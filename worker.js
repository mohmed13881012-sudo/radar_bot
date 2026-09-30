const BOT_TOKEN = "8579994081:AAFPiuiMPgANy7ARI9QiE7dWWwlnFrwY8gs";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

// ==================== نقشه ASN به اسم اپراتور ====================
const ASN_NAMES = {
  "42337": "پارس‌آنلاین",
  "58224": "مخابرات ایران (TCI)",
  "197207": "همراه اول (MCI)",
  "44244": "ایرانسل",
  "31549": "شاتل",
  "16322": "پارس‌پک",
  "50810": "آسیاتک",
  "57218": "رایتل",
  "43754": "آسیاتک",
  "12880": "زیرساخت",
  "48159": "پیشگامان",
  "39501": "ابر آروان",
  "25184": "افرانِت",
  "56402": "صبانت",
  "208161": "ایرانسل جدید",
  "205648": "رسپینا",
  "21478": "مبین‌نت",
  "206065": "پیشگامان",
  "44208": "شبکه گستر",
  "49100": "ارتباطات زیرساخت",
  "202468": "ایران‌سرور",
  "204213": "همراه نت",
  "57497": "شاتل موبایل",
  "51685": "پارس‌پک",
  "48434": "پارس‌آنلاین",
  "58224": "مخابرات",
  "12880": "زیرساخت",
  "6736": "شاتل",
  "51074": "شاتل"
};

// ==================== سایت‌ها ====================
const IR_SITES = [
  { name: "دیجی‌کالا", url: "https://digikala.com" },
  { name: "شاپرک", url: "https://shaparak.ir" },
  { name: "ایرانسل", url: "https://irancell.ir" },
  { name: "همراه اول", url: "https://mci.ir" }
];
const GLOBAL_SITES = [
  { name: "گوگل", url: "https://www.google.com" },
  { name: "کلادفلر", url: "https://www.cloudflare.com" },
  { name: "مایکروسافت", url: "https://www.microsoft.com" }
];
const FILTER_CHECK = [
  { name: "توییتر / X", url: "https://x.com" },
  { name: "یوتیوب", url: "https://www.youtube.com" },
  { name: "فیسبوک", url: "https://www.facebook.com" },
  { name: "اینستاگرام", url: "https://www.instagram.com" },
  { name: "تلگرام", url: "https://telegram.org" },
  { name: "واتساپ", url: "https://web.whatsapp.com" },
  { name: "گوگل پلی", url: "https://play.google.com" },
  { name: "ویکی‌پدیا", url: "https://www.wikipedia.org" }
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

// ==================== توابع کمکی ====================
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
function asnName(asn) {
  const clean = String(asn).replace(/^AS/i, "");
  return ASN_NAMES[clean] || ("AS" + clean);
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

async function pingSite(url) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    return Date.now() - start;
  } catch(e) { return null; }
}

async function checkAccessible(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    return r.ok || r.status < 400;
  } catch(e) { return false; }
}

// ==================== Debug ====================
async function debugAll() {
  let out = "=== OONI ===\n";
  const ooni = await fetchOONI();
  if (ooni && ooni.result) {
    out += "Rows: " + ooni.result.length + "\n";
    out += JSON.stringify(ooni.result.slice(0, 2)).substring(0, 1200) + "\n\n";
  } else out += "No data\n\n";

  out += "=== RIPE routing-status ===\n";
  try {
    const r = await fetch("https://stat.ripe.net/data/routing-status/data.json?resource=IR");
    out += (await r.text()).substring(0, 800) + "\n\n";
  } catch(e) { out += "ERR: " + e.message + "\n\n"; }

  out += "=== RIPE bgp-state ===\n";
  try {
    const r = await fetch("https://stat.ripe.net/data/bgp-state/data.json?resource=IR");
    out += (await r.text()).substring(0, 800) + "\n\n";
  } catch(e) { out += "ERR: " + e.message + "\n\n"; }

  out += "=== RIPE country-asns ===\n";
  try {
    const r = await fetch("https://stat.ripe.net/data/country-asns/data.json?resource=IR");
    out += (await r.text()).substring(0, 800) + "\n\n";
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
    "https://stat.ripe.net/data/bgp-state/data.json?resource=IR",
    "https://stat.ripe.net/data/country-asns/data.json?resource=IR"
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { "Accept": "application/json" } });
      if (r.ok) {
        const d = await r.json();
        if (d && d.data) return d;
      }
    } catch(e) { console.log("RIPE err: " + e.message); }
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
      "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📌 دستورات:\n/status - گزارش کامل\n/ping - پینگ سایت‌ها\n/filtering - فیلترینگ اپراتورها\n/sites - وضعیت سرویس‌ها\n/help - راهنما",
      { parse_mode: "HTML" }
    );
  } else if (text === "/status") {
    await sendMessage(chatId, "🔍 در حال دریافت...");
    const report = await makeReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/ping") {
    await sendMessage(chatId, "🔍 در حال پینگ...");
    const report = await makePingReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/filtering") {
    await sendMessage(chatId, "🔍 در حال بررسی فیلترینگ...");
    const report = await makeFilteringReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/sites") {
    await sendMessage(chatId, "🔍 در حال بررسی سرویس‌ها...");
    const report = await makeSitesReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/help") {
    await sendMessage(chatId,
      "📚 <b>راهنمای ربات</b>\n\n/status - گزارش کامل\n/ping - پینگ سایت‌ها\n/filtering - فیلترینگ اپراتورها\n/sites - وضعیت سرویس‌ها\n/help - راهنما",
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

// ==================== Ping Report ====================
async function makePingReport() {
  let irList = "";
  let globalList = "";
  let irOk = 0, globalOk = 0;

  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + ": " + t + " ms\n"; }
    else { irList += "  ❌ " + s.name + ": ناموفق\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + ": " + t + " ms\n"; }
    else { globalList += "  ❌ " + s.name + ": ناموفق\n"; }
  }

  return "🌐 <b>پینگ سایت‌ها</b>\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🇮🇷 <b>ایرانی</b> (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n" +
    "🌍 <b>جهانی</b> (" + globalOk + "/" + GLOBAL_SITES.length + ")\n" + globalList + "\n" +
    "🕒 " + getIranTime() + "\n" +
    "🤖 رادار اینترنت";
}

// ==================== Filtering Report ====================
async function makeFilteringReport() {
  const ooni = await fetchOONI();
  let totalMs = 0, blockedMs = 0;
  let asnData = {};

  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      const mc = row.measurement_count || 0;
      const ac = row.anomaly_count || 0;
      const cc = row.confirmed_count || 0;
      const fc = row.failure_count || 0;
      const ok = mc - ac - cc - fc;

      totalMs += mc;
      blockedMs += (ac + cc);

      if (row.probe_asn && mc >= 50) {
        const asn = String(row.probe_asn).replace(/^AS/i, "");
        if (!asnData[asn]) asnData[asn] = { total: 0, ok: 0, count: 0 };
        asnData[asn].total += mc;
        asnData[asn].ok += ok;
        asnData[asn].count += mc;
      }
    }
  }

  const blockPercent = totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0;

  let level = "🟢 پایین";
  if (blockPercent >= 60) level = "🔴 بالا";
  else if (blockPercent >= 40) level = "🟠 نسبتاً بالا";
  else if (blockPercent >= 20) level = "🟡 متوسط";

  let operatorList = [];
  for (const [asn, data] of Object.entries(asnData)) {
    const rate = Math.round((data.ok / data.total) * 100);
    operatorList.push({ asn: asn, name: asnName(asn), rate: rate, count: data.count });
  }
  operatorList.sort((a,b) => b.count - a.count);

  let out = "🚫 <b>سطح فیلترینگ ایران</b>\n\n";
  out += "📊 درصد مسدودسازی: <b>%" + blockPercent + "</b>\n";
  out += "📈 وضعیت: " + level + "\n";
  out += makeBar(blockPercent / 10) + "\n";
  out += "📡 تعداد اندازه‌گیری: " + totalMs.toLocaleString("fa-IR") + "\n\n";

  if (operatorList.length > 0) {
    out += "━━━━━━━━━━━━━━━\n";
    out += "<b>وضعیت به تفکیک اپراتور:</b>\n";
    operatorList.slice(0, 10).forEach(item => {
      const emoji = item.rate >= 80 ? "🟢" : item.rate >= 60 ? "🟡" : item.rate >= 40 ? "🟠" : "🔴";
      out += emoji + " <b>" + item.name + "</b>: %" + item.rate + " آزاد (" + item.count.toLocaleString("fa-IR") + ")\n";
    });
  }

  out += "\n🕒 " + getIranTime() + "\n";
  out += "📌 منبع: OONI\n";
  out += "🤖 رادار اینترنت";
  return out;
}

// ==================== Sites Report ====================
async function makeSitesReport() {
  let out = "🌐 <b>وضعیت سرویس‌ها</b>\n\n";
  out += "⚠️ این تست از سرور خارج از ایران انجام شده.\n\n";
  out += "━━━━━━━━━━━━━━━\n";

  let accessible = 0;
  let list = "";
  for (const s of FILTER_CHECK) {
    const ok = await checkAccessible(s.url);
    if (ok) { accessible++; list += "  ✅ " + s.name + "\n"; }
    else { list += "  🚫 " + s.name + "\n"; }
  }

  out += "<b>دسترسی از خارج:</b> " + accessible + "/" + FILTER_CHECK.length + "\n\n";
  out += list;
  out += "\n🕒 " + getIranTime() + "\n";
  out += "🤖 رادار اینترنت";
  return out;
}

// ==================== Main Report ====================
async function makeReport() {
  // 1. پینگ
  let irOk = 0, globalOk = 0;
  let irList = "", globalList = "";
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + ": " + t + "ms\n"; }
    else { irList += "  ❌ " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + ": " + t + "ms\n"; }
    else { globalList += "  ❌ " + s.name + "\n"; }
  }

  // 2. OONI
  const ooni = await fetchOONI();
  let totalMs = 0, blockedMs = 0;
  let asnData = {};
  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      const mc = row.measurement_count || 0;
      const ac = row.anomaly_count || 0;
      const cc = row.confirmed_count || 0;
      const fc = row.failure_count || 0;
      const ok = mc - ac - cc - fc;
      totalMs += mc;
      blockedMs += (ac + cc);
      if (row.probe_asn && mc >= 50) {
        const asn = String(row.probe_asn).replace(/^AS/i, "");
        if (!asnData[asn]) asnData[asn] = { total: 0, ok: 0 };
        asnData[asn].total += mc;
        asnData[asn].ok += ok;
      }
    }
  }
  const blockPercent = totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0;

  let operators = [];
  for (const [asn, data] of Object.entries(asnData)) {
    const rate = Math.round((data.ok / data.total) * 100);
    operators.push({ name: asnName(asn), rate: rate });
  }
  operators.sort((a,b) => a.rate - b.rate);

  // 3. RIPE
  const ripe = await fetchRIPE();

  const time = getIranTime();
  const date = getIranDate();

  let out = "📊 <b>گزارش وضعیت اینترنت ایران</b>\n";
  out += "📅 " + date + " | 🕒 " + time + "\n\n";

  // پینگ
  out += "━━━━━━━━━━━━━━━\n";
  out += "🌐 <b>دسترسی سایت‌ها</b>\n";
  out += "🇮🇷 ایرانی: " + irOk + "/" + IR_SITES.length + "\n";
  out += "🌍 جهانی: " + globalOk + "/" + GLOBAL_SITES.length + "\n\n";
  out += irList + globalList + "\n";

  // OONI
  out += "━━━━━━━━━━━━━━━\n";
  out += "🚫 <b>سطح فیلترینگ (OONI)</b>\n";
  out += "درصد مسدودسازی: <b>%" + blockPercent + "</b>\n";
  out += makeBar(blockPercent / 10) + "\n";
  out += "📊 اندازه‌گیری: " + totalMs.toLocaleString("fa-IR") + "\n\n";

  if (operators.length > 0) {
    out += "<b>بدترین اپراتورها:</b>\n";
    operators.slice(0, 5).forEach(o => {
      const emoji = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += emoji + " " + o.name + ": %" + o.rate + "\n";
    });
  }

  // RIPE
  out += "\n━━━━━━━━━━━━━━━\n";
  out += "🚨 <b>مسیریابی (BGP)</b>\n";
  if (ripe && ripe.data) {
    if (ripe.data.visibility !== undefined) {
      const vis = ripe.data.visibility;
      out += "👁️ Visibility: <b>%" + vis + "</b>\n";
      out += "وضعیت: " + (vis > 95 ? "🟢 پایدار" : vis > 80 ? "🟡 متوسط" : "🔴 ناپایدار") + "\n";
    }
    if (ripe.data.total_count !== undefined) {
      out += "📡 روت‌ها: " + ripe.data.total_count.toLocaleString("fa-IR") + "\n";
    }
    if (ripe.data.observed_neighbours !== undefined) {
      out += "🔗 همسایه‌ها: " + ripe.data.observed_neighbours + "\n";
    }
    out += "🔗 منبع: RIPE Stat\n";
  } else {
    out += "⚠️ RIPE در دسترس نیست\n";
    out += "📌 فقط داده‌های OONI نمایش داده شد.\n";
  }

  out += "\n━━━━━━━━━━━━━━━\n";
  out += "🔗 @radarinternetiran\n";
  out += "👑 @royal_trust_ir_official\n\n";
  out += "🤖 <i>رادار اینترنت - مانیتورینگ زنده</i>";

  return out;
  }
