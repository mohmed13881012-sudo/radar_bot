const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";

const ASN_NAMES = {
  "12880": "زیرساخت (DCI)", "58224": "مخابرات ایران (TCI)", "6736": "شاتل قدیمی",
  "44244": "ایرانسل", "197207": "همراه اول (MCI)", "57218": "رایتل",
  "57497": "شاتل موبایل", "50810": "آسیاتک", "31549": "شاتل",
  "42337": "پارس‌آنلاین", "16322": "پارس‌پک", "43754": "آسیاتک",
  "48159": "پیشگامان", "25184": "افرانت", "56402": "صبانت",
  "205648": "رسپینا", "21478": "مبین‌نت", "206065": "پیشگامان",
  "48434": "پارس‌آنلاین", "51685": "پارس‌پک", "51074": "شاتل",
  "39501": "ابر آروان", "202468": "ایران‌سرور", "204213": "همراه نت",
  "44208": "شبکه گستر", "49100": "ارتباطات زیرساخت", "208161": "ایرانسل جدید",
  "48320": "شبکه نقره‌ای", "61167": "فناوران", "49666": "مهرگان",
  "203087": "سیستم‌های نوین", "210644": "داده گستر", "211260": "ماهان",
  "212097": "آسیاتک نوین", "213210": "زیتون", "51433": "های‌وب",
  "62442": "مهر", "197749": "بهسازان", "201610": "پاسارگاد",
  "202520": "ماد", "205172": "کنیا", "206779": "کامکار",
  "207796": "شبکه سازان", "208296": "پژواک", "209103": "افق",
  "209408": "سبز", "210787": "دیبا", "211120": "راهبر",
  "213891": "ایده آل", "25124": "فناوری اطلاعات", "29049": "داده پرداز",
  "43396": "نوین", "47257": "نسیم", "48431": "ماهان",
  "48827": "همراه", "49189": "پارس", "51430": "آرمان",
  "56688": "شبکه پرداز", "58090": "گسترش", "59397": "توسعه",
  "61197": "ایده", "62229": "فرهنگ", "197967": "پیشرو"
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
      "╭━━━ 🔒 عضویت لازم ━━━╮\n\n" +
      "  برای استفاده از ربات،\n  ابتدا در هر دو کانال زیر\n  عضو شوید:\n\n" +
      "  📡 رادار اینترنت\n  👑 رویال تراست\n\n" +
      "  پس از عضویت،\n  دوباره /start را بزنید.\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
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
      "╭━━━ 👋 خوش آمدید ━━━╮\n\n" +
      "  به <b>رادار اینترنت</b> خوش آمدی\n\n" +
      "┣━━━ 📊 گزارش‌ها\n\n" +
      "  /status  →  گزارش کامل\n" +
      "  /status simple  →  خلاصه\n" +
      "  /status chart  →  با نمودار\n" +
      "  /ping  →  پینگ سایت‌ها\n" +
      "  /filtering  →  فیلترینگ\n" +
      "  /sites  →  وضعیت سرویس‌ها\n\n" +
      "┣━━━ 🆚 مقایسه\n\n" +
      "  /compare  →  مقایسه اپراتورها\n" +
      "  /top  →  رتبه‌بندی هفتگی\n\n" +
      "┣━━━ ⚡ تست سرعت\n\n" +
      "  /speed  →  راهنما + لینک\n" +
      "  /myspeed  →  کارت وایرال\n\n" +
      "┣━━━ 📈 نمودارها\n\n" +
      "  /chart  →  میله‌ای\n" +
      "  /pie  →  دایره‌ای\n" +
      "  /trend  →  روند ۷ روز\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" }
    );
  } else if (text === "/status" || text === "/status full") {
    await sendMessage(TG, chatId, "⏳ در حال دریافت...");
    const report = await makeReport("full");
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/status simple") {
    await sendMessage(TG, chatId, "⏳ در حال دریافت...");
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
    await sendMessage(TG, chatId, "⏳ در حال پینگ...");
    const report = await makePingReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/filtering") {
    await sendMessage(TG, chatId, "⏳ در حال بررسی...");
    const report = await makeFilteringReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/sites") {
    await sendMessage(TG, chatId, "⏳ در حال بررسی...");
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
      "╭━━━ 📚 راهنمای ربات ━━━╮\n\n" +
      "┣━━━ 📊 گزارش‌ها\n\n" +
      "  /status  →  کامل\n" +
      "  /status simple  →  خلاصه\n" +
      "  /status chart  →  با نمودار\n" +
      "  /ping  →  پینگ سایت‌ها\n" +
      "  /filtering  →  فیلترینگ\n" +
      "  /sites  →  سرویس‌ها\n\n" +
      "┣━━━ 🆚 مقایسه\n\n" +
      "  /compare  →  مقایسه اپراتورها\n" +
      "  /top  →  رتبه‌بندی هفتگی\n\n" +
      "┣━━━ ⚡ تست سرعت\n\n" +
      "  /speed  →  راهنما\n" +
      "  /myspeed 25 8 20  →  کارت\n\n" +
      "┣━━━ 📈 نمودارها\n\n" +
      "  /chart  →  میله‌ای\n" +
      "  /pie  →  دایره‌ای\n" +
      "  /trend  →  روند ۷ روز\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
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
    caption: "📊 <b>نمودار دسترسی اپراتورها</b>\n\nسطح فیلترینگ کل: <b>%" + p.blockPercent + "</b>"
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
    caption: "🥧 <b>سهم اپراتورها</b>\n\nاز <b>" + p.totalMs.toLocaleString("fa-IR") + "</b> اندازه‌گیری"
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
    caption: "📈 <b>روند فیلترینگ ۷ روز اخیر</b>\n\n🔺 بالاترین: <b>%" + Math.max(...values) + "</b>\n🔻 پایین‌ترین: <b>%" + Math.min(...values) + "</b>"
  };
}

// ==================== Reports ====================
async function makePingReport() {
  let irList = "", globalList = "";
  let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { irList += "  ❌ " + s.name + "  <i>ناموفق</i>\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { globalList += "  ❌ " + s.name + "  <i>ناموفق</i>\n"; }
  }
  return "╭━━━ 🌐 پینگ سایت‌ها ━━━╮\n\n" +
    "┣━━━ 🇮🇷 <b>ایرانی</b>  <b>" + irOk + "/" + IR_SITES.length + "</b>\n\n" +
    irList + "\n" +
    "┣━━━ 🌍 <b>جهانی</b>  <b>" + globalOk + "/" + GLOBAL_SITES.length + "</b>\n\n" +
    globalList + "\n" +
    "╰━━━━━━━━━━━━━━━━━━━╯\n\n" +
    "🕒 " + getIranTime() + "\n" +
    "📡 @Radarinternetiran";
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

  let out = "╭━━━ 🚫 فیلترینگ ایران ━━━╮\n\n";
  out += "  📊 مسدودسازی: <b>%" + p.blockPercent + "</b>\n";
  out += "  📈 سطح: " + level + "\n";
  out += "  " + makeBar(p.blockPercent / 10) + "\n\n";
  out += "  📡 اندازه‌گیری: <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n";
  out += "  🌐 تعداد ASN: <code>" + ops.length + "</code>\n\n";

  if (ops.length > 0) {
    out += "┣━━━ 📡 <b>وضعیت اپراتورها</b>\n\n";
    ops.slice(0, 12).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += "  " + e + " <b>" + o.name + "</b>\n";
      out += "     └ %" + o.rate + " آزاد  •  " + o.count.toLocaleString("fa-IR") + " تست\n";
    });
  }
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "📌 منبع: OONI\n";
  out += "🕒 " + getIranTime() + "\n";
  out += "📡 @Radarinternetiran";
  return out;
}

async function makeSitesReport() {
  let out = "╭━━━ 🌐 وضعیت سرویس‌ها ━━━╮\n\n";
  out += "  ⚠️ <i>تست از خارج ایران</i>\n\n";
  let acc = 0, list = "";
  for (const s of FILTER_CHECK) {
    const ok = await checkAccessible(s.url);
    if (ok) { acc++; list += "  ✅ " + s.name + "\n"; }
    else { list += "  🚫 " + s.name + "\n"; }
  }
  out += "┣━━━ 📊 نتیجه\n\n";
  out += "  دسترسی: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n";
  out += "  " + makeBar((acc/FILTER_CHECK.length) * 10) + "\n\n";
  out += "┣━━━ 📋 جزئیات\n\n";
  out += list;
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "🕒 " + getIranTime() + "\n";
  out += "📡 @Radarinternetiran";
  return out;
}

async function makeCompareReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 100) {
      ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);

  let out = "╭━━━ 🆚 مقایسه اپراتورها ━━━╮\n\n";
  out += "📊 بر اساس دسترسی آزاد\n\n";

  out += "┣━━━ 🏆 <b>بهترین‌ها</b>\n\n";
  ops.slice(0, 5).forEach((o, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
    out += "  " + medal + " <b>" + o.name + "</b>\n";
    out += "     └ %" + o.rate + " آزاد\n";
  });

  out += "\n┣━━━ 🔻 <b>ضعیف‌ترین‌ها</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "  🔴 <b>" + o.name + "</b>\n";
    out += "     └ %" + o.rate + " آزاد\n";
  });

  out += "\n┣━━━ 📊 خلاصه\n\n";
  out += "  📡 تعداد: <b>" + ops.length + "</b>\n";
  const avg = Math.round(ops.reduce((a, b) => a + b.rate, 0) / ops.length);
  out += "  📈 میانگین: <b>%" + avg + "</b>\n";
  out += "  " + makeBar(avg / 10) + "\n";

  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "🕒 " + getIranTime() + "\n";
  out += "📡 @Radarinternetiran";
  return out;
}

async function makeTopReport() {
  const ooni7d = await fetchOONI7d();
  const p = parseOONI(ooni7d);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 500) {
      ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);

  let out = "╭━━━ 🏆 رتبه‌بندی هفتگی ━━━╮\n\n";
  out += "📅 ۷ روز اخیر\n\n";

  out += "┣━━━ 🥇 <b>بهترین‌ها</b>\n\n";
  ops.slice(0, 7).forEach((o, i) => {
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    out += "  " + rank + " <b>" + o.name + "</b>  %" + o.rate + "\n";
  });

  out += "\n┣━━━ 🔻 <b>پایین‌ترین‌ها</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "  🔴 <b>" + o.name + "</b>  %" + o.rate + "\n";
  });

  out += "\n┣━━━ 📊 خلاصه\n\n";
  out += "  📡 تعداد: <b>" + ops.length + "</b> اپراتور\n";
  out += "  🥇 بهترین: <b>%" + ops[0].rate + "</b>\n";
  out += "  🔻 بدترین: <b>%" + ops[ops.length-1].rate + "</b>\n";

  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "📌 منبع: OONI\n";
  out += "🕒 " + getIranTime() + "\n";
  out += "📡 @Radarinternetiran";
  return out;
}

async function makeSpeedReport() {
  let out = "╭━━━ ⚡ تست سرعت ━━━╮\n\n";
  out += "  📋 <b>راهنمای تست:</b>\n\n";
  out += "  1️⃣ لینک تست رو باز کن\n";
  out += "  2️⃣ سرعتت رو اندازه بگیر\n";
  out += "  3️⃣ نتیجه رو به ما بفرست\n\n";
  out += "┣━━━ 🔗 <b>لینک‌های تست</b>\n\n";
  out += "  🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n";
  out += "  📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n";
  out += "  ⚡ <a href='https://fast.com/'>Fast.com</a>\n\n";
  out += "┣━━━ 📤 <b>ارسال نتیجه</b>\n\n";
  out += "  <code>/myspeed 25 8 20</code>\n\n";
  out += "  🔹 اول: دانلود (Mbps)\n";
  out += "  🔹 دوم: آپلود (Mbps)\n";
  out += "  🔹 سوم: پینگ (ms)\n\n";
  out += "  🎁 یه <b>کارت وایرال</b> برات می‌سازیم!\n";
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯";
  return out;
}

async function makeSpeedCard(download, upload, ping) {
  const dl = parseFloat(download);
  const ul = parseFloat(upload);
  const pg = parseInt(ping);
  if (isNaN(dl) || dl < 0 || dl > 10000) return "❌ عدد دانلود نامعتبر.";
  if (isNaN(ul) || ul < 0 || ul > 10000) return "❌ عدد آپلود نامعتبر.";
  if (isNaN(pg) || pg < 0 || pg > 10000) return "❌ عدد پینگ نامعتبر.";

  let rank = "🐌 ضعیف", emoji = "🐌", percent = 15;
  if (dl >= 50) { rank = "⚡ فوق‌العاده"; emoji = "⚡"; percent = 95; }
  else if (dl >= 30) { rank = "🚀 خیلی خوب"; emoji = "🚀"; percent = 85; }
  else if (dl >= 15) { rank = "✨ خوب"; emoji = "✨"; percent = 70; }
  else if (dl >= 8) { rank = "🟡 متوسط"; emoji = "🟡"; percent = 50; }
  else if (dl >= 3) { rank = "🟠 ضعیف"; emoji = "🟠"; percent = 30; }

  let quality = "📱 پیام‌رسان";
  if (dl >= 25 && pg < 50) quality = "🎮 مناسب گیمینگ";
  else if (dl >= 15) quality = "🎬 مناسب استریم";
  else if (dl >= 8) quality = "🌐 مناسب وبگردی";

  const bar = makeBar(percent / 10);

  return "╭━━━ ⚡ سرعت اینترنت من ━━━╮\n\n" +
    "  " + emoji + "  <b>" + rank + "</b>\n\n" +
    "┣━━━ 📊 نتایج\n\n" +
    "  ⬇️ دانلود  <b>" + dl + " Mbps</b>\n" +
    "  ⬆️ آپلود  <b>" + ul + " Mbps</b>\n" +
    "  ⏱️ پینگ  <b>" + pg + " ms</b>\n\n" +
    "┣━━━ 🏆 رتبه\n\n" +
    "  " + bar + "\n" +
    "  بهتر از <b>%" + percent + "</b> کاربران\n\n" +
    "  " + quality + "\n\n" +
    "╰━━━━━━━━━━━━━━━━━━━╯\n\n" +
    "📤 <b>با دوستات به اشتراک بذار!</b>\n" +
    "🤖 @Radarinternetiranbot\n\n" +
    "🕒 " + getIranTime();
}

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
    let emoji = "🟢", status = "پایدار";
    if (p.blockPercent >= 60) { emoji = "🔴"; status = "بحرانی"; }
    else if (p.blockPercent >= 40) { emoji = "🟠"; status = "ناپایدار"; }
    else if (p.blockPercent >= 20) { emoji = "🟡"; status = "متوسط"; }

    return "╭━━━ 📊 وضعیت اینترنت ━━━╮\n\n" +
      "  " + emoji + "  <b>" + status + "</b>\n\n" +
      "  🚫 مسدودسازی: <b>%" + p.blockPercent + "</b>\n" +
      "  " + makeBar(p.blockPercent / 10) + "\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯\n\n" +
      "🕒 " + getIranTime() + "\n" +
      "📡 @Radarinternetiran";
  }

  if (mode === "chart") {
    return "╭━━━ 📊 وضعیت اینترنت ━━━╮\n\n" +
      "  🚫 مسدودسازی: <b>%" + p.blockPercent + "</b>\n" +
      "  " + makeBar(p.blockPercent / 10) + "\n\n" +
      "  👇 نمودار زیر:\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯";
  }

  // full
  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { irList += "  ❌ " + s.name + "  <i>ناموفق</i>\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { globalList += "  ❌ " + s.name + "  <i>ناموفق</i>\n"; }
  }

  const ripe = await fetchRIPE();

  let mainEmoji = "🟢", mainStatus = "پایدار";
  if (p.blockPercent >= 60) { mainEmoji = "🔴"; mainStatus = "بحرانی"; }
  else if (p.blockPercent >= 40) { mainEmoji = "🟠"; mainStatus = "ناپایدار"; }
  else if (p.blockPercent >= 20) { mainEmoji = "🟡"; mainStatus = "متوسط"; }

  let out = "╭━━━ 📊 گزارش اینترنت ━━━╮\n\n";
  out += "  📅 <b>" + getIranDate() + "</b>\n";
  out += "  🕒 <b>" + getIranTime() + "</b>\n\n";
  out += "  " + mainEmoji + "  <b>" + mainStatus + "</b>\n\n";

  out += "┣━━━ 🌐 <b>دسترسی سایت‌ها</b>\n\n";
  out += "  🇮🇷 ایرانی: <b>" + irOk + "/" + IR_SITES.length + "</b>\n\n";
  out += irList + "\n";
  out += "  🌍 جهانی: <b>" + globalOk + "/" + GLOBAL_SITES.length + "</b>\n\n";
  out += globalList + "\n";

  out += "┣━━━ 🚫 <b>فیلترینگ</b>\n\n";
  out += "  📊 مسدودسازی: <b>%" + p.blockPercent + "</b>\n";
  out += "  " + makeBar(p.blockPercent / 10) + "\n\n";
  out += "  📈 اندازه‌گیری: <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n\n";

  if (ops.length > 0) {
    out += "  🔻 <b>بدترین اپراتورها:</b>\n\n";
    ops.slice(0, 5).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += "  " + e + " " + o.name + "  <b>%" + o.rate + "</b>\n";
    });
    out += "\n";
  }

  out += "┣━━━ 🚨 <b>مسیریابی</b>\n\n";
  if (ripe && ripe.data && ripe.data.visibility !== undefined) {
    const v = ripe.data.visibility;
    const vE = v > 95 ? "🟢" : v > 80 ? "🟡" : "🔴";
    out += "  " + vE + " Visibility: <b>%" + v + "</b>\n";
    out += "  " + makeBar(v / 10) + "\n";
  } else {
    out += "  ⚠️ RIPE در دسترس نیست\n";
  }

  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "🔗 @radarinternetiran\n";
  out += "👑 @royal_trust_ir_official";

  return out;
      }
