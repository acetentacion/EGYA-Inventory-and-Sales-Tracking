// 🌍 API Base
const API_BASE = 'http://localhost:3000/api';

// Common helper function
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error: ${res.status}`);
  return res.json();
}
