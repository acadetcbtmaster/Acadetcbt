import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeFirestore, getDocs, collection, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";

async function main() {
  console.log("[Clear DB] Starting database purge for questions and users...");
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const fbApp = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(fbApp);
  const dbId = config.firestoreDatabaseId === 'ai-studio-aicbtsimulator-24029710-e20e-4e1e-a3cf-846d58bd47cf' ? '(default)' : (config.firestoreDatabaseId || '(default)');
  const db = initializeFirestore(fbApp, { ignoreUndefinedProperties: true }, dbId);

  // Authenticate as Admin
  const adminEmail = "admin@menmex.ng";
  const adminPass = "joyce@menmex";
  try {
    await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    console.log("[Clear DB] Signed in as Admin");
  } catch (err: any) {
    try {
      await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      console.log("[Clear DB] Created and signed in as Admin");
    } catch (e: any) {
      console.log("[Clear DB] Auth attempt result:", e.message);
    }
  }

  // 1. Clear questions
  const qSnap = await getDocs(collection(db, "questions"));
  console.log(`[Clear DB] Found ${qSnap.size} questions to delete.`);
  for (const d of qSnap.docs) {
    await deleteDoc(doc(db, "questions", d.id));
    console.log(`Deleted question: ${d.id}`);
  }

  // 2. Clear users
  const uSnap = await getDocs(collection(db, "users"));
  console.log(`[Clear DB] Found ${uSnap.size} users to delete.`);
  for (const d of uSnap.docs) {
    await deleteDoc(doc(db, "users", d.id));
    console.log(`Deleted user: ${d.id}`);
  }

  console.log("[Clear DB] Finished! All questions and users successfully purged from Cloud Firestore.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error clearing DB:", err);
  process.exit(1);
});

