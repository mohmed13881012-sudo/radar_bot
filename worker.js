const BOT = "CFGHGD0YPAGBXPUDLFUSIFNBMRNLBEPSRPLWKYPYBOAMJFXCRAZTGIGYEAKJQHHR";
const RADAR = "cfat_NBfqhl13ZTbTlMnA2c7wc32GwKCL3UmWb3qaPEhv1a3e1133";
const CH = "radar_internet_ir";
const API = "https://botapi.rubika.ir/v3/" + BOT;

export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === "/test") return new Response("Test OK");
    if (u.pathname === "/setwebhook") {
      const r = await fetch(API + "/updateBotEndpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u.origin + "/" })
      });
      return new Response("Result: " + await r.text());
    }
    if (req.method !== "POST") return new Response("Bot running");
    try {
      const up = await req.json();
      if (up.message) await onMsg(up.message);
    } catch(e) {}
    return new Response("OK");
  }
};

async function onMsg(m) {
  const cid = m.chat_id;
  const txt = m.text || "";
  const uid = m.sender_id;
  let ok = false;
  try {
    const r = await fetch(API + "/getChatMember", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: "@" + CH, user_id: uid })
    });
    const d = await r.json();
    if (d.status === "OK" && d.data && d.data.member) {
      const s = d.data.member.status;
      if (s === "Member" || s === "Admin" || s === "Creator") ok = true;
    }
  } catch(e) {}
  if (!ok) {
    await send(cid, "برای استفاده، ابتدا در کانال @radar_internet_ir عضو شوید.");
    return;
  }
  if (txt === "/start") {
    await send(cid, "سلام! به ربات رادار اینترنت خوش آمدید.\n\nبرای گزارش: /status");
  } else if (txt === "/status") {
    await send(cid, "در حال دریافت...");
    await send(cid, await report());
  } else if (txt === "/help") {
    await send(cid, "دستورات:\n/start\n/status\n/help");
  }
}

async function send(cid, txt) {
  await fetch(API + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: cid, text: txt })
  });
}

async function report() {
  let i = 50, l = 15;
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/radar/quality/iqi/summary?location=IR&dateRange=1d", {
      headers: { "Authorization": "Bearer " + RADAR }
    });
    const d = await r.json();
    if (d.success && d.result) {
      if (d.result.iqi && d.result.iqi.score) i = Math.round(d.result.iqi.score);
      if (d.result.latency && d.result.latency.value) l = Math.round(d.result.latency.value);
    }
  } catch(e) {}
  let e = "🔴", s = "بحرانی";
  if (i >= 80) { e = "🟢"; s = "پایدار"; }
  else if (i >= 60) { e = "🟡"; s = "نسبتا پایدار"; }
  else if (i >= 40) { e = "🟠"; s = "ناپایدار"; }
  return "📊 گزارش وضعیت شبکه\n\nوضعیت: " + e + " " + s + "\nسلامت شبکه: %" + i + "\nافت: %" + (100 - i) + "\n\nکیفیت اتصال\nQoE: %" + i + "\nتاخیر: " + l + " ms\n\nربات رادار اینترنت";
}
