import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Chave de cache para um set de perguntas ──────────────────────────────
function cacheKey(grade, subject, level, content) {
  return `${grade}_${subject}_${level}_${content}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// ── Histórico do usuário (quais batches já usou) ─────────────────────────
export async function getUserHistory(uuid) {
  const ref = doc(db, 'users', uuid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : { used_batches: [] };
}

export async function markBatchUsed(uuid, batchId) {
  const ref = doc(db, 'users', uuid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { used_batches: arrayUnion(batchId) });
  } else {
    await setDoc(ref, { used_batches: [batchId] });
  }
}

// ── Cache de perguntas ───────────────────────────────────────────────────
export async function getUnusedBatch(uuid, grade, subject, level, content) {
  const key = cacheKey(grade, subject, level, content);
  const userHistory = await getUserHistory(uuid);
  const usedBatches = userHistory.used_batches || [];

  const colRef = collection(db, 'question_cache', key, 'batches');
  const snap = await getDocs(colRef);

  for (const docSnap of snap.docs) {
    if (!usedBatches.includes(docSnap.id)) {
      return { batchId: docSnap.id, questions: docSnap.data().questions };
    }
  }
  return null; // todos os batches foram usados — gerar novo
}

export async function saveBatch(grade, subject, level, content, questions) {
  const key = cacheKey(grade, subject, level, content);
  const colRef = collection(db, 'question_cache', key, 'batches');
  const docRef = await addDoc(colRef, {
    questions,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

// ── Ranking ──────────────────────────────────────────────────────────────
export async function saveScore(playerName, uuid, fichas, score) {
  const ref = doc(db, 'ranking', uuid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const prev = snap.data();
    await updateDoc(ref, {
      player_name: playerName,
      total_score: prev.total_score + score,
      fichas_totais: prev.fichas_totais + fichas,
      last_played: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      player_name: playerName,
      total_score: score,
      fichas_totais: fichas,
      last_played: serverTimestamp(),
    });
  }
}

export async function getTopRanking(n = 5) {
  const q = query(
    collection(db, 'ranking'),
    orderBy('fichas_totais', 'desc'),
    orderBy('last_played', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
}
