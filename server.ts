import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp as initFirebaseApp, getApps as getFirebaseApps, getApp as getFirebaseApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, getDoc } from "firebase/firestore";

dotenv.config();

const app = express();
app.set("trust proxy", true);
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

const getSquadSecretKey = (): string => {
  return (process.env.SQUAD_SECRET_KEY || "").trim();
};

const getSquadPublicKey = (): string => {
  return (process.env.SQUAD_PUBLIC_KEY || process.env.VITE_SQUAD_PUBLIC_KEY || "").trim();
};

const getSquadWebhookSecret = (): string => {
  return (process.env.SQUAD_WEBHOOK_SECRET || process.env.SQUAD_SECRET_KEY || "").trim();
};

const isSquadConfigured = (): boolean => {
  const secretKey = getSquadSecretKey();
  const publicKey = getSquadPublicKey();
  return secretKey !== "" || publicKey !== "";
};

const getSquadBaseUrl = (): string => {
  if (process.env.SQUAD_BASE_URL && !process.env.SQUAD_BASE_URL.includes('placeholder')) {
    return process.env.SQUAD_BASE_URL.replace(/\/+$/, "");
  }
  const secretKey = getSquadSecretKey();
  if (secretKey.startsWith("sandbox_") || secretKey.startsWith("test_") || secretKey.includes("sandbox") || secretKey.includes("placeholder")) {
    return "https://sandbox-api-d.squadco.com";
  }
  return "https://api-d.squadco.com";
};

// Official KoraPay Payment Gateway Credentials
const getKorapaySecretKey = (): string => (process.env.KORAPAY_SECRET_KEY || "").trim();
const getKorapayPublicKey = (): string => (process.env.KORAPAY_PUBLIC_KEY || "").trim();
const getKorapayWebhookSecret = (): string => (process.env.KORAPAY_WEBHOOK_SECRET || process.env.KORAPAY_SECRET_KEY || "").trim();
const getKorapayBaseUrl = (): string => (process.env.KORAPAY_BASE_URL || "https://api.korapay.com").replace(/\/+$/, "").trim();

const isKorapayConfigured = (): boolean => {
  const secretKey = getKorapaySecretKey();
  const publicKey = getKorapayPublicKey();
  return secretKey !== "" || publicKey !== "";
};

const processedKorapayReferences = new Set<string>();

// Official Subscription Plans Configuration
const SUBSCRIPTION_PLANS: Record<string, { id: string; name: string; price: number; durationDays: number }> = {
  "plan-1d": { id: "plan-1d", name: "1-Day Starter Pass", price: 150, durationDays: 1 },
  "premium-150": { id: "premium-150", name: "1-Day Starter Pass", price: 150, durationDays: 1 },
  "plan-150": { id: "plan-150", name: "1-Day Starter Pass", price: 150, durationDays: 1 },
  "premium": { id: "premium", name: "Premium Plan", price: 800, durationDays: 30 },
  "premium-basic": { id: "premium-basic", name: "Premium Basic", price: 800, durationDays: 14 },
  "plan-14d": { id: "plan-14d", name: "Premium Basic (14-Day)", price: 800, durationDays: 14 },
  "premium-plus": { id: "premium-plus", name: "Premium Plus", price: 1500, durationDays: 30 },
  "plan-30d": { id: "plan-30d", name: "Premium Plus (30-Day)", price: 1500, durationDays: 30 },
  "premium-pro": { id: "premium-pro", name: "Premium Pro", price: 3500, durationDays: 90 },
  "plan-90d": { id: "plan-90d", name: "Premium Pro (90-Day)", price: 3500, durationDays: 90 },
};

// Helper: Create pending payment record in Firestore (payments/{paymentId})
const createPendingPaymentInFirestore = async (params: {
  userId: string;
  email: string;
  fullName?: string;
  reference: string;
  amount: number;
  plan?: string;
  planId?: string;
  durationDays?: number;
  provider?: string;
}) => {
  if (!dbServer) return;
  try {
    const provider = params.provider || (params.reference.includes("_KORA_") ? "korapay" : "squad");
    const paymentRef = doc(dbServer, "payments", params.reference);
    await setDoc(
      paymentRef,
      {
        userId: params.userId,
        fullName: params.fullName || "Acadet Student",
        email: params.email,
        amount: params.amount,
        plan: params.plan || "Premium Membership",
        planId: params.planId || "premium",
        durationDays: params.durationDays || 30,
        provider,
        transactionRef: params.reference,
        squadTransactionId: null,
        gatewayTransactionId: null,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firestore Server] Created pending payment record: ${params.reference} (Amount: ₦${params.amount}, Duration: ${params.durationDays || 30} days, Provider: ${provider})`);
  } catch (err) {
    console.error("[Firestore Server] Failed to create pending payment record:", err);
  }
};

// Helper: Process Referral Reward & Leaderboard Rankings
const processReferralReward = async (uid: string) => {
  if (!dbServer) return;
  try {
    const userRef = doc(dbServer, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();

    const referrerId = userData.referredBy || userData.referrerId || userData.referredByCode || null;
    if (!referrerId) return;

    const referralId = `ref_${referrerId}_${uid}`;
    const refDocRef = doc(dbServer, "referrals", referralId);
    const refSnap = await getDoc(refDocRef);
    if (refSnap.exists() && refSnap.data()?.status === "completed") {
      console.log(`[Referral] Referral ${referralId} already completed.`);
      return;
    }

    // 1. Create referral record in referrals/{referralId}
    await setDoc(
      refDocRef,
      {
        referrerId,
        referredUserId: uid,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Increment referrer's totalReferrals in users/{referrerId}
    const referrerRef = doc(dbServer, "users", referrerId);
    const referrerSnap = await getDoc(referrerRef);
    let referrerName = "Student";
    let updatedTotal = 1;

    if (referrerSnap.exists()) {
      const rData = referrerSnap.data();
      referrerName = rData.fullName || rData.username || rData.email?.split("@")[0] || "Student";
      updatedTotal = (rData.totalReferrals || 0) + 1;
      await setDoc(referrerRef, { totalReferrals: updatedTotal }, { merge: true });
    } else {
      await setDoc(
        referrerRef,
        {
          fullName: referrerName,
          totalReferrals: 1,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    // 3. Update leaderboard/{referrerId}
    const leaderboardRef = doc(dbServer, "leaderboard", referrerId);
    await setDoc(
      leaderboardRef,
      {
        name: referrerName,
        referralCount: updatedTotal,
        rank: 1, // Default, will recalculate
      },
      { merge: true }
    );

    console.log(`[Referral System] Successfully rewarded Referrer ${referrerId} for user ${uid}. New count: ${updatedTotal}`);
  } catch (err) {
    console.error("[Referral System Error]", err);
  }
};

// Helper: Activate subscription and record transactions in Firestore
const activateSubscriptionInFirestore = async (params: {
  userId: string;
  userName?: string;
  userEmail: string;
  reference: string;
  gatewayRef?: string;
  squadTransactionId?: string;
  amount: number;
  planName: string;
  durationDays: number;
  paymentMethod?: string;
  provider?: string;
  squadResponse?: any;
}) => {
  const paidAt = new Date().toISOString();
  const durationInDays = params.durationDays > 0 ? params.durationDays : 30;
  const expiryDate = new Date(Date.now() + durationInDays * 86400000).toISOString();
  const txId = params.squadTransactionId || params.gatewayRef || params.reference;
  const provider = params.provider || (params.reference.includes("_KORA_") ? "korapay" : "squad");
  const gatewayDisplayName = provider === "korapay" ? "KoraPay" : "Squad";

  // 1. users/{uid} payload
  const userPayload = {
    fullName: params.userName || "Acadet Student",
    name: params.userName || "Acadet Student",
    email: params.userEmail,
    role: "student",
    subscriptionPlan: params.planName || "Premium Membership",
    subscriptionStatus: "active",
    subscriptionStartDate: paidAt,
    subscriptionExpiryDate: expiryDate,
    subscription: {
      isPremium: true,
      plan: params.planName || "Premium Membership",
      startDate: paidAt,
      expiryDate: expiryDate,
      gateway: gatewayDisplayName,
      reference: params.reference,
      questionsAttemptedCount: 0,
      freeLimit: 999999,
    },
    updatedAt: paidAt,
  };

  // 2. payments/{paymentId} payload
  const paymentRecord = {
    userId: params.userId,
    fullName: params.userName || "Acadet Student",
    email: params.userEmail,
    amount: params.amount,
    plan: params.planName || "Premium Membership",
    provider,
    transactionRef: params.reference,
    squadTransactionId: txId,
    gatewayTransactionId: txId,
    paymentMethod: params.paymentMethod || gatewayDisplayName,
    status: "success",
    createdAt: paidAt,
    updatedAt: paidAt,
  };

  // 3. subscriptions/{uid} payload
  const subscriptionRecord = {
    userId: params.userId,
    plan: params.planName || "Premium Membership",
    provider,
    amount: params.amount,
    status: "active",
    startDate: paidAt,
    expiryDate: expiryDate,
    paymentReference: params.reference,
  };

  if (dbServer) {
    try {
      // 1. Update User Profile in Firestore (users/{uid})
      const userRef = doc(dbServer, "users", params.userId);
      await setDoc(userRef, userPayload, { merge: true });

      // 2. Update Payments Collection (payments/{paymentId})
      const paymentRef = doc(dbServer, "payments", params.reference);
      await setDoc(paymentRef, paymentRecord, { merge: true });

      // 3. Update Subscriptions Collection (subscriptions/{uid})
      const subRef = doc(dbServer, "subscriptions", params.userId);
      await setDoc(subRef, subscriptionRecord, { merge: true });

      // 4. Trigger referral system check
      await processReferralReward(params.userId);

      console.log(`[Firestore Server] Verified & Activated ${gatewayDisplayName} Subscription for User ${params.userId} (${params.reference})`);
    } catch (err) {
      console.error("[Firestore Server] Failed to write subscription/payment records:", err);
    }
  }

  return { userPayload, paymentRecord, subscriptionRecord };
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

// Helper: Fetch live subscription plan from Firestore (subscription_plans/{planId})
const getLivePlanFromFirestore = async (planId: string) => {
  if (!dbServer || !planId) return null;
  try {
    const planRef = doc(dbServer, "subscription_plans", planId);
    const planSnap = await getDoc(planRef);
    if (planSnap.exists()) {
      const data = planSnap.data();
      return {
        id: planSnap.id,
        name: String(data.name || "Premium Plan"),
        price: Number(data.price) || 0,
        durationDays: Number(data.durationDays) || 30,
        active: data.active !== false,
      };
    }
  } catch (err) {
    console.warn(`[Firestore Server] Failed to fetch subscription_plan ${planId}:`, err);
  }
  return null;
};

// 2. Initiate Payment (POST /api/payments/initiate & aliases)
const handlePaymentInitiation = async (req: express.Request, res: express.Response) => {
  try {
    const { planId, email, userEmail, userId, uid, userName, userUsername } = req.body;
    const reqAmount = Number(req.body.amount);
    const provider = String(req.body.provider || req.body.gateway || "").toLowerCase();

    const effUserId = userId || uid || email || userEmail || "usr-student";
    const effEmail = email || userEmail || (userUsername ? `${userUsername}@acadet.cbt` : "student@acadet.cbt");

    if (!effEmail || !effEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "A valid customer email address is required to initiate payment.",
      });
    }

    // Determine Plan and Amount (Load live plan from Firestore first for security & accuracy)
    const livePlan = await getLivePlanFromFirestore(planId);
    const knownPlan = livePlan || SUBSCRIPTION_PLANS[planId];

    if (livePlan && !livePlan.active) {
      return res.status(400).json({
        success: false,
        error: `Subscription plan "${livePlan.name}" is currently inactive or disabled.`,
      });
    }

    // Amount in Naira is always stored and treated in Naira (e.g. 150, 800, 1500)
    const amountInNaira = knownPlan ? knownPlan.price : (reqAmount && reqAmount > 0 ? reqAmount : 800);
    const planTitle = req.body.planName || (knownPlan ? knownPlan.name : (planId === "premium-plus" || planId === "plan-30d" ? "Premium Plus" : "Premium Membership"));
    const durationDays = Number(req.body.durationDays) || (knownPlan ? knownPlan.durationDays : 30);
    const amountInKobo = Math.round(amountInNaira * 100);

    const gatewayName = provider === "korapay" ? "KoraPay" : "Squad";
    const amountSentToGateway = provider === "korapay" ? amountInNaira : amountInKobo;

    // Required Debug Logs (Selected Plan Price, Amount Sent To Gateway, Gateway Name)
    console.log(`\n=================== [PAYMENT DEBUG LOG] ===================`);
    console.log(`- Selected Plan Price: ₦${amountInNaira}`);
    console.log(`- Plan Duration Days: ${durationDays} days`);
    console.log(`- Gateway Name: ${gatewayName}`);
    console.log(`- Amount Sent To Gateway: ${amountSentToGateway} (${provider === 'korapay' ? 'Naira' : 'Kobo'})`);
    console.log(`- Plan ID: ${planId || 'default'} | Plan Name: ${planTitle}`);
    console.log(`===========================================================\n`);

    const timestamp = Date.now();
    const cleanUid = String(effUserId).replace(/[^a-zA-Z0-9_]/g, '');

    // Determine base App URL
    const rawHost = req.get('host') || 'cadetcbt.website';
    const rawProto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const isLocalhost = rawHost.includes('localhost') || rawHost.includes('127.0.0.1');
    const secureProto = isLocalhost ? rawProto : 'https';
    const reqHostUrl = `${secureProto}://${rawHost}`;
    const appUrl = (process.env.APP_URL || reqHostUrl).replace(/\/+$/, "");
    const callbackUrl = `${appUrl}/payment-success`;

    // ------------------- KORAPAY INITIALIZATION -------------------
    if (provider === "korapay") {
      const secretKey = getKorapaySecretKey();
      if (!secretKey || secretKey.includes("placeholder")) {
        return res.status(400).json({
          success: false,
          error: "KORAPAY_SECRET_KEY is missing or invalid in server environment. Please configure KORAPAY_SECRET_KEY.",
        });
      }

      // Ensure reference is unique and valid for Korapay (>= 8 chars, alphanumeric + _ -)
      const baseRef = req.body.reference || req.body.transactionRef || `ACADE_KORA_${timestamp}_${cleanUid}`;
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      const cleanRef = `${baseRef.replace(/[^a-zA-Z0-9_\-]/g, '')}_${uniqueSuffix}`.substring(0, 50);

      await createPendingPaymentInFirestore({
        userId: effUserId,
        fullName: userName || "Acadet Student",
        email: effEmail,
        reference: cleanRef,
        amount: amountInNaira,
        plan: planTitle,
        planId: planId || "premium",
        durationDays,
        provider: "korapay",
      });

      const customerName = (userName || "Acadet Student").trim();
      let userEmailStr = String(effEmail).trim().toLowerCase();
      
      // Korapay requires a valid top-level domain email format (e.g., .com, .org, .ng)
      if (!userEmailStr || !userEmailStr.includes("@") || userEmailStr.endsWith(".cbt") || userEmailStr.endsWith(".local")) {
        const userPrefix = (userEmailStr.split("@")[0] || String(effUserId)).replace(/[^a-z0-9]/g, "") || "student";
        userEmailStr = `${userPrefix}@gmail.com`;
      }

      // Korapay requires valid public HTTPS URLs for redirect and webhooks
      let publicAppUrl = appUrl.startsWith('http://') ? appUrl.replace('http://', 'https://') : appUrl;
      if (!publicAppUrl.startsWith('https://')) {
        publicAppUrl = `https://${publicAppUrl}`;
      }

      const validRedirectUrl = `${publicAppUrl}/payment-success`;
      const validNotificationUrl = publicAppUrl.includes('localhost') || publicAppUrl.includes('127.0.0.1')
        ? 'https://cadetcbt.website/api/webhooks/korapay'
        : `${publicAppUrl}/api/webhooks/korapay`;

      // Korapay charges/initialize payload (KoraPay API expects amount in NAIRA, e.g. 150 for ₦150)
      const korapayPayload = {
        amount: Number(amountInNaira),
        currency: "NGN",
        reference: cleanRef,
        narration: String(planTitle).substring(0, 100),
        notification_url: validNotificationUrl,
        redirect_url: validRedirectUrl,
        customer: {
          name: customerName,
          email: userEmailStr,
        },
        metadata: {
          "user-id": String(effUserId).substring(0, 50),
          "user-email": userEmailStr.substring(0, 50),
          "plan-id": String(planId || "premium").substring(0, 20),
          "plan-name": String(planTitle).substring(0, 50),
          "duration-days": String(durationDays),
        },
      };

      console.log(`[KoraPay Initiate] Initiating NGN ${amountInNaira} for ${userEmailStr} (Ref: ${cleanRef})`);

      // Primary attempt: charges/initialize
      let korapayRes = await fetch(`${getKorapayBaseUrl()}/merchant/api/v1/charges/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify(korapayPayload),
      });

      let korapayData = await korapayRes.json();

      // Fallback 1: Retrying without metadata if Korapay metadata validation failed
      if (!korapayData.status && (korapayData.error === "validation_error" || korapayData.message?.toLowerCase().includes("invalid"))) {
        console.warn("[KoraPay Initiate] Validation error received. Retrying without metadata object...");
        const noMetaPayload = {
          amount: Number(amountInNaira),
          currency: "NGN",
          reference: cleanRef,
          narration: String(planTitle).substring(0, 100),
          notification_url: validNotificationUrl,
          redirect_url: validRedirectUrl,
          customer: {
            name: customerName,
            email: userEmailStr,
          },
        };

        const fbRes0 = await fetch(`${getKorapayBaseUrl()}/merchant/api/v1/charges/initialize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
          },
          body: JSON.stringify(noMetaPayload),
        });
        const fbData0 = await fbRes0.json();
        if (fbData0.status === true || fbData0.status === "true" || fbData0.status === 200) {
          korapayData = fbData0;
        }
      }

      // Fallback 2: Try /merchant/api/v1/checkout/initialize if charges/initialize returned error
      if (!korapayData.status && (korapayData.error === "validation_error" || korapayData.message?.toLowerCase().includes("invalid"))) {
        console.warn("[KoraPay Initiate] /charges/initialize failed. Retrying with /checkout/initialize...");
        const checkoutPayload = {
          amount: Number(amountInNaira),
          currency: "NGN",
          reference: cleanRef,
          redirect_url: validRedirectUrl,
          notification_url: validNotificationUrl,
          customer: {
            name: customerName,
            email: userEmailStr,
          },
        };

        const checkoutRes = await fetch(`${getKorapayBaseUrl()}/merchant/api/v1/checkout/initialize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
          },
          body: JSON.stringify(checkoutPayload),
        });
        const checkoutData = await checkoutRes.json();
        if (checkoutData.status === true || checkoutData.status === "true" || checkoutData.status === 200) {
          korapayData = checkoutData;
        }
      }

      // Fallback 3: Try minimal payload without metadata or extra fields
      if (!korapayData.status && (korapayData.error === "validation_error" || korapayData.message?.toLowerCase().includes("invalid"))) {
        console.warn("[KoraPay Initiate] Retrying with minimal Korapay payload...");
        const minimalPayload = {
          amount: Number(amountInNaira),
          currency: "NGN",
          reference: cleanRef,
          redirect_url: validRedirectUrl,
          customer: {
            name: customerName,
            email: userEmailStr,
          },
        };

        const fbRes2 = await fetch(`${getKorapayBaseUrl()}/merchant/api/v1/charges/initialize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
          },
          body: JSON.stringify(minimalPayload),
        });
        const fbData2 = await fbRes2.json();
        if (fbData2.status === true || fbData2.status === "true" || fbData2.status === 200) {
          korapayData = fbData2;
        }
      }

      if ((korapayData.status === true || korapayData.status === "true" || korapayData.status === 200) && korapayData.data) {
        const checkoutUrl = korapayData.data.checkout_url || korapayData.data.authorization_url;
        if (!checkoutUrl) {
          return res.status(400).json({
            success: false,
            error: "KoraPay API did not return a valid checkout URL.",
            korapayResponse: korapayData,
          });
        }

        return res.json({
          success: true,
          provider: "korapay",
          paymentId: cleanRef,
          transactionRef: cleanRef,
          reference: cleanRef,
          checkoutUrl,
          paymentLink: checkoutUrl,
          amount: amountInNaira,
          planId: planId || "premium",
          planName: planTitle,
          korapayData: korapayData.data,
        });
      } else {
        console.error("[KoraPay Initiate Error]", korapayData);
        return res.status(400).json({
          success: false,
          error: korapayData.message || korapayData.error || "Failed to initialize payment with KoraPay Gateway.",
          details: korapayData.data || korapayData.errors || korapayData,
          korapayResponse: korapayData,
        });
      }
    }

    // ------------------- SQUAD INITIALIZATION (DEFAULT) -------------------
    const secretKey = getSquadSecretKey();
    if (!secretKey || secretKey.includes("placeholder")) {
      return res.status(400).json({
        success: false,
        error: "SQUAD_SECRET_KEY is missing or invalid in server environment. Please configure SQUAD_SECRET_KEY.",
      });
    }

    const reference = req.body.reference || req.body.transactionRef || `ACADE_${timestamp}_${cleanUid}`;
    const baseUrl = getSquadBaseUrl();

    // Step 1: Create initial pending record in Firestore (payments/{paymentId})
    await createPendingPaymentInFirestore({
      userId: effUserId,
      fullName: userName || "Acadet Student",
      email: effEmail,
      reference,
      amount: amountInNaira,
      plan: planTitle,
      planId: planId || "premium",
      durationDays,
      provider: "squad",
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
        planId: planId || "premium",
        planName: planTitle,
        amount: amountInNaira,
        durationDays: Number(req.body?.durationDays) || (knownPlan ? knownPlan.durationDays : 30),
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
        provider: "squad",
        paymentId: reference,
        transactionRef: reference,
        reference,
        checkoutUrl,
        paymentLink: checkoutUrl,
        amount: amountInNaira,
        planId: planId || "premium",
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
    console.error("[Payment Initiate Exception]", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Server error while contacting Payment Gateway.",
    });
  }
};

app.post("/api/payments/initiate", handlePaymentInitiation);
app.post("/api/create-payment-link", handlePaymentInitiation);
app.post("/api/squad/initialize", handlePaymentInitiation);
app.post("/api/korapay/initialize", handlePaymentInitiation);

// 3. Payment Verification (GET & POST /api/payments/verify/:reference)
const handlePaymentVerification = async (req: express.Request, res: express.Response) => {
  try {
    const reference = req.params.reference || req.query.reference || req.body.reference || req.query.transaction_ref || req.query.trxref;
    const userId = req.body?.userId || req.body?.uid || req.query?.userId;
    const email = req.body?.email || req.body?.userEmail || req.query?.email;
    const planId = req.body?.planId || req.query?.planId || "premium";

    if (!reference) {
      return res.status(400).json({
        success: false,
        status: "failed",
        error: "Transaction reference is required for payment verification.",
      });
    }

    let isKorapay = String(reference).startsWith("ACADE_KORA_") || String(req.body?.provider || req.query?.provider || "").toLowerCase() === "korapay";

    if (!isKorapay && dbServer) {
      try {
        const existingDoc = await getDoc(doc(dbServer, "payments", reference));
        if (existingDoc.exists() && existingDoc.data()?.provider === "korapay") {
          isKorapay = true;
        }
      } catch (e) {
        // fallback
      }
    }

    if (isKorapay) {
      const secretKey = getKorapaySecretKey();
      if (!secretKey || secretKey.includes("placeholder")) {
        return res.status(400).json({
          success: false,
          status: "failed",
          error: "KORAPAY_SECRET_KEY is missing or invalid in server environment.",
        });
      }

      console.log(`[KoraPay Verify] Querying KoraPay API for reference: ${reference}`);
      const verifyRes = await fetch(`${getKorapayBaseUrl()}/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const verifyData = await verifyRes.json();
      const statusStr = String(verifyData?.data?.status || verifyData?.status || "").toLowerCase();
      const isSuccess = (
        (verifyData.status === true || verifyData.status === "true" || verifyData.status === 200 || verifyData.status === "success") &&
        verifyData.data &&
        (statusStr === "success" || statusStr === "successful")
      );

      const meta = verifyData.data?.metadata || {};
      const effUserId = userId || meta.userId || verifyData.data?.customer?.userId || email || "usr-student";
      const effEmail = email || meta.userEmail || verifyData.data?.customer?.email || "student@acadet.cbt";

      if (!isSuccess) {
        if (dbServer) {
          setDoc(
            doc(dbServer, "payments", reference),
            {
              userId: effUserId,
              email: effEmail,
              transactionRef: reference,
              provider: "korapay",
              status: "failed",
              updatedAt: new Date().toISOString(),
              korapayResponse: verifyData,
            },
            { merge: true }
          ).catch((err) => console.error("Failed to set payment failed status:", err));
        }

        return res.status(400).json({
          success: false,
          status: statusStr || "failed",
          error: verifyData.message || "KoraPay payment verification failed: Payment was not confirmed on KoraPay Gateway.",
          korapayResponse: verifyData,
        });
      }

      processedKorapayReferences.add(reference);

      let storedPending: any = null;
      if (dbServer) {
        try {
          const pSnap = await getDoc(doc(dbServer, "payments", reference));
          if (pSnap.exists()) {
            storedPending = pSnap.data();
          }
        } catch (e) {
          console.warn("[KoraPay Verify] Could not fetch stored pending doc:", e);
        }
      }

      const rawAmount = verifyData.data?.amount || meta.amount || storedPending?.amount || 800;
      const actualAmount = storedPending?.amount || (rawAmount > 5000 ? Math.round(rawAmount / 100) : rawAmount);
      const reqPlanId = planId || meta.planId || meta["plan-id"] || storedPending?.planId || "premium";
      const livePlan = await getLivePlanFromFirestore(reqPlanId);
      const knownPlan = livePlan || SUBSCRIPTION_PLANS[reqPlanId];
      const durationDays = Number(req.body?.durationDays) || Number(meta.durationDays) || Number(meta["duration-days"]) || Number(storedPending?.durationDays) || (knownPlan ? knownPlan.durationDays : 30);
      const planTitle = req.body?.planName || meta.planName || meta["plan-name"] || storedPending?.plan || (knownPlan ? knownPlan.name : "Premium Membership");

      const syncResult = await activateSubscriptionInFirestore({
        userId: effUserId,
        userName: req.body?.userName || meta.fullName || meta.userName || "Acadet Student",
        userEmail: effEmail,
        reference,
        gatewayRef: verifyData.data?.reference || reference,
        squadTransactionId: verifyData.data?.reference || reference,
        amount: actualAmount,
        planName: planTitle,
        durationDays,
        paymentMethod: "KoraPay Checkout",
        provider: "korapay",
        squadResponse: verifyData,
      });

      return res.json({
        success: true,
        status: "success",
        provider: "korapay",
        message: "KoraPay payment successfully verified on server! Premium subscription activated.",
        reference,
        amount: actualAmount,
        planName: planTitle,
        user: syncResult?.userPayload,
        subscription: syncResult?.subscriptionRecord,
        payment: syncResult?.paymentRecord,
      });
    }

    // ------------------- SQUAD VERIFICATION -------------------
    const secretKey = getSquadSecretKey();
    if (!secretKey || secretKey.includes("placeholder")) {
      return res.status(400).json({
        success: false,
        status: "failed",
        error: "SQUAD_SECRET_KEY is missing or invalid in server environment.",
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
      if (dbServer) {
        setDoc(
          doc(dbServer, "payments", reference),
          {
            userId: effUserId,
            email: effEmail,
            transactionRef: reference,
            provider: "squad",
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

    processedSquadReferences.add(reference);

    let storedPending: any = null;
    if (dbServer) {
      try {
        const pSnap = await getDoc(doc(dbServer, "payments", reference));
        if (pSnap.exists()) {
          storedPending = pSnap.data();
        }
      } catch (e) {
        console.warn("[Squad Verify] Could not fetch stored pending doc:", e);
      }
    }

    const returnedAmt = verifyData.data.transaction_amount || verifyData.data.amount;
    const actualAmount = storedPending?.amount || (returnedAmt ? (returnedAmt > 10000 ? Math.round(returnedAmt / 100) : returnedAmt) : 800);
    const gatewayRef = verifyData.data?.gateway_ref || verifyData.data?.transaction_ref || reference;

    const meta = verifyData.data?.meta || verifyData.data?.metadata || {};
    const reqPlanId = planId || meta.planId || meta["plan-id"] || storedPending?.planId || "premium";
    const livePlan = await getLivePlanFromFirestore(reqPlanId);
    const knownPlan = livePlan || SUBSCRIPTION_PLANS[reqPlanId];
    const durationDays = Number(req.body?.durationDays) || Number(meta.durationDays) || Number(meta["duration-days"]) || Number(storedPending?.durationDays) || (knownPlan ? knownPlan.durationDays : 30);
    const planTitle = req.body?.planName || meta.planName || meta["plan-name"] || storedPending?.plan || (knownPlan ? knownPlan.name : "Premium Membership");

    const syncResult = await activateSubscriptionInFirestore({
      userId: effUserId,
      userName: req.body?.userName || meta.userName || "Acadet Student",
      userEmail: effEmail,
      reference,
      gatewayRef,
      amount: actualAmount,
      planName: planTitle,
      durationDays,
      paymentMethod: verifyData.data?.payment_method || "Squad Checkout",
      provider: "squad",
      squadResponse: verifyData,
    });

    return res.json({
      success: true,
      status: "success",
      provider: "squad",
      message: "Squad payment successfully verified on server! Premium subscription activated.",
      reference,
      amount: actualAmount,
      planName: planTitle,
      user: syncResult?.userPayload,
      subscription: syncResult?.subscriptionRecord,
      payment: syncResult?.paymentRecord,
    });
  } catch (err: any) {
    console.error("[Payment Verify Exception]", err);
    return res.status(500).json({
      success: false,
      status: "failed",
      error: err.message || "Failed to verify payment with Gateway API.",
    });
  }
};

app.get("/api/payments/verify/:reference", handlePaymentVerification);
app.post("/api/payments/verify/:reference", handlePaymentVerification);
app.get("/api/payments/verify", handlePaymentVerification);
app.post("/api/payments/verify", handlePaymentVerification);
app.post("/api/verify-payment", handlePaymentVerification);
app.post("/api/squad/verify", handlePaymentVerification);
app.post("/api/korapay/verify", handlePaymentVerification);

// 4. Squad Webhook (POST /api/webhooks/squad & POST /api/payments/webhook & POST /api/squad/webhook)
const handleSquadWebhook = async (req: express.Request, res: express.Response) => {
  try {
    const signature = (req.headers["x-squad-signature"] as string) || (req.headers["x-squad-encrypted-body"] as string);
    const webhookSecret = getSquadWebhookSecret();

    if (signature && webhookSecret && !webhookSecret.includes("placeholder")) {
      const computedHash = crypto
        .createHmac("sha512", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex")
        .toUpperCase();

      if (computedHash !== signature.toUpperCase()) {
        console.warn("[Squad Webhook] Invalid webhook signature. Rejecting request.");
        return res.status(401).json({ status: "error", error: "Invalid webhook signature" });
      }
    }

    const payload = req.body || {};
    const rawEvent = payload.Event || payload.event || payload.action || "";
    const bodyData = payload.Body || payload.data || payload;

    console.log(`[Squad Webhook Received] Event: ${rawEvent}`);

    const reference = bodyData.transaction_ref || bodyData.reference;
    const status = String(bodyData.transaction_status || bodyData.status || "").toLowerCase();
    const isChargeSuccessful =
      rawEvent.toLowerCase().includes("charge_successful") ||
      rawEvent.toLowerCase().includes("charge.successful") ||
      status === "success" ||
      status === "successful";

    if (reference && isChargeSuccessful) {
      if (processedSquadReferences.has(reference)) {
        console.log(`[Squad Webhook] Reference ${reference} already processed.`);
        return res.status(200).json({ status: "success", message: "Already processed" });
      }

      processedSquadReferences.add(reference);

      let storedPending: any = null;
      if (dbServer) {
        try {
          const pSnap = await getDoc(doc(dbServer, "payments", reference));
          if (pSnap.exists()) {
            storedPending = pSnap.data();
          }
        } catch (e) {
          console.warn("[Squad Webhook] Could not fetch stored pending doc:", e);
        }
      }

      const metadata = bodyData.meta || bodyData.metadata || {};
      const userId = metadata.userId || bodyData.customer?.user_id || storedPending?.userId || "usr-student";
      const userEmail = bodyData.email || metadata.userEmail || storedPending?.email || "student@acadet.cbt";
      const userName = metadata.userName || bodyData.customer?.name || storedPending?.fullName || "Acadet Student";
      const rawAmt = bodyData.amount || bodyData.transaction_amount || metadata.amount || storedPending?.amount || 800;
      const amount = storedPending?.amount || (rawAmt > 10000 ? Math.round(rawAmt / 100) : rawAmt);
      const gatewayRef = bodyData.gateway_ref || bodyData.transaction_ref || reference;

      const reqPlanId = metadata.planId || metadata["plan-id"] || storedPending?.planId || "premium";
      const livePlan = await getLivePlanFromFirestore(reqPlanId);
      const knownPlan = livePlan || SUBSCRIPTION_PLANS[reqPlanId];
      const durationDays = Number(metadata.durationDays) || Number(metadata["duration-days"]) || Number(storedPending?.durationDays) || (knownPlan ? knownPlan.durationDays : 30);
      const planTitle = metadata.planName || metadata["plan-name"] || storedPending?.plan || (knownPlan ? knownPlan.name : "Premium Membership");

      // Log webhook event in webhook_logs/{logId}
      if (dbServer) {
        const logId = `log_${Date.now()}_${reference}`;
        setDoc(doc(dbServer, "webhook_logs", logId), {
          event: rawEvent || "charge_successful",
          transactionRef: reference,
          gatewayRef,
          userId,
          email: userEmail,
          amount,
          squadResponse: payload,
          createdAt: new Date().toISOString(),
        }, { merge: true }).catch((err) => console.error("Failed to store webhook log:", err));
      }

      if (userId) {
        await activateSubscriptionInFirestore({
          userId,
          userName,
          userEmail,
          reference,
          gatewayRef,
          amount,
          planName: planTitle,
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

app.post("/api/webhooks/squad", handleSquadWebhook);
app.post("/api/payments/webhook", handleSquadWebhook);
app.post("/api/squad/webhook", handleSquadWebhook);

// 5. KoraPay Webhook (POST /api/webhooks/korapay & POST /api/korapay/webhook)
const handleKorapayWebhook = async (req: express.Request, res: express.Response) => {
  try {
    const signature = (req.headers["x-korapay-signature"] as string) || (req.headers["x-signature"] as string);
    const webhookSecret = getKorapayWebhookSecret();

    if (signature && webhookSecret && !webhookSecret.includes("placeholder")) {
      const computedHash = crypto
        .createHmac("sha256", webhookSecret)
        .update(typeof req.body === "string" ? req.body : JSON.stringify(req.body))
        .digest("hex");

      if (computedHash.toLowerCase() !== signature.toLowerCase()) {
        console.warn("[KoraPay Webhook] Invalid signature. Rejecting request.");
        return res.status(401).json({ status: "error", error: "Invalid KoraPay webhook signature" });
      }
    }

    const payload = req.body || {};
    const event = String(payload.event || payload.action || "").toLowerCase();
    const data = payload.data || payload;

    console.log(`[KoraPay Webhook Received] Event: ${event}`);

    const reference = data.reference || data.transaction_ref;
    const status = String(data.status || "").toLowerCase();
    const isSuccess = event === "charge.success" || status === "success" || status === "successful";

    if (reference && isSuccess) {
      if (processedKorapayReferences.has(reference)) {
        console.log(`[KoraPay Webhook] Reference ${reference} already processed.`);
        return res.status(200).json({ status: "success", message: "Already processed" });
      }

      processedKorapayReferences.add(reference);

      // Verify transaction directly with KoraPay API for security
      const secretKey = getKorapaySecretKey();
      if (secretKey && !secretKey.includes("placeholder")) {
        try {
          const verifyRes = await fetch(`${getKorapayBaseUrl()}/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${secretKey}` },
          });
          const verifyData = await verifyRes.json();
          const vStatus = String(verifyData?.data?.status || "").toLowerCase();
          if (vStatus !== "success" && vStatus !== "successful") {
            console.warn(`[KoraPay Webhook] Server verification check failed for ${reference}`);
            return res.status(400).json({ status: "error", error: "KoraPay verification failed on server check" });
          }
        } catch (vErr) {
          console.error("[KoraPay Webhook] Direct verify exception:", vErr);
        }
      }

      let storedPending: any = null;
      if (dbServer) {
        try {
          const pSnap = await getDoc(doc(dbServer, "payments", reference));
          if (pSnap.exists()) {
            storedPending = pSnap.data();
          }
        } catch (e) {
          console.warn("[KoraPay Webhook] Could not fetch stored pending doc:", e);
        }
      }

      const meta = data.metadata || {};
      const userId = meta.userId || meta["user-id"] || data.customer?.userId || storedPending?.userId || "usr-student";
      const userEmail = meta.userEmail || meta["user-email"] || data.customer?.email || storedPending?.email || "student@acadet.cbt";
      const userName = meta.fullName || meta.userName || data.customer?.name || storedPending?.fullName || "Acadet Student";
      const rawAmount = data.amount || meta.amount || meta["amount"] || storedPending?.amount || 800;
      const amount = storedPending?.amount || (rawAmount > 5000 ? Math.round(rawAmount / 100) : rawAmount);

      const reqPlanId = meta.planId || meta["plan-id"] || storedPending?.planId || "premium";
      const livePlan = await getLivePlanFromFirestore(reqPlanId);
      const knownPlan = livePlan || SUBSCRIPTION_PLANS[reqPlanId];
      const durationDays = Number(meta.durationDays) || Number(meta["duration-days"]) || Number(storedPending?.durationDays) || (knownPlan ? knownPlan.durationDays : 30);
      const planTitle = meta.planName || meta["plan-name"] || storedPending?.plan || (knownPlan ? knownPlan.name : "Premium Membership");

      if (dbServer) {
        const logId = `kora_log_${Date.now()}_${reference}`;
        setDoc(doc(dbServer, "webhook_logs", logId), {
          event: event || "charge.success",
          transactionRef: reference,
          provider: "korapay",
          userId,
          email: userEmail,
          amount,
          korapayResponse: payload,
          createdAt: new Date().toISOString(),
        }, { merge: true }).catch((err) => console.error("Failed to store KoraPay webhook log:", err));
      }

      if (userId) {
        await activateSubscriptionInFirestore({
          userId,
          userName,
          userEmail,
          reference,
          gatewayRef: reference,
          squadTransactionId: reference,
          amount,
          planName: planTitle,
          durationDays,
          paymentMethod: "KoraPay Webhook",
          provider: "korapay",
          squadResponse: payload,
        });
        console.log(`[KoraPay Webhook] Successfully activated subscription for User ${userId}`);
      }
    }

    return res.status(200).json({ status: "success", message: "KoraPay webhook processed successfully" });
  } catch (err: any) {
    console.error("[KoraPay Webhook Exception]", err);
    return res.status(200).json({ status: "success", message: "Webhook acknowledged" });
  }
};

app.post("/api/webhooks/korapay", handleKorapayWebhook);
app.post("/api/korapay/webhook", handleKorapayWebhook);

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
if (process.env.FUNCTION_NAME || process.env.FUNCTION_TARGET) {
  import("firebase-functions/v2/https")
    .then(({ onRequest }) => {
      apiExport = onRequest(
        {
          cors: true,
          maxInstances: 10,
        },
        app
      );
    })
    .catch((e) => {
      console.warn("Firebase onRequest export skipped:", e);
    });
}

export { apiExport as api, app };

async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true, allowedHosts: true },
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
