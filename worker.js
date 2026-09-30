const BOT_TOKEN = "8579994081:AAFPiuiMPgANy7ARI9QiE7dWWwlnFrwY8gs";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

// سایت‌های تست
const IR_SITES = [
  { name: "ایرانسل", url: "https://irancell.ir" },
  { name: "همراه اول", url: "https://mci.ir" },
  { name: "شاپرک", url: "https://shaparak.ir" },
  { name: "دیجی‌کالا", url: "https://digikala.com" }
];
const GLOBAL_SITES = [
  { name: "گوگل", url: "https://www.google.com" },
  { name: "کلادفلر", url: "https://www.cloudflare.com" },
  { name: "مایکروسافت", url: "https://www.microsoft.com" }
];

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
      const out = await debugPing();
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

// پینگ یه سایت و برگرداندن زمان پاسخ (ms)
async function pingSite(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    return Date.now() - start;
  } catch(e) {
    return null;
  }
}

async function debugPing() {
  let out = "";
  for (const site of IR_SITES) {
    const t = await pingSite(site.url);
    out += site.name + " (" + site.url + "): " + (t ? t + " ms" : "FAIL") + "\n";
  }
  out += "---\n";
  for (const site of GLOBAL_SITES) {
    const t = await pingSite(site.url);
    out += site.name + " (" + site.url + "): " + (t ? t + " ms" : "FAIL") + "\n";
  }
  return out;
}

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
      "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📊 برای دریافت گزارش لحظه‌ای اینترنت ایران، دستور /status را بزنید.\n\n📌 دستورات:\n/start - شروع\n/status - گزارش لحظه‌ای\n/speed - سرعت و پینگ سایت‌ها\n/help - راهنما",
      { parse_mode: "HTML" }
    );
  } else if (text === "/status") {
    await sendMessage(chatId, "🔍 در حال دریافت اطلاعات...");
    const report = await makeReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/speed") {
    await sendMessage(chatId, "🔍 در حال دریافت پینگ...");
    const report = await makeSpeedReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/help") {
    await sendMessage(chatId,
      "📚 <b>راهنمای ربات رادار اینترنت</b>\n\n/start - شروع\n/status - گزارش لحظه‌ای\n/speed - پینگ سایت‌ها\n/help - راهنما",
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

// تحلیل وضعیت کلی بر اساس پینگ‌ها
async function analyzeNetwork() {
  const irResults = [];
  const globalResults = [];

  for (const site of IR_SITES) {
    const t = await pingSite(site.url);
    irResults.push({ name: site.name, time: t });
  }
  for (const site of GLOBAL_SITES) {
    const t = await pingSite(site.url);
    globalResults.push({ name: site.name, time: t });
  }

  const irTimes = irResults.filter(r => r.time).map(r => r.time);
  const globalTimes = globalResults.filter(r => r.time).map(r => r.time);

  const irAvg = irTimes.length ? Math.round(irTimes.reduce((a,b) => a+b, 0) / irTimes.length) : null;
  const globalAvg = globalTimes.length ? Math.round(globalTimes.reduce((a,b) => a+b, 0) / globalTimes.length) : null;

  // محاسبه امتیاز کلی
  let score = 0;
  let count = 0;
  if (irAvg !== null) {
    // پینگ زیر ۱۰۰ = عالی، بالای ۵۰۰ = بد
    const irScore = Math.max(0, Math.min(100, 100 - (irAvg / 5)));
    score += irScore;
    count++;
  }
  if (globalAvg !== null) {
    const globalScore = Math.max(0, Math.min(100, 100 - (globalAvg / 5)));
    score += globalScore;
    count++;
  }
  const finalScore = count > 0 ? Math.round(score / count) : 0;

  return {
    irResults,
    globalResults,
    irAvg,
    globalAvg,
    score: finalScore,
    irAccessible: irTimes.length,
    globalAccessible: globalTimes.length,
    irTotal: IR_SITES.length,
    globalTotal: GLOBAL_SITES.length
  };
}

async function makeReport() {
  const data = await analyzeNetwork();

  let emoji = "🔴", status = "بحرانی";
  if (data.score >= 80) { emoji = "🟢"; status = "پایدار"; }
  else if (data.score >= 60) { emoji = "🟡"; status = "نسبتا پایدار"; }
  else if (data.score >= 40) { emoji = "🟠"; status = "ناپایدار"; }

  const time = getIranTime();
  const date = getIranDate();
  const bar = makeBar(data.score / 10);

  // ساخت لیست سایت‌ها
  let irList = "";
  for (const r of data.irResults) {
    irList += "  • " + r.name + ": " + (r.time ? r.time + " ms" : "❌") + "\n";
  }
  let globalList = "";
  for (const r of data.globalResults) {
    globalList += "  • " + r.name + ": " + (r.time ? r.time + " ms" : "❌") + "\n";
  }

  return "📊 <b>گزارش وضعیت شبکه</b>\n" +
    "📅 " + date + " | 🕒 " + time + "\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🎯 <b>وضعیت کلی</b>\n" +
    emoji + " " + status + "\n" +
    bar + " <b>%" + data.score + "</b>\n\n" +
    "📡 دسترسی ایران: " + data.irAccessible + "/" + data.irTotal + "\n" +
    "🌍 دسترسی جهانی: " + data.globalAccessible + "/" + data.globalTotal + "\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🇮🇷 <b>سایت‌های ایرانی</b>\n" +
    irList + "\n" +
    "🌍 <b>سایت‌های جهانی</b>\n" +
    globalList + "\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🔗 @radarinternetiran\n" +
    "👑 @royal_trust_ir_official\n\n" +
    "🤖 <i>رادار اینترنت - مانیتورینگ زنده</i>";
}

async function makeSpeedReport() {
  const data = await analyzeNetwork();
  let out = "📶 <b>پینگ سرورها</b>\n\n";
  out += "🇮🇷 <b>ایرانی</b>\n";
  for (const r of data.irResults) {
    out += "  • " + r.name + ": " + (r.time ? r.time + " ms" : "❌") + "\n";
  }
  out += "\n🌍 <b>جهانی</b>\n";
  for (const r of data.globalResults) {
    out += "  • " + r.name + ": " + (r.time ? r.time + " ms" : "❌") + "\n";
  }
  out += "\n📊 میانگین ایران: " + (data.irAvg || "-") + " ms\n";
  out += "📊 میانگین جهانی: " + (data.globalAvg || "-") + " ms\n\n";
  out += "🕒 " + getIranTime() + "\n";
  out += "🤖 رادار اینترنت";
  return out;
}
