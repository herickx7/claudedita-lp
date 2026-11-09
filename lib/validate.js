export function cleanLead(body = {}) {
  const name = String(body.name || "").trim().replace(/\s+/g, " ").slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
  let phone = String(body.whatsapp || "").replace(/\D/g, "");
  if (phone.startsWith("55") && phone.length >= 12) phone = phone.slice(2);
  const errors = [];
  if (name.split(" ")[0].length < 2) errors.push("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push("email");
  if (!/^\d{10,11}$/.test(phone)) errors.push("whatsapp");
  return { name, email, whatsapp: phone, errors };
}

export function baseUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

export async function postJSON(url, data) {
  if (!url) return;
  try {
    // o token vai no corpo porque o Google Apps Script não lê cabeçalhos
    const body = JSON.stringify({ ...data, token: process.env.WEBHOOK_TOKEN || "" });
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, redirect: "follow" });
  } catch (e) {
    console.error("webhook externo falhou:", e.message);
  }
}
