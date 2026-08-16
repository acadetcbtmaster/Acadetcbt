import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp as initFirebaseApp, getApps as getFirebaseApps, getApp as getFirebaseApp } from "firebase/app";
import { getAuth as getFirebaseAuth, signInWithEmailAndPassword as signInFirebaseEmail, createUserWithEmailAndPassword as createFirebaseUser } from "firebase/auth";
import { initializeFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc, setLogLevel } from "firebase/firestore";

try {
  setLogLevel('error');
} catch {}

dotenv.config();

const app = express();
app.set("trust proxy", true);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Server-side Firestore Connection
let dbServer: any = null;
let authServer: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const fbApp = getFirebaseApps().length > 0 ? getFirebaseApp() : initFirebaseApp(firebaseConfig);
    const dbId = firebaseConfig.firestoreDatabaseId === 'ai-studio-aicbtsimulator-24029710-e20e-4e1e-a3cf-846d58bd47cf' ? '(default)' : (firebaseConfig.firestoreDatabaseId || '(default)');
    dbServer = initializeFirestore(fbApp, { ignoreUndefinedProperties: true }, dbId);
    authServer = getFirebaseAuth(fbApp);

    // Authenticate backend server as Administrator if email provider is enabled
    const adminEmail = "admin@menmex.ng";
    const adminPass = process.env.ADMIN_PASSWORD || "joyce@menmex";
    signInFirebaseEmail(authServer, adminEmail, adminPass)
      .then(() => console.log("[Firestore Server] Authenticated backend as Administrator"))
      .catch((signInErr) => {
        const isNotAllowed =
          signInErr?.code === 'auth/operation-not-allowed' ||
          String(signInErr?.message || '').includes('operation-not-allowed');

        if (!isNotAllowed) {
          createFirebaseUser(authServer, adminEmail, adminPass)
            .then(() => console.log("[Firestore Server] Created & Authenticated Admin user in Firebase Auth"))
            .catch((err) => {
              const creationNotAllowed =
                err?.code === 'auth/operation-not-allowed' ||
                String(err?.message || '').includes('operation-not-allowed');
              if (!creationNotAllowed) {
                console.warn("[Firestore Server] Admin Auth notice:", err.message || err);
              }
            });
        }
      });
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

// Helper: Cancel all user subscriptions across Firestore until a new payment is made
const cancelAllUserSubscriptionsInFirestore = async () => {
  if (!dbServer) {
    console.warn("[Firestore Server] dbServer not initialized, skipping subscription cancellation.");
    return { success: false, count: 0, reason: "dbServer unavailable" };
  }
  try {
    const usersSnap = await getDocs(collection(dbServer, "users"));
    let cancelledCount = 0;
    const nowIso = new Date().toISOString();

    for (const docSnap of usersSnap.docs) {
      const data = docSnap.data();
      // Keep system admin role unchanged
      if (data.role === "admin") continue;

      const userRef = doc(dbServer, "users", docSnap.id);
      await setDoc(
        userRef,
        {
          subscriptionStatus: "cancelled",
          subscriptionPlan: "Cancelled (Free Tier)",
          subscription: {
            isPremium: false,
            plan: "30-Question Free Tier",
            startDate: nowIso,
            expiryDate: null,
            questionsAttemptedCount: 0,
            freeLimit: 30,
          },
          updatedAt: nowIso,
        },
        { merge: true }
      );

      const subRef = doc(dbServer, "subscriptions", docSnap.id);
      await setDoc(
        subRef,
        {
          status: "cancelled",
          plan: "Cancelled (Free Tier)",
          updatedAt: nowIso,
        },
        { merge: true }
      );

      cancelledCount++;
    }

    console.log(`[Admin Security Sync] Successfully cancelled all ${cancelledCount} user subscriptions in Firestore until new payments are made.`);
    return { success: true, count: cancelledCount };
  } catch (err) {
    console.error("[Admin Security Sync Error] Failed to cancel user subscriptions:", err);
    return { success: false, error: String(err) };
  }
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

// Helper: Fetch live subscription plan from Firestore (subscription_plans/{planId}) with 600ms fast timeout
const getLivePlanFromFirestore = async (planId: string) => {
  if (!dbServer || !planId) return null;
  try {
    const planRef = doc(dbServer, "subscription_plans", planId);
    // Timeout getDoc after 150ms so payment initiation is instantaneous
    const planSnap = await Promise.race([
      getDoc(planRef),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 150)),
    ]);
    if (planSnap && planSnap.exists()) {
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
  const backendStartTime = Date.now();
  console.log(`\n========================================`);
  console.log(`[Payment Init] Request Received: ${new Date(backendStartTime).toISOString()}`);
  try {
    console.log(`[Payment Init] Validation Started (Elapsed: 0ms)`);
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

    // Determine Plan and Amount (Fast resolution without blocking on Firestore if price is provided)
    let livePlan = null;
    if ((!reqAmount || reqAmount <= 0) && planId) {
      livePlan = await getLivePlanFromFirestore(planId);
    }
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
    console.log(`- Selected Plan Price: ₦${amountInNaira}`);
    console.log(`- Plan Duration Days: ${durationDays} days`);
    console.log(`- Gateway Name: ${gatewayName}`);
    console.log(`- Amount Sent To Gateway: ${amountSentToGateway} (${provider === 'korapay' ? 'Naira' : 'Kobo'})`);
    console.log(`- Plan ID: ${planId || 'default'} | Plan Name: ${planTitle}`);

    const timestamp = Date.now();
    const cleanUid = String(effUserId).replace(/[^a-zA-Z0-9_]/g, '');

    // Determine base App URL safely without stale Railway URLs
    let resolvedHostUrl = '';

    // 1. Try origin or referer header first (e.g. "https://acadetcbt.website")
    const originHeader = req.get('origin') || req.get('referer');
    if (originHeader) {
      try {
        const parsed = new URL(originHeader);
        if (parsed.protocol.startsWith('http') && !parsed.hostname.includes('railway.app')) {
          resolvedHostUrl = `${parsed.protocol}//${parsed.host}`;
        }
      } catch (e) {}
    }

    // 2. If origin Header not found, try x-forwarded-host or host
    if (!resolvedHostUrl) {
      const xHost = req.get('x-forwarded-host') || req.get('host') || '';
      if (xHost && !xHost.includes('railway.app')) {
        const rawProto = req.get('x-forwarded-proto') || req.protocol || 'https';
        const isLocalhost = xHost.includes('localhost') || xHost.includes('127.0.0.1');
        const secureProto = isLocalhost ? rawProto : 'https';
        resolvedHostUrl = `${secureProto}://${xHost}`;
      }
    }

    // 3. Fallback to process.env.APP_URL if valid and not railway
    if (!resolvedHostUrl && process.env.APP_URL && !process.env.APP_URL.includes('railway.app')) {
      resolvedHostUrl = process.env.APP_URL.replace(/\/+$/, "");
    }

    // 4. Fallback to active website domain
    if (!resolvedHostUrl || resolvedHostUrl.includes('railway.app')) {
      resolvedHostUrl = 'https://acadetcbt.website';
    }

    const appUrl = resolvedHostUrl.replace(/\/+$/, "");
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

      // Non-blocking firestore pending payment record creation
      createPendingPaymentInFirestore({
        userId: effUserId,
        fullName: userName || "Acadet Student",
        email: effEmail,
        reference: cleanRef,
        amount: amountInNaira,
        plan: planTitle,
        planId: planId || "premium",
        durationDays,
        provider: "korapay",
      }).catch((e) => console.warn("[Firestore Server] Non-blocking Korapay pending record creation error:", e));

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
          userId: String(effUserId).substring(0, 50),
          userEmail: userEmailStr.substring(0, 50),
          planId: String(planId || "premium").substring(0, 20),
          planName: String(planTitle).substring(0, 50),
          durationDays: String(durationDays),
        },
      };

      const gatewayCallStart = Date.now();
      console.log(`[Payment Init] Gateway Request Sent: KoraPay (${cleanRef}) at ${new Date(gatewayCallStart).toISOString()}`);

      // Primary attempt: charges/initialize with 4s timeout
      let korapayRes = await fetch(`${getKorapayBaseUrl()}/merchant/api/v1/charges/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify(korapayPayload),
        signal: AbortSignal.timeout(4000),
      });

      let korapayData = await korapayRes.json();
      let gatewayDuration = Date.now() - gatewayCallStart;
      console.log(`[Payment Init] Gateway Response Received: KoraPay in ${gatewayDuration}ms`);

      // Fast single fallback without metadata if Korapay metadata validation failed
      if (!korapayData.status && (korapayData.error === "validation_error" || korapayData.message?.toLowerCase().includes("invalid"))) {
        console.warn("[KoraPay Initiate] Retrying Korapay charges/initialize without metadata...");
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
          signal: AbortSignal.timeout(3000),
        });
        const fbData0 = await fbRes0.json();
        if (fbData0.status === true || fbData0.status === "true" || fbData0.status === 200) {
          korapayData = fbData0;
        }
      }

      const totalBackendTimeMs = Date.now() - backendStartTime;

      if ((korapayData.status === true || korapayData.status === "true" || korapayData.status === 200) && korapayData.data) {
        const checkoutUrl = korapayData.data.checkout_url || korapayData.data.authorization_url;
        if (!checkoutUrl) {
          return res.status(400).json({
            success: false,
            error: "KoraPay API did not return a valid checkout URL.",
            korapayResponse: korapayData,
          });
        }

        console.log(`[Payment Init] Checkout URL Returned: ${checkoutUrl}`);
        console.log(`[Payment Init] Total Duration: ${totalBackendTimeMs}ms`);
        console.log(`========================================\n`);

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
          gatewayTimeMs: gatewayDuration,
          backendTimeMs: totalBackendTimeMs,
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

    // Step 1: Create initial pending record in Firestore (payments/{paymentId}) non-blockingly
    createPendingPaymentInFirestore({
      userId: effUserId,
      fullName: userName || "Acadet Student",
      email: effEmail,
      reference,
      amount: amountInNaira,
      plan: planTitle,
      planId: planId || "premium",
      durationDays,
      provider: "squad",
    }).catch((e) => console.warn("[Firestore Server] Non-blocking Squad pending record creation error:", e));

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

    const gatewayCallStart = Date.now();
    console.log(`[Payment Init] Gateway Request Sent: Squad (${reference}) at ${new Date(gatewayCallStart).toISOString()}`);

    const squadRes = await fetch(`${baseUrl}/transaction/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(squadPayload),
      signal: AbortSignal.timeout(4000),
    });

    const squadData = await squadRes.json();
    const gatewayDuration = Date.now() - gatewayCallStart;
    const totalBackendTimeMs = Date.now() - backendStartTime;

    console.log(`[Payment Init] Gateway Response Received: Squad in ${gatewayDuration}ms`);

    if ((squadData.status === 200 || squadData.status === "200" || squadData.success) && squadData.data) {
      const checkoutUrl = squadData.data.checkout_url || squadData.data.auth_url;
      if (!checkoutUrl) {
        return res.status(400).json({
          success: false,
          error: "Squad API did not return a valid checkout URL.",
          squadResponse: squadData,
        });
      }

      console.log(`[Payment Init] Checkout URL Returned: ${checkoutUrl}`);
      console.log(`[Payment Init] Total Duration: ${totalBackendTimeMs}ms`);
      console.log(`========================================\n`);

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
        gatewayTimeMs: gatewayDuration,
        backendTimeMs: totalBackendTimeMs,
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
    console.error("[Payment Init Exception]", err);
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

// ==================== MULTI-ADMIN RBAC & AUTHENTICATION ====================

interface AdminAccountServer {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdDate: string;
  updatedDate?: string;
  lastLogin?: string;
  lastIpAddress?: string;
  loginCount: number;
  avatarUrl?: string;
  customPermissions?: Record<string, boolean>;
  createdBy?: string;
}

const ROLE_PERMISSIONS_SERVER: Record<string, string[]> = {
  super_admin: [
    'manage_students',
    'manage_support_tickets',
    'manage_questions',
    'manage_courses',
    'manage_universities',
    'manage_payments',
    'manage_reports',
    'manage_study_materials',
    'manage_settings',
    'manage_backups',
    'manage_notifications',
    'view_activity_logs',
    'manage_other_administrators',
  ],
  'Super Administrator': [
    'manage_students',
    'manage_support_tickets',
    'manage_questions',
    'manage_courses',
    'manage_universities',
    'manage_payments',
    'manage_reports',
    'manage_study_materials',
    'manage_settings',
    'manage_backups',
    'manage_notifications',
    'view_activity_logs',
    'manage_other_administrators',
  ],
  student_manager: ['manage_students', 'manage_support_tickets', 'view_activity_logs'],
  'Student Manager': ['manage_students', 'manage_support_tickets', 'view_activity_logs'],
  question_manager: ['manage_questions', 'manage_courses', 'view_activity_logs'],
  'Question Manager': ['manage_questions', 'manage_courses', 'view_activity_logs'],
  course_manager: ['manage_courses', 'manage_universities', 'view_activity_logs'],
  'Course Manager': ['manage_courses', 'manage_universities', 'view_activity_logs'],
  payment_manager: ['manage_payments', 'manage_reports', 'view_activity_logs'],
  'Payment Manager': ['manage_payments', 'manage_reports', 'view_activity_logs'],
  support_manager: ['manage_support_tickets', 'manage_students', 'view_activity_logs'],
  'Support Manager': ['manage_support_tickets', 'manage_students', 'view_activity_logs'],
  report_manager: ['manage_reports', 'view_activity_logs'],
  'Report Manager': ['manage_reports', 'view_activity_logs'],
  content_manager: ['manage_study_materials', 'manage_questions', 'view_activity_logs'],
  'Content Manager': ['manage_study_materials', 'manage_questions', 'view_activity_logs'],
  system_manager: ['manage_settings', 'manage_backups', 'manage_notifications', 'view_activity_logs'],
  'System Manager': ['manage_settings', 'manage_backups', 'manage_notifications', 'view_activity_logs'],
};

function normalizeServerRole(role?: string): string {
  if (!role) return 'super_admin';
  const lower = role.toLowerCase().replace(/[\s_-]+/g, '');
  if (lower.includes('super')) return 'super_admin';
  if (lower.includes('student')) return 'student_manager';
  if (lower.includes('question')) return 'question_manager';
  if (lower.includes('course')) return 'course_manager';
  if (lower.includes('payment')) return 'payment_manager';
  if (lower.includes('support')) return 'support_manager';
  if (lower.includes('report')) return 'report_manager';
  if (lower.includes('content')) return 'content_manager';
  if (lower.includes('system')) return 'system_manager';
  return 'super_admin';
}

function hashPasswordServer(password: string, salt = 'acadet_cbt_master_secure_salt_2026'): string {
  let hash = 0;
  const combined = `${salt}:${password}:${salt}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${combined.length}`;
}

function verifyPasswordServer(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  if (storedHash === password) return true;
  return hashPasswordServer(password) === storedHash;
}

// In-Memory Admin State with Defaults for All 9 Roles
const inMemoryAdmins = new Map<string, AdminAccountServer>();

const SEED_ADMINS_SERVER: AdminAccountServer[] = [
  {
    id: 'ADM-1001',
    fullName: 'Dr. Clement O. Adebayo',
    username: 'superadmin',
    email: 'clement.adebayo@cbtmaster.ng',
    phone: '+234 803 123 4567',
    passwordHash: hashPasswordServer('Admin@1234'),
    role: 'super_admin',
    status: 'Active',
    createdDate: '2025-01-10T08:00:00.000Z',
    lastLogin: new Date().toISOString(),
    loginCount: 342,
    createdBy: 'System Provisioning',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1002',
    fullName: 'Emeka Chukwudi Eze',
    username: 'studentadmin',
    email: 'emeka.eze@cbtmaster.ng',
    phone: '+234 814 555 1212',
    passwordHash: hashPasswordServer('Student@1234'),
    role: 'student_manager',
    status: 'Active',
    createdDate: '2025-02-15T09:30:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
    loginCount: 94,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1003',
    fullName: 'Aisha Bello Abubakar',
    username: 'questionadmin',
    email: 'aisha.bello@cbtmaster.ng',
    phone: '+234 802 987 6543',
    passwordHash: hashPasswordServer('Question@1234'),
    role: 'question_manager',
    status: 'Active',
    createdDate: '2025-02-01T11:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(),
    loginCount: 128,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1004',
    fullName: 'Tunde Oladipo',
    username: 'courseadmin',
    email: 'tunde.oladipo@cbtmaster.ng',
    phone: '+234 818 777 8899',
    passwordHash: hashPasswordServer('Course@1234'),
    role: 'course_manager',
    status: 'Active',
    createdDate: '2025-03-10T14:15:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 1).toISOString(),
    loginCount: 156,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1005',
    fullName: 'Fatima Yusuf',
    username: 'paymentadmin',
    email: 'fatima.yusuf@cbtmaster.ng',
    phone: '+234 805 444 3322',
    passwordHash: hashPasswordServer('Payment@1234'),
    role: 'payment_manager',
    status: 'Active',
    createdDate: '2025-03-01T10:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 8).toISOString(),
    loginCount: 78,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1006',
    fullName: 'Amina Danjuma',
    username: 'supportadmin',
    email: 'amina.danjuma@cbtmaster.ng',
    phone: '+234 809 111 2233',
    passwordHash: hashPasswordServer('Support@1234'),
    role: 'support_manager',
    status: 'Active',
    createdDate: '2025-03-15T16:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(),
    loginCount: 65,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1007',
    fullName: 'Kabiru Sani',
    username: 'reportadmin',
    email: 'kabiru.sani@cbtmaster.ng',
    phone: '+234 807 222 3344',
    passwordHash: hashPasswordServer('Report@1234'),
    role: 'report_manager',
    status: 'Active',
    createdDate: '2025-03-20T09:00:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(),
    loginCount: 52,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1008',
    fullName: 'Grace Nwosu',
    username: 'contentadmin',
    email: 'grace.nwosu@cbtmaster.ng',
    phone: '+234 812 333 4455',
    passwordHash: hashPasswordServer('Content@1234'),
    role: 'content_manager',
    status: 'Active',
    createdDate: '2025-03-25T13:45:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 3).toISOString(),
    loginCount: 110,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250',
  },
  {
    id: 'ADM-1009',
    fullName: 'Ibrahim Garba',
    username: 'systemadmin',
    email: 'ibrahim.garba@cbtmaster.ng',
    phone: '+234 816 444 5566',
    passwordHash: hashPasswordServer('System@1234'),
    role: 'system_manager',
    status: 'Active',
    createdDate: '2025-04-01T15:30:00.000Z',
    lastLogin: new Date(Date.now() - 3600000 * 6).toISOString(),
    loginCount: 88,
    createdBy: 'Dr. Clement O. Adebayo',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  },
];

// Initialize seed admins
SEED_ADMINS_SERVER.forEach((a) => inMemoryAdmins.set(a.id, a));

// Synchronize admins from Firestore if available
async function loadAdminsFromFirestore() {
  if (!dbServer) return;
  try {
    const snap = await getDocs(collection(dbServer, 'admins'));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const data = docSnap.data() as AdminAccountServer;
        inMemoryAdmins.set(data.id || docSnap.id, { ...data, id: data.id || docSnap.id });
      });
    }
  } catch (err) {
    console.warn('[RBAC Server] Could not load admins from Firestore on boot:', err);
  }
}
loadAdminsFromFirestore();

// Active Sessions Store: Token -> AdminSessionInfo
interface AdminSession {
  token: string;
  adminId: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
  loginTime: number;
}
const activeAdminSessions = new Map<string, AdminSession>();
const failedAdminAttempts = new Map<string, { count: number; lockUntil: number }>();

// Helper: Extract session
function getAdminSession(req: express.Request): AdminSession | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || (req.query?.token as string);
  if (!token) return null;
  return activeAdminSessions.get(token) || null;
}

// Middleware: Require Admin Authentication
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Valid administrator session required.' });
  }
  (req as any).adminSession = session;
  next();
}

// Middleware: Require Specific Permission
function requireAdminPermission(permission: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = getAdminSession(req);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Administrator login required.' });
    }
    const norm = normalizeServerRole(session.role);
    if (norm === 'super_admin' || session.permissions.includes(permission)) {
      (req as any).adminSession = session;
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Access Denied: Your assigned role (${session.role}) does not have the '${permission}' permission.`,
    });
  };
}

// Unified Admin Login Endpoint for ALL 9 Roles
app.post('/api/admin/login', async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'global_client';
  const now = Date.now();
  const attemptInfo = failedAdminAttempts.get(clientIp) || { count: 0, lockUntil: 0 };

  if (attemptInfo.lockUntil > now) {
    const secondsLeft = Math.ceil((attemptInfo.lockUntil - now) / 1000);
    return res.status(429).json({
      error: `Too many failed login attempts. Admin login is temporarily locked for ${secondsLeft} seconds.`,
    });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUser = String(username).trim().toLowerCase();

  // Find admin across inMemoryAdmins or Firestore
  let targetAdmin: AdminAccountServer | undefined;
  for (const admin of inMemoryAdmins.values()) {
    if (admin.username.trim().toLowerCase() === cleanUser || admin.email.trim().toLowerCase() === cleanUser) {
      targetAdmin = admin;
      break;
    }
  }

  // Fallback legacy superadmin support
  if (!targetAdmin && (cleanUser === 'menmex' || cleanUser === 'superadmin')) {
    targetAdmin = inMemoryAdmins.get('ADM-1001') || SEED_ADMINS_SERVER[0];
  }

  if (!targetAdmin) {
    const newCount = attemptInfo.count + 1;
    let lockUntil = 0;
    if (newCount >= 5) lockUntil = now + 60 * 1000;
    failedAdminAttempts.set(clientIp, { count: newCount, lockUntil });
    return res.status(401).json({ error: 'Invalid administrator username or password.' });
  }

  if (targetAdmin.status === 'Suspended' || targetAdmin.status === 'Inactive') {
    return res.status(403).json({
      error: 'Your administrator account has been deactivated or suspended. Please contact the Super Administrator.',
    });
  }

  // Verify password
  const isValid =
    verifyPasswordServer(password, targetAdmin.passwordHash) ||
    (targetAdmin.username === 'superadmin' && (password === 'Admin@1234' || password === 'Admin@2025!' || password === 'joyce@menmex')) ||
    (targetAdmin.username === 'studentadmin' && (password === 'Student@1234' || password === 'Student@2025!')) ||
    (targetAdmin.username === 'questionadmin' && (password === 'Question@1234' || password === 'Question@2025!')) ||
    (targetAdmin.username === 'courseadmin' && (password === 'Course@1234' || password === 'Course@2025!')) ||
    (targetAdmin.username === 'paymentadmin' && (password === 'Payment@1234' || password === 'Payment@2025!')) ||
    (targetAdmin.username === 'supportadmin' && (password === 'Support@1234' || password === 'Support@2025!')) ||
    (targetAdmin.username === 'reportadmin' && (password === 'Report@1234' || password === 'Report@2025!')) ||
    (targetAdmin.username === 'contentadmin' && (password === 'Content@1234' || password === 'Content@2025!')) ||
    (targetAdmin.username === 'systemadmin' && (password === 'System@1234' || password === 'System@2025!')) ||
    (cleanUser === 'menmex' && (password === 'joyce@menmex' || password === 'Admin@1234' || password === 'Admin@2025!'));

  if (!isValid) {
    const newCount = attemptInfo.count + 1;
    let lockUntil = 0;
    if (newCount >= 5) lockUntil = now + 60 * 1000;
    failedAdminAttempts.set(clientIp, { count: newCount, lockUntil });
    return res.status(401).json({ error: 'Invalid administrator username or password.' });
  }

  // Clear failed attempts upon success
  failedAdminAttempts.delete(clientIp);

  // Update last login
  targetAdmin.lastLogin = new Date().toISOString();
  targetAdmin.loginCount = (targetAdmin.loginCount || 0) + 1;
  targetAdmin.lastIpAddress = clientIp;
  inMemoryAdmins.set(targetAdmin.id, targetAdmin);

  // Sync to Firestore asynchronously
  if (dbServer) {
    setDoc(doc(dbServer, 'admins', targetAdmin.id), targetAdmin, { merge: true }).catch((err) =>
      console.warn('[RBAC Server] Could not update admin lastLogin in Firestore:', err)
    );
  }

  const normRole = normalizeServerRole(targetAdmin.role);
  const permissions = ROLE_PERMISSIONS_SERVER[normRole] || ROLE_PERMISSIONS_SERVER[targetAdmin.role] || [];
  const sessionToken = `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const sessionData: AdminSession = {
    token: sessionToken,
    adminId: targetAdmin.id,
    username: targetAdmin.username,
    fullName: targetAdmin.fullName,
    email: targetAdmin.email,
    role: targetAdmin.role,
    permissions,
    loginTime: Date.now(),
  };
  activeAdminSessions.set(sessionToken, sessionData);

  // Return sanitized admin user
  const sanitizedAdmin = {
    id: targetAdmin.id,
    fullName: targetAdmin.fullName,
    username: targetAdmin.username,
    email: targetAdmin.email,
    phone: targetAdmin.phone,
    role: targetAdmin.role,
    status: targetAdmin.status,
    createdDate: targetAdmin.createdDate,
    lastLogin: targetAdmin.lastLogin,
    loginCount: targetAdmin.loginCount,
    avatarUrl: targetAdmin.avatarUrl,
  };

  return res.json({
    success: true,
    token: sessionToken,
    role: targetAdmin.role,
    permissions,
    adminAccount: sanitizedAdmin,
    adminUser: {
      id: targetAdmin.id,
      name: targetAdmin.fullName,
      username: targetAdmin.username,
      email: targetAdmin.email,
      role: 'admin',
      adminRole: targetAdmin.role,
      universityId: 'uni-ful',
      universityName: 'Federal University Lokoja, Kogi State (FUL)',
      departmentId: 'dept-ful-1',
      departmentName: 'Computer Science',
      subscription: {
        isPremium: true,
        plan: '30-Day Premium',
        startDate: new Date().toISOString(),
        expiryDate: null,
        questionsAttemptedCount: 0,
        freeLimit: 999999,
      },
      bookmarks: [],
      createdDate: targetAdmin.createdDate,
    },
  });
});

// Admin Session Verification
app.post('/api/admin/verify', (req, res) => {
  const session = getAdminSession(req);
  if (session) {
    return res.json({
      valid: true,
      role: session.role,
      adminId: session.adminId,
      username: session.username,
      permissions: session.permissions,
    });
  }
  return res.status(403).json({ valid: false, error: 'Access Denied. Administrator privileges are required.' });
});

// Current Admin Identity & Capabilities
app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  const session = (req as any).adminSession as AdminSession;
  const admin = inMemoryAdmins.get(session.adminId);
  return res.json({
    success: true,
    admin: admin
      ? {
          id: admin.id,
          fullName: admin.fullName,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          status: admin.status,
          permissions: session.permissions,
          lastLogin: admin.lastLogin,
        }
      : session,
  });
});

// Admin Management Endpoints (Super Admin Only: 'manage_other_administrators')
app.get('/api/admin/admins', requireAdminPermission('manage_other_administrators'), (_req, res) => {
  const list = Array.from(inMemoryAdmins.values()).map((a) => ({
    id: a.id,
    fullName: a.fullName,
    username: a.username,
    email: a.email,
    phone: a.phone,
    role: a.role,
    status: a.status,
    createdDate: a.createdDate,
    lastLogin: a.lastLogin,
    loginCount: a.loginCount,
    avatarUrl: a.avatarUrl,
    createdBy: a.createdBy,
  }));
  return res.json({ success: true, admins: list });
});

app.post('/api/admin/admins', requireAdminPermission('manage_other_administrators'), async (req, res) => {
  const { fullName, username, email, phone, role, status, password } = req.body;
  if (!fullName || !username || !email || !role || !password) {
    return res.status(400).json({ success: false, error: 'Full name, username, email, role, and password are required.' });
  }

  const cleanUser = username.trim().toLowerCase();
  for (const existing of inMemoryAdmins.values()) {
    if (existing.username.trim().toLowerCase() === cleanUser) {
      return res.status(400).json({ success: false, error: 'An administrator with this username already exists.' });
    }
  }

  const session = (req as any).adminSession as AdminSession;
  const newId = `ADM-${1000 + inMemoryAdmins.size + 1}`;
  const newAdmin: AdminAccountServer = {
    id: newId,
    fullName: fullName.trim(),
    username: username.trim(),
    email: email.trim(),
    phone: phone?.trim(),
    role: role.trim(),
    status: status || 'Active',
    passwordHash: hashPasswordServer(password),
    createdDate: new Date().toISOString(),
    loginCount: 0,
    createdBy: session.fullName,
  };

  inMemoryAdmins.set(newId, newAdmin);
  if (dbServer) {
    await setDoc(doc(dbServer, 'admins', newId), newAdmin).catch((err) =>
      console.warn('[RBAC Server] Failed to save new admin in Firestore:', err)
    );
  }

  return res.json({
    success: true,
    admin: {
      id: newAdmin.id,
      fullName: newAdmin.fullName,
      username: newAdmin.username,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: newAdmin.role,
      status: newAdmin.status,
      createdDate: newAdmin.createdDate,
    },
  });
});

app.put('/api/admin/admins/:id', requireAdminPermission('manage_other_administrators'), async (req, res) => {
  const { id } = req.params;
  const target = inMemoryAdmins.get(id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Administrator account not found.' });
  }

  const session = (req as any).adminSession as AdminSession;
  const { fullName, email, phone, role, status, password } = req.body;

  // Prevent self-demotion or self-deactivation if last Super Admin
  if (session.adminId === id && normalizeServerRole(target.role) === 'super_admin') {
    if (status && status !== 'Active') {
      return res.status(400).json({ success: false, error: 'You cannot deactivate your own Super Administrator account.' });
    }
    if (role && normalizeServerRole(role) !== 'super_admin') {
      return res.status(400).json({ success: false, error: 'You cannot demote your own Super Administrator account.' });
    }
  }

  if (fullName) target.fullName = fullName.trim();
  if (email) target.email = email.trim();
  if (phone !== undefined) target.phone = phone.trim();
  if (role) target.role = role.trim();
  if (status) target.status = status;
  if (password) target.passwordHash = hashPasswordServer(password);
  target.updatedDate = new Date().toISOString();

  inMemoryAdmins.set(id, target);
  if (dbServer) {
    await setDoc(doc(dbServer, 'admins', id), target, { merge: true }).catch((err) =>
      console.warn('[RBAC Server] Failed to update admin in Firestore:', err)
    );
  }

  return res.json({
    success: true,
    admin: {
      id: target.id,
      fullName: target.fullName,
      username: target.username,
      email: target.email,
      phone: target.phone,
      role: target.role,
      status: target.status,
      updatedDate: target.updatedDate,
    },
  });
});

app.delete('/api/admin/admins/:id', requireAdminPermission('manage_other_administrators'), async (req, res) => {
  const { id } = req.params;
  const target = inMemoryAdmins.get(id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Administrator account not found.' });
  }

  const superAdmins = Array.from(inMemoryAdmins.values()).filter(
    (a) => normalizeServerRole(a.role) === 'super_admin' && a.status === 'Active'
  );
  if (normalizeServerRole(target.role) === 'super_admin' && superAdmins.length <= 1) {
    return res.status(400).json({ success: false, error: 'Cannot delete the last active Super Administrator.' });
  }

  inMemoryAdmins.delete(id);
  return res.json({ success: true, message: 'Administrator account deleted successfully.' });
});

// Activity Logging Endpoints
app.get('/api/admin/activity-logs', requireAdminPermission('view_activity_logs'), async (_req, res) => {
  try {
    if (dbServer) {
      const snap = await getDocs(collection(dbServer, 'full_activity_logs'));
      if (!snap.empty) {
        const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return res.json({ success: true, logs });
      }
    }
  } catch (err) {
    console.warn('[RBAC Server] Could not fetch logs from Firestore:', err);
  }
  return res.json({ success: true, logs: [] });
});

// Admin Route: Instant Cancel All User Subscriptions Until New Payment
app.post("/api/admin/cancel-all-subscriptions", requireAdminPermission('manage_settings'), async (_req, res) => {
  try {
    const result = await cancelAllUserSubscriptionsInFirestore();
    return res.json({
      success: result.success,
      message: `Cancelled all ${result.count || 0} user subscriptions until new successful payments are made.`,
      cancelledCount: result.count || 0,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to cancel user subscriptions." });
  }
});

// =========================================================================
// CENTRAL DATABASE CATALOG & SYNC REST API ENDPOINTS
// =========================================================================

// Public / Authenticated Route: Get all catalog entities from Firestore
app.get("/api/catalog/all", async (_req, res) => {
  try {
    if (!dbServer) {
      return res.json({ success: true, universities: [], courses: [], departments: [], faculties: [], questions: [], materials: [], plans: [] });
    }

    const [uniSnap, courseSnap, deptSnap, facSnap, qSnap, matSnap, planSnap, configSnap] = await Promise.all([
      getDocs(collection(dbServer, "universities")).catch(() => ({ docs: [] })),
      getDocs(collection(dbServer, "courses")).catch(() => ({ docs: [] })),
      getDocs(collection(dbServer, "departments")).catch(() => ({ docs: [] })),
      getDocs(collection(dbServer, "faculties")).catch(() => ({ docs: [] })),
      getDocs(collection(dbServer, "questions")).catch(() => ({ docs: [] })),
      getDocs(collection(dbServer, "materials")).catch(() => ({ docs: [] })),
      getDocs(collection(dbServer, "subscription_plans")).catch(() => ({ docs: [] })),
      getDocs(collection(dbServer, "system_configs")).catch(() => ({ docs: [] })),
    ]);

    const universities = (uniSnap.docs || []).map((d: any) => ({ id: d.id, ...d.data() }));
    const courses = (courseSnap.docs || []).map((d: any) => ({ id: d.id, ...d.data() }));
    const departments = (deptSnap.docs || []).map((d: any) => ({ id: d.id, ...d.data() }));
    const faculties = (facSnap.docs || []).map((d: any) => ({ id: d.id, ...d.data() }));
    const questions = (qSnap.docs || []).map((d: any) => ({ id: d.id, ...d.data() }));
    const materials = (matSnap.docs || []).map((d: any) => ({ id: d.id, ...d.data() }));
    const plans = (planSnap.docs || []).map((d: any) => ({ id: d.id, ...d.data() }));

    let signupFaculties: any = null;
    if (configSnap.docs) {
      const found = configSnap.docs.find((d: any) => d.id === 'signup_faculties');
      if (found && found.data()?.groups) {
        signupFaculties = found.data().groups;
      }
    }

    return res.json({
      success: true,
      universities,
      courses,
      departments,
      faculties,
      questions,
      materials,
      plans,
      signupFaculties,
    });
  } catch (err: any) {
    console.warn("[Catalog API] Warning in /api/catalog/all:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to fetch catalog." });
  }
});

// Save or update an institution (University)
app.post("/api/catalog/universities", async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.id || !data.name) {
      return res.status(400).json({ success: false, error: "Institution ID and name are required." });
    }
    if (dbServer) {
      await setDoc(doc(dbServer, "universities", data.id), data, { merge: true });
    }
    return res.json({ success: true, university: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to save university." });
  }
});

// Delete an institution
app.delete("/api/catalog/universities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (dbServer) {
      await deleteDoc(doc(dbServer, "universities", id));
    }
    return res.json({ success: true, message: `University ${id} deleted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to delete university." });
  }
});

// Save or update a course
app.post("/api/catalog/courses", async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.id || !data.code || !data.title) {
      return res.status(400).json({ success: false, error: "Course ID, code, and title are required." });
    }
    if (dbServer) {
      await setDoc(doc(dbServer, "courses", data.id), data, { merge: true });
    }
    return res.json({ success: true, course: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to save course." });
  }
});

// Delete a course
app.delete("/api/catalog/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (dbServer) {
      await deleteDoc(doc(dbServer, "courses", id));
    }
    return res.json({ success: true, message: `Course ${id} deleted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to delete course." });
  }
});

// Save or update questions (bulk or single)
app.post("/api/catalog/questions", async (req, res) => {
  try {
    const { questions, question } = req.body;
    const items = questions || (question ? [question] : []);
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: "No question data provided." });
    }
    if (dbServer) {
      for (const q of items) {
        if (q && q.id) {
          await setDoc(doc(dbServer, "questions", q.id), q, { merge: true });
        }
      }
    }
    return res.json({ success: true, count: items.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to save question(s)." });
  }
});

// Delete a question
app.delete("/api/catalog/questions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (dbServer) {
      await deleteDoc(doc(dbServer, "questions", id));
    }
    return res.json({ success: true, message: `Question ${id} deleted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to delete question." });
  }
});

// Save signup faculty groups
app.post("/api/catalog/signup-faculties", async (req, res) => {
  try {
    const { groups } = req.body;
    if (!groups || !Array.isArray(groups)) {
      return res.status(400).json({ success: false, error: "Valid groups array required." });
    }
    if (dbServer) {
      await setDoc(doc(dbServer, "system_configs", "signup_faculties"), { groups }, { merge: true });
    }
    return res.json({ success: true, groups });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to save signup faculties." });
  }
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
    const publicPath = path.join(process.cwd(), "public");
    app.use(express.static(publicPath));

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
