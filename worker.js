const BOT_TOKEN = "8579994081:AAFPiuiMPgANy7ARI9QiE7dWWwlnFrwY8gs";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

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
// سایت‌هایی که معمولاً در ایران فیلتر هستن
const FILTERED_SITES = [
  { name: "توییتر / X", url: "https://x.com" },
  { name: "یوتیوب", url: "https://www.youtube.com" },
  { name: "فیسبوک", url: "https://www.facebook.com" },
  { name: "تلگرام", url: "https://telegram.org" },
  { name: "اینستاگرام", url: "https://www.instagram.com" }
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

// ==================== Debug همه چیز ====================
async function debugAll() {
  let out = "=== PING TEST ===\n";
  for (const s of [...IR_SITES, ...GLOBAL_SITES]) {
    const t = await pingSite(s.url);
    out += s.name + ": " + (t ? t + " ms" : "FAIL") + "\n";
  }
  out += "\n=== BANDWIDTH ===\n";
  const bw = await measureBandwidth();
  out += "Estimated: " + bw + " Mbps\n";
  out += "\n=== OONI FILTERING ===\n";
  const ooni = await fetchOONI();
  out += JSON.stringify(ooni).substring(0, 1000) + "\n";
  out += "\n=== BGP DATA (RIPE) ===\n";
  const bgp = await fetchBGP();
  out += JSON.stringify(bgp).substring(0, 1000) + "\n";
  return out;
}

// ==================== Ping ====================
async function pingSite(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    return Date.now() - start;
  } catch(e) { return null; }
}

// ==================== Bandwidth Test ====================
async function measureBandwidth() {
  // دانلود فایل 100KB از Cloudflare برای تست سرعت
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const r = await fetch("https://speed.cloudflare.com/__down?bytes=1000000", { signal: controller.signal });
    const data = await r.arrayBuffer();
    clearTimeout(timeout);
    const elapsed = (Date.now() - start) / 1000;
    const bits = data.byteLength * 8;
    const mbps = (bits / elapsed / 1000000).toFixed(1);
    return parseFloat(mbps);
  } catch(e) { return 0; }
}

// ==================== OONI Filtering Data ====================
async function fetchOONI() {
  try {
    const since = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const until = new Date().toISOString().split("T")[0];
    const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    const d = await r.json();
    return d;
  } catch(e) { return null; }
}

// ==================== BGP Data from RIPE ====================
async function fetchBGP() {
  try {
    const start = new Date(Date.now() - 3600000).toISOString();
    const url = "https://stat.ripe.net/data/bgp-updates/data.json?resource=IR&starttime=" + start;
    const r = await fetch(url);
    const d = await r.json();
    return d;
  } catch(e) { return null; }
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
      "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📊 دستورات:\n/start - شروع\n/status - گزارش کامل\n/bandwidth - سرعت پهنای باند\n/filtering - سطح فیلترینگ\n/outages - اختلالات\n/help - راهنما",
      { parse_mode: "HTML" }
    );
  } else if (text === "/status") {
    await sendMessage(chatId, "🔍 در حال دریافت اطلاعات...");
    const report = await makeReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/bandwidth") {
    await sendMessage(chatId, "🔍 در حال اندازه‌گیری پهنای باند...");
    const report = await makeBandwidthReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/filtering") {
    await sendMessage(chatId, "🔍 در حال بررسی سطح فیلترینگ...");
    const report = await makeFilteringReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/outages") {
    await sendMessage(chatId, "🔍 در حال بررسی اختلالات...");
    const report = await makeOutagesReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/help") {
    await sendMessage(chatId,
      "📚 <b>راهنمای ربات رادار اینترنت</b>\n\n/status - گزارش کامل\n/bandwidth - پهنای باند\n/filtering - سطح فیلترینگ\n/outages - اختلالات شبکه\n/help - راهنما",
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

// ==================== Analyze Network ====================
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

  let score = 0;
  let count = 0;
  if (irAvg !== null) {
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
    irResults, globalResults, irAvg, globalAvg,
    score: finalScore,
    irAccessible: irTimes.length,
    globalAccessible: globalTimes.length,
    irTotal: IR_SITES.length,
    globalTotal: GLOBAL_SITES.length
  };
}

// ==================== Main Report ====================
async function makeReport() {
  const data = await analyzeNetwork();

  let emoji = "🔴", status = "بحرانی";
  if (data.score >= 80) { emoji = "🟢"; status = "پایدار"; }
  else if (data.score >= 60) { emoji = "🟡"; status = "نسبتا پایدار"; }
  else if (data.score >= 40) { emoji = "🟠"; status = "ناپایدار"; }

  const time = getIranTime();
  const date = getIranDate();
  const bar = makeBar(data.score / 10);

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
    "🇮🇷 <b>سایت‌های ایرانی</b>\n" + irList + "\n" +
    "🌍 <b>سایت‌های جهانی</b>\n" + globalList + "\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🔗 @radarinternetiran\n" +
    "👑 @royal_trust_ir_official\n\n" +
    "🤖 <i>رادار اینترنت - مانیتورینگ زنده</i>";
}

// ==================== Bandwidth Report ====================
async function makeBandwidthReport() {
  const bw = await measureBandwidth();
  let quality = "🔴 ضعیف";
  if (bw >= 20) quality = "🟢 عالی";
  else if (bw >= 10) quality = "🟡 خوب";
  else if (bw >= 5) quality = "🟠 متوسط";

  return "📶 <b>پهنای باند اینترنت</b>\n\n" +
    "سرعت تخمینی: <b>" + bw + " Mbps</b>\n" +
    "کیفیت: " + quality + "\n\n" +
    "📌 این عدد تخمینی است و بر اساس دانلود از سرورهای Cloudflare محاسبه شده.\n\n" +
    "🕒 " + getIranTime() + "\n" +
    "🤖 رادار اینترنت";
}

// ==================== Filtering Report ====================
async function makeFilteringReport() {
  const results = [];
  for (const site of FILTERED_SITES) {
    const t = await pingSite(site.url);
    results.push({ name: site.name, accessible: t !== null, time: t });
  }

  const accessible = results.filter(r => r.accessible).length;
  const total = results.length;
  const percent = Math.round((accessible / total) * 100);

  let level = "🔴 بالا";
  if (percent >= 80) level = "🟢 پایین";
  else if (percent >= 60) level = "🟡 متوسط";
  else if (percent >= 40) level = "🟠 نسبتاً بالا";

  let list = "";
  for (const r of results) {
    list += "  " + (r.accessible ? "✅" : "🚫") + " " + r.name;
    if (r.time) list += " (" + r.time + " ms)";
    list += "\n";
  }

  return "🚫 <b>سطح فیلترینگ</b>\n\n" +
    "سطح: " + level + "\n" +
    "دسترسی آزاد: %" + percent + "\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "<b>وضعیت سایت‌ها:</b>\n" + list + "\n" +
    "⚠️ توجه: این تست از سرور خارج از ایران انجام شده و ممکنه نتایج دقیق نباشه.\n\n" +
    "🕒 " + getIranTime() + "\n" +
    "🤖 رادار اینترنت";
}

// ==================== Outages Report ====================
async function makeOutagesReport() {
  const bgp = await fetchBGP();
  let out = "🚨 <b>اختلالات شبکه</b>\n\n";

  if (bgp && bgp.data && bgp.data.updates) {
    const updates = bgp.data.updates;
    out += "📊 تعداد به‌روزرسانی‌های BGP: <b>" + updates.length + "</b>\n";

    if (updates.length > 100) {
      out += "⚠️ تعداد بالا → نشانه اختلال\n";
    } else if (updates.length > 30) {
      out += "🟡 فعالیت متوسط\n";
    } else {
      out += "🟢 شبکه پایدار\n";
    }

    out += "\n🔗 منبع: RIPE Stat\n";
  } else {
    out += "❌ دریافت داده از RIPE ناموفق\n";
  }

  out += "\n🕒 " + getIranTime() + "\n";
  out += "🤖 رادار اینترنت";
  return out;
  }
