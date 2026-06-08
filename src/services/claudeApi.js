const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://garraedu-backend.onrender.com/api';

async function post(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

export async function fetchStudyContent(grade, subject, level, content) {
  return post('/study', { grade, subject, level, content });
}

export async function fetchQuestions(grade, subject, level, content, count, warmup = false, excludeIds = []) {
  return post('/questions', { grade, subject, level, content, count, warmup, excludeIds });
}
