import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp as initFirebaseApp, getApps as getFirebaseApps, getApp as getFirebaseApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, getDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Server-side Firestore Connection
let dbServer: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const fbApp = getFirebaseApps().length > 0 ? getFirebaseApp() : initFirebaseApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId === 'ai-studio-aicbtsimulator-24029710-e20e-4e1e-a3cf-846d58bd47cf' ? '(default)' : (firebaseConfig.firestoreDatabaseId || '(default)');
    dbServer = initializeFirestore(fbApp, {}, dbId);
  }
} catch (e) {
  console.warn("Server-side Firestore initialization warning:", e);
}

// In-Memory Protection Lock for Duplicate Transactions
const processedSquadReferences = new Set<string>();

const isSquadConfigured = (): boolean => {
  const secretKey = (process.env.SQUAD_SECRET_KEY || "").trim();
  const publicKey = (process.env.SQUAD_PUBLIC_KEY || process.env.VITE_SQUAD_PUBLIC_KEY || "").trim();
  return secretKey !== "" || publicKey !== "";
};

const getSquadBaseUrl = (): string => {
  if (process.env.SQUAD_BASE_URL && !process.env.SQUAD_BASE_URL.includes('placeholder')) {
    return process.env.SQUAD_BASE_URL.replace(/\/+$/, "");
  }
  const secretKey = (process.env.SQUAD_SECRET_KEY || "").trim();
  if (secretKey.startsWith("sandbox_") || secretKey.startsWith("test_") || secretKey.includes("sandbox") || secretKey.includes("placeholder")) {
    return "https://sandbox-api-d.squadco.com";
  }
  return "https://api-d.squadco.com";
};

// Official Subscription Plans Configuration
const SUBSCRIPTION_PLANS: Record<string, { id: string; name: string; price: number; durationDays: number }> = {
  "premium-basic": { id: "premium-basic", name: "Premium Basic", price: 800, durationDays: 14 },
  "plan-14d": { id: "plan-14d", name: "Premium Basic (14-Day)", price: 800, durationDays: 14 },
  "premium-plus": { id: "premium-plus", name: "Premium Plus", price: 1500, durationDays: 30 },
  "plan-30d": { id: "plan-30d", name: "Premium Plus (30-Day)", price: 1500, durationDays: 30 },
  "premium-pro": { id: "premium-pro", name: "Premium Pro", price: 3500, durationDays: 90 },
  "plan-90d": { id: "plan-90d", name: "Premium Pro (90-Day)", price: 3500, durationDays: 90 },
};

// Helper: Create pending payment record in Firestore
const createPendingPaymentInFirestore = async (params: {
  userId: string;
  reference: string;
  amount: number;
}) => {
  if (!dbServer) return;
  try {
    const paymentRef = doc(dbServer, "payments", params.reference);
    await setDoc(
      paymentRef,
      {
        paymentId: params.reference,
        userId: params.userId,
        amount: params.amount,
        reference: params.reference,
        status: "pending",
        createdAt: new Date().toISOString(),
        verifiedAt: null,
      },
      { merge: true }
    );
    console.log(`[Firestore Server] Created pending payment record: ${params.reference}`);
  } catch (err) {
    console.error("[Firestore Server] Failed to create pending payment record:", err);
  }
};

// Helper: Activate subscription and record transaction in Firestore
const activateSubscriptionInFirestore = async (params: {
  userId: string;
  userName: string;
  userUsername?: string;
  userEmail: string;
  reference: string;
  transactionId?: string;
  amount: number;
  planName: string;
  durationDays: number;
  paymentMethod?: string;
  squadResponse?: any;
}) => {
  const paidAt = new Date().toISOString();
  const expiryDate = new Date(Date.now() + params.durationDays * 86400000).toISOString();
  const txId = params.transactionId || `tx-squad-${params.reference}`;

  // Firestore Structure strictly matching requirements
  const activationPayload = {
    premium: true,
    isPremium: true,
    plan: params.planName,
    subscriptionAmount: params.amount,
    paymentStatus: "paid",
    paymentReference: params.reference,
    paymentDate: paidAt,
    subscription: {
      isPremium: true,
      plan: params.planName,
      startDate: paidAt,
      expiryDate,
    },
    subscriptionStatus: "active",
    subscriptionPlan: params.planName,
    paymentAmount: params.amount,
    expiryDate,
  };

  const paymentRecord = {
    paymentId: params.reference,
    userId: params.userId,
    amount: params.amount,
    reference: params.reference,
    status: "success",
    createdAt: paidAt,
    verifiedAt: paidAt,
  };

  const subscriptionRecord = {
    userId: params.userId,
    plan: params.planName,
    startDate: paidAt,
    expiryDate,
    status: "active",
  };

  const transactionRecord = {
    id: txId,
    paymentId: params.reference,
    userId: params.userId,
    userName: params.userName || "Acadet Student",
    userUsername: params.userUsername || "",
    userEmail: params.userEmail,
    reference: params.reference,
    gateway: "Squad Payment Gateway",
    amount: params.amount,
    planName: params.planName,
    date: paidAt,
    paymentDate: paidAt,
    expiryDate,
    status: "Successful",
    paymentMethod: params.paymentMethod || "Squad Payment Gateway",
    squadResponse: params.squadResponse || null,
  };

  if (dbServer) {
    try {
      // 1. Update User Profile in Firestore (users/{userId})
      const userRef = doc(dbServer, "users", params.userId);
      await setDoc(userRef, activationPayload, { merge: true });

      // 2. Update Payments Collection (payments/{reference})
      const paymentRef = doc(dbServer, "payments", params.reference);
      await setDoc(paymentRef, paymentRecord, { merge: true });

      // 3. Update Subscriptions Collection (subscriptions/{userId})
      const subRef = doc(dbServer, "subscriptions", params.userId);
      await setDoc(subRef, subscriptionRecord, { merge: true });

      // 4. Save Transaction Record (transactions/{txId})
      const txRef = doc(dbServer, "transactions", txId);
      await setDoc(txRef, transactionRecord, { merge: true });

      console.log(`[Firestore Server] Successfully verified & activated Squad Subscription for User ${params.userId} (${params.reference})`);
    } catch (err) {
      console.error("[Firestore Server] Failed to write subscription/payment/transaction records:", err);
    }
  }

  return { activationPayload, transactionRecord, paymentRecord, subscriptionRecord };
};

// Initialize Gemini Client
const getGeminiAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Route: Health Check
app.get(["/health", "/api/health"], (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route: Validate Practice Session & Subscription Status (All practice is 100% Free & Unlimited)
app.post("/api/practice/validate-session", (req, res) => {
  try {
    const { requestedLimit } = req.body;
    const isUnlimited =
      requestedLimit === "unlimited" ||
      requestedLimit === "Unlimited" ||
      Number(requestedLimit) > 30;

    return res.json({
      success: true,
      validatedLimit: isUnlimited ? "unlimited" : Math.min(Math.max(Number(requestedLimit) || 10, 1), 500),
      isFreeAccess: true,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, error: err.message || "Failed to validate session." });
  }
});

// API Route: Generate AI Questions from Course Material (PDF, Photo, Text Writing, Documents)
app.post("/api/ai/generate-questions", async (req, res) => {
  try {
    const {
      materialText,
      fileData,
      mimeType,
      fileName,
      universityName = "University",
      level = "100 Level",
      courseCode = "GST101",
      courseTitle = "General Course",
      topic = "General Topic",
      difficulty = "Medium",
      questionCount = 5,
    } = req.body;

    const hasFile = !!(fileData && typeof fileData === 'string' && fileData.trim().length > 0);
    const hasText = !!(materialText && typeof materialText === 'string' && materialText.trim().length >= 10);

    if (!hasFile && !hasText) {
      return res.status(400).json({
        error: "Please provide either an uploaded file (PDF, photo/image, Word/text document) or text material (minimum 10 characters).",
      });
    }

    const ai = getGeminiAi();
    const instructionPrompt = `You are an expert university examiner and CBT question author.
Analyze the provided study material / exam photo / document for ${universityName} course "${courseCode}: ${courseTitle}" (${level}, topic: "${topic || 'General Topic'}").
Generate exactly ${questionCount} high-quality, exam-standard multiple-choice practice questions at "${difficulty || 'Medium'}" difficulty.

Requirements for each question:
1. "question": A clear, unambiguous question statement testing comprehension, application, or factual recall.
2. "optionA": First plausible answer choice.
3. "optionB": Second plausible answer choice.
4. "optionC": Third plausible answer choice.
5. "optionD": Fourth plausible answer choice.
6. "correctAnswer": Must strictly be one of "A", "B", "C", or "D".
7. "explanation": A concise, educational step-by-step breakdown explaining why the correct answer is right and why distractors are incorrect.
8. "difficulty": "${difficulty || 'Medium'}"
9. "topic": "${topic || 'General Topic'}"`;

    const contentsParts: any[] = [];

    if (hasFile) {
      let normalizedMime = mimeType || 'application/pdf';
      const fName = (fileName || '').toLowerCase();

      if (fName.endsWith('.pdf')) normalizedMime = 'application/pdf';
      else if (fName.endsWith('.jpg') || fName.endsWith('.jpeg')) normalizedMime = 'image/jpeg';
      else if (fName.endsWith('.png')) normalizedMime = 'image/png';
      else if (fName.endsWith('.webp')) normalizedMime = 'image/webp';
      else if (fName.endsWith('.txt')) normalizedMime = 'text/plain';
      else if (fName.endsWith('.csv')) normalizedMime = 'text/csv';
      else if (fName.endsWith('.json')) normalizedMime = 'application/json';
      else if (fName.endsWith('.html') || fName.endsWith('.htm')) normalizedMime = 'text/html';

      // Strip base64 data URI header if present
      let cleanBase64 = fileData;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      contentsParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: normalizedMime,
        },
      });
    }

    if (hasText) {
      contentsParts.push({
        text: `Source Text / Material Content:\n"""\n${materialText.slice(0, 20000)}\n"""`,
      });
    }

    contentsParts.push({ text: instructionPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: contentsParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              optionA: { type: Type.STRING },
              optionB: { type: Type.STRING },
              optionC: { type: Type.STRING },
              optionD: { type: Type.STRING },
              correctAnswer: { type: Type.STRING, description: "Must be A, B, C, or D" },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              topic: { type: Type.STRING },
            },
            required: ["question", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "explanation"],
          },
        },
      },
    });

    const questionsRaw = JSON.parse(response.text || "[]");
    return res.json({ success: true, questions: questionsRaw });
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate questions." });
  }
});

// API Route: Smart Upload & Format AI Questions for Question Bank & FaceArena
app.post("/api/ai/smart-upload-questions", async (req, res) => {
  try {
    const {
      mode = "generate_material", // "generate_material" | "format_existing"
      rawText,
      fileData,
      mimeType,
      fileName,
      category = "General CBT",
      questionCount = 10,
    } = req.body;

    const hasFile = !!(fileData && typeof fileData === "string" && fileData.trim().length > 0);
    const hasText = !!(rawText && typeof rawText === "string" && rawText.trim().length >= 10);

    if (!hasFile && !hasText) {
      return res.status(400).json({
        error: "Please upload a document file (PDF, DOCX, TXT) or paste text content.",
      });
    }

    const ai = getGeminiAi();

    let systemPrompt = "";
    if (mode === "format_existing") {
      systemPrompt = `You are an expert CBT document auditor and question bank compiler.
Your task is to analyze the provided raw question document/file for category "${category}".
Extract all multiple-choice questions from the content.
For each extracted question:
1. Fix all spelling, grammatical, and typographical errors.
2. Standardize formatting into clean, unambiguous CBT question statement.
3. Ensure 4 clear options: optionA, optionB, optionC, optionD.
4. Detect and verify the correct answer option (must strictly be "A", "B", "C", or "D").
5. Provide a clear educational explanation for why that answer is correct.
6. Remove any duplicate questions.
7. Set category to "${category}".`;
    } else {
      systemPrompt = `You are an expert university examiner and CBT question author.
Analyze the provided study material content for category "${category}".
Generate exactly ${questionCount} high-quality, exam-standard multiple-choice practice questions.
Requirements:
1. "question": Clear question testing key concepts from the material.
2. "optionA", "optionB", "optionC", "optionD": 4 plausible options.
3. "correctAnswer": Must strictly be "A", "B", "C", or "D".
4. "explanation": Step-by-step breakdown of why the answer is correct.
5. "category": "${category}"`;
    }

    const contentsParts: any[] = [];

    if (hasFile) {
      let normalizedMime = mimeType || "application/pdf";
      const fName = (fileName || "").toLowerCase();

      if (fName.endsWith(".pdf")) normalizedMime = "application/pdf";
      else if (fName.endsWith(".jpg") || fName.endsWith(".jpeg")) normalizedMime = "image/jpeg";
      else if (fName.endsWith(".png")) normalizedMime = "image/png";
      else if (fName.endsWith(".txt")) normalizedMime = "text/plain";

      let cleanBase64 = fileData;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      contentsParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: normalizedMime,
        },
      });
    }

    if (hasText) {
      contentsParts.push({
        text: `Raw Material / Question Document Text:\n"""\n${rawText.slice(0, 30000)}\n"""`,
      });
    }

    contentsParts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: contentsParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              optionA: { type: Type.STRING },
              optionB: { type: Type.STRING },
              optionC: { type: Type.STRING },
              optionD: { type: Type.STRING },
              correctAnswer: { type: Type.STRING, description: "Must be A, B, C, or D" },
              explanation: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["question", "optionA", "optionB", "optionC", "optionD", "correctAnswer"],
          },
        },
      },
    });

    const questionsParsed = JSON.parse(response.text || "[]");
    return res.json({ success: true, questions: questionsParsed });
  } catch (err: any) {
    console.error("Smart Upload AI Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process question file." });
  }
});

// API Route: Generate AI Explanation for a question
app.post("/api/ai/explain-question", async (req, res) => {
  try {
    const { question, optionA, optionB, optionC, optionD, correctAnswer, userAnswer } = req.body;

    const ai = getGeminiAi();
    const prompt = `Provide a friendly, deep educational explanation for this university examination question.
Question: ${question}
Option A: ${optionA}
Option B: ${optionB}
Option C: ${optionC}
Option D: ${optionD}
Correct Answer: Option ${correctAnswer}
Student's Chosen Answer: ${userAnswer ? `Option ${userAnswer}` : "Not answered"}

Explain step-by-step why Option ${correctAnswer} is correct and why the student's answer (if wrong) was mistaken. Keep it concise, engaging, and easy to memorize for exams.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({ success: true, explanation: response.text });
  } catch (err: any) {
    console.error("AI Explanation Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate explanation." });
  }
});

// API Route: AI Performance Analysis
app.post("/api/ai/analyze-performance", async (req, res) => {
  try {
    const { score, totalQuestions, courseCode, timeSpentSeconds, weakTopics, strongTopics } = req.body;

    const ai = getGeminiAi();
    const prompt = `Analyze this student's CBT examination result and provide 3 actionable, encouraging study strategies:
Course: ${courseCode}
Score: ${score} out of ${totalQuestions} (${Math.round((score / totalQuestions) * 100)}%)
Time Spent: ${Math.floor(timeSpentSeconds / 60)} minutes ${timeSpentSeconds % 60} seconds
Weak Topics: ${weakTopics?.join(", ") || "None identified"}
Strong Topics: ${strongTopics?.join(", ") || "General knowledge"}

Return JSON format with:
1. "verdict": Short summary phrase (e.g., "Excellent Performance!", "Great Effort - Focus on Weak Areas")
2. "feedback": Paragraph of tactical feedback.
3. "recommendations": Array of 3 bullet points for next steps.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING },
            feedback: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["verdict", "feedback", "recommendations"],
        },
      },
    });

    const analysis = JSON.parse(response.text || "{}");
    return res.json({ success: true, analysis });
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate analysis." });
  }
});

// API Route: MenCore AI Chat (Gemini AI for General Knowledge & Outside Questions)
app.post("/api/ai/mencore-chat", async (req, res) => {
  try {
    const { questionText, userProfile } = req.body;

    if (!questionText || typeof questionText !== "string") {
      return res.status(400).json({ error: "Question text is required." });
    }

    const ai = getGeminiAi();
    const userName = userProfile?.name || "Student";
    const systemPrompt = `You are MenCore AI (Smart MenCore, Powered by Menmex), the official intelligent CBT & Academic Companion for Acadet CBT Master.
You are addressing ${userName}.
You act just like Gemini AI: smart, articulate, highly knowledgeable, friendly, and comprehensive across all domains (academic subjects, science, mathematics, literature, history, technology, general knowledge, current facts, and exam preparation).
Provide clear, structured, well-formatted answers with markdown bolding, bullet points, code blocks or mathematical formulas where appropriate.
If the student asks a question about CBT exams or university courses, give them an accurate, encouraging, and highly detailed breakdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: questionText,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const textAnswer = response.text || "I processed your question using MenCore Gemini AI.";
    return res.json({ success: true, answer: textAnswer });
  } catch (err: any) {
    console.error("MenCore Gemini AI Chat Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to process query via Gemini AI.",
    });
  }
});

// ==========================================
// Official Squad Payment Gateway Integration
// ==========================================

const getSquadSecretKey = (): string => {
  return (process.env.SQUAD_SECRET_KEY || "").trim();
};

const getSquadPublicKey = (): string => {
  return (process.env.SQUAD_PUBLIC_KEY || process.env.VITE_SQUAD_PUBLIC_KEY || "").trim();
};

const isSquadGatewayConfigured = (): boolean => {
  const secretKey = getSquadSecretKey();
  return secretKey !== "" && !secretKey.includes("placeholder");
};

// 1. Squad Configuration Status
app.get("/api/payments/config", (_req, res) => {
  const configured = isSquadGatewayConfigured();
  return res.json({
    isConfigured: configured,
    publicKey: getSquadPublicKey(),
    message: configured ? "Squad Payment Gateway Operational" : "Squad Payment Gateway is not configured with a valid secret key.",
  });
});

app.get("/api/squad/config", (_req, res) => {
  const configured = isSquadGatewayConfigured();
  return res.json({
    isConfigured: configured,
    publicKey: getSquadPublicKey(),
    message: configured ? "Squad Payment Gateway Operational" : "Squad Payment Gateway is not configured.",
  });
});

// 2. Initiate Payment (POST /api/payments/initiate)
const handlePaymentInitiation = async (req: express.Request, res: express.Response) => {
  try {
    const { planId, email, userEmail, userId, uid, userName, userUsername } = req.body;
    const reqAmount = Number(req.body.amount);

    const effUserId = userId || uid || email || userEmail || "usr-student";
    const effEmail = email || userEmail || (userUsername ? `${userUsername}@acadet.cbt` : "student@acadet.cbt");

    if (!effEmail || !effEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "A valid customer email address is required to initiate Squad payment.",
      });
    }

    const secretKey = getSquadSecretKey();
    if (!secretKey || secretKey.includes("placeholder")) {
      return res.status(400).json({
        success: false,
        error: "SQUAD_SECRET_KEY is missing or invalid in server environment. Please configure SQUAD_SECRET_KEY in Railway.",
      });
    }

    // Determine Plan and Amount
    const knownPlan = SUBSCRIPTION_PLANS[planId];
    const amountInNaira = knownPlan ? knownPlan.price : (reqAmount || 800);
    const planTitle = knownPlan ? knownPlan.name : (planId === "premium-plus" || planId === "plan-30d" ? "Premium Plus" : "Premium Basic");
    const amountInKobo = Math.round(amountInNaira * 100);

    const reference = `SQUAD-CBT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const baseUrl = getSquadBaseUrl();

    // Determine base App URL
    const reqHostUrl = `${req.protocol}://${req.get('host')}`;
    const appUrl = (process.env.APP_URL || reqHostUrl).replace(/\/+$/, "");
    const callbackUrl = `${appUrl}/payment/success?reference=${reference}`;

    // Step 1: Create initial pending record in Firestore
    await createPendingPaymentInFirestore({
      userId: effUserId,
      reference,
      amount: amountInNaira,
    });

    const squadPayload = {
      amount: amountInKobo,
      email: effEmail,
      currency: "NGN",
      initiate_type: "inline",
      transaction_ref: reference,
      callback_url: callbackUrl,
      pass_charge: false,
      payment_channels: ["card", "bank", "transfer", "ussd"],
      metadata: {
        userId: effUserId,
        userEmail: effEmail,
        userName: userName || "Acadet Student",
        planId: planId || "premium-basic",
        planName: planTitle,
        amount: amountInNaira,
      },
    };

    console.log(`[Squad Initiate] Initiating NGN ${amountInNaira} for ${effEmail} (Ref: ${reference})`);

    const squadRes = await fetch(`${baseUrl}/transaction/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(squadPayload),
    });

    const squadData = await squadRes.json();

    if ((squadData.status === 200 || squadData.status === "200" || squadData.success) && squadData.data) {
      const checkoutUrl = squadData.data.checkout_url || squadData.data.auth_url;
      if (!checkoutUrl) {
        return res.status(400).json({
          success: false,
          error: "Squad API did not return a valid checkout URL.",
          squadResponse: squadData,
        });
      }

      return res.json({
        success: true,
        paymentId: reference,
        transactionRef: reference,
        reference,
        checkoutUrl,
        paymentLink: checkoutUrl,
        amount: amountInNaira,
        planId: planId || "premium-basic",
        planName: planTitle,
        squadData: squadData.data,
      });
    } else {
      console.error("[Squad Initiate Error]", squadData);
      return res.status(400).json({
        success: false,
        error: squadData.message || squadData.error || "Failed to initialize payment with Squad Gateway.",
        squadResponse: squadData,
      });
    }
  } catch (err: any) {
    console.error("[Squad Initiate Exception]", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Server error while contacting Squad Payment Gateway.",
    });
  }
};

app.post("/api/payments/initiate", handlePaymentInitiation);
app.post("/api/create-payment-link", handlePaymentInitiation);
app.post("/api/squad/initialize", handlePaymentInitiation);

// 3. Payment Verification (GET & POST /api/payments/verify/:reference)
const handlePaymentVerification = async (req: express.Request, res: express.Response) => {
  try {
    const reference = req.params.reference || req.query.reference || req.body.reference;
    const userId = req.body?.userId || req.body?.uid || req.query?.userId;
    const email = req.body?.email || req.body?.userEmail || req.query?.email;
    const planId = req.body?.planId || req.query?.planId || "premium-basic";

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: "Transaction reference is required for payment verification.",
      });
    }

    const secretKey = getSquadSecretKey();
    if (!secretKey || secretKey.includes("placeholder")) {
      return res.status(400).json({
        success: false,
        error: "SQUAD_SECRET_KEY is missing or invalid in server environment.",
      });
    }

    // Protection against re-verification if already processed
    if (processedSquadReferences.has(reference)) {
      console.log(`[Squad Verify] Reference ${reference} was already verified.`);
      return res.json({
        success: true,
        status: "success",
        alreadyVerified: true,
        message: "Payment reference has already been verified and subscription is active.",
        reference,
      });
    }

    const baseUrl = getSquadBaseUrl();
    console.log(`[Squad Verify] Querying Squad API for reference: ${reference}`);

    const verifyRes = await fetch(`${baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const verifyData = await verifyRes.json();
    const statusStr = String(verifyData?.data?.transaction_status || verifyData?.data?.status || "").toLowerCase();
    const isSuccess = (
      (verifyData.status === 200 || verifyData.status === "200" || verifyData.success) &&
      verifyData.data &&
      (statusStr === "success" || statusStr === "successful")
    );

    const effUserId = userId || verifyData.data?.meta?.userId || verifyData.data?.metadata?.userId || email || "usr-student";
    const effEmail = email || verifyData.data?.email || verifyData.data?.customer?.email || "student@acadet.cbt";

    if (!isSuccess) {
      // Mark as failed in Firestore
      if (dbServer) {
        setDoc(
          doc(dbServer, "payments", reference),
          {
            paymentId: reference,
            userId: effUserId,
            transactionRef: reference,
            status: "failed",
            updatedAt: new Date().toISOString(),
            squadResponse: verifyData,
          },
          { merge: true }
        ).catch((err) => console.error("Failed to set payment failed status:", err));
      }

      return res.status(400).json({
        success: false,
        status: statusStr || "failed",
        error: verifyData.message || "Squad payment verification failed: Payment was not confirmed on Squad Gateway.",
        squadResponse: verifyData,
      });
    }

    // Mark as processed in lock set
    processedSquadReferences.add(reference);

    const returnedAmt = verifyData.data.transaction_amount || verifyData.data.amount;
    const actualAmount = returnedAmt ? (returnedAmt > 10000 ? Math.round(returnedAmt / 100) : returnedAmt) : 800;
    const paymentMethod = verifyData.data.payment_method || verifyData.data.channel || "Squad Checkout";

    const knownPlan = SUBSCRIPTION_PLANS[planId];
    const durationDays = knownPlan ? knownPlan.durationDays : (actualAmount === 800 ? 14 : 30);
    const planTitle = knownPlan ? knownPlan.name : (actualAmount === 800 ? "Premium Basic" : "Premium Plus");

    const syncResult = await activateSubscriptionInFirestore({
      userId: effUserId,
      userName: req.body?.userName || verifyData.data?.meta?.userName || "Acadet Student",
      userUsername: req.body?.userUsername || "",
      userEmail: effEmail,
      reference,
      transactionId: verifyData.data?.transaction_ref || reference,
      amount: actualAmount,
      planName: planTitle,
      durationDays,
      paymentMethod,
      squadResponse: verifyData,
    });

    return res.json({
      success: true,
      status: "success",
      message: "Squad payment successfully verified on server! Premium subscription activated.",
      reference,
      amount: actualAmount,
      planName: planTitle,
      subscription: syncResult?.activationPayload,
      transaction: syncResult?.transactionRecord,
      payment: syncResult?.paymentRecord,
    });
  } catch (err: any) {
    console.error("[Squad Verify Exception]", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to verify payment with Squad API.",
    });
  }
};

app.get("/api/payments/verify/:reference", handlePaymentVerification);
app.post("/api/payments/verify", handlePaymentVerification);
app.post("/api/verify-payment", handlePaymentVerification);
app.post("/api/squad/verify", handlePaymentVerification);

// 4. Squad Webhook (POST /api/payments/webhook & POST /api/squad/webhook)
const handleSquadWebhook = async (req: express.Request, res: express.Response) => {
  try {
    const signature = (req.headers["x-squad-signature"] as string) || (req.headers["x-squad-encrypted-body"] as string);
    const secretKey = getSquadSecretKey();

    if (signature && secretKey && !secretKey.includes("placeholder")) {
      const computedHash = crypto
        .createHmac("sha512", secretKey)
        .update(JSON.stringify(req.body))
        .digest("hex")
        .toUpperCase();

      if (computedHash !== signature.toUpperCase()) {
        console.warn("[Squad Webhook] Invalid webhook signature. Rejecting request.");
        return res.status(401).json({ status: "error", error: "Invalid webhook signature" });
      }
    }

    const payload = req.body || {};
    console.log("[Squad Webhook Received]", payload.Event || payload.event);

    const eventName = payload.Event || payload.event || "";
    const bodyData = payload.Body || payload.data || payload;

    const reference = bodyData.transaction_ref || bodyData.reference;
    const status = String(bodyData.transaction_status || bodyData.status || "").toLowerCase();

    if (reference && (status === "success" || status === "successful" || eventName.toLowerCase().includes("success"))) {
      if (processedSquadReferences.has(reference)) {
        console.log(`[Squad Webhook] Reference ${reference} already processed.`);
        return res.status(200).json({ status: "success", message: "Already processed" });
      }

      processedSquadReferences.add(reference);

      const metadata = bodyData.meta || bodyData.metadata || {};
      const userId = metadata.userId || bodyData.customer?.user_id;
      const userEmail = bodyData.email || metadata.userEmail;
      const userName = metadata.userName || bodyData.customer?.name || "Acadet Student";
      const rawAmt = bodyData.amount || bodyData.transaction_amount || metadata.amount || 1500;
      const amount = rawAmt > 10000 ? Math.round(rawAmt / 100) : rawAmt;
      const planName = metadata.planName || (amount === 800 ? "Premium Basic" : "Premium Plus");
      const durationDays = amount === 800 ? 14 : 30;

      if (userId) {
        await activateSubscriptionInFirestore({
          userId,
          userName,
          userEmail,
          reference,
          transactionId: reference,
          amount,
          planName,
          durationDays,
          paymentMethod: bodyData.payment_type || "Squad Webhook",
          squadResponse: payload,
        });
        console.log(`[Squad Webhook] Successfully activated subscription for User ${userId}`);
      }
    }

    return res.status(200).json({ status: "success", message: "Webhook processed" });
  } catch (err: any) {
    console.error("[Squad Webhook Exception]", err);
    return res.status(200).json({ status: "success", message: "Webhook acknowledged" });
  }
};

app.post("/api/payments/webhook", handleSquadWebhook);
app.post("/api/squad/webhook", handleSquadWebhook);

// Admin Authentication & Rate Limiting Store
const failedAdminAttempts = new Map<string, { count: number; lockUntil: number }>();
const validAdminSessions = new Set<string>();

app.post("/api/admin/login", (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || "global_client";
  const now = Date.now();
  const attemptInfo = failedAdminAttempts.get(clientIp) || { count: 0, lockUntil: 0 };

  if (attemptInfo.lockUntil > now) {
    const secondsLeft = Math.ceil((attemptInfo.lockUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed login attempts. Admin login is temporarily locked for ${secondsLeft} seconds.`
    });
  }

  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME || "Menmex";
  const expectedPassword = process.env.ADMIN_PASSWORD || "joyce@menmex";

  if (username === expectedUsername && password === expectedPassword) {
    failedAdminAttempts.delete(clientIp);
    const sessionToken = `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    validAdminSessions.add(sessionToken);

    return res.json({
      success: true,
      token: sessionToken,
      adminUser: {
        id: "usr-admin-menmex",
        name: "System Administrator",
        username: expectedUsername,
        email: "admin@menmex.ng",
        role: "admin",
        universityId: "uni-ful",
        universityName: "Federal University Lokoja, Kogi State (FUL)",
        departmentId: "dept-ful-1",
        departmentName: "Computer Science",
        subscription: {
          isPremium: true,
          plan: "30-Day Premium",
          startDate: new Date().toISOString(),
          expiryDate: null,
          questionsAttemptedCount: 0,
          freeLimit: 999999,
        },
        bookmarks: [],
        createdDate: new Date().toISOString(),
      }
    });
  } else {
    const newCount = attemptInfo.count + 1;
    let lockUntil = 0;
    if (newCount >= 5) {
      lockUntil = now + 60 * 1000; // 60 second lock after 5 consecutive failures
    }
    failedAdminAttempts.set(clientIp, { count: newCount, lockUntil });

    // Exact requirement: "Invalid administrator username or password."
    return res.status(401).json({
      error: "Invalid administrator username or password."
    });
  }
});

// Admin Session Verification
app.post("/api/admin/verify", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
  if (token && validAdminSessions.has(token)) {
    return res.json({ valid: true, role: "admin" });
  }
  return res.status(403).json({ valid: false, error: "Access Denied. Administrator privileges are required." });
});

// Export Cloud Function handler for Firebase Hosting / Cloud Functions deployments if in function environment
let apiExport: any;
if (process.env.FUNCTION_NAME || process.env.FUNCTION_TARGET || process.env.K_SERVICE) {
  try {
    apiExport = onRequest(
      {
        cors: true,
        maxInstances: 10,
      },
      app
    );
  } catch (e) {
    console.warn("Firebase onRequest export skipped:", e);
  }
}

export { apiExport as api, app };

async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
});

if (!process.env.FUNCTION_NAME && !process.env.FUNCTION_TARGET) {
  startServer().catch((err) => {
    console.error("Error starting server process:", err);
  });
}
