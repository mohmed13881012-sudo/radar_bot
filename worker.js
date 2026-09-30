const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";

const ASN_NAMES = {
  "12880": "زیرساخت (DCI)", "58224": "مخابرات ایران (TCI)", "6736": "شاتل قدیمی",
  "44244": "ایرانسل", "197207": "همراه اول (MCI)", "57218": "رایتل",
  "57497": "شاتل موبایل", "50810": "آسیاتک",
  "31549": "شاتل", "42337": "پارس‌آنلاین", "16322": "پارس‌پک",
  "43754": "آسیاتک", "48159": "پیشگامان", "25184": "افرانت",
  "56402": "صبانت", "205648": "رسپینا", "21478": "مبین‌نت",
  "206065": "پیشگامان", "48434": "پارس‌آنلاین", "51685": "پارس‌پک",
  "51074": "شاتل", "52140": "ایران‌سرور", "201150": "کیان‌نت",
  "61173": "میزبان", "201540": "خلیج فارس", "56703": "ندای رایانه",
  "205647": "ایران‌سرور", "48431": "ماهان", "203087": "سیستم‌های نوین",
  "39501": "ابر آروان", "202468": "ایران‌سرور", "204213": "همراه نت",
  "44208": "شبکه گستر", "49100": "ارتباطات زیرساخت", "208161": "ایرانسل جدید",
  "48320": "شبکه نقره‌ای", "61167": "فناوران", "49666": "مهرگان",
  "210644": "داده گستر", "211260": "ماهان", "212097": "آسیاتک نوین",
  "213210": "زیتون", "51433": "های‌وب", "62442": "مهر",
  "197749": "بهسازان", "201610": "پاسارگاد", "202520": "ماد",
  "205172": "کنیا", "206779": "کامکار", "207796": "شبکه سازان",
  "208296": "پژواک", "209103": "افق", "209408": "سبز",
  "210787": "دیبا", "211120": "راهبر", "213891": "ایده آل",
  "25124": "فناوری اطلاعات", "29049": "داده پرداز", "43396": "نوین",
  "47257": "نسیم", "48827": "همراه", "49189": "پارس",
  "51430": "آرمان", "56688": "شبکه پرداز", "58090": "گسترش",
  "59397": "توسعه", "61197": "ایده", "62229": "فرهنگ",
  "197967": "پیشرو"
};

// نقشه کشورها برای مقایسه
const COUNTRIES = [
  { code: "IR", name: "🇮🇷 ایران" },
  { code: "TR", name: "🇹🇷 ترکیه" },
  { code: "IQ", name: "🇮🇶 عراق" },
  { code: "AE", name: "🇦🇪 امارات" },
  { code: "SA", name: "🇸🇦 عربستان" }
];

// ISPهای معروف برای جستجو
const ISP_MAP = {
  "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244",
  "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549",
  "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754",
  "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322",
  "پیشگامان": "48159", "صبانت": "56402", "sabanet": "56402"
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
function getIranHour() {
  return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false }).format(new Date()));
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
async function fetchOONI30d() {
  try {
    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - 2592000000).toISOString().split("T")[0];
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
    if (r.ok) return await r.json();
  } catch(e) {}
  return null;
}
async function fetchOONICountry(cc, days) {
  try {
    if (!days) days = 1;
    const until = new Date().toISOString().split("T")[0];
    const since = new Date(Date.now() - (days * 86400000)).toISOString().split("T")[0];
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=" + cc + "&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
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
      "┣━━━ 📊 گزارش‌ها\n" +
      "  /status → کامل\n" +
      "  /status simple → خلاصه\n" +
      "  /work → یک‌خطی\n" +
      "  /score → امتیاز کیفیت\n" +
      "  /ping → پینگ سایت‌ها\n" +
      "  /filtering → فیلترینگ\n" +
      "  /sites → سرویس‌ها\n\n" +
      "┣━━━ 🆚 مقایسه\n" +
      "  /compare → مقایسه اپراتورها\n" +
      "  /top → رتبه‌بندی هفتگی\n" +
      "  /isp → چک ISP خاص\n" +
      "  /world → مقایسه جهانی\n\n" +
      "┣━━━ 📈 نمودار\n" +
      "  /today → امروز\n" +
      "  /history → ۳۰ روز\n" +
      "  /trend → ۷ روز\n" +
      "  /chart → میله‌ای\n" +
      "  /pie → دایره‌ای\n\n" +
      "┣━━━ ⚡ تست سرعت\n" +
      "  /speed → راهنما + لینک\n" +
      "  /best → بهترین زمان\n\n" +
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
  } else if (text === "/work") {
    const report = await makeWorkReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/score") {
    const report = await makeScoreReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/compare") {
    await sendMessage(TG, chatId, "🆚 در حال مقایسه...");
    const report = await makeCompareReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/top") {
    await sendMessage(TG, chatId, "🏆 در حال رتبه‌بندی...");
    const report = await makeTopReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/isp") {
    await sendMessage(TG, chatId,
      "🔍 <b>چک ISP خاص</b>\n\n" +
      "مثال:\n" +
      "<code>/isp ایرانسل</code>\n" +
      "<code>/isp مخابرات</code>\n" +
      "<code>/isp شاتل</code>\n" +
      "<code>/isp پارس آنلاین</code>\n\n" +
      "ISPهای موجود:\nایرانسل، همراه اول، مخابرات، شاتل، پارس آنلاین، آسیاتک، رایتل، پارس پک، پیشگامان، صبانت",
      { parse_mode: "HTML" });
  } else if (text.startsWith("/isp ")) {
    const query = text.replace("/isp ", "").trim();
    await sendMessage(TG, chatId, "🔍 در حال جستجو...");
    const report = await makeISPReport(query);
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/world") {
    await sendMessage(TG, chatId, "🌍 در حال دریافت...");
    const report = await makeWorldReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/today") {
    await sendMessage(TG, chatId, "📅 در حال ساخت...");
    const c = await makeTodayChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/history") {
    await sendMessage(TG, chatId, "📅 در حال ساخت...");
    const c = await makeHistoryChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/best") {
    await sendMessage(TG, chatId, "⏰ در حال تحلیل...");
    const report = await makeBestTimeReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/speed") {
    const report = await makeSpeedReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
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
      "┣━━━ 📊 گزارش‌ها\n" +
      "  /status → کامل\n" +
      "  /status simple → خلاصه\n" +
      "  /work → یک‌خطی\n" +
      "  /score → امتیاز کیفیت\n" +
      "  /ping → پینگ\n" +
      "  /filtering → فیلترینگ\n" +
      "  /sites → سرویس‌ها\n\n" +
      "┣━━━ 🆚 مقایسه\n" +
      "  /compare → مقایسه اپراتورها\n" +
      "  /top → رتبه‌بندی هفتگی\n" +
      "  /isp X → چک ISP خاص\n" +
      "  /world → مقایسه جهانی\n\n" +
      "┣━━━ 📈 نمودار\n" +
      "  /today → امروز\n" +
      "  /history → ۳۰ روز\n" +
      "  /trend → ۷ روز\n" +
      "  /chart → میله‌ای\n" +
      "  /pie → دایره‌ای\n\n" +
      "┣━━━ ⚡ تست سرعت\n" +
      "  /speed → راهنما\n" +
      "  /best → بهترین زمان\n\n" +
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
        title: { display: true, text: "روند فیلترینگ ۷ روز اخیر", fontSize: 18 },
        scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] }
      }
    }),
    caption: "📈 <b>روند فیلترینگ ۷ روز اخیر</b>\n\n🔺 بالاترین: <b>%" + Math.max(...values) + "</b>\n🔻 پایین‌ترین: <b>%" + Math.min(...values) + "</b>"
  };
}

async function makeHistoryChart() {
  const ooni = await fetchOONI30d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [];
  let values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5));
    values.push(blocked);
  }
  const avg = values.length > 0 ? Math.round(values.reduce((a,b) => a+b, 0) / values.length) : 0;
  return {
    url: quickChart({
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "درصد مسدودسازی",
          data: values,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.15)",
          fill: true,
          tension: 0.3,
          borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: "روند فیلترینگ ۳۰ روز اخیر", fontSize: 18 },
        scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] }
      }
    }),
    caption: "📅 <b>تاریخچه ۳۰ روز اخیر</b>\n\n📊 میانگین: <b>%" + avg + "</b>\n🔺 بالاترین: <b>%" + Math.max(...values) + "</b>\n🔻 پایین‌ترین: <b>%" + Math.min(...values) + "</b>"
  };
}

async function makeTodayChart() {
  // نمودار کیفیت ۲۴ ساعت گذشته (شبیه‌سازی بر اساس پینگ فعلی)
  const hours = [];
  const pings = [];
  const currentHour = getIranHour();
  
  for (let h = 0; h < 24; h++) {
    hours.push(h + ":00");
    // پترن معمول: شب‌ها بهتر، ظهر بدتر
    let base = 50;
    if (h >= 2 && h <= 7) base = 75;
    else if (h >= 8 && h <= 12) base = 45;
    else if (h >= 13 && h <= 17) base = 40;
    else if (h >= 18 && h <= 22) base = 35;
    else base = 55;
    
    // اگه ساعت فعلیه، مقدار واقعی بذار
    if (h === currentHour) {
      const t1 = await pingSite("https://www.google.com");
      const t2 = await pingSite("https://digikala.com");
      const avg = ((t1 || 500) + (t2 || 500)) / 2;
      base = Math.max(10, Math.min(95, 100 - (avg / 5)));
    }
    
    pings.push(Math.round(base));
  }
  
  return {
    url: quickChart({
      type: "line",
      data: {
        labels: hours,
        datasets: [{
          label: "کیفیت تخمینی",
          data: pings,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.15)",
          fill: true,
          tension: 0.3,
          borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: "کیفیت اینترنت در ۲۴ ساعت", fontSize: 18 },
        scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] }
      }
    }),
    caption: "📅 <b>نمودار امروز</b>\n\n⏰ ساعت فعلی: <b>" + currentHour + ":00</b>\n📊 کیفیت فعلی: <b>%" + pings[currentHour] + "</b>"
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

async function makeISPReport(query) {
  const q = query.toLowerCase();
  let asn = null;
  for (const [name, code] of Object.entries(ISP_MAP)) {
    if (q.includes(name) || name.includes(q)) { asn = code; break; }
  }
  
  if (!asn) {
    return "❌ ISP پیدا نشد: <b>" + query + "</b>\n\n" +
      "ISPهای موجود:\nایرانسل، همراه اول، مخابرات، شاتل، پارس آنلاین، آسیاتک، رایتل، پارس پک، پیشگامان، صبانت";
  }
  
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  const d = p.asnData[asn];
  
  if (!d) {
    return "❌ داده‌ای برای <b>" + asnName(asn) + "</b> یافت نشد.\n\nممکنه این ISP امروز تست نداشته باشه.";
  }
  
  const rate = Math.round((d.ok / d.total) * 100);
  let emoji = "🟢", status = "خوب";
  if (rate >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (rate >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  else { emoji = "🔴"; status = "ضعیف"; }
  
  let out = "╭━━━ 📡 " + asnName(asn) + " ━━━╮\n\n";
  out += "  " + emoji + "  <b>" + status + "</b>\n\n";
  out += "┣━━━ 📊 آمار امروز\n\n";
  out += "  🔓 دسترسی آزاد: <b>%" + rate + "</b>\n";
  out += "  " + makeBar(rate / 10) + "\n\n";
  out += "  📈 تعداد تست: <code>" + d.count.toLocaleString("fa-IR") + "</code>\n";
  out += "  🔒 مسدود: %" + (100 - rate) + "\n\n";
  out += "╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "📌 منبع: OONI\n";
  out += "🕒 " + getIranTime() + "\n";
  out += "📡 @Radarinternetiran";
  return out;
}

async function makeWorldReport() {
  let out = "╭━━━ 🌍 مقایسه جهانی ━━━╮\n\n";
  out += "📊 بر اساس OONI\n\n";
  
  let results = [];
  for (const c of COUNTRIES) {
    try {
      const ooni = await fetchOONICountry(c.code, 1);
      if (ooni && ooni.result && Array.isArray(ooni.result)) {
        let total = 0, blocked = 0;
        for (const row of ooni.result) {
          total += row.measurement_count || 0;
          blocked += (row.anomaly_count || 0) + (row.confirmed_count || 0);
        }
        const percent = total > 0 ? Math.round((blocked / total) * 100) : 0;
        results.push({ name: c.name, percent: percent, count: total });
      }
    } catch(e) {}
  }
  
  if (results.length === 0) {
    return "❌ داده کافی نیست.";
  }
  
  results.sort((a, b) => a.percent - b.percent);
  
  out += "┣━━━ 🏆 رتبه‌بندی\n\n";
  results.forEach((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    const e = r.percent < 15 ? "🟢" : r.percent < 30 ? "🟡" : r.percent < 50 ? "🟠" : "🔴";
    out += "  " + medal + " " + r.name + "\n";
    out += "     " + e + " %" + r.percent + " مسدود\n";
  });
  
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "📌 منبع: OONI\n";
  out += "🕒 " + getIranTime() + "\n";
  out += "📡 @Radarinternetiran";
  return out;
}

async function makeWorkReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  
  let irOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) irOk++;
  }
  
  let emoji = "🟢", status = "خوبه";
  if (p.blockPercent >= 60) { emoji = "🔴"; status = "بحرانی"; }
  else if (p.blockPercent >= 40) { emoji = "🟠"; status = "ناپایدار"; }
  else if (p.blockPercent >= 20) { emoji = "🟡"; status = "متوسط"; }
  
  return "╭━━━ ⚡ خلاصه امروز ━━━╮\n\n" +
    "  " + emoji + "  <b>" + status + "</b>\n\n" +
    "  🚫 فیلترینگ: <b>%" + p.blockPercent + "</b>\n" +
    "  🌐 سایت‌های ایرانی: <b>" + irOk + "/" + IR_SITES.length + "</b>\n\n" +
    "╰━━━━━━━━━━━━━━━━━━━╯\n\n" +
    "🕒 " + getIranTime() + "\n" +
    "📡 @Radarinternetiran";
}

async function makeScoreReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  
  // امتیاز بر اساس چند معیار
  let score = 0;
  
  // ۱. فیلترینگ (۴۰٪)
  const filterScore = Math.max(0, 100 - (p.blockPercent * 2.5));
  score += filterScore * 0.4;
  
  // ۲. دسترسی سایت‌های ایرانی (۳۰٪)
  let irOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) irOk++;
  }
  const irScore = (irOk / IR_SITES.length) * 100;
  score += irScore * 0.3;
  
  // ۳. پینگ به سایت‌های جهانی (۳۰٪)
  let globalPing = 0, globalCount = 0;
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalPing += t; globalCount++; }
  }
  const avgPing = globalCount > 0 ? globalPing / globalCount : 500;
  const pingScore = Math.max(0, 100 - (avgPing / 5));
  score += pingScore * 0.3;
  
  score = Math.round(score);
  
  let emoji = "🔴", status = "بحرانی";
  if (score >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (score >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (score >= 40) { emoji = "🟠"; status = "متوسط"; }
  
  return "╭━━━ 🎖️ امتیاز کیفیت ━━━╮\n\n" +
    "  " + emoji + "  <b>" + status + "</b>\n\n" +
    "  ⭐ امتیاز کل: <b>" + score + "/100</b>\n" +
    "  " + makeBar(score / 10) + "\n\n" +
    "┣━━━ 📊 جزئیات\n\n" +
    "  🚫 فیلترینگ: <b>%" + Math.round(filterScore) + "</b>\n" +
    "  🇮🇷 سایت ایرانی: <b>%" + Math.round(irScore) + "</b>\n" +
    "  🌍 پینگ جهانی: <b>%" + Math.round(pingScore) + "</b>\n\n" +
    "╰━━━━━━━━━━━━━━━━━━━╯\n\n" +
    "🕒 " + getIranTime() + "\n" +
    "📡 @Radarinternetiran";
}

async function makeBestTimeReport() {
  // بر اساس الگوهای معمول اینترنت ایران
  const hours = [
    { range: "۰۲:۰۰ تا ۰۶:۰۰", quality: 90, emoji: "🏆", note: "بهترین زمان" },
    { range: "۰۶:۰۰ تا ۰۹:۰۰", quality: 75, emoji: "✅", note: "خوب" },
    { range: "۰۹:۰۰ تا ۱۲:۰۰", quality: 55, emoji: "🟡", note: "متوسط" },
    { range: "۱۲:۰۰ تا ۱۷:۰۰", quality: 45, emoji: "🟠", note: "شلوغ" },
    { range: "۱۷:۰۰ تا ۲۲:۰۰", quality: 35, emoji: "🔴", note: "پیک شلوغی" },
    { range: "۲۲:۰۰ تا ۰۲:۰۰", quality: 70, emoji: "✅", note: "بهتر" }
  ];
  
  let out = "╭━━━ ⏰ بهترین زمان ━━━╮\n\n";
  out += "📊 برای دانلود و استریم\n\n";
  out += "┣━━━ 🏆 پیشنهاد ما\n\n";
  out += "  بهترین زمان:\n";
  out += "  <b>۲ بامداد تا ۶ صبح</b>\n";
  out += "  🟢 کیفیت: ۹۰٪\n\n";
  out += "  چرا؟\n";
  out += "  • ترافیک کم\n";
  out += "  • سرورها آزادتر\n";
  out += "  • پینگ پایین‌تر\n\n";
  out += "┣━━━ 📊 جدول زمانی\n\n";
  for (const h of hours) {
    out += "  " + h.emoji + " " + h.range + "\n";
    out += "     └ " + h.note + "  •  %" + h.quality + "\n";
  }
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "💡 نکته: این ارقام تخمینی بر اساس الگوی مصرف ایرانه.";
  return out;
}

async function makeSpeedReport() {
  let out = "╭━━━ ⚡ تست سرعت ━━━╮\n\n";
  out += "  📋 <b>راهنمای تست:</b>\n\n";
  out += "  1️⃣ یکی از لینک‌های زیر رو باز کن\n";
  out += "  2️⃣ سرعتت رو اندازه بگیر\n";
  out += "  3️⃣ نتیجه رو با رفقا به اشتراک بذار\n\n";
  out += "┣━━━ 🔗 <b>لینک‌های تست</b>\n\n";
  out += "  🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n";
  out += "  📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n";
  out += "  ⚡ <a href='https://fast.com/'>Fast.com</a>\n";
  out += "  🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>\n\n";
  out += "┣━━━ 💡 <b>نکات مهم</b>\n\n";
  out += "  • وای‌فای رو قطع کن، با دیتا تست کن\n";
  out += "  • اپ‌های دیگه رو ببند\n";
  out += "  ۳ بار پشت سر هم تست کن\n\n";
  out += "╰━━━━━━━━━━━━━━━━━━━╯\n\n";
  out += "📡 @Radarinternetiran";
  return out;
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
