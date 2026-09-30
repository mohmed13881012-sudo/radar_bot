const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";

const ASN_NAMES = {
  "42337": "پارس‌آنلاین", "58224": "مخابرات", "197207": "همراه اول",
  "44244": "ایرانسل", "31549": "شاتل", "16322": "پارس‌پک",
  "50810": "آسیاتک", "57218": "رایتل", "43754": "آسیاتک",
  "12880": "زیرساخت", "48159": "پیشگامان", "39501": "ابر آروان",
  "25184": "افرانِت", "56402": "صبانت", "208161": "ایرانسل جدید",
  "205648": "رسپینا", "21478": "مبین‌نت", "206065": "پیشگامان",
  "44208": "شبکه گستر", "49100": "زیرساخت", "202468": "ایران‌سرور",
  "204213": "همراه نت", "57497": "شاتل موبایل", "51685": "پارس‌پک",
  "48434": "پارس‌آنلاین", "6736": "شاتل", "51074": "شاتل"
};

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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const BOT_TOKEN = env.BOT_TOKEN;
    if (url.pathname === "/test") return new Response("Test OK");
    if (url.pathname === "/check") return new Response("TOKEN: " + BOT_TOKEN);
    if (!BOT_TOKEN) return new Response("ERROR: BOT_TOKEN not set!", { status: 500 });
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

    if (url.pathname === "/setwebhook") {
      const r = await fetch(TG + "/setWebhook?url=" + url.origin + "/");
      return new Response("Result: " + await r.text());
    }
    if (url.pathname === "/webhookinfo") {
      const r = await fetch(TG + "/getWebhookInfo");
      return new Response(await r.text());
    }
    if (url.pathname === "/sendreport") {
      await sendChannelReport(TG);
      return new Response("Report sent!");
    }
    if (request.method !== "POST") return new Response("Radar Bot is running!");
    try {
      const update = await request.json();
      await handleUpdate(update, TG);
    } catch(e) { console.log("Error: " + e.message); }
    return new Response("OK");
  },
  async scheduled(event, env, ctx) {
    const BOT_TOKEN = env.BOT_TOKEN;
    if (!BOT_TOKEN) return;
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;
    await sendChannelReport(TG);
  }
};

// ==================== Helpers ====================
function getIranTime() {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
}
function getIranDate() {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function asnName(asn) {
  const c = String(asn).replace(/^AS/i, "");
  return ASN_NAMES[c] || ("AS" + c);
}
function makeBar(v) {
  const f = Math.max(0, Math.min(10, Math.round(v)));
  let c = "🔴";
  if (v >= 8) c = "🟢"; else if (v >= 6) c = "🟡"; else if (v >= 4) c = "🟠";
  let b = "";
  for (let i = 0; i < 10; i++) b += (i < f ? c : "▫️");
  return b;
}
async function pingSite(url) {
  const s = Date.now();
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    await fetch(url, { method: "HEAD", signal: c.signal, redirect: "follow" });
    clearTimeout(t);
    return Date.now() - s;
  } catch(e) { return null; }
}
async function checkAccessible(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    const r = await fetch(url, { method: "HEAD", signal: c.signal, redirect: "follow" });
    clearTimeout(t);
    return r.ok || r.status < 400;
  } catch(e) { return false; }
}
function quickChart(config) {
  const json = JSON.stringify(config);
  return "https://quickchart.io/chart?w=900&h=500&bkg=%23ffffff&c=" + encodeURIComponent(json);
}

// ==================== APIs ====================
async function fetchOONI() {
  try {
    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
    if (r.ok) return await r.json();
  } catch(e) {}
  return null;
}
async function fetchOONI7d() {
  try {
    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - 604800000).toISOString().split("T")[0];
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
    if (r.ok) return await r.json();
  } catch(e) {}
  return null;
}
async function fetchRIPE() {
  const eps = [
    "https://stat.ripe.net/data/routing-status/data.json?resource=IR",
    "https://stat.ripe.net/data/bgp-state/data.json?resource=IR"
  ];
  for (const u of eps) {
    try {
      const r = await fetch(u, { headers: { "Accept": "application/json" } });
      if (r.ok) { const d = await r.json(); if (d && d.data) return d; }
    } catch(e) {}
  }
  return null;
}
function parseOONI(ooni) {
  let totalMs = 0, blockedMs = 0;
  let asnData = {};
  let dayData = {};
  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      const mc = row.measurement_count || 0;
      const ac = row.anomaly_count || 0;
      const cc = row.confirmed_count || 0;
      const fc = row.failure_count || 0;
      const ok = mc - ac - cc - fc;
      totalMs += mc;
      blockedMs += (ac + cc);
      if (row.probe_asn && mc >= 30) {
        const asn = String(row.probe_asn).replace(/^AS/i, "");
        if (!asnData[asn]) asnData[asn] = { total: 0, ok: 0, count: 0 };
        asnData[asn].total += mc;
        asnData[asn].ok += ok;
        asnData[asn].count += mc;
      }
      if (row.measurement_start_day) {
        const day = row.measurement_start_day;
        if (!dayData[day]) dayData[day] = { total: 0, blocked: 0 };
        dayData[day].total += mc;
        dayData[day].blocked += (ac + cc);
      }
    }
  }
  return {
    blockPercent: totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0,
    totalMs, blockedMs, asnData, dayData
  };
}

// ==================== Send ====================
async function sendPhoto(TG, chatId, url, caption) {
  try {
    await fetch(TG + "/sendPhoto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: url, caption: caption, parse_mode: "HTML" })
    });
  } catch(e) {}
}
async function sendMessage(TG, chatId, text, extra) {
  const body = { chat_id: chatId, text: text };
  if (extra) {
    Object.keys(extra).forEach(k => {
      if (k === "inline_keyboard") {
        body.reply_markup = { inline_keyboard: extra[k] };
      } else {
        body[k] = extra[k];
      }
    });
  }
  try {
    await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch(e) {}
}
async function sendChannelReport(TG) {
  const report = await makeReport("full");
  try {
    await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CH1, text: report, parse_mode: "HTML" })
    });
  } catch(e) {}
}

// ==================== Handle Update ====================
async function handleUpdate(update, TG) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = msg.from.id;

  const inCh1 = await checkMember(TG, userId, CH1);
  const inCh2 = await checkMember(TG, userId, CH2);

  if (!inCh1 || !inCh2) {
    await sendMessage(TG, chatId,
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
    await sendMessage(TG, chatId,
      "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📌 دستورات:\n/status - گزارش کامل\n/ping - پینگ سایت‌ها\n/filtering - فیلترینگ اپراتورها\n/sites - وضعیت سرویس‌ها\n/compare - مقایسه اپراتورها\n/top - رتبه‌بندی هفتگی\n/speed - تست سرعت\n/chart - نمودار\n/trend - روند ۷ روز اخیر\n/help - راهنما",
      { parse_mode: "HTML" }
    );
  } else if (text === "/status" || text === "/status full") {
    await sendMessage(TG, chatId, "🔍 در حال دریافت...");
    const report = await makeReport("full");
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/status simple") {
    await sendMessage(TG, chatId, "🔍 در حال دریافت...");
    const report = await makeReport("simple");
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/status chart") {
    await sendMessage(TG, chatId, "📊 در حال ساخت...");
    const summary = await makeReport("chart");
    await sendMessage(TG, chatId, summary, { parse_mode: "HTML" });
    const c = await makeBarChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/compare") {
    await sendMessage(TG, chatId, "🆚 در حال مقایسه...");
    const report = await makeCompareReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/top") {
    await sendMessage(TG, chatId, "🏆 در حال رتبه‌بندی...");
    const report = await makeTopReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/speed") {
    const report = await makeSpeedReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text.startsWith("/myspeed ")) {
    const parts = text.replace("/myspeed ", "").trim().split(/\s+/);
    if (parts.length !== 3) {
      await sendMessage(TG, chatId, "❌ فرمت اشتباه. مثال:\n<code>/myspeed 25 8 20</code>", { parse_mode: "HTML" });
    } else {
      const card = await makeSpeedCard(parts[0], parts[1], parts[2]);
      await sendMessage(TG, chatId, card, { parse_mode: "HTML" });
    }
  } else if (text === "/ping") {
    await sendMessage(TG, chatId, "🔍 در حال پینگ...");
    const report = await makePingReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/filtering") {
    await sendMessage(TG, chatId, "🔍 در حال بررسی...");
    const report = await makeFilteringReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/sites") {
    await sendMessage(TG, chatId, "🔍 در حال بررسی سرویس‌ها...");
    const report = await makeSitesReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/chart") {
    await sendMessage(TG, chatId, "📊 در حال ساخت نمودار...");
    const c = await makeBarChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/pie") {
    await sendMessage(TG, chatId, "🥧 در حال ساخت نمودار...");
    const c = await makePieChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/trend") {
    await sendMessage(TG, chatId, "📈 در حال ساخت نمودار...");
    const c = await makeTrendChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/help") {
    await sendMessage(TG, chatId,
      "📚 <b>راهنمای ربات</b>\n\n📊 گزارش‌ها:\n/status - کامل\n/ping - پینگ سایت‌ها\n/filtering - فیلترینگ\n/sites - سرویس‌ها\n\n🆚 مقایسه:\n/compare - مقایسه اپراتورها\n/top - رتبه‌بندی هفتگی\n\n⚡ تست سرعت:\n/speed - لینک تست + راهنما\n/myspeed 25 8 20 - کارت وایرال\n\n📈 نمودارها:\n/chart - میله‌ای\n/pie - دایره‌ای\n/trend - روند ۷ روز",
      { parse_mode: "HTML" }
    );
  }
}

async function checkMember(TG, userId, channel) {
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

// ==================== Charts ====================
async function makeBarChart() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a,b) => b.count - a.count);
  ops = ops.slice(0, 8);
  return {
    url: quickChart({
      type: "horizontalBar",
      data: {
        labels: ops.map(o => o.name),
        datasets: [{
          label: "دسترسی آزاد %",
          data: ops.map(o => o.rate),
          backgroundColor: ops.map(o => o.rate >= 80 ? "#22c55e" : o.rate >= 60 ? "#eab308" : o.rate >= 40 ? "#f97316" : "#ef4444")
        }]
      },
      options: {
        title: { display: true, text: "دسترسی آزاد اپراتورها", fontSize: 18 },
        legend: { display: false },
        scales: { xAxes: [{ ticks: { beginAtZero: true, max: 100 } }] }
      }
    }),
    caption: "📊 <b>نمودار دسترسی اپراتورها</b>\n\nسطح فیلترینگ کل: %" + p.blockPercent
  };
}

async function makePieChart() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    ops.push({ name: asnName(asn), count: d.count });
  }
  ops.sort((a,b) => b.count - a.count);
  ops = ops.slice(0, 6);
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#f97316"];
  return {
    url: quickChart({
      type: "pie",
      data: {
        labels: ops.map(o => o.name),
        datasets: [{ data: ops.map(o => o.count), backgroundColor: colors }]
      },
      options: { title: { display: true, text: "سهم اپراتورها", fontSize: 18 } }
    }),
    caption: "🥧 <b>سهم اپراتورها</b>\n\nاز " + p.totalMs.toLocaleString("fa-IR") + " اندازه‌گیری"
  };
}

async function makeTrendChart() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [];
  let values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5));
    values.push(blocked);
  }
  return {
    url: quickChart({
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "درصد مسدودسازی",
          data: values,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.15)",
          fill: true,
          tension: 0.3,
          borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: "روند فیلترینگ 7 روز اخیر", fontSize: 18 },
        scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] }
      }
    }),
    caption: "📈 <b>روند فیلترینگ ۷ روز اخیر</b>\n\nبالاترین: %" + Math.max(...values) + "\nپایین‌ترین: %" + Math.min(...values)
  };
}

// ==================== Reports ====================
async function makePingReport() {
  let irList = "", globalList = "";
  let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + ": " + t + " ms\n"; }
    else { irList += "  ❌ " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + ": " + t + " ms\n"; }
    else { globalList += "  ❌ " + s.name + "\n"; }
  }
  return "🌐 <b>پینگ سایت‌ها</b>\n\n" +
    "🇮🇷 <b>ایرانی</b> (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n" +
    "🌍 <b>جهانی</b> (" + globalOk + "/" + GLOBAL_SITES.length + ")\n" + globalList + "\n" +
    "🕒 " + getIranTime() + "\n🤖 رادار اینترنت";
}

async function makeFilteringReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a,b) => b.count - a.count);

  let level = "🟢 پایین";
  if (p.blockPercent >= 60) level = "🔴 بالا";
  else if (p.blockPercent >= 40) level = "🟠 نسبتاً بالا";
  else if (p.blockPercent >= 20) level = "🟡 متوسط";

  let out = "🚫 <b>سطح فیلترینگ ایران</b>\n\n";
  out += "📊 مسدودسازی: <b>%" + p.blockPercent + "</b>\n";
  out += "📈 وضعیت: " + level + "\n";
  out += makeBar(p.blockPercent / 10) + "\n";
  out += "📡 اندازه‌گیری: " + p.totalMs.toLocaleString("fa-IR") + "\n\n";

  if (ops.length > 0) {
    out += "━━━━━━━━━━━━━━━\n<b>به تفکیک اپراتور:</b>\n";
    ops.slice(0, 10).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += e + " <b>" + o.name + "</b>: %" + o.rate + " (" + o.count.toLocaleString("fa-IR") + ")\n";
    });
  }
  out += "\n🕒 " + getIranTime() + "\n📌 OONI\n🤖 رادار اینترنت";
  return out;
}

async function makeSitesReport() {
  let out = "🌐 <b>وضعیت سرویس‌ها</b>\n\n";
  out += "⚠️ این تست از خارج ایران انجام شده.\n\n━━━━━━━━━━━━━━━\n";
  let acc = 0, list = "";
  for (const s of FILTER_CHECK) {
    const ok = await checkAccessible(s.url);
    if (ok) { acc++; list += "  ✅ " + s.name + "\n"; }
    else { list += "  🚫 " + s.name + "\n"; }
  }
  out += "<b>دسترسی از خارج:</b> " + acc + "/" + FILTER_CHECK.length + "\n\n" + list;
  out += "\n🕒 " + getIranTime() + "\n🤖 رادار اینترنت";
  return out;
}

// ==================== Compare ====================
async function makeCompareReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 100) {
      ops.push({ name: asnName(asn), asn: asn, rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی برای مقایسه در دسترس نیست.";
  ops.sort((a, b) => b.rate - a.rate);
  const best = ops.slice(0, 3);
  const worst = ops.slice(-3).reverse();
  let out = "🆚 <b>مقایسه اپراتورها</b>\n\n";
  out += "📊 بر اساس دسترسی آزاد به اینترنت\n\n";
  out += "━━━━━━━━━━━━━━━\n🏆 <b>بهترین اپراتورها:</b>\n";
  best.forEach((o, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
    out += medal + " <b>" + o.name + "</b>: %" + o.rate + " آزاد\n";
  });
  out += "\n━━━━━━━━━━━━━━━\n🔴 <b>بدترین اپراتورها:</b>\n";
  worst.forEach(o => {
    out += "• <b>" + o.name + "</b>: %" + o.rate + " آزاد\n";
  });
  out += "\n━━━━━━━━━━━━━━━\n📌 مجموع: " + ops.length + " اپراتور بررسی شده\n📊 منبع: OONI\n\n";
  out += "🕒 " + getIranTime() + "\n🤖 رادار اینترنت";
  return out;
}

// ==================== Top ====================
async function makeTopReport() {
  const ooni7d = await fetchOONI7d();
  const p = parseOONI(ooni7d);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 500) {
      ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی برای رتبه‌بندی در دسترس نیست.";
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🏆 <b>رتبه‌بندی هفتگی اپراتورها</b>\n\n📅 بر اساس داده ۷ روز اخیر\n\n";
  out += "━━━━━━━━━━━━━━━\n🥇 <b>بهترین‌ها:</b>\n";
  ops.slice(0, 5).forEach((o, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i+1) + ".";
    out += medal + " " + o.name + ": %" + o.rate + "\n";
  });
  out += "\n━━━━━━━━━━━━━━━\n🔻 <b>پایین‌ترین‌ها:</b>\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "• " + o.name + ": %" + o.rate + "\n";
  });
  out += "\n━━━━━━━━━━━━━━━\n📌 مجموع: " + ops.length + " اپراتور\n📊 منبع: OONI\n\n";
  out += "🕒 " + getIranTime() + "\n🤖 رادار اینترنت";
  return out;
}

// ==================== Speed ====================
async function makeSpeedReport() {
  let out = "⚡ <b>تست سرعت اینترنت</b>\n\n";
  out += "━━━━━━━━━━━━━━━\n🔗 <b>لینک تست سرعت:</b>\n";
  out += "• <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n";
  out += "• <a href='https://www.speedtest.net/'>Speedtest.net</a>\n";
  out += "• <a href='https://fast.com/'>Fast.com</a>\n\n";
  out += "━━━━━━━━━━━━━━━\n📋 <b>چطور نتیجه‌ات رو با ما به اشتراک بذاری؟</b>\n\n";
  out += "بعد از تست، این پیام رو به ربات بفرست:\n";
  out += "<code>/myspeed 25 8 20</code>\n\n";
  out += "ترتیب اعداد:\n• دانلود (Mbps)\n• آپلود (Mbps)\n• پینگ (ms)\n\n";
  out += "📊 ما یه <b>کارت گرافیکی</b> برات می‌سازیم که بتونی با دوستات به اشتراک بذاری!\n\n";
  out += "🕒 " + getIranTime() + "\n🤖 رادار اینترنت";
  return out;
}

async function makeSpeedCard(download, upload, ping) {
  const dl = parseFloat(download);
  const ul = parseFloat(upload);
  const pg = parseInt(ping);
  if (isNaN(dl) || dl < 0 || dl > 10000) return "❌ عدد دانلود نامعتبر.";
  if (isNaN(ul) || ul < 0 || ul > 10000) return "❌ عدد آپلود نامعتبر.";
  if (isNaN(pg) || pg < 0 || pg > 10000) return "❌ عدد پینگ نامعتبر.";
  let rank = "🐌 ضعیف";
  let rankEmoji = "🐌";
  let percent = 0;
  if (dl >= 50) { rank = "⚡ فوق‌العاده"; rankEmoji = "⚡"; percent = 95; }
  else if (dl >= 30) { rank = "🚀 خیلی خوب"; rankEmoji = "🚀"; percent = 85; }
  else if (dl >= 15) { rank = "✅ خوب"; rankEmoji = "✅"; percent = 70; }
  else if (dl >= 8) { rank = "🟡 متوسط"; rankEmoji = "🟡"; percent = 50; }
  else if (dl >= 3) { rank = "🟠 ضعیف"; rankEmoji = "🟠"; percent = 30; }
  else { rank = "🔴 خیلی ضعیف"; rankEmoji = "🔴"; percent = 10; }
  const bar = makeBar(percent / 10);
  return "⚡ <b>سرعت اینترنت من</b>\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "⬇️ دانلود: <b>" + dl + " Mbps</b>\n" +
    "⬆️ آپلود: <b>" + ul + " Mbps</b>\n" +
    "⏱️ پینگ: <b>" + pg + " ms</b>\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    rankEmoji + " رتبه: <b>" + rank + "</b>\n" +
    bar + " " + percent + "%\n\n" +
    "🏆 بهتر از " + percent + "% کاربران\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "📤 <b>این کارت رو با دوستات به اشتراک بذار!</b>\n" +
    "🤖 @Radarinternetiranbot\n\n" +
    "🕒 " + getIranTime();
}

// ==================== Main Report ====================
async function makeReport(mode) {
  if (mode === undefined) mode = "full";
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100) });
  }
  ops.sort((a, b) => a.rate - b.rate);

  if (mode === "simple") {
    let emoji = "🟢";
    let status = "پایدار";
    if (p.blockPercent >= 60) { emoji = "🔴"; status = "بحرانی"; }
    else if (p.blockPercent >= 40) { emoji = "🟠"; status = "ناپایدار"; }
    else if (p.blockPercent >= 20) { emoji = "🟡"; status = "متوسط"; }
    return "📊 <b>وضعیت اینترنت</b>\n\n" +
      emoji + " " + status + "\n" +
      "🚫 مسدودسازی: <b>%" + p.blockPercent + "</b>\n" +
      makeBar(p.blockPercent / 10) + "\n\n" +
      "🕒 " + getIranTime() + "\n🤖 رادار اینترنت";
  }

  if (mode === "chart") {
    return "📊 <b>وضعیت اینترنت - مود نموداری</b>\n\n" +
      "🚫 مسدودسازی: <b>%" + p.blockPercent + "</b>\n" +
      makeBar(p.blockPercent / 10) + "\n\n" +
      "👇 نمودار زیر رو ببین:";
  }

  // full
  let irOk = 0, globalOk = 0, irList = "", globalList = "";
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

  const ripe = await fetchRIPE();

  let out = "📊 <b>گزارش وضعیت اینترنت ایران</b>\n";
  out += "📅 " + getIranDate() + " | 🕒 " + getIranTime() + "\n\n";
  out += "━━━━━━━━━━━━━━━\n🌐 <b>دسترسی سایت‌ها</b>\n";
  out += "🇮🇷 ایرانی: " + irOk + "/" + IR_SITES.length + "\n";
  out += "🌍 جهانی: " + globalOk + "/" + GLOBAL_SITES.length + "\n\n";
  out += irList + globalList + "\n";
  out += "━━━━━━━━━━━━━━━\n🚫 <b>فیلترینگ (OONI)</b>\n";
  out += "مسدودسازی: <b>%" + p.blockPercent + "</b>\n";
  out += makeBar(p.blockPercent / 10) + "\n";
  out += "📊 اندازه‌گیری: " + p.totalMs.toLocaleString("fa-IR") + "\n\n";
  if (ops.length > 0) {
    out += "<b>بدترین اپراتورها:</b>\n";
    ops.slice(0, 5).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += e + " " + o.name + ": %" + o.rate + "\n";
    });
  }
  out += "\n━━━━━━━━━━━━━━━\n🚨 <b>مسیریابی (BGP)</b>\n";
  if (ripe && ripe.data) {
    if (ripe.data.visibility !== undefined) {
      const v = ripe.data.visibility;
      out += "👁️ Visibility: <b>%" + v + "</b>\n";
      out += "وضعیت: " + (v > 95 ? "🟢 پایدار" : v > 80 ? "🟡 متوسط" : "🔴 ناپایدار") + "\n";
    }
    out += "🔗 RIPE Stat\n";
  } else {
    out += "⚠️ RIPE در دسترس نیست\n";
  }
  out += "\n━━━━━━━━━━━━━━━\n🔗 @radarinternetiran\n👑 @royal_trust_ir_official\n\n";
  out += "🤖 <i>رادار اینترنت - مانیتورینگ زنده</i>";
  return out;
    }
