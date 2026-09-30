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
  let out = "=== OONI (24h) ===\n";
  const ooni = await fetchOONI();
  out += JSON.stringify(ooni).substring(0, 2000) + "\n\n";
  out += "=== OONI (7d) ===\n";
  const ooni7 = await fetchOONI7d();
  out += JSON.stringify(ooni7).substring(0, 2000) + "\n\n";
  out += "=== RIPE BGP (1h) ===\n";
  const bgp = await fetchBGP();
  out += JSON.stringify(bgp).substring(0, 2000) + "\n\n";
  return out;
}

// ==================== OONI (24 ساعت اخیر) ====================
async function fetchOONI() {
  try {
    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    // گرفتن داده‌های aggregate برای ایران
    const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (r.ok) return await r.json();
  } catch(e) { console.log("OONI error: " + e.message); }
  return null;
}

async function fetchOONI7d() {
  try {
    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - 604800000).toISOString().split("T")[0];
    const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (r.ok) return await r.json();
  } catch(e) { console.log("OONI 7d error: " + e.message); }
  return null;
}

// ==================== RIPE BGP ====================
async function fetchBGP() {
  try {
    const start = new Date(Date.now() - 3600000).toISOString();
    const url = "https://stat.ripe.net/data/bgp-updates/data.json?resource=IR&starttime=" + start;
    const r = await fetch(url);
    if (r.ok) return await r.json();
  } catch(e) { console.log("BGP error: " + e.message); }
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

// ==================== Handle Update ====================
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
      "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📊 برای دریافت گزارش لحظه‌ای اینترنت ایران، دستور /status را بزنید.\n\n📌 دستورات:\n/start - شروع\n/status - گزارش کامل\n/filtering - سطح فیلترینگ\n/outages - اختلالات\n/help - راهنما",
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
      "📚 <b>راهنمای ربات رادار اینترنت</b>\n\n/status - گزارش کامل\n/filtering - سطح فیلترینگ\n/outages - اختلالات\n/help - راهنما",
      { parse_mode: "HTML" }
    );
  }
}

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
  const bgp = await fetchBGP();

  const time = getIranTime();
  const date = getIranDate();

  // محاسبه سطح فیلترینگ از OONI
  let filterPercent = 0;
  let totalMs = 0;
  let okMs = 0;
  let asnCount = 0;

  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      if (row.measurement_count) {
        totalMs += row.measurement_count;
        if (row.ok_count) okMs += row.ok_count;
        asnCount++;
      }
    }
    if (totalMs > 0) {
      filterPercent = Math.round(((totalMs - okMs) / totalMs) * 100);
    }
  }

  let filterLevel = "🟢 پایین";
  if (filterPercent >= 60) filterLevel = "🔴 بالا";
  else if (filterPercent >= 30) filterLevel = "🟠 نسبتاً بالا";
  else if (filterPercent >= 15) filterLevel = "🟡 متوسط";

  // محاسبه اختلال از BGP
  let bgpUpdates = 0;
  let bgpStatus = "🟢 پایدار";
  if (bgp && bgp.data && bgp.data.updates) {
    bgpUpdates = bgp.data.updates.length;
    if (bgpUpdates > 100) bgpStatus = "🔴 اختلال جدی";
    else if (bgpUpdates > 30) bgpStatus = "🟡 فعالیت غیرعادی";
  }

  return "📊 <b>گزارش وضعیت اینترنت ایران</b>\n" +
    "📅 " + date + " | 🕒 " + time + "\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🚫 <b>سطح فیلترینگ</b>\n" +
    "وضعیت: " + filterLevel + "\n" +
    "درصد مسدودسازی: <b>%" + filterPercent + "</b>\n" +
    makeBar(filterPercent / 10) + "\n" +
    "تعداد ASNهای بررسی‌شده: " + asnCount + "\n" +
    "تعداد اندازه‌گیری‌ها: " + totalMs + "\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🚨 <b>اختلالات مسیریابی (BGP)</b>\n" +
    "وضعیت: " + bgpStatus + "\n" +
    "تعداد به‌روزرسانی ۱ ساعت اخیر: <b>" + bgpUpdates + "</b>\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "📌 <b>منابع داده:</b>\n" +
    "• OONI (اندازه‌گیری از داخل ایران)\n" +
    "• RIPE Stat (داده‌های BGP)\n\n" +
    "🔗 @radarinternetiran\n" +
    "👑 @royal_trust_ir_official\n\n" +
    "🤖 <i>رادار اینترنت - مانیتورینگ زنده</i>";
}

// ==================== Filtering Report ====================
async function makeFilteringReport() {
  const ooni = await fetchOONI();
  let totalMs = 0, okMs = 0, asnCount = 0;
  let asnList = [];

  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      if (row.measurement_count) {
        totalMs += row.measurement_count;
        if (row.ok_count) okMs += row.ok_count;
        asnCount++;
        if (row.probe_asn) {
          const rate = row.measurement_count > 0 ? Math.round((row.ok_count / row.measurement_count) * 100) : 0;
          asnList.push({ asn: row.probe_asn, rate: rate, count: row.measurement_count });
        }
      }
    }
  }

  const filterPercent = totalMs > 0 ? Math.round(((totalMs - okMs) / totalMs) * 100) : 0;

  let out = "🚫 <b>سطح فیلترینگ ایران</b>\n\n";
  out += "درصد مسدودسازی کل: <b>%" + filterPercent + "</b>\n";
  out += "تعداد کل اندازه‌گیری‌ها: " + totalMs + "\n";
  out += "تعداد ASNها: " + asnCount + "\n\n";

  if (asnList.length > 0) {
    out += "━━━━━━━━━━━━━━━\n";
    out += "<b>به تفکیک اپراتور:</b>\n";
    asnList.sort((a,b) => a.rate - b.rate).slice(0, 10).forEach(item => {
      const emoji = item.rate >= 80 ? "🟢" : item.rate >= 60 ? "🟡" : item.rate >= 40 ? "🟠" : "🔴";
      out += emoji + " AS" + item.asn + ": %" + item.rate + " دسترسی آزاد\n";
    });
  }

  out += "\n🕒 " + getIranTime() + "\n";
  out += "📌 منبع: OONI\n";
  out += "🤖 رادار اینترنت";
  return out;
}

// ==================== Outages Report ====================
async function makeOutagesReport() {
  const bgp = await fetchBGP();
  let out = "🚨 <b>اختلالات شبکه</b>\n\n";

  if (bgp && bgp.data && bgp.data.updates) {
    const updates = bgp.data.updates;
    out += "📊 به‌روزرسانی‌های BGP (۱ ساعت اخیر): <b>" + updates.length + "</b>\n\n";

    if (updates.length > 100) {
      out += "🔴 اختلال جدی در مسیریابی\n";
    } else if (updates.length > 30) {
      out += "🟡 فعالیت غیرعادی\n";
    } else {
      out += "🟢 مسیریابی پایدار است\n";
    }

    // نمایش چند نمونه از آخرین به‌روزرسانی‌ها
    if (updates.length > 0) {
      out += "\n<b>آخرین رویدادها:</b>\n";
      updates.slice(0, 5).forEach(u => {
        if (u.type) out += "• " + u.type + "\n";
      });
    }

    out += "\n🔗 منبع: RIPE Stat\n";
  } else {
    out += "❌ دریافت داده از RIPE ناموفق\n";
  }

  out += "\n🕒 " + getIranTime() + "\n";
  out += "🤖 رادار اینترنت";
  return out;
        }
