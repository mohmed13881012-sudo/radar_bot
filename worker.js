const BOT_TOKEN = "8579994081:AAFPiuiMPgANy7ARI9QiE7dWWwlnFrwY8gs";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/test") return new Response("Test OK");
    if (url.pathname === "/setwebhook") {
      const r = await fetch(TG + "/setWebhook?url=" + url.origin + "/");
      return new Response("Result: " + await r.text());
    }
    if (url.pathname === "/webhookinfo") {
      const r = await fetch(TG + "/getWebhookInfo");
      return new Response(await r.text());
    }
    if (url.pathname === "/debug") {
      const out = await debugAll();
      return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    if (url.pathname === "/sendreport") {
      await sendChannelReport();
      return new Response("Report sent!");
    }
    if (request.method !== "POST") return new Response("Radar Bot is running!");
    try {
      const update = await request.json();
      await handleUpdate(update);
    } catch(e) { console.log("Error: " + e.message); }
    return new Response("OK");
  },
  async scheduled(event, env, ctx) {
    await sendChannelReport();
  }
};

// ==================== زمان تهران ====================
function getIranTime() {
  return new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date());
}
function getIranDate() {
  return new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

// ==================== Debug ====================
async function debugAll() {
  let out = "=== OONI ===\n";
  const ooni = await fetchOONI();
  out += JSON.stringify(ooni).substring(0, 2000) + "\n\n";
  out += "=== RIPE routing-status ===\n";
  try {
    const r = await fetch("https://stat.ripe.net/data/routing-status/data.json?resource=IR");
    out += (await r.text()).substring(0, 1500) + "\n\n";
  } catch(e) { out += "ERR: " + e.message + "\n\n"; }
  out += "=== RIPE bgp-state ===\n";
  try {
    const r = await fetch("https://stat.ripe.net/data/bgp-state/data.json?resource=IR");
    out += (await r.text()).substring(0, 1500) + "\n\n";
  } catch(e) { out += "ERR: " + e.message + "\n\n"; }
  return out;
}

// ==================== OONI ====================
async function fetchOONI() {
  try {
    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (r.ok) return await r.json();
  } catch(e) { console.log("OONI error: " + e.message); }
  return null;
}

// ==================== RIPE ====================
async function fetchRIPE() {
  const endpoints = [
    "https://stat.ripe.net/data/routing-status/data.json?resource=IR",
    "https://stat.ripe.net/data/bgp-state/data.json?resource=IR"
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { "Accept": "application/json" } });
      if (r.ok) {
        const d = await r.json();
        if (d && d.data) return d;
      }
    } catch(e) {}
  }
  return null;
}

// ==================== Channel Report ====================
async function sendChannelReport() {
  const report = await makeReport();
  try {
    await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CH1, text: report, parse_mode: "HTML" })
    });
  } catch(e) { console.log("Channel error: " + e.message); }
}

// ==================== Update Handler ====================
async function handleUpdate(update) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = msg.from.id;

  const inCh1 = await checkMember(userId, CH1);
  const inCh2 = await checkMember(userId, CH2);

  if (!inCh1 || !inCh2) {
    await sendMessage(chatId,
      "🔒 برای استفاده از ربات، ابتدا در <b>هر دو کانال</b> زیر عضو شوید:\n\n📡 رادار اینترنت\n👑 رویال تراست\n\nپس از عضویت، دوباره /start را بزنید.",
      {
        parse_mode: "HTML",
        inline_keyboard: [
          [{ text: "📡 عضویت در رادار اینترنت", url: "https://t.me/radarinternetiran" }],
          [{ text: "👑 عضویت در رویال تراست", url: "https://t.me/royal_trust_ir_official" }]
        ]
      }
    );
    return;
  }

  if (text === "/start") {
    await sendMessage(chatId,
      "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📊 برای دریافت گزارش لحظه‌ای اینترنت ایران، دستور /status را بزنید.\n\n📌 دستورات:\n/start - شروع\n/status - گزارش کامل\n/filtering - سطح فیلترینگ\n/outages - اختلالات مسیریابی\n/help - راهنما",
      { parse_mode: "HTML" }
    );
  } else if (text === "/status") {
    await sendMessage(chatId, "🔍 در حال دریافت اطلاعات...");
    const report = await makeReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/filtering") {
    await sendMessage(chatId, "🔍 در حال بررسی فیلترینگ...");
    const report = await makeFilteringReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/outages") {
    await sendMessage(chatId, "🔍 در حال بررسی اختلالات...");
    const report = await makeOutagesReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/help") {
    await sendMessage(chatId,
      "📚 <b>راهنمای ربات رادار اینترنت</b>\n\n/status - گزارش کامل\n/filtering - سطح فیلترینگ\n/outages - اختلالات مسیریابی\n/help - راهنما\n\n📡 @radarinternetiran\n👑 @royal_trust_ir_official",
      { parse_mode: "HTML" }
    );
  }
}

// ==================== Check Member ====================
async function checkMember(userId, channel) {
  try {
    const r = await fetch(TG + "/getChatMember?chat_id=" + channel + "&user_id=" + userId);
    const d = await r.json();
    if (d.ok && d.result) {
      const s = d.result.status;
      return s === "member" || s === "administrator" || s === "creator";
    }
  } catch(e) {}
  return false;
}

// ==================== Send Message ====================
async function sendMessage(chatId, text, extra) {
  const body = Object.assign({ chat_id: chatId, text: text }, extra || {});
  try {
    await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch(e) {}
}

// ==================== Bar ====================
function makeBar(v) {
  const filled = Math.max(0, Math.min(10, Math.round(v)));
  let color = "🔴";
  if (v >= 8) color = "🟢";
  else if (v >= 6) color = "🟡";
  else if (v >= 4) color = "🟠";
  let bar = "";
  for (let i = 0; i < 10; i++) bar += (i < filled ? color : "▫️");
  return bar;
}

// ==================== Main Report ====================
async function makeReport() {
  const ooni = await fetchOONI();
  const ripe = await fetchRIPE();

  const time = getIranTime();
  const date = getIranDate();

  let totalMs = 0, blockedMs = 0, asnData = [];

  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      const mc = row.measurement_count || 0;
      const ac = row.anomaly_count || 0;
      const cc = row.confirmed_count || 0;
      const fc = row.failure_count || 0;
      const ok = mc - ac - cc - fc;

      totalMs += mc;
      blockedMs += (ac + cc);

      if (row.probe_asn && mc >= 100) {
        const rate = Math.round((ok / mc) * 100);
        asnData.push({ asn: row.probe_asn, rate: rate, count: mc });
      }
    }
  }

  const blockPercent = totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0;

  let filterLevel = "🟢 پایین";
  if (blockPercent >= 60) filterLevel = "🔴 بالا";
  else if (blockPercent >= 40) filterLevel = "🟠 نسبتاً بالا";
  else if (blockPercent >= 20) filterLevel = "🟡 متوسط";

  asnData.sort((a,b) => b.count - a.count);

  let out = "📊 <b>گزارش وضعیت اینترنت ایران</b>\n";
  out += "📅 " + date + " | 🕒 " + time + "\n\n";
  out += "━━━━━━━━━━━━━━━\n";
  out += "🚫 <b>سطح فیلترینگ</b>\n";
  out += "وضعیت: " + filterLevel + "\n";
  out += "درصد مسدودسازی: <b>%" + blockPercent + "</b>\n";
  out += makeBar(blockPercent / 10) + "\n";
  out += "📈 اندازه‌گیری ۲۴ ساعت: " + totalMs.toLocaleString("fa-IR") + "\n";
  out += "📡 تعداد ASN: " + asnData.length + "\n\n";

  if (asnData.length > 0) {
    out += "━━━━━━━━━━━━━━━\n";
    out += "<b>وضعیت اپراتورها:</b>\n";
    asnData.slice(0, 5).forEach(item => {
      const emoji = item.rate >= 80 ? "🟢" : item.rate >= 60 ? "🟡" : item.rate >= 40 ? "🟠" : "🔴";
      out += emoji + " AS" + item.asn + ": %" + item.rate + " آزاد\n";
    });
    out += "\n";
  }

  // بخش RIPE
  out += "━━━━━━━━━━━━━━━\n";
  out += "🚨 <b>مسیریابی (BGP)</b>\n";
  if (ripe && ripe.data) {
    if (ripe.data.visibility !== undefined) {
      const vis = ripe.data.visibility;
      out += "👁️ Visibility: <b>%" + vis + "</b>\n";
      out += "وضعیت: " + (vis > 95 ? "🟢 پایدار" : vis > 80 ? "🟡 متوسط" : "🔴 ناپایدار") + "\n";
    }
    if (ripe.data.total_count !== undefined) {
      out += "📡 روت‌های فعال: " + ripe.data.total_count.toLocaleString("fa-IR") + "\n";
    }
    out += "🔗 منبع: RIPE Stat\n\n";
  } else {
    out += "⚠️ داده RIPE در دسترس نیست\n\n";
  }

  out += "━━━━━━━━━━━━━━━\n";
  out += "📌 منابع: OONI (داخل ایران) + RIPE Stat\n\n";
  out += "🔗 @radarinternetiran\n";
  out += "👑 @royal_trust_ir_official\n\n";
  out += "🤖 <i>رادار اینترنت - مانیتورینگ زنده</i>";

  return out;
}

// ==================== Filtering Report ====================
async function makeFilteringReport() {
  const ooni = await fetchOONI();
  let totalMs = 0, okMs = 0, blockedMs = 0;
  let asnData = [];

  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      const mc = row.measurement_count || 0;
      const ac = row.anomaly_count || 0;
      const cc = row.confirmed_count || 0;
      const fc = row.failure_count || 0;
      const ok = mc - ac - cc - fc;

      totalMs += mc;
      if (ok > 0) okMs += ok;
      blockedMs += (ac + cc);

      if (row.probe_asn && mc >= 100) {
        const rate = Math.round((ok / mc) * 100);
        asnData.push({ asn: row.probe_asn, rate: rate, count: mc });
      }
    }
  }

  const blockPercent = totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0;
  asnData.sort((a,b) => b.count - a.count);

  let out = "🚫 <b>سطح فیلترینگ ایران</b>\n\n";
  out += "📊 درصد مسدودسازی کل: <b>%" + blockPercent + "</b>\n";
  out += "📈 تعداد کل اندازه‌گیری: " + totalMs.toLocaleString("fa-IR") + "\n";
  out += "📡 تعداد ASN: " + asnData.length + "\n\n";

  if (asnData.length > 0) {
    out += "━━━━━━━━━━━━━━━\n";
    out += "<b>بزرگ‌ترین اپراتورها:</b>\n";
    asnData.slice(0, 10).forEach(item => {
      const emoji = item.rate >= 80 ? "🟢" : item.rate >= 60 ? "🟡" : item.rate >= 40 ? "🟠" : "🔴";
      out += emoji + " AS" + item.asn + ": %" + item.rate + " (" + item.count + " تست)\n";
    });
  }

  out += "\n🕒 " + getIranTime() + "\n";
  out += "📌 منبع: OONI\n";
  out += "🤖 رادار اینترنت";
  return out;
}

// ==================== Outages Report ====================
async function makeOutagesReport() {
  const ripe = await fetchRIPE();
  let out = "🚨 <b>وضعیت مسیریابی ایران (BGP)</b>\n\n";

  if (ripe && ripe.data) {
    out += "✅ داده از RIPE Stat دریافت شد\n\n";

    if (ripe.data.visibility !== undefined) {
      const vis = ripe.data.visibility;
      let status = "🟢 پایدار";
      if (vis < 80) status = "🔴 ناپایدار";
      else if (vis < 95) status = "🟡 متوسط";

      out += "👁️ Visibility: <b>%" + vis + "</b>\n";
      out += "وضعیت: " + status + "\n\n";
      out += makeBar(vis / 10) + "\n\n";
    }

    if (ripe.data.total_count !== undefined) {
      out += "📡 تعداد روت‌های فعال: <b>" + ripe.data.total_count.toLocaleString("fa-IR") + "</b>\n";
    }

    if (ripe.data.observed_neighbours !== undefined) {
      out += "🔗 تعداد همسایه‌ها: " + ripe.data.observed_neighbours + "\n";
    }

    out += "\n🔗 منبع: RIPE Stat (stat.ripe.net)\n";
  } else {
    out += "⚠️ دریافت داده از RIPE ناموفق\n\n";
    out += "📌 راه‌حل: در حال حاضر فقط داده‌های OONI\n";
    out += "برای فیلترینگ در دسترس است.\n";
  }

  out += "\n🕒 " + getIranTime() + "\n";
  out += "🤖 رادار اینترنت";
  return out;
      }
