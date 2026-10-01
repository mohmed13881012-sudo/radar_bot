const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const ADMIN_PASS = "mohmedkord1388";
const BOT_USERNAME = "Radarinternetiranbot";

const ASN_NAMES = {
  "12880": "زیرساخت (DCI)", "58224": "مخابرات ایران (TCI)", "6736": "شاتل قدیمی",
  "44244": "ایرانسل", "197207": "همراه اول (MCI)", "57218": "رایتل",
  "57497": "شاتل موبایل", "50810": "آسیاتک", "31549": "شاتل",
  "42337": "پارس‌آنلاین", "16322": "پارس‌پک", "43754": "آسیاتک",
  "48159": "پیشگامان", "25184": "افرانت", "56402": "صبانت",
  "205648": "رسپینا", "21478": "مبین‌نت", "206065": "پیشگامان",
  "48434": "پارس‌آنلاین", "51685": "پارس‌پک", "51074": "شاتل",
  "52140": "ایران‌سرور", "201150": "کیان‌نت", "61173": "میزبان",
  "201540": "خلیج فارس", "56703": "ندای رایانه", "205647": "ایران‌سرور",
  "48431": "ماهان", "203087": "سیستم‌های نوین", "39501": "ابر آروان",
  "202468": "ایران‌سرور", "204213": "همراه نت", "44208": "شبکه گستر",
  "49100": "ارتباطات زیرساخت", "208161": "ایرانسل جدید"
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
    const STATS = env.STATS;

    if (url.pathname === "/test") return new Response("Test OK");
    if (!BOT_TOKEN) return new Response("ERROR: BOT_TOKEN not set!", { status: 500 });
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

    if (url.pathname.startsWith("/api")) {
      return await handleAPI(url, STATS);
    }

    if (url.pathname === "/admin") {
      const pass = url.searchParams.get("pass");
      if (pass !== ADMIN_PASS) {
        return new Response("⛔ دسترسی غیرمجاز", { status: 401 });
      }
      const html = await makeAdminDashboard(STATS);
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

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
      await handleUpdate(update, TG, STATS);
    } catch(e) { console.log("Error: " + e.message); }
    return new Response("OK");
  },
  async scheduled(event, env, ctx) {
    const BOT_TOKEN = env.BOT_TOKEN;
    if (!BOT_TOKEN) return;
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;
    await sendChannelReport(TG);
    if (env.STATS) await saveDailySnapshot(env.STATS);
  }
};

// ==================== Helper Dates ====================
function getIranTime() {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
}
function getIranDate() {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function getGregDate() {
  const d = new Date();
  return d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0");
}
function getDateBoth() {
  return "📅 " + getIranDate() + "  •  🗓 " + getGregDate();
}
function getToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function getYesterday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 86400000));
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
    const until = getToday();
    const since = getYesterday();
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
    if (r.ok) return await r.json();
  } catch(e) {}
  return null;
}
async function fetchOONI7d() {
  try {
    const until = getToday();
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
  return { blockPercent: totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0, totalMs, blockedMs, asnData, dayData };
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
      if (k === "inline_keyboard") body.reply_markup = { inline_keyboard: extra[k] };
      else body[k] = extra[k];
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

// ==================== KV Stats ====================
async function saveDailySnapshot(STATS) {
  try {
    const ooni = await fetchOONI();
    const p = parseOONI(ooni);
    const today = getToday();
    await STATS.put("snap:" + today, JSON.stringify({
      blockPercent: p.blockPercent,
      totalMs: p.totalMs,
      saved: new Date().toISOString()
    }), { expirationTtl: 2592000 });
  } catch(e) {}
}

async function getDailySnapshot(STATS, date) {
  try {
    const d = await STATS.get("snap:" + date);
    return d ? JSON.parse(d) : null;
  } catch(e) { return null; }
}

async function addPoints(STATS, userId, points) {
  if (!STATS) return;
  try {
    const key = "points:" + userId;
    const cur = parseInt(await STATS.get(key) || "0");
    await STATS.put(key, String(cur + points));
    const name = await STATS.get("name:" + userId) || ("کاربر " + userId.slice(-4));
    const lb = await STATS.get("leaderboard");
    let list = lb ? JSON.parse(lb) : [];
    const found = list.find(x => x.id === userId);
    if (found) { found.p = cur + points; found.n = name; }
    else list.push({ id: userId, p: cur + points, n: name });
    list.sort((a, b) => b.p - a.p);
    list = list.slice(0, 50);
    await STATS.put("leaderboard", JSON.stringify(list));
  } catch(e) {}
}

async function getPoints(STATS, userId) {
  if (!STATS) return 0;
  try {
    return parseInt(await STATS.get("points:" + userId) || "0");
  } catch(e) { return 0; }
}

async function trackUser(STATS, userId, userName) {
  if (!STATS) return;
  try {
    const today = getToday();
    const userKey = "u:" + userId;
    const exists = await STATS.get(userKey);
    if (!exists) {
      await STATS.put(userKey, today);
      const total = parseInt(await STATS.get("total_users") || "0");
      await STATS.put("total_users", String(total + 1));
    }
    if (userName) await STATS.put("name:" + userId, userName);
    const dkey = "dau:" + today;
    const dauRaw = await STATS.get(dkey);
    let dau = dauRaw ? JSON.parse(dauRaw) : [];
    if (!dau.includes(userId)) {
      dau.push(userId);
      await STATS.put(dkey, JSON.stringify(dau), { expirationTtl: 172800 });
    }
  } catch(e) {}
}

async function getReferrer(STATS, userId) {
  if (!STATS) return null;
  try {
    const r = await STATS.get("ref:" + userId);
    return r || null;
  } catch(e) { return null; }
}

// ==================== Handle Update ====================
async function handleUpdate(update, TG, STATS) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = String(msg.from.id);
  const userName = msg.from.first_name || msg.from.username || ("کاربر " + userId.slice(-4));

  if (STATS) await STATS.put("name:" + userId, userName);

  // ====== دستور /admin ======
  if (text === "/admin") {
    await sendMessage(TG, chatId,
      "╭━━━ 🔐 ورود به پنل ━━━╮\n\n" +
      "  🔑 لطفاً رمز ادمین رو بفرست:\n\n" +
      "  ⚠️ <i>دسترسی فقط برای مدیر</i>\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" });
    return;
  }

  // ====== چک رمز ادمین ======
  if (text === ADMIN_PASS) {
    const dash = "https://radar-bot.royal-trust-ir-official.workers.dev/admin?pass=" + ADMIN_PASS;
    await sendMessage(TG, chatId,
      "╭━━━ 🔐 داشبورد ادمین ━━━╮\n\n" +
      "  ✅ رمز صحیح!\n\n" +
      "  🔗 <a href='" + dash + "'>ورود به داشبورد</a>\n\n" +
      "  <i>لینک رو در مرورگر باز کن</i>\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" });
    return;
  }

  // ====== عضویت اجباری ======
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

  await trackUser(STATS, userId, userName);

  if (text.startsWith("/start ref_")) {
    const refCode = text.replace("/start ref_", "").trim();
    if (refCode && refCode !== userId && STATS) {
      const already = await getReferrer(STATS, userId);
      if (!already) {
        await STATS.put("ref:" + userId, refCode);
        await addPoints(STATS, refCode, 10);
        await addPoints(STATS, userId, 5);
        await sendMessage(TG, chatId,
          "🎉 <b>خوش آمدی " + userName + "!</b>\n\n" +
          "✅ ۵ امتیاز به خاطر دعوت گرفتی!\n" +
          "🎁 دعات هم ۱۰ امتیاز گرفت.",
          { parse_mode: "HTML" });
      }
    }
  }

  if (text === "/start" || text.startsWith("/start ")) {
    await addPoints(STATS, userId, 1);
    const pts = await getPoints(STATS, userId);
    await sendMessage(TG, chatId,
      "╭━━━ 👋 خوش آمدید ━━━╮\n\n" +
      "  سلام <b>" + userName + "</b> عزیز!\n\n" +
      "  🏆 امتیاز شما: <b>" + pts + "</b>\n\n" +
      "┣━━━ 📊 گزارش‌ها\n" +
      "  /status → کامل\n" +
      "  /work → یک‌خطی\n" +
      "  /score → امتیاز کیفیت\n" +
      "  /vs → مقایسه با دیروز\n\n" +
      "┣━━━ 🆚 مقایسه\n" +
      "  /compare → مقایسه اپراتورها\n" +
      "  /top → رتبه‌بندی اپراتورها\n" +
      "  /isp → چک ISP\n" +
      "  /world → مقایسه جهانی\n\n" +
      "┣━━━ 📈 نمودار\n" +
      "  /today → امروز\n" +
      "  /history → تاریخچه\n" +
      "  /trend → ۷ روز\n" +
      "  /chart → میله‌ای\n" +
      "  /pie → دایره‌ای\n" +
      "  /map → نقشه حرارتی\n\n" +
      "┣━━━ 🎮 گیمیفیکیشن\n" +
      "  /myrank → رتبه من\n" +
      "  /leaderboard → جدول برترین‌ها\n" +
      "  /invite → دعوت دوستان\n\n" +
      "┣━━━ ⚡ تست سرعت\n" +
      "  /speed → راهنما\n" +
      "  /best → بهترین زمان\n\n" +
      "┣━━━ 🔌 API عمومی\n" +
      "  /api → لیست APIها\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" });
  } else if (text === "/myrank") {
    const pts = await getPoints(STATS, userId);
    const lbRaw = await STATS.get("leaderboard");
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    const rank = lb.findIndex(x => x.id === userId) + 1;
    await sendMessage(TG, chatId,
      "╭━━━ 🎖️ رتبه شما ━━━╮\n\n" +
      "  👤 <b>" + userName + "</b>\n" +
      "  🏆 امتیاز: <b>" + pts + "</b>\n" +
      "  📊 رتبه: <b>#" + (rank || "?") + "</b>\n" +
      "  👥 از " + lb.length + " کاربر\n\n" +
      "┣━━━ 💡 چطور امتیاز بگیرم؟\n\n" +
      "  • هر دستور: +1 امتیاز\n" +
      "  • دعوت دوست: +10 امتیاز\n" +
      "  • دعوت شدن: +5 امتیاز\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" });
  } else if (text === "/leaderboard") {
    const lbRaw = await STATS.get("leaderboard");
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    let out = "╭━━━ 🏆 جدول برترین‌ها ━━━╮\n\n" + getDateBoth() + "\n\n";
    if (lb.length === 0) {
      out += "  هنوز کسی امتیاز نگرفته!\n\n  اولین نفر باش! 🚀\n\n";
    } else {
      lb.slice(0, 10).forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
        const name = u.n || u.id;
        out += "  " + medal + " <b>" + name + "</b>  →  " + u.p + "\n";
      });
    }
    out += "\n╰━━━━━━━━━━━━━━━━━━━╯";
    await sendMessage(TG, chatId, out, { parse_mode: "HTML" });
  } else if (text === "/invite") {
    const link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + userId;
    const pts = await getPoints(STATS, userId);
    await sendMessage(TG, chatId,
      "╭━━━ 🎁 دعوت دوستان ━━━╮\n\n" +
      "  👤 <b>" + userName + "</b>\n" +
      "  🏆 امتیاز شما: <b>" + pts + "</b>\n\n" +
      "┣━━━ 🔗 لینک اختصاصی\n\n" +
      "  <code>" + link + "</code>\n\n" +
      "┣━━━ 💰 جایزه\n\n" +
      "  • شما: <b>+۱۰</b> امتیاز\n" +
      "  • دوستت: <b>+۵</b> امتیاز\n\n" +
      "  هرچی بیشتر دعوت کنی،\n  رتبه‌ات بالاتر می‌ره! 🏆\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" });
  } else if (text === "/vs") {
    await sendMessage(TG, chatId, "📊 در حال مقایسه...");
    const report = await makeVsReport(STATS);
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/map") {
    await sendMessage(TG, chatId, "🗺 در حال ساخت نقشه...");
    const c = await makeMapChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/api") {
    const base = "https://radar-bot.royal-trust-ir-official.workers.dev/api";
    await sendMessage(TG, chatId,
      "╭━━━ 🔌 API عمومی ━━━╮\n\n" +
      "  📊 داده‌های رادار به JSON\n\n" +
      "┣━━━ 🔗 Endpoints\n\n" +
      "  <code>" + base + "/status</code>\n" +
      "  وضعیت کلی اینترنت\n\n" +
      "  <code>" + base + "/operators</code>\n" +
      "  لیست اپراتورها\n\n" +
      "  <code>" + base + "/top</code>\n" +
      "  رتبه‌بندی هفتگی\n\n" +
      "  <code>" + base + "/history</code>\n" +
      "  تاریخچه ۷ روز\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" });
  } else if (text === "/status" || text === "/status full") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "⏳ در حال دریافت...");
    const report = await makeReport("full");
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/status simple" || text === "/work") {
    await addPoints(STATS, userId, 1);
    const report = await makeWorkReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/score") {
    await addPoints(STATS, userId, 1);
    const report = await makeScoreReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/compare") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🆚 در حال مقایسه...");
    const report = await makeCompareReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/top") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🏆 در حال رتبه‌بندی...");
    const report = await makeTopReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/isp") {
    await sendMessage(TG, chatId,
      "🔍 <b>چک ISP خاص</b>\n\n" +
      "مثال:\n<code>/isp ایرانسل</code>\n<code>/isp مخابرات</code>\n<code>/isp شاتل</code>",
      { parse_mode: "HTML" });
  } else if (text.startsWith("/isp ")) {
    await addPoints(STATS, userId, 1);
    const q = text.replace("/isp ", "").trim();
    await sendMessage(TG, chatId, "🔍 در حال جستجو...");
    const report = await makeISPReport(q);
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/world") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🌍 در حال دریافت...");
    const report = await makeWorldReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/today") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📅 در حال ساخت...");
    const c = await makeTodayChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/history") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📅 در حال ساخت...");
    const c = await makeHistoryChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/best") {
    await addPoints(STATS, userId, 1);
    const report = await makeBestTimeReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/speed") {
    await addPoints(STATS, userId, 1);
    const report = await makeSpeedReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/ping") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "⏳ در حال پینگ...");
    const report = await makePingReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/filtering") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "⏳ در حال بررسی...");
    const report = await makeFilteringReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/sites") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "⏳ در حال بررسی...");
    const report = await makeSitesReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/chart") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📊 در حال ساخت نمودار...");
    const c = await makeBarChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/pie") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🥧 در حال ساخت نمودار...");
    const c = await makePieChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/trend") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📈 در حال ساخت نمودار...");
    const c = await makeTrendChart();
    await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/help") {
    await sendMessage(TG, chatId,
      "╭━━━ 📚 راهنما ━━━╮\n\n" +
      "┣━━━ 📊 گزارش\n" +
      "  /status، /work، /score، /vs\n\n" +
      "┣━━━ 🆚 مقایسه\n" +
      "  /compare، /top، /isp، /world\n\n" +
      "┣━━━ 📈 نمودار\n" +
      "  /today، /history، /trend\n" +
      "  /chart، /pie، /map\n\n" +
      "┣━━━ 🎮 گیمیفیکیشن\n" +
      "  /myrank، /leaderboard، /invite\n\n" +
      "┣━━━ 🔌 API\n" +
      "  /api\n\n" +
      "┣━━━ ⚡ تست\n" +
      "  /speed، /best، /ping\n\n" +
      "╰━━━━━━━━━━━━━━━━━━━╯",
      { parse_mode: "HTML" });
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

// ==================== API عمومی ====================
async function handleAPI(url, STATS) {
  const cors = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  };
  
  try {
    if (url.pathname === "/api/status") {
      const ooni = await fetchOONI();
      const p = parseOONI(ooni);
      const ripe = await fetchRIPE();
      return new Response(JSON.stringify({
        ok: true,
        data: {
          block_percent: p.blockPercent,
          total_measurements: p.totalMs,
          ripe_visibility: ripe && ripe.data ? ripe.data.visibility : null,
          date_iran: getIranDate(),
          date_greg: getGregDate(),
          time_iran: getIranTime(),
          source: "OONI + RIPE"
        }
      }, null, 2), { headers: cors });
    }
    
    if (url.pathname === "/api/operators") {
      const ooni = await fetchOONI();
      const p = parseOONI(ooni);
      const ops = [];
      for (const [asn, d] of Object.entries(p.asnData)) {
        ops.push({
          asn: "AS" + asn,
          name: asnName(asn),
          free_percent: Math.round((d.ok / d.total) * 100),
          tests: d.count
        });
      }
      ops.sort((a, b) => b.tests - a.tests);
      return new Response(JSON.stringify({ ok: true, count: ops.length, data: ops.slice(0, 20) }, null, 2), { headers: cors });
    }
    
    if (url.pathname === "/api/top") {
      const ooni = await fetchOONI7d();
      const p = parseOONI(ooni);
      const ops = [];
      for (const [asn, d] of Object.entries(p.asnData)) {
        if (d.count >= 500) {
          ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), tests: d.count });
        }
      }
      ops.sort((a, b) => b.rate - a.rate);
      return new Response(JSON.stringify({
        ok: true,
        period: "7 days",
        best: ops.slice(0, 5),
        worst: ops.slice(-5).reverse()
      }, null, 2), { headers: cors });
    }
    
    if (url.pathname === "/api/history") {
      const ooni = await fetchOONI7d();
      const p = parseOONI(ooni);
      const days = Object.keys(p.dayData).sort();
      const data = days.map(d => ({
        date: d,
        block_percent: p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0,
        total: p.dayData[d].total
      }));
      return new Response(JSON.stringify({ ok: true, data }, null, 2), { headers: cors });
    }
    
    if (url.pathname === "/api" || url.pathname === "/api/") {
      return new Response(JSON.stringify({
        ok: true,
        name: "Radar Internet Public API",
        version: "1.0",
        endpoints: {
          status: "/api/status",
          operators: "/api/operators",
          top: "/api/top",
          history: "/api/history"
        },
        source: "OONI, RIPE",
        free: true
      }, null, 2), { headers: cors });
    }
    
    return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: cors });
  } catch(e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: cors });
  }
}

// ==================== Admin Dashboard ====================
async function makeAdminDashboard(STATS) {
  if (!STATS) return "<h1 style='color:#fff;font-family:Tahoma;padding:40px'>⚠️ KV not connected</h1>";
  const today = getToday();
  const totalUsers = await STATS.get("total_users") || "0";
  const dauRaw = await STATS.get("dau:" + today);
  const dau = dauRaw ? JSON.parse(dauRaw) : [];
  const lbRaw = await STATS.get("leaderboard");
  const lb = lbRaw ? JSON.parse(lbRaw) : [];
  
  let lbHtml = "";
  lb.slice(0, 10).forEach((u, i) => {
    const name = u.n || u.id;
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i+1);
    lbHtml += "<tr><td>" + medal + "</td><td><b>" + name + "</b></td><td>" + u.p + "</td></tr>";
  });
  
  return "<!DOCTYPE html><html lang='fa' dir='rtl'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>داشبورد رادار</title>" +
    "<style>body{font-family:Tahoma;background:#0a1128;color:#fff;padding:20px;margin:0}h1{color:#d4af37;text-align:center;margin-bottom:20px}" +
    ".card{background:rgba(255,255,255,0.05);border-radius:15px;padding:20px;margin:15px 0;border:1px solid rgba(212,175,55,0.3)}" +
    ".stat{display:inline-block;margin:10px 20px;text-align:center}.stat-v{font-size:36px;color:#d4af37;font-weight:bold}" +
    ".stat-l{color:#8899bb;font-size:13px;margin-top:5px}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1)}" +
    "th{color:#d4af37;font-size:14px}code{background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:12px}" +
    ".date{color:#8899bb;font-size:14px;text-align:center;margin-bottom:20px}a{color:#d4af37;text-decoration:none}" +
    ".head{color:#d4af37;border-bottom:2px solid #d4af37;padding-bottom:10px;margin-bottom:15px;display:inline-block}</style></head><body>" +
    "<h1>🔐 داشبورد ادمین رادار اینترنت</h1>" +
    "<div class='date'>" + getIranDate() + "  •  " + getGregDate() + "  •  " + getIranTime() + "</div>" +
    "<div class='card'><div class='head'>📊 آمار کلی</div>" +
    "<div class='stat'><div class='stat-v'>" + totalUsers + "</div><div class='stat-l'>👥 کاربر کل</div></div>" +
    "<div class='stat'><div class='stat-v'>" + dau.length + "</div><div class='stat-l'>✅ فعال امروز</div></div>" +
    "<div class='stat'><div class='stat-v'>" + lb.length + "</div><div class='stat-l'>🏆 در جدول</div></div>" +
    "</div>" +
    "<div class='card'><div class='head'>🏆 جدول برترین‌ها</div><table><tr><th>#</th><th>نام</th><th>امتیاز</th></tr>" + lbHtml + "</table></div>" +
    "<div class='card'><div class='head'>🔌 API عمومی</div><p><a href='/api'>/api</a> — لیست endpoints</p><p><a href='/api/status'>/api/status</a> — وضعیت لحظه‌ای</p></div>" +
    "<div class='card'><div class='head'>📅 تاریخ</div><p>" + getDateBoth() + "</p></div>" +
    "</body></html>";
}

// ==================== Charts ====================
async function makeBarChart() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
  ops.sort((a,b) => b.count - a.count);
  ops = ops.slice(0, 8);
  return {
    url: quickChart({
      type: "horizontalBar",
      data: { labels: ops.map(o => o.name), datasets: [{ label: "دسترسی آزاد %", data: ops.map(o => o.rate), backgroundColor: ops.map(o => o.rate >= 80 ? "#22c55e" : o.rate >= 60 ? "#eab308" : o.rate >= 40 ? "#f97316" : "#ef4444") }] },
      options: { title: { display: true, text: "دسترسی آزاد اپراتورها", fontSize: 18 }, legend: { display: false }, scales: { xAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
    }),
    caption: "📊 <b>دسترسی اپراتورها</b>\n\n" + getDateBoth() + "\n\nسطح فیلترینگ: <b>%" + p.blockPercent + "</b>"
  };
}

async function makePieChart() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) ops.push({ name: asnName(asn), count: d.count });
  ops.sort((a,b) => b.count - a.count);
  ops = ops.slice(0, 6);
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#f97316"];
  return {
    url: quickChart({ type: "pie", data: { labels: ops.map(o => o.name), datasets: [{ data: ops.map(o => o.count), backgroundColor: colors }] }, options: { title: { display: true, text: "سهم اپراتورها", fontSize: 18 } } }),
    caption: "🥧 <b>سهم اپراتورها</b>\n\n" + getDateBoth() + "\n\nاز <b>" + p.totalMs.toLocaleString("fa-IR") + "</b> اندازه‌گیری"
  };
}

async function makeTrendChart() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [], values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5));
    values.push(blocked);
  }
  return {
    url: quickChart({
      type: "line",
      data: { labels: labels, datasets: [{ label: "درصد مسدودسازی", data: values, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] },
      options: { title: { display: true, text: "روند فیلترینگ ۷ روز", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
    }),
    caption: "📈 <b>روند فیلترینگ ۷ روز</b>\n\n" + getDateBoth() + "\n\n🔺 بالاترین: <b>%" + Math.max(...values) + "</b>\n🔻 پایین‌ترین: <b>%" + Math.min(...values) + "</b>"
  };
}

async function makeHistoryChart() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [], values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5));
    values.push(blocked);
  }
  const avg = values.length > 0 ? Math.round(values.reduce((a,b) => a+b, 0) / values.length) : 0;
  return {
    url: quickChart({
      type: "line",
      data: { labels: labels, datasets: [{ label: "مسدودسازی %", data: values, borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] },
      options: { title: { display: true, text: "تاریخچه ۷ روز اخیر", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
    }),
    caption: "📅 <b>تاریخچه</b>\n\n" + getDateBoth() + "\n\nمیانگین: <b>%" + avg + "</b>"
  };
}

async function makeTodayChart() {
  const hours = [], pings = [];
  const currentHour = getIranHour();
  for (let h = 0; h < 24; h++) {
    hours.push(h + ":00");
    let base = 50;
    if (h >= 2 && h <= 7) base = 75;
    else if (h >= 8 && h <= 12) base = 45;
    else if (h >= 13 && h <= 17) base = 40;
    else if (h >= 18 && h <= 22) base = 35;
    else base = 55;
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
      data: { labels: hours, datasets: [{ label: "کیفیت تخمینی", data: pings, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] },
      options: { title: { display: true, text: "کیفیت اینترنت در ۲۴ ساعت", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
    }),
    caption: "📅 <b>نمودار امروز</b>\n\n" + getDateBoth() + "\n\n⏰ ساعت: <b>" + currentHour + ":00</b>\n📊 کیفیت: <b>%" + pings[currentHour] + "</b>"
  };
}

async function makeMapChart() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  const bp = p.blockPercent;
  let color = "#ef4444";
  if (bp < 20) color = "#22c55e";
  else if (bp < 35) color = "#eab308";
  else if (bp < 50) color = "#f97316";
  
  const chartUrl = quickChart({
    type: "doughnut",
    data: {
      labels: ["فیلترینگ", "دسترسی آزاد"],
      datasets: [{
        data: [bp, 100 - bp],
        backgroundColor: [color, "#22c55e"]
      }]
    },
    options: {
      title: { display: true, text: "نقشه حرارتی فیلترینگ ایران", fontSize: 20, fontColor: "#d4af37" },
      legend: { labels: { fontColor: "#fff" } }
    }
  });
  
  return {
    url: chartUrl,
    caption: "🗺 <b>نقشه حرارتی فیلترینگ ایران</b>\n\n" + getDateBoth() + "\n\n🚫 مسدودسازی: <b>%" + bp + "</b>\n📊 تعداد ASN: <b>" + Object.keys(p.asnData).length + "</b>\n📈 اندازه‌گیری: <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>"
  };
}

// ==================== Reports ====================
async function makePingReport() {
  let irList = "", globalList = "";
  let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { irList += "  ❌ " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { globalList += "  ❌ " + s.name + "\n"; }
  }
  return "╭━━━ 🌐 پینگ سایت‌ها ━━━╮\n\n" + getDateBoth() + "\n\n" +
    "┣━━━ 🇮🇷 <b>ایرانی</b>  <b>" + irOk + "/" + IR_SITES.length + "</b>\n\n" + irList + "\n" +
    "┣━━━ 🌍 <b>جهانی</b>  <b>" + globalOk + "/" + GLOBAL_SITES.length + "</b>\n\n" + globalList + "\n" +
    "╰━━━━━━━━━━━━━━━━━━━╯\n\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
}

async function makeFilteringReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
  ops.sort((a,b) => b.count - a.count);

  let level = "🟢 پایین";
  if (p.blockPercent >= 60) level = "🔴 بالا";
  else if (p.blockPercent >= 40) level = "🟠 نسبتاً بالا";
  else if (p.blockPercent >= 20) level = "🟡 متوسط";

  let out = "╭━━━ 🚫 فیلترینگ ایران ━━━╮\n\n" + getDateBoth() + "\n\n";
  out += "  📊 مسدودسازی: <b>%" + p.blockPercent + "</b>\n";
  out += "  📈 سطح: " + level + "\n  " + makeBar(p.blockPercent / 10) + "\n\n";
  out += "  📡 اندازه‌گیری: <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n";
  out += "  🌐 تعداد ASN: <code>" + ops.length + "</code>\n\n";

  if (ops.length > 0) {
    out += "┣━━━ 📡 <b>وضعیت اپراتورها</b>\n\n";
    ops.slice(0, 12).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += "  " + e + " <b>" + o.name + "</b>\n     └ %" + o.rate + " آزاد  •  " + o.count.toLocaleString("fa-IR") + " تست\n";
    });
  }
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n📌 منبع: OONI\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}

async function makeSitesReport() {
  let out = "╭━━━ 🌐 وضعیت سرویس‌ها ━━━╮\n\n" + getDateBoth() + "\n\n";
  let acc = 0, list = "";
  for (const s of FILTER_CHECK) {
    const ok = await checkAccessible(s.url);
    if (ok) { acc++; list += "  ✅ " + s.name + "\n"; }
    else { list += "  🚫 " + s.name + "\n"; }
  }
  out += "┣━━━ 📊 نتیجه\n\n  دسترسی: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n  " + makeBar((acc/FILTER_CHECK.length) * 10) + "\n\n";
  out += "┣━━━ 📋 جزئیات\n\n" + list;
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}

async function makeCompareReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 100) ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);

  let out = "╭━━━ 🆚 مقایسه اپراتورها ━━━╮\n\n" + getDateBoth() + "\n\n";
  out += "┣━━━ 🏆 <b>بهترین‌ها</b>\n\n";
  ops.slice(0, 5).forEach((o, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
    out += "  " + medal + " <b>" + o.name + "</b>\n     └ %" + o.rate + " آزاد\n";
  });
  out += "\n┣━━━ 🔻 <b>ضعیف‌ترین‌ها</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "  🔴 <b>" + o.name + "</b>\n     └ %" + o.rate + " آزاد\n";
  });
  out += "\n┣━━━ 📊 خلاصه\n\n  📡 تعداد: <b>" + ops.length + "</b>\n";
  const avg = Math.round(ops.reduce((a, b) => a + b.rate, 0) / ops.length);
  out += "  📈 میانگین: <b>%" + avg + "</b>\n  " + makeBar(avg / 10) + "\n";
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}

async function makeTopReport() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 500) ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);

  let out = "╭━━━ 🏆 رتبه‌بندی هفتگی ━━━╮\n\n📅 ۷ روز اخیر  •  " + getGregDate() + "\n\n";
  out += "┣━━━ 🥇 <b>بهترین‌ها</b>\n\n";
  ops.slice(0, 7).forEach((o, i) => {
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    out += "  " + rank + " <b>" + o.name + "</b>  %" + o.rate + "\n";
  });
  out += "\n┣━━━ 🔻 <b>پایین‌ترین‌ها</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "  🔴 <b>" + o.name + "</b>  %" + o.rate + "\n";
  });
  out += "\n┣━━━ 📊 خلاصه\n\n  📡 تعداد: <b>" + ops.length + "</b>\n";
  out += "  🥇 بهترین: <b>%" + ops[0].rate + "</b>\n  🔻 بدترین: <b>%" + ops[ops.length-1].rate + "</b>\n";
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n📌 OONI\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}

async function makeISPReport(query) {
  const q = query.toLowerCase();
  const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
  let asn = null;
  for (const [name, code] of Object.entries(ISP_MAP)) {
    if (q.includes(name) || name.includes(q)) { asn = code; break; }
  }
  if (!asn) return "❌ ISP پیدا نشد: <b>" + query + "</b>";
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  const d = p.asnData[asn];
  if (!d) return "❌ داده‌ای برای <b>" + asnName(asn) + "</b> یافت نشد.";
  const rate = Math.round((d.ok / d.total) * 100);
  let emoji = "🔴", status = "ضعیف";
  if (rate >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (rate >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  
  let out = "╭━━━ 📡 " + asnName(asn) + " ━━━╮\n\n" + getDateBoth() + "\n\n";
  out += "  " + emoji + "  <b>" + status + "</b>\n\n";
  out += "┣━━━ 📊 آمار امروز\n\n";
  out += "  🔓 دسترسی آزاد: <b>%" + rate + "</b>\n  " + makeBar(rate / 10) + "\n\n";
  out += "  📈 تعداد تست: <code>" + d.count.toLocaleString("fa-IR") + "</code>\n";
  out += "  🔒 مسدود: %" + (100 - rate) + "\n\n";
  out += "╰━━━━━━━━━━━━━━━━━━━╯\n\n📌 OONI\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}

async function makeWorldReport() {
  const COUNTRIES = [
    { code: "IR", name: "🇮🇷 ایران" }, { code: "TR", name: "🇹🇷 ترکیه" },
    { code: "IQ", name: "🇮🇶 عراق" }, { code: "AE", name: "🇦🇪 امارات" }, { code: "SA", name: "🇸🇦 عربستان" }
  ];
  let out = "╭━━━ 🌍 مقایسه جهانی ━━━╮\n\n" + getDateBoth() + "\n\n";
  let results = [];
  for (const c of COUNTRIES) {
    try {
      const since = getYesterday();
      const until = getToday();
      const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=" + c.code + "&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
      if (r.ok) {
        const d = await r.json();
        let total = 0, blocked = 0;
        if (d.result) for (const row of d.result) { total += row.measurement_count || 0; blocked += (row.anomaly_count || 0) + (row.confirmed_count || 0); }
        const percent = total > 0 ? Math.round((blocked / total) * 100) : 0;
        results.push({ name: c.name, percent, count: total });
      }
    } catch(e) {}
  }
  if (results.length === 0) return "❌ داده کافی نیست.";
  results.sort((a, b) => a.percent - b.percent);
  out += "┣━━━ 🏆 رتبه‌بندی\n\n";
  results.forEach((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    const e = r.percent < 15 ? "🟢" : r.percent < 30 ? "🟡" : r.percent < 50 ? "🟠" : "🔴";
    out += "  " + medal + " " + r.name + "\n     " + e + " %" + r.percent + " مسدود\n";
  });
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n📌 OONI\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}

async function makeVsReport(STATS) {
  const yesterday = getYesterday();
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  
  let ySnap = await getDailySnapshot(STATS, yesterday);
  let yPercent = ySnap ? ySnap.blockPercent : null;
  
  let out = "╭━━━ 📊 مقایسه روز ━━━╮\n\n";
  out += "📅 " + getIranDate() + "  •  " + getGregDate() + "\n\n";
  out += "┣━━━ 🗓 دیروز vs امروز\n\n";
  
  if (yPercent !== null) {
    out += "  دیروز: <b>%" + yPercent + "</b>\n";
    out += "  امروز: <b>%" + p.blockPercent + "</b>\n\n";
    const diff = p.blockPercent - yPercent;
    let trend = "➖ ثابت";
    if (diff > 3) trend = "📈 بدتر (" + diff + "+)";
    else if (diff > 0) trend = "🔺 کمی بدتر (+" + diff + ")";
    else if (diff < -3) trend = "📉 بهتر (" + diff + ")";
    else if (diff < 0) trend = "🔻 کمی بهتر (" + diff + ")";
    out += "  " + trend + "\n";
  } else {
    out += "  امروز: <b>%" + p.blockPercent + "</b>\n";
    out += "  ⚠️ داده دیروز ثبت نشده\n";
  }
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🕒 " + getIranTime();
  return out;
}

async function makeWorkReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let irOk = 0;
  for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
  let emoji = "🟢", status = "خوبه";
  if (p.blockPercent >= 60) { emoji = "🔴"; status = "بحرانی"; }
  else if (p.blockPercent >= 40) { emoji = "🟠"; status = "ناپایدار"; }
  else if (p.blockPercent >= 20) { emoji = "🟡"; status = "متوسط"; }
  return "╭━━━ ⚡ خلاصه ━━━╮\n\n" + getDateBoth() + "\n\n  " + emoji + "  <b>" + status + "</b>\n\n  🚫 فیلترینگ: <b>%" + p.blockPercent + "</b>\n  🌐 سایت‌های ایرانی: <b>" + irOk + "/" + IR_SITES.length + "</b>\n\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
}

async function makeScoreReport() {
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let score = 0;
  const filterScore = Math.max(0, 100 - (p.blockPercent * 2.5));
  score += filterScore * 0.4;
  let irOk = 0;
  for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
  const irScore = (irOk / IR_SITES.length) * 100;
  score += irScore * 0.3;
  let globalPing = 0, globalCount = 0;
  for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalPing += t; globalCount++; } }
  const avgPing = globalCount > 0 ? globalPing / globalCount : 500;
  const pingScore = Math.max(0, 100 - (avgPing / 5));
  score += pingScore * 0.3;
  score = Math.round(score);
  let emoji = "🔴", status = "بحرانی";
  if (score >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (score >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (score >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "╭━━━ 🎖️ امتیاز کیفیت ━━━╮\n\n" + getDateBoth() + "\n\n  " + emoji + "  <b>" + status + "</b>\n\n  ⭐ امتیاز: <b>" + score + "/100</b>\n  " + makeBar(score / 10) + "\n\n┣━━━ 📊 جزئیات\n\n  🚫 فیلترینگ: <b>%" + Math.round(filterScore) + "</b>\n  🇮🇷 سایت ایرانی: <b>%" + Math.round(irScore) + "</b>\n  🌍 پینگ جهانی: <b>%" + Math.round(pingScore) + "</b>\n\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
}

async function makeBestTimeReport() {
  const hours = [
    { range: "۰۲:۰۰ تا ۰۶:۰۰", quality: 90, emoji: "🏆", note: "بهترین زمان" },
    { range: "۰۶:۰۰ تا ۰۹:۰۰", quality: 75, emoji: "✅", note: "خوب" },
    { range: "۰۹:۰۰ تا ۱۲:۰۰", quality: 55, emoji: "🟡", note: "متوسط" },
    { range: "۱۲:۰۰ تا ۱۷:۰۰", quality: 45, emoji: "🟠", note: "شلوغ" },
    { range: "۱۷:۰۰ تا ۲۲:۰۰", quality: 35, emoji: "🔴", note: "پیک شلوغی" },
    { range: "۲۲:۰۰ تا ۰۲:۰۰", quality: 70, emoji: "✅", note: "بهتر" }
  ];
  let out = "╭━━━ ⏰ بهترین زمان ━━━╮\n\n" + getDateBoth() + "\n\n📊 برای دانلود و استریم\n\n┣━━━ 🏆 پیشنهاد\n\n  بهترین: <b>۲ بامداد تا ۶ صبح</b>\n  🟢 کیفیت: ۹۰٪\n\n┣━━━ 📊 جدول زمانی\n\n";
  for (const h of hours) {
    out += "  " + h.emoji + " " + h.range + "\n     └ " + h.note + "  •  %" + h.quality + "\n";
  }
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n💡 تخمینی بر اساس الگوی مصرف";
  return out;
}

async function makeSpeedReport() {
  let out = "╭━━━ ⚡ تست سرعت ━━━╮\n\n  📋 <b>راهنما:</b>\n\n  1️⃣ لینک تست رو باز کن\n  2️⃣ سرعتت رو اندازه بگیر\n  3️⃣ مقایسه کن\n\n┣━━━ 🔗 لینک‌ها\n\n";
  out += "  🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n";
  out += "  📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n";
  out += "  ⚡ <a href='https://fast.com/'>Fast.com</a>\n";
  out += "  🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>\n\n";
  out += "┣━━━ 💡 نکات\n\n  • وای‌فای رو قطع کن\n  • اپ‌های دیگه رو ببند\n  • ۳ بار تست کن\n\n";
  out += "╰━━━━━━━━━━━━━━━━━━━╯\n\n📡 @Radarinternetiran";
  return out;
}

async function makeReport(mode) {
  if (mode === undefined) mode = "full";
  const ooni = await fetchOONI();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) ops.push({ name: asnName(asn), rate: Math.round((d.ok / d.total) * 100) });
  ops.sort((a, b) => a.rate - b.rate);

  if (mode === "simple") {
    let emoji = "🟢", status = "پایدار";
    if (p.blockPercent >= 60) { emoji = "🔴"; status = "بحرانی"; }
    else if (p.blockPercent >= 40) { emoji = "🟠"; status = "ناپایدار"; }
    else if (p.blockPercent >= 20) { emoji = "🟡"; status = "متوسط"; }
    return "╭━━━ 📊 وضعیت اینترنت ━━━╮\n\n" + getDateBoth() + "\n\n  " + emoji + "  <b>" + status + "</b>\n\n  🚫 مسدودسازی: <b>%" + p.blockPercent + "</b>\n  " + makeBar(p.blockPercent / 10) + "\n\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  }

  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { irList += "  ❌ " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { globalList += "  ❌ " + s.name + "\n"; }
  }

  const ripe = await fetchRIPE();
  let mainEmoji = "🟢", mainStatus = "پایدار";
  if (p.blockPercent >= 60) { mainEmoji = "🔴"; mainStatus = "بحرانی"; }
  else if (p.blockPercent >= 40) { mainEmoji = "🟠"; mainStatus = "ناپایدار"; }
  else if (p.blockPercent >= 20) { mainEmoji = "🟡"; mainStatus = "متوسط"; }

  let out = "╭━━━ 📊 گزارش اینترنت ━━━╮\n\n  " + getDateBoth() + "\n  🕒 <b>" + getIranTime() + "</b>\n\n  " + mainEmoji + "  <b>" + mainStatus + "</b>\n\n";
  out += "┣━━━ 🌐 <b>دسترسی سایت‌ها</b>\n\n  🇮🇷 ایرانی: <b>" + irOk + "/" + IR_SITES.length + "</b>\n\n" + irList + "\n  🌍 جهانی: <b>" + globalOk + "/" + GLOBAL_SITES.length + "</b>\n\n" + globalList + "\n";
  out += "┣━━━ 🚫 <b>فیلترینگ</b>\n\n  📊 مسدودسازی: <b>%" + p.blockPercent + "</b>\n  " + makeBar(p.blockPercent / 10) + "\n\n  📈 اندازه‌گیری: <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n\n";
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
    out += "  " + vE + " Visibility: <b>%" + v + "</b>\n  " + makeBar(v / 10) + "\n";
  } else out += "  ⚠️ RIPE در دسترس نیست\n";
  out += "\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🔗 @radarinternetiran\n👑 @royal_trust_ir_official";
  return out;
    }
