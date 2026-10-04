const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const CH3 = "@radarinternetirangruop";
const ADMIN_PASS = "mohmedkord1388";
const BOT_USERNAME = "Radarinternetiranbot";
const CURRENT_VERSION = "7.0";
const WEEKLY_PIN_MSG_KEY = "weekly_pin_msg_id";
const ALERT_THRESHOLD = 70;
const QUALITY_DROP_THRESHOLD = 30;

let GLOBAL_STATS = null;

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

const BADGES = {
  first_leader: { emoji: "🥇", name: "صدرنشین", desc: "یک بار اول جدول شدن" },
  streak_7: { emoji: "🔥", name: "شعله", desc: "۷ روز متوالی فعال" },
  streak_30: { emoji: "💎", name: "الماس", desc: "۳۰ روز متوالی فعال" },
  points_100: { emoji: "⭐", name: "ستاره", desc: "۱۰۰ امتیاز" },
  points_500: { emoji: "🌟", name: "ستاره درخشان", desc: "۵۰۰ امتیاز" },
  points_1000: { emoji: "💫", name: "کهکشان", desc: "۱۰۰۰ امتیاز" },
  inviter_5: { emoji: "🎁", name: "سخاوتمند", desc: "دعوت ۵ دوست" },
  inviter_10: { emoji: "👑", name: "پادشاه دعوت", desc: "دعوت ۱۰ دوست" },
  spin_lucky: { emoji: "🎰", name: "خوش‌شانس", desc: "بردن ۵۰ امتیاز در اسپین" },
  voter: { emoji: "🗳", name: "رأی‌دهنده", desc: "شرکت در نظرسنجی" }
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
    GLOBAL_STATS = STATS;

    if (url.pathname === "/test") return new Response("Test OK");
    if (!BOT_TOKEN) return new Response("ERROR: BOT_TOKEN not set!", { status: 500 });
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

    if (url.pathname.startsWith("/api")) return await handleAPI(url, STATS);

    if (url.pathname === "/admin") {
      const pass = url.searchParams.get("pass");
      if (pass !== ADMIN_PASS) return new Response("⛔ دسترسی غیرمجاز", { status: 401 });
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
      await sendChannelReport(TG, STATS);
      await sendOrUpdateChannelStatus(TG, STATS);
      if (STATS) { await saveDailySnapshot(STATS); await saveHourlySnapshot(STATS); }
      return new Response("Report sent!");
    }
    if (url.pathname === "/weeklypin") {
      await postWeeklyLeaderboard(TG, STATS);
      return new Response("Weekly pin posted!");
    }
    if (url.pathname === "/alert") {
      await checkAndAlertQuality(TG, STATS);
      return new Response("Alert check done!");
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
    GLOBAL_STATS = env.STATS;
    
    const now = new Date();
    const iranHour = getIranHour();
    // JS getDay: 0=Sun, 6=Sat. For Iran: Sat=0, Sun=1, ..., Fri=6
    const jsDay = now.getUTCDay();
    const iranDay = (jsDay + 1) % 7;
    
    // شنبه ساعت ۲۰ (ایران) - سنجاق جدول هفتگی
    if (iranDay === 0 && (iranHour === 20 || iranHour === 21)) {
      await postWeeklyLeaderboard(TG, env.STATS);
    }
    // یکشنبه ساعت ۱۰ - برداشتن سنجاق
    if (iranDay === 1 && iranHour === 10) {
      await unpinWeeklyLeaderboard(TG, env.STATS);
    }
    // هر ساعت - بررسی هشدار افت کیفیت
    await checkAndAlertQuality(TG, env.STATS);
    // هر ساعت - بررسی اشتراک ISP
    await checkISPSubscriptions(TG, env.STATS);
    
    await sendOrUpdateChannelStatus(TG, env.STATS);
    if (env.STATS) { await saveDailySnapshot(env.STATS); await saveHourlySnapshot(env.STATS); }
  }
};

// ==================== Helper Dates ====================
function getIranTime() { return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()); }
function getIranDate() { return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function getGregDate() { const d = new Date(); return d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0"); }
function getDateBoth() { return "📅 " + getIranDate() + "  •  🗓 " + getGregDate(); }
function getToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function getYesterday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 86400000)); }
function getIranHour() { return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false }).format(new Date())); }
function getWeekKey() {
  const now = new Date();
  const iranDay = (now.getUTCDay() + 1) % 7;
  const startOfWeek = new Date(now.getTime() - (iranDay * 86400000));
  return "week:" + new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(startOfWeek);
}
function asnName(asn) { const c = String(asn).replace(/^AS/i, ""); return ASN_NAMES[c] || ("AS" + c); }

async function asnNameAuto(asn) {
  const clean = String(asn).replace(/^AS/i, "");
  if (ASN_NAMES[clean]) return ASN_NAMES[clean];
  if (GLOBAL_STATS) { try { const cached = await GLOBAL_STATS.get("asnname:" + clean); if (cached) return cached; } catch(e) {} }
  try {
    const r = await fetch("https://api.bgpview.io/asn/" + clean);
    if (r.ok) {
      const d = await r.json();
      if (d.status === "ok" && d.data && d.data.name) {
        let name = d.data.name.trim();
        if (name.length > 22) name = name.substring(0, 22) + "…";
        if (name.length >= 2 && !/^\d+$/.test(name)) {
          if (GLOBAL_STATS) { try { await GLOBAL_STATS.put("asnname:" + clean, name, { expirationTtl: 2592000 }); } catch(e) {} }
          return name;
        }
      }
    }
  } catch(e) {}
  return "AS" + clean;
}

function makeBar(v) {
  const f = Math.max(0, Math.min(10, Math.round(v)));
  let filled = "🟩";
  if (v < 3) filled = "🟥";
  else if (v < 5) filled = "🟧";
  else if (v < 7) filled = "🟨";
  else if (v < 8.5) filled = "🟩";
  else filled = "💚";
  let b = "";
  for (let i = 0; i < 10; i++) b += (i < f ? filled : "⬜");
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
  let totalMs = 0, blockedMs = 0, asnData = {}, dayData = {};
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
  const hasData = totalMs >= 100;
  const blockPercent = totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0;
  return { blockPercent, accessPercent: 100 - blockPercent, totalMs, blockedMs, hasData, asnData, dayData };
}
async function getOONIData() {
  let ooni = await fetchOONI();
  let p = parseOONI(ooni);
  if (p.hasData) return p;
  ooni = await fetchOONI7d();
  p = parseOONI(ooni);
  return p;
}
function getStatusMood(blockPercent) {
  if (blockPercent < 15) return { emoji: "🎉", label: "اینترنت آزاد و روان", mood: "عالی", color: "#22c55e" };
  if (blockPercent < 30) return { emoji: "😊", label: "وضعیت مطلوب", mood: "خوب", color: "#84cc16" };
  if (blockPercent < 45) return { emoji: "😐", label: "کمی محدود", mood: "متوسط", color: "#eab308" };
  if (blockPercent < 60) return { emoji: "😟", label: "محدودیت زیاد", mood: "ناپایدار", color: "#f97316" };
  if (blockPercent < 80) return { emoji: "😰", label: "وضعیت بحرانی", mood: "بحرانی", color: "#ef4444" };
  return { emoji: "🚨", label: "فیلترینگ شدید", mood: "اضطراری", color: "#dc2626" };
}
function getVipRank(points) {
  if (points >= 1000) return { emoji: "💎", name: "Diamond" };
  if (points >= 500) return { emoji: "🥇", name: "Gold" };
  if (points >= 100) return { emoji: "🥈", name: "Silver" };
  return { emoji: "🥉", name: "Bronze" };
}

// ==================== Send ====================
async function sendMessage(TG, chatId, text, extra) {
  const body = { chat_id: chatId, text: text };
  if (extra) {
    Object.keys(extra).forEach(k => {
      if (k === "inline_keyboard") body.reply_markup = { inline_keyboard: extra[k] };
      else body[k] = extra[k];
    });
  }
  try {
    const r = await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await r.json();
  } catch(e) { return { ok: false, error: e.message }; }
}
async function sendPhoto(TG, chatId, url, caption, extra) {
  const body = { chat_id: chatId, photo: url, caption: caption, parse_mode: "HTML" };
  if (extra) {
    Object.keys(extra).forEach(k => {
      if (k === "inline_keyboard") body.reply_markup = { inline_keyboard: extra[k] };
      else body[k] = extra[k];
    });
  }
  try {
    const r = await fetch(TG + "/sendPhoto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!d.ok) {
      console.log("sendPhoto failed: " + JSON.stringify(d));
      if (caption) { try { await sendMessage(TG, chatId, caption); } catch(e2) {} }
    }
    return d;
  } catch(e) {
    console.log("sendPhoto exception: " + e.message);
    if (caption) { try { await sendMessage(TG, chatId, caption); } catch(e2) {} }
  }
}

// ==================== Chat Tracking ====================
async function trackChat(STATS, chatId) {
  if (!STATS || chatId >= 0) return;
  try {
    const key = "bot_chats";
    const raw = await STATS.get(key);
    let list = raw ? JSON.parse(raw) : [];
    if (!list.includes(chatId)) {
      list.push(chatId);
      await STATS.put(key, JSON.stringify(list));
    }
  } catch(e) {}
}
async function getTrackedChats(STATS) {
  let chats = [CH1, CH2, CH3];
  if (STATS) {
    try {
      const raw = await STATS.get("bot_chats");
      if (raw) {
        const list = JSON.parse(raw);
        for (const c of list) { if (!chats.includes(c)) chats.push(c); }
      }
    } catch(e) {}
  }
  return chats;
}

// ==================== Gamification ====================
async function addPoints(STATS, userId, points) {
  if (!STATS) return;
  try {
    const key = "points:" + userId;
    const cur = parseInt(await STATS.get(key) || "0");
    const newPts = cur + points;
    await STATS.put(key, String(newPts));
    const name = await STATS.get("name:" + userId) || ("کاربر " + userId.slice(-4));
    const lb = await STATS.get("leaderboard");
    let list = lb ? JSON.parse(lb) : [];
    const found = list.find(x => x.id === userId);
    if (found) { found.p = newPts; found.n = name; }
    else list.push({ id: userId, p: newPts, n: name });
    list.sort((a, b) => b.p - a.p);
    list = list.slice(0, 100);
    await STATS.put("leaderboard", JSON.stringify(list));
    // بررسی نشان‌های امتیازی
    if (cur < 100 && newPts >= 100) await awardBadge(STATS, userId, "points_100", TG_GLOBAL);
    if (cur < 500 && newPts >= 500) await awardBadge(STATS, userId, "points_500", TG_GLOBAL);
    if (cur < 1000 && newPts >= 1000) await awardBadge(STATS, userId, "points_1000", TG_GLOBAL);
  } catch(e) {}
}
let TG_GLOBAL = null;
function setTGGlobal(TG) { TG_GLOBAL = TG; }

async function getPoints(STATS, userId) {
  if (!STATS) return 0;
  try { return parseInt(await STATS.get("points:" + userId) || "0"); } catch(e) { return 0; }
}

async function checkStreak(STATS, userId) {
  if (!STATS) return null;
  try {
    const today = getToday();
    const key = "streak:" + userId;
    const raw = await STATS.get(key);
    let streak = raw ? JSON.parse(raw) : { count: 0, lastDate: null };
    if (streak.lastDate === today) return { count: streak.count, isNew: false };
    const yesterday = getYesterday();
    if (streak.lastDate === yesterday) streak.count += 1;
    else streak.count = 1;
    streak.lastDate = today;
    await STATS.put(key, JSON.stringify(streak));
    let bonus = 0, msg = "";
    if (streak.count === 7) { bonus = 20; msg = "🔥 <b>۷ روز متوالی!</b> +20 امتیاز"; await awardBadge(STATS, userId, "streak_7", TG_GLOBAL); }
    else if (streak.count === 30) { bonus = 100; msg = "💎 <b>یک ماه متوالی!</b> +100 امتیاز"; await awardBadge(STATS, userId, "streak_30", TG_GLOBAL); }
    else if (streak.count > 0 && streak.count % 10 === 0) { bonus = 30; msg = "🎯 <b>" + streak.count + " روز متوالی!</b> +30 امتیاز"; }
    if (bonus > 0) await addPoints(STATS, userId, bonus);
    return { count: streak.count, isNew: true, bonus, msg };
  } catch(e) { return null; }
}

async function awardBadge(STATS, userId, badgeId, TG) {
  if (!STATS) return;
  try {
    const key = "badges:" + userId;
    const raw = await STATS.get(key);
    let badges = raw ? JSON.parse(raw) : [];
    if (badges.includes(badgeId)) return;
    badges.push(badgeId);
    await STATS.put(key, JSON.stringify(badges));
    const b = BADGES[badgeId];
    if (b && TG) {
      await sendMessage(TG, userId, 
        "🎉 <b>نشان جدید unlocked!</b>\n\n" +
        b.emoji + " <b>" + b.name + "</b>\n" +
        "<i>" + b.desc + "</i>\n\n" +
        "📊 مشاهده همه نشان‌ها: /badges",
        { parse_mode: "HTML" });
    }
  } catch(e) {}
}

async function getUserBadges(STATS, userId) {
  if (!STATS) return [];
  try {
    const raw = await STATS.get("badges:" + userId);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
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
  try { const r = await STATS.get("ref:" + userId); return r || null; } catch(e) { return null; }
}

// ==================== Spin ====================
async function handleSpin(STATS, userId, TG, chatId) {
  try {
    const today = getToday();
    const key = "spin:" + userId;
    const lastSpin = await STATS.get(key);
    if (lastSpin === today) {
      const tomorrow = new Date(Date.now() + 86400000);
      const hours = 24 - getIranHour();
      await sendMessage(TG, chatId,
        "🎰 <b>اسپین امروز استفاده شده!</b>\n\n" +
        "⏰ فردا دوباره برگرد.\n" +
        "🕒 حدود <b>" + hours + " ساعت</b> دیگر.\n\n" +
        "💡 <i>هر روز یک اسپین رایگان داری!</i>",
        { parse_mode: "HTML" });
      return;
    }
    
    // انیمیشن
    await sendMessage(TG, chatId, "🎰 <i>در حال چرخش...</i>\n\n▫️▫️▫️", { parse_mode: "HTML" });
    
    const prizes = [1, 2, 3, 5, 5, 10, 15, 20, 25, 30, 50];
    const weights = [20, 15, 15, 12, 10, 8, 6, 5, 4, 3, 2];
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) { idx = i; break; }
    }
    const prize = prizes[idx];
    await STATS.put(key, today, { expirationTtl: 172800 });
    await addPoints(STATS, userId, prize);
    
    let emoji = "🎁";
    if (prize >= 50) { emoji = "💎"; await awardBadge(STATS, userId, "spin_lucky", TG); }
    else if (prize >= 30) emoji = "🏆";
    else if (prize >= 20) emoji = "🥇";
    else if (prize >= 10) emoji = "⭐";
    else if (prize >= 5) emoji = "✨";
    
    const pts = await getPoints(STATS, userId);
    await sendMessage(TG, chatId,
      "🎰 <b>نتیجه اسپین!</b>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      emoji + " <b>+ " + prize + " امتیاز</b>\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "🏆 <b>امتیاز کل شما:</b> <code>" + pts + "</code>\n\n" +
      "🎁 فردا دوباره امتحان کن!",
      { parse_mode: "HTML" });
  } catch(e) {
    console.log("spin error: " + e.message);
    await sendMessage(TG, chatId, "❌ خطا در اسپین. دوباره تلاش کن.");
  }
}

// ==================== Subscribe to ISP ====================
async function handleSubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
    const q = ispQuery.toLowerCase();
    let asn = null, name = null;
    for (const [n, code] of Object.entries(ISP_MAP)) {
      if (q.includes(n) || n.includes(q)) { asn = code; name = n; break; }
    }
    if (!asn) return await sendMessage(TG, chatId, "❌ ISP پیدا نشد.\n💡 مثال: <code>/subscribe ایرانسل</code>", { parse_mode: "HTML" });
    
    const key = "sub:" + userId;
    const raw = await STATS.get(key);
    let subs = raw ? JSON.parse(raw) : [];
    if (subs.includes(asn)) return await sendMessage(TG, chatId, "ℹ️ قبلاً مشترک <b>" + name + "</b> هستی.", { parse_mode: "HTML" });
    subs.push(asn);
    await STATS.put(key, JSON.stringify(subs));
    await sendMessage(TG, chatId,
      "🔔 <b>اشتراک فعال شد!</b>\n\n" +
      "📡 <b>اپراتور:</b> " + name + "\n" +
      "📊 هر بار که کیفیت این اپراتور تغییر کرد، بهت اطلاع می‌دیم.\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "🔕 لغو: <code>/unsubscribe " + name + "</code>",
      { parse_mode: "HTML" });
  } catch(e) { console.log("subscribe error: " + e.message); }
}
async function handleUnsubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
    const q = ispQuery.toLowerCase();
    let asn = null, name = null;
    for (const [n, code] of Object.entries(ISP_MAP)) {
      if (q.includes(n) || n.includes(code)) { asn = code; name = n; break; }
    }
    if (!asn) return await sendMessage(TG, chatId, "❌ ISP پیدا نشد.");
    const key = "sub:" + userId;
    const raw = await STATS.get(key);
    let subs = raw ? JSON.parse(raw) : [];
    subs = subs.filter(s => s !== asn);
    await STATS.put(key, JSON.stringify(subs));
    await sendMessage(TG, chatId, "🔕 اشتراک <b>" + name + "</b> لغو شد.", { parse_mode: "HTML" });
  } catch(e) {}
}
async function checkISPSubscriptions(TG, STATS) {
  if (!STATS) return;
  try {
    const p = await getOONIData();
    if (!p.hasData) return;
    const hour = getIranHour();
    const today = getToday();
    // فقط هر ۶ ساعت اجرا شود
    if (hour % 6 !== 0) return;
    
    // دریافت لیست همه اشتراک‌ها (به صورت تقریبی - فقط کاربران فعال)
    const lbRaw = await STATS.get("leaderboard");
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    for (const u of lb.slice(0, 50)) {
      try {
        const subRaw = await STATS.get("sub:" + u.id);
        if (!subRaw) continue;
        const subs = JSON.parse(subRaw);
        for (const asn of subs) {
          const d = p.asnData[asn];
          if (!d) continue;
          const rate = Math.round((d.ok / d.total) * 100);
          if (rate < 40) {
            const lastAlert = await STATS.get("ispsub:" + u.id + ":" + asn);
            if (lastAlert !== today) {
              await STATS.put("ispsub:" + u.id + ":" + asn, today, { expirationTtl: 172800 });
              await sendMessage(TG, u.id,
                "🔔 <b>هشدار اپراتور شما</b>\n\n" +
                "📡 <b>" + asnName(asn) + "</b>\n" +
                "⚠️ کیفیت پایین: <code>" + rate + "%</code>\n" +
                makeBar(rate / 10) + "\n\n" +
                "🕒 " + getIranTime(),
                { parse_mode: "HTML" });
            }
          }
        }
      } catch(e) {}
    }
  } catch(e) { console.log("checkISPSubscriptions error: " + e.message); }
}

// ==================== Alert on Quality Drop ====================
async function checkAndAlertQuality(TG, STATS) {
  if (!STATS) return;
  try {
    const p = await getOONIData();
    if (!p.hasData) return;
    const today = getToday();
    const hour = getIranHour();
    
    // ذخیره آخرین وضعیت
    const lastKey = "lastcheck";
    const lastRaw = await STATS.get(lastKey);
    const last = lastRaw ? JSON.parse(lastRaw) : null;
    
    // اگر افت شدید بود هشدار بده
    if (last && last.blockPercent !== undefined) {
      const diff = p.blockPercent - last.blockPercent;
      if (diff >= QUALITY_DROP_THRESHOLD) {
        const alertKey = "alert:" + today + ":" + hour;
        const alreadySent = await STATS.get(alertKey);
        if (!alreadySent) {
          await STATS.put(alertKey, "1", { expirationTtl: 7200 });
          const mood = getStatusMood(p.blockPercent);
          const chats = await getTrackedChats(STATS);
          const alertMsg = "🚨 <b>هشدار افت شدید کیفیت!</b>\n\n" +
            "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
            mood.emoji + " <b>" + mood.label + "</b>\n\n" +
            "📉 افت: <b>+" + diff + "%</b> فیلترینگ\n" +
            "🚫 فیلترینگ فعلی: <code>" + p.blockPercent + "%</code>\n" +
            "✅ دسترسی آزاد: <code>" + p.accessPercent + "%</code>\n" +
            "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
            "🕒 " + getIranTime() + "\n" +
            "🤖 @Radarinternetiranbot";
          for (const ch of chats) {
            await sendMessage(TG, ch, alertMsg, { parse_mode: "HTML" }).catch(() => {});
          }
        }
      }
    }
    
    // اگر فیلترینگ بالای آستانه بود، هشدار اضطراری
    if (p.blockPercent >= ALERT_THRESHOLD) {
      const alertKey = "critical:" + today + ":" + Math.floor(hour / 3);
      const alreadySent = await STATS.get(alertKey);
      if (!alreadySent) {
        await STATS.put(alertKey, "1", { expirationTtl: 21600 });
        const chats = await getTrackedChats(STATS);
        const criticalMsg = "🚨🚨 <b>هشدار اضطراری</b> 🚨🚨\n\n" +
          "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
          "⚠️ <b>فیلترینگ در سطح بحرانی!</b>\n\n" +
          "🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n" +
          "✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" +
          makeBar(p.accessPercent / 10) + "\n\n" +
          "🔬 <b>تست:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n" +
          "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
          "🕒 " + getIranTime() + "\n" +
          "🤖 @Radarinternetiranbot";
        for (const ch of chats) {
          await sendMessage(TG, ch, criticalMsg, { parse_mode: "HTML" }).catch(() => {});
        }
      }
    }
    
    await STATS.put(lastKey, JSON.stringify({ blockPercent: p.blockPercent, ts: Date.now() }), { expirationTtl: 7200 });
  } catch(e) { console.log("checkAndAlertQuality error: " + e.message); }
}

// ==================== Weekly Leaderboard Pin ====================
async function postWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return;
  try {
    const lbRaw = await STATS.get("leaderboard");
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    if (lb.length === 0) return;
    
    let out = "🏆 <b>برترین‌های هفته</b>\n" +
      "<i>قهرمانان این هفته رادار</i>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    
    lb.slice(0, 10).forEach((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
      const name = (u.n || u.id).substring(0, 20);
      const rank = getVipRank(u.p);
      out += medal + " " + rank.emoji + " <b>" + name + "</b>  →  <code>" + u.p + "</code>\n";
    });
    
    out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "🎁 <b>جوایز هفته:</b>\n" +
      "🥇 نفر اول: <b>+100 امتیاز</b>\n" +
      "🥈 نفر دوم: <b>+50 امتیاز</b>\n" +
      "🥉 نفر سوم: <b>+25 امتیاز</b>\n\n" +
      "🚀 <i>خودت رو به لیست برسون! /invite</i>\n\n" +
      "🕒 " + getIranDate();
    
    // ارسال به همه چت‌ها
    const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const r = await sendMessage(TG, ch, out, { parse_mode: "HTML" });
        if (r && r.ok && r.result) {
          // تلاش برای پین
          await fetch(TG + "/pinChatMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: ch, message_id: r.result.message_id, disable_notification: false })
          }).catch(() => {});
          // ذخیره message_id
          if (ch === CH1) await STATS.put(WEEKLY_PIN_MSG_KEY, String(r.result.message_id));
        }
      } catch(e) { console.log("weekly pin error for " + ch + ": " + e.message); }
    }
    
    // جوایز
    if (lb[0]) await addPoints(STATS, lb[0].id, 100);
    if (lb[1]) await addPoints(STATS, lb[1].id, 50);
    if (lb[2]) await addPoints(STATS, lb[2].id, 25);
    
    // نشان صدرنشین
    if (lb[0]) await awardBadge(STATS, lb[0].id, "first_leader", TG);
  } catch(e) { console.log("postWeeklyLeaderboard error: " + e.message); }
}

async function unpinWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return;
  try {
    const msgId = await STATS.get(WEEKLY_PIN_MSG_KEY);
    if (msgId) {
      const chats = await getTrackedChats(STATS);
      for (const ch of chats) {
        await fetch(TG + "/unpinChatMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: ch })
        }).catch(() => {});
      }
      await STATS.delete(WEEKLY_PIN_MSG_KEY);
    }
  } catch(e) {}
}

// ==================== Prediction ====================
async function makePrediction() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  const days = Object.keys(p.dayData).sort();
  if (days.length < 3) return "🔮 داده کافی برای پیش‌بینی نیست.";
  
  const values = days.map(d => p.dayData[d].total > 0 ? (p.dayData[d].blocked / p.dayData[d].total) * 100 : 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const trend = last - prev;
  
  let prediction = "";
  if (trend > 5) prediction = "📈 روند افزایشی فیلترینگ. احتمالاً روزهای آینده وضعیت بدتر می‌شه.";
  else if (trend < -5) prediction = "📉 روند کاهشی. امیدواریم اینترنت بهتر بشه!";
  else prediction = "➖ وضعیت نسبتاً پایداره. تغییر محسوسی پیش‌بینی نمی‌شه.";
  
  return "🔮 <b>پیش‌بینی اینترنت</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "📊 <b>میانگین ۷ روز:</b> <code>" + Math.round(avg) + "%</code>\n" +
    "📈 <b>روند فعلی:</b> " + (trend > 0 ? "🔺" : "🔻") + " <code>" + Math.round(trend) + "%</code>\n\n" +
    prediction + "\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "⚠️ <i>این پیش‌بینی بر اساس داده‌های گذشته است.</i>\n" +
    "📌 OONI  •  🕒 " + getIranTime();
}

// ==================== Year Ago ====================
async function makeYearAgoReport() {
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 86400000);
    const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(oneYearAgo);
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + dateStr + "&until=" + dateStr + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
    if (!r.ok) return "❌ داده یک سال پیش در دسترس نیست.";
    const d = await r.json();
    const p = parseOONI(d);
    if (!p.hasData) return "❌ داده یک سال پیش موجود نیست.";
    const mood = getStatusMood(p.blockPercent);
    return "🕰 <b>یک سال پیش امروز</b>\n\n" +
      "📅 " + dateStr + "\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      mood.emoji + " <b>" + mood.label + "</b>\n\n" +
      "✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" +
      "🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n" +
      makeBar(p.accessPercent / 10) + "\n\n" +
      "🔬 <b>تست:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📌 OONI";
  } catch(e) { return "❌ خطا در دریافت داده."; }
}

// ==================== Reports ====================
async function makePingReport() {
  let irList = "", globalList = "";
  let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  🟢 " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { irList += "  🔴 " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  🟢 " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { globalList += "  🔴 " + s.name + "\n"; }
  }
  return "📡 <b>پینگ سرورها</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🇮🇷 <b>سایت‌های ایرانی</b>  (" + irOk + "/" + IR_SITES.length + ")\n\n" + irList + "\n" +
    "🌍 <b>سایت‌های جهانی</b>  (" + globalOk + "/" + GLOBAL_SITES.length + ")\n\n" + globalList +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
}
async function makeFilteringReport() {
  const p = await getOONIData();
  if (!p.hasData) return "🚫 <b>فیلترینگ</b>\n\n⚪ در انتظار داده‌های جدید...\n\n🕒 " + getIranTime();
  const mood = getStatusMood(p.blockPercent);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  let out = "🚫 <b>وضعیت فیلترینگ ایران</b>\n\n" +
    mood.emoji + " <b>" + mood.label + "</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🎯 <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" +
    "🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n\n" +
    makeBar(p.accessPercent / 10) + "\n\n" +
    "🔬 <b>تعداد تست:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n" +
    "🌐 <b>اپراتورها:</b> <code>" + ops.length + "</code>\n\n";
  if (ops.length > 0) {
    out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📡 <b>وضعیت اپراتورها:</b>\n\n";
    ops.slice(0, 12).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += e + " <b>" + o.name + "</b>\n   └ %" + o.rate + " آزاد • " + o.count.toLocaleString("fa-IR") + " تست\n";
    });
  }
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📌 OONI  •  🕒 " + getIranTime();
  return out;
}
async function makeSitesReport() {
  let out = "🌐 <b>بررسی دسترسی سرویس‌ها</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
  let acc = 0, list = "";
  for (const s of FILTER_CHECK) {
    const ok = await checkAccessible(s.url);
    if (ok) { acc++; list += "  ✅ " + s.name + "\n"; }
    else { list += "  🚫 " + s.name + "\n"; }
  }
  out += "📊 <b>نتیجه:</b> " + acc + " از " + FILTER_CHECK.length + " قابل دسترسی\n";
  out += makeBar((acc / FILTER_CHECK.length) * 10) + "\n\n";
  out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" + list;
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}
async function makeCompareReport() {
  const p = await getOONIData();
  if (!p.hasData) return "❌ داده کافی موجود نیست.";
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 50) {
      const name = await asnNameAuto(asn);
      ops.push({ name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🆚 <b>مقایسه اپراتورها</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🏆 <b>بهترین‌ها:</b>\n\n";
  ops.slice(0, 5).forEach((o, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
    out += "  " + medal + " <b>" + o.name + "</b>\n     └ %" + o.rate + " آزاد\n";
  });
  out += "\n🔻 <b>ضعیف‌ترین‌ها:</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "  🔴 <b>" + o.name + "</b>\n     └ %" + o.rate + " آزاد\n";
  });
  const avg = Math.round(ops.reduce((a, b) => a + b.rate, 0) / ops.length);
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "📊 <b>تعداد اپراتور:</b> " + ops.length + "\n" +
    "📈 <b>میانگین آزادی:</b> " + avg + "%\n" + makeBar(avg / 10) + "\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime();
  return out;
}
async function makeVsOperatorReport(op1, op2) {
  const p = await getOONIData();
  if (!p.hasData) return "❌ داده کافی موجود نیست.";
  const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
  function findASN(q) {
    const s = q.toLowerCase();
    for (const [n, code] of Object.entries(ISP_MAP)) { if (s.includes(n) || n.includes(s)) return code; }
    return null;
  }
  const asn1 = findASN(op1), asn2 = findASN(op2);
  if (!asn1 || !asn2) return "❌ یکی از اپراتورها پیدا نشد.";
  const d1 = p.asnData[asn1], d2 = p.asnData[asn2];
  if (!d1 || !d2) return "❌ داده کافی برای مقایسه نیست.";
  const rate1 = Math.round((d1.ok / d1.total) * 100);
  const rate2 = Math.round((d2.ok / d2.total) * 100);
  const winner = rate1 > rate2 ? 1 : 2;
  let out = "🆚 <b>مقایسه دو اپراتور</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
    (winner === 1 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn1) + "</b>\n" +
    "   ✅ دسترسی آزاد: <code>" + rate1 + "%</code>\n" +
    "   " + makeBar(rate1 / 10) + "\n\n" +
    (winner === 2 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn2) + "</b>\n" +
    "   ✅ دسترسی آزاد: <code>" + rate2 + "%</code>\n" +
    "   " + makeBar(rate2 / 10) + "\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🏆 <b>برنده:</b> " + asnName(winner === 1 ? asn1 : asn2) + "\n" +
    "📊 اختلاف: <code>" + Math.abs(rate1 - rate2) + "%</code>\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "📌 OONI  •  🕒 " + getIranTime();
  return out;
}
async function makeTopReport() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 500) {
      const name = await asnNameAuto(asn);
      ops.push({ name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🏆 <b>رتبه‌بندی هفتگی اپراتورها</b>\n<i>بر اساس ۷ روز گذشته</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🥇 <b>بهترین‌ها:</b>\n\n";
  ops.slice(0, 7).forEach((o, i) => {
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    out += "  " + rank + " <b>" + o.name + "</b>  →  %" + o.rate + "\n";
  });
  out += "\n🔻 <b>پایین‌ترین‌ها:</b>\n\n";
  ops.slice(-5).reverse().forEach(o => { out += "  🔴 <b>" + o.name + "</b>  →  %" + o.rate + "\n"; });
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📊 <b>تعداد:</b> " + ops.length + "\n⭐ <b>بهترین:</b> %" + ops[0].rate + "\n⚠️ <b>بدترین:</b> %" + ops[ops.length-1].rate + "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📌 OONI  •  🕒 " + getIranTime();
  return out;
}
async function makeISPReport(query) {
  const q = query.toLowerCase();
  const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
  let asn = null;
  for (const [name, code] of Object.entries(ISP_MAP)) { if (q.includes(name) || name.includes(q)) { asn = code; break; } }
  if (!asn) return "❌ ISP پیدا نشد: <b>" + query + "</b>\n\n💡 مثال: <code>/isp ایرانسل</code>";
  const p = await getOONIData();
  const d = p.asnData[asn];
  if (!d) return "❌ داده‌ای برای <b>" + asnName(asn) + "</b> یافت نشد.";
  const rate = Math.round((d.ok / d.total) * 100);
  let emoji = "🔴", status = "ضعیف";
  if (rate >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (rate >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "📡 <b>" + asnName(asn) + "</b>\n\n" + emoji + " <b>" + status + "</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n✅ <b>دسترسی آزاد:</b> <code>" + rate + "%</code>\n🚫 <b>مسدود:</b> <code>" + (100 - rate) + "%</code>\n\n" + makeBar(rate / 10) + "\n\n🔬 <b>تعداد تست:</b> <code>" + d.count.toLocaleString("fa-IR") + "</code>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📌 OONI  •  🕒 " + getIranTime();
}
async function makeWorldReport() {
  const COUNTRIES = [
    { code: "IR", name: "🇮🇷 ایران" }, { code: "TR", name: "🇹🇷 ترکیه" },
    { code: "IQ", name: "🇮🇶 عراق" }, { code: "AE", name: "🇦🇪 امارات" }, { code: "SA", name: "🇸🇦 عربستان" }
  ];
  let out = "🌍 <b>مقایسه جهانی</b>\n<i>وضعیت آزادی اینترنت در منطقه</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
  let results = [];
  for (const c of COUNTRIES) {
    try {
      const since = new Date(Date.now() - 604800000).toISOString().split("T")[0];
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
  results.forEach((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    const e = r.percent < 15 ? "🟢" : r.percent < 30 ? "🟡" : r.percent < 50 ? "🟠" : "🔴";
    out += "  " + medal + " " + r.name + "  " + e + " <b>%" + r.percent + "</b>\n";
  });
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📌 OONI  •  🕒 " + getIranTime();
  return out;
}
async function makeVsReport(STATS) {
  const yesterday = getYesterday();
  const p = await getOONIData();
  const todayPercent = p.accessPercent;
  let yPercent = null;
  if (STATS) {
    const ySnap = await getDailySnapshot(STATS, yesterday);
    if (ySnap && ySnap.hasData) yPercent = ySnap.accessPercent;
  }
  let out = "📊 <b>مقایسه دیروز و امروز</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";
  if (yPercent !== null && p.hasData) {
    out += "📅 <b>دیروز:</b> <code>" + yPercent + "%</code>\n📅 <b>امروز:</b> <code>" + todayPercent + "%</code>\n\n";
    const diff = todayPercent - yPercent;
    let trend = "➖ بدون تغییر";
    if (diff > 5) trend = "🎉 خیلی بهتر (+" + diff + ")";
    else if (diff > 0) trend = "📈 کمی بهتر (+" + diff + ")";
    else if (diff < -5) trend = "😟 خیلی بدتر (" + diff + ")";
    else if (diff < 0) trend = "📉 کمی بدتر (" + diff + ")";
    out += "<b>" + trend + "</b>\n\n" + makeBar(todayPercent / 10);
  } else {
    out += "\n⚠️ داده کافی برای مقایسه نیست\n\nامروز: <code>" + (p.hasData ? todayPercent + "%" : "—") + "</code>";
  }
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime();
  return out;
}
async function makeWorkReport() {
  const p = await getOONIData();
  if (!p.hasData) return "⚡ <b>خلاصه وضعیت</b>\n\n⏳ در انتظار داده‌های واقعی...\n\n🕒 " + getIranTime();
  const mood = getStatusMood(p.blockPercent);
  return "⚡ <b>خلاصه وضعیت اینترنت</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n" +
    "✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" +
    "🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n\n" +
    makeBar(p.accessPercent / 10) + "\n\n" +
    "🔬 <b>تست:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n\n" +
    "🕒 " + getIranTime() + "  •  📅 " + getIranDate();
}
async function makeScoreReport() {
  const p = await getOONIData();
  if (!p.hasData) return "❌ داده کافی برای امتیازدهی نیست.";
  const filterScore = p.accessPercent;
  let irOk = 0;
  for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
  const irScore = (irOk / IR_SITES.length) * 100;
  let globalPing = 0, globalCount = 0;
  for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalPing += t; globalCount++; } }
  const avgPing = globalCount > 0 ? globalPing / globalCount : 500;
  const pingScore = Math.max(0, 100 - (avgPing / 5));
  const score = Math.round(filterScore * 0.5 + irScore * 0.25 + pingScore * 0.25);
  let emoji = "🔴", status = "بحرانی";
  if (score >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (score >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (score >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "🎖️ <b>امتیاز کیفیت اینترنت</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" + emoji + " <b>" + status + "</b>\n\n⭐ <b>امتیاز نهایی:</b> <code>" + score + "/100</code>\n" + makeBar(score / 10) + "\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📊 <b>جزئیات امتیاز:</b>\n\n✅ فیلترینگ: <code>" + Math.round(filterScore) + "%</code>\n🇮🇷 سایت ایرانی: <code>" + Math.round(irScore) + "%</code>\n🌍 پینگ جهانی: <code>" + Math.round(pingScore) + "%</code>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime();
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
  let out = "⏰ <b>بهترین ساعات استفاده از اینترنت</b>\n\n<i>برای دانلود، استریم و کارهای سنگین</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🏆 <b>پیشنهاد ویژه:</b>\nساعت <b>۲ بامداد تا ۶ صبح</b>\nبهترین سرعت و پایداری\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
  for (const h of hours) out += h.emoji + " " + h.range + "\n   └ " + h.note + " • %" + h.quality + "\n\n";
  out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💡 تخمینی بر اساس الگوی مصرف";
  return out;
}
async function makeSpeedReport() {
  return "⚡ <b>راهنمای تست سرعت</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🔗 <b>لینک‌های معتبر:</b>\n\n  🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n  📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n  ⚡ <a href='https://fast.com/'>Fast.com</a>\n  🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💡 <b>نکات مهم:</b>\n\n  1️⃣ وای‌فای را قطع کن\n  2️⃣ اپ‌های دیگر را ببند\n  3️⃣ سه بار تست کن\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📡 @Radarinternetiran";
}

// ==================== Charts ====================
async function makeBarChart() {
  const p = await getOONIData();
  if (!p.hasData) return { url: "", caption: "❌ داده کافی موجود نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 8);
  return {
    url: quickChart({ type: "horizontalBar", data: { labels: ops.map(o => o.name), datasets: [{ label: "دسترسی آزاد %", data: ops.map(o => o.rate), backgroundColor: ops.map(o => o.rate >= 80 ? "#22c55e" : o.rate >= 60 ? "#eab308" : o.rate >= 40 ? "#f97316" : "#ef4444") }] }, options: { title: { display: true, text: "دسترسی آزاد اپراتورها", fontSize: 18 }, legend: { display: false }, scales: { xAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } } }),
    caption: "📊 <b>کیفیت اپراتورها</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🎯 <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n🔬 <b>تست:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime()
  };
}
async function makePieChart() {
  const p = await getOONIData();
  if (!p.hasData) return { url: "", caption: "❌ داده کافی موجود نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 6);
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#f97316"];
  return {
    url: quickChart({ type: "pie", data: { labels: ops.map(o => o.name), datasets: [{ data: ops.map(o => o.count), backgroundColor: colors }] }, options: { title: { display: true, text: "سهم اپراتورها", fontSize: 18 } } }),
    caption: "🥧 <b>سهم اپراتورها</b>\n\nاز مجموع <b>" + p.totalMs.toLocaleString("fa-IR") + "</b> تست واقعی\n\n📅 " + getDateBoth()
  };
}
async function makeTrendChart() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [], values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5)); values.push(blocked);
  }
  if (values.length === 0) return { url: "", caption: "❌ داده کافی موجود نیست." };
  return {
    url: quickChart({ type: "line", data: { labels, datasets: [{ label: "درصد مسدودسازی", data: values, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] }, options: { title: { display: true, text: "روند فیلترینگ ۷ روز", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } } }),
    caption: "📈 <b>روند فیلترینگ ۷ روز</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🔺 <b>بیشترین:</b> <code>" + Math.max(...values) + "%</code>\n🔻 <b>کمترین:</b> <code>" + Math.min(...values) + "%</code>\n📊 <b>میانگین:</b> <code>" + Math.round(values.reduce((a,b) => a+b, 0) / values.length) + "%</code>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📅 " + getDateBoth()
  };
}
async function makeHistoryChart() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [], values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5)); values.push(blocked);
  }
  if (values.length === 0) return { url: "", caption: "❌ داده کافی موجود نیست." };
  const avg = Math.round(values.reduce((a,b) => a+b, 0) / values.length);
  return {
    url: quickChart({ type: "line", data: { labels, datasets: [{ label: "مسدودسازی %", data: values, borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] }, options: { title: { display: true, text: "تاریخچه ۷ روز اخیر", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } } }),
    caption: "📅 <b>تاریخچه ۷ روز اخیر</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📊 <b>میانگین هفته:</b> <code>" + avg + "%</code>\n📉 <b>روند کلی:</b> " + (values[values.length-1] > values[0] ? "🔺 افزایشی" : "🔻 کاهشی") + "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📌 منبع: OONI"
  };
}
async function makeTodayChart(STATS) {
  const currentHour = getIranHour();
  const today = getToday();
  let realData = {};
  if (STATS) {
    const promises = [];
    for (let h = 0; h <= currentHour; h++) {
      promises.push(STATS.get("hourly:" + today + ":" + h).then(raw => {
        if (raw) { try { const d = JSON.parse(raw); realData[h] = d.quality; } catch(e) {} }
      }).catch(() => {}));
    }
    await Promise.all(promises);
  }
  const p = await getOONIData();
  if (p.hasData) {
    realData[currentHour] = p.accessPercent;
    if (STATS) { try { await STATS.put("hourly:" + today + ":" + currentHour, JSON.stringify({ hour: currentHour, quality: p.accessPercent, blockPercent: p.blockPercent, totalMs: p.totalMs, saved: new Date().toISOString() }), { expirationTtl: 172800 }); } catch(e) {} }
  }
  const labels = [], values = [];
  for (let h = 0; h <= currentHour; h++) { labels.push(h + ":00"); values.push(realData[h] !== undefined ? realData[h] : null); }
  const hasAnyData = values.some(v => v !== null);
  if (!hasAnyData) {
    return { url: quickChart({ type: "line", data: { labels: ["در انتظار داده"], datasets: [{ data: [0], backgroundColor: "rgba(148,163,184,0.4)" }] }, options: { title: { display: true, text: "در انتظار داده‌های جدید", fontSize: 18 }, legend: { display: false } } }), caption: "📊 <b>نمودار امروز</b>\n\n⏳ هنوز داده‌ای ثبت نشده\nلطفاً بعداً تلاش کنید." };
  }
  const realCount = Object.keys(realData).length;
  const totalShown = currentHour + 1;
  const mood = p.hasData ? getStatusMood(p.blockPercent) : null;
  let captionText = "📊 <b>نمودار امروز</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⏰ <b>ساعت:</b> " + currentHour + ":00\n📡 <b>وضعیت زنده:</b> " + (p.hasData ? mood.emoji + " %" + p.accessPercent : "—") + "\n📈 <b>ثبت‌شده:</b> " + realCount + "/" + totalShown + "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n✅ فقط داده‌های واقعی";
  return {
    url: quickChart({ type: "line", data: { labels, datasets: [{ label: "دسترسی آزاد (%)", data: values, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)", fill: true, tension: 0.3, borderWidth: 3, pointRadius: 4, spanGaps: true }] }, options: { title: { display: true, text: "سطح دسترسی آزاد امروز", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } } }),
    caption: captionText
  };
}
async function makeMapChart() {
  const p = await getOONIData();
  if (!p.hasData) return { url: "", caption: "❌ داده کافی موجود نیست." };
  const mood = getStatusMood(p.blockPercent);
  return {
    url: quickChart({ type: "doughnut", data: { labels: ["مسدود", "دسترسی آزاد"], datasets: [{ data: [p.blockPercent, p.accessPercent], backgroundColor: ["#ef4444", mood.color], borderColor: "#fff", borderWidth: 3 }] }, options: { title: { display: true, text: "نقشه حرارتی فیلترینگ", fontSize: 22, fontColor: "#0f172a" }, legend: { position: "bottom", labels: { fontSize: 14 } } } }),
    caption: "🗺 <b>نقشه حرارتی فیلترینگ</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n📊 <b>ASN:</b> <code>" + Object.keys(p.asnData).length + "</code>\n🔬 <b>تست:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime()
  };
}

// ==================== Reports ====================
async function makeReport(mode) {
  if (mode === undefined) mode = "full";
  const p = await getOONIData();
  if (!p.hasData) return "📊 <b>گزارش اینترنت</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n⏳ <b>در انتظار داده‌های جدید</b>\n\nAPI OONI هنوز داده کافی ندارد.\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime() + "\n🔗 @radarinternetiran";
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate: Math.round((d.ok / d.total) * 100) });
  }
  ops.sort((a, b) => a.rate - b.rate);
  const mood = getStatusMood(p.blockPercent);
  if (mode === "simple") return "📊 <b>وضعیت اینترنت</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" + makeBar(p.accessPercent / 10) + "\n\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; } else { irList += "  ❌ " + s.name + "\n"; } }
  for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; } else { globalList += "  ❌ " + s.name + "\n"; } }
  const ripe = await fetchRIPE();
  let out = "📊 <b>گزارش کامل اینترنت ایران</b>\n<i>پایش زنده</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" + mood.emoji + " <b>" + mood.label + "</b>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🚦 <b>وضعیت فیلترینگ</b>\n\n  ✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n  🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n  " + makeBar(p.accessPercent / 10) + "\n\n  🔬 <b>تست واقعی:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🌐 <b>دسترسی سایت‌ها</b>\n\n  🇮🇷 <b>ایرانی</b>  (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n  🌍 <b>خارجی</b>  (" + globalOk + "/" + GLOBAL_SITES.length + ")\n" + globalList + "\n";
  if (ops.length > 0) {
    out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📡 <b>ضعیف‌ترین اپراتورها</b>\n\n";
    ops.slice(0, 5).forEach(o => { const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴"; out += e + " <b>" + o.name + "</b>  →  %" + o.rate + "\n"; });
    out += "\n";
  }
  out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🚨 <b>مسیریابی (RIPE)</b>\n\n";
  if (ripe && ripe.data && ripe.data.visibility !== undefined) {
    const v = ripe.data.visibility;
    const vE = v > 95 ? "🟢" : v > 80 ? "🟡" : "🔴";
    out += "  " + vE + " <b>Visibility:</b> <code>" + v + "%</code>\n  " + makeBar(v / 10) + "\n";
  } else out += "  ⚠️ RIPE در دسترس نیست\n";
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime() + "  •  📅 " + getIranDate() + "\n\n🔗 @radarinternetiran\n👑 @royal_trust_ir_official\n💬 @radarinternetirangruop";
  return out;
  }// ==================== KV Stats ====================
async function saveDailySnapshot(STATS) {
  try {
    const p = await getOONIData();
    const today = getToday();
    await STATS.put("snap:" + today, JSON.stringify({
      blockPercent: p.blockPercent, accessPercent: p.accessPercent,
      totalMs: p.totalMs, hasData: p.hasData, saved: new Date().toISOString()
    }), { expirationTtl: 2592000 });
  } catch(e) {}
}
async function saveHourlySnapshot(STATS) {
  if (!STATS) return;
  try {
    const today = getToday();
    const hour = getIranHour();
    const p = await getOONIData();
    if (!p.hasData) return;
    await STATS.put("hourly:" + today + ":" + hour, JSON.stringify({
      hour, quality: p.accessPercent, blockPercent: p.blockPercent,
      totalMs: p.totalMs, saved: new Date().toISOString()
    }), { expirationTtl: 172800 });
  } catch(e) {}
}
async function ensureTodaySnapshot(STATS) {
  if (!STATS) return;
  try {
    const today = getToday();
    const yesterday = getYesterday();
    const existsToday = await STATS.get("snap:" + today);
    if (!existsToday) {
      const p = await getOONIData();
      await STATS.put("snap:" + today, JSON.stringify({
        blockPercent: p.blockPercent, accessPercent: p.accessPercent,
        totalMs: p.totalMs, hasData: p.hasData, saved: new Date().toISOString()
      }), { expirationTtl: 2592000 });
    }
    const existsYesterday = await STATS.get("snap:" + yesterday);
    if (!existsYesterday) {
      try {
        const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + yesterday + "&until=" + yesterday + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
        if (r.ok) {
          const d = await r.json();
          const p = parseOONI(d);
          if (p.hasData) {
            await STATS.put("snap:" + yesterday, JSON.stringify({
              blockPercent: p.blockPercent, accessPercent: p.accessPercent,
              totalMs: p.totalMs, hasData: true, saved: new Date().toISOString(), retrospective: true
            }), { expirationTtl: 2592000 });
          }
        }
      } catch(e) {}
    }
  } catch(e) {}
}
async function getDailySnapshot(STATS, date) {
  try { const d = await STATS.get("snap:" + date); return d ? JSON.parse(d) : null; } catch(e) { return null; }
}

// ==================== Channel Status ====================
async function sendOrUpdateChannelStatus(TG, STATS) {
  try {
    const p = await getOONIData();
    const mood = getStatusMood(p.blockPercent);
    let chartUrl;
    if (p.hasData) {
      chartUrl = quickChart({
        type: "doughnut",
        data: {
          labels: ["دسترسی آزاد", "مسدود"],
          datasets: [{ data: [p.accessPercent, p.blockPercent], backgroundColor: [mood.color, "#1e293b"], borderColor: "#ffffff", borderWidth: 3 }]
        },
        options: {
          title: { display: true, text: "🚦 وضعیت زنده اینترنت ایران", fontSize: 22, fontColor: "#0f172a" },
          legend: { position: "bottom", labels: { fontColor: "#0f172a", fontSize: 14, padding: 20 } },
          plugins: { doughnutlabel: { labels: [
            { text: p.accessPercent + "%", font: { size: 42, weight: "bold" }, color: mood.color },
            { text: "دسترسی آزاد", font: { size: 16 }, color: "#475569" }
          ] } }
        }
      });
    } else {
      chartUrl = quickChart({
        type: "doughnut",
        data: { labels: ["در انتظار داده"], datasets: [{ data: [100], backgroundColor: ["#94a3b8"] }] },
        options: { title: { display: true, text: "⏳ در حال جمع‌آوری داده", fontSize: 22, fontColor: "#0f172a" } }
      });
    }
    let caption;
    if (p.hasData) {
      caption = "<b>🛰 رادار اینترنت ایران</b>\n<i>پایش زنده از دید کاربران ایرانی</i>\n\n" +
        mood.emoji + " <b>" + mood.label + "</b>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
        "🎯 <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" +
        "🚫 <b>مسدود شده:</b> <code>" + p.blockPercent + "%</code>\n\n" +
        makeBar(p.accessPercent / 10) + "\n\n" +
        "📡 <b>پایگاه داده:</b> OONI\n🔬 <b>تعداد تست:</b> <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n" +
        "🕒 <b>آخرین بروزرسانی:</b> " + getIranTime() + "\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
        "🤖 <b>@Radarinternetiranbot</b>";
    } else {
      caption = "<b>🛰 رادار اینترنت ایران</b>\n\n⏳ <b>در حال جمع‌آوری داده...</b>\n\n🕒 " + getIranTime() + "  •  📅 " + getIranDate() + "\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\nبه‌زودی داده‌های زنده منتشر می‌شود.\n\n🤖 <b>@Radarinternetiranbot</b>";
    }
    const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const lastMsgId = STATS ? await STATS.get("msg_id:" + ch) : null;
        if (lastMsgId) {
          await fetch(TG + "/deleteMessage", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: ch, message_id: parseInt(lastMsgId) }) }).catch(() => {});
        }
        const r = await fetch(TG + "/sendPhoto", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: ch, photo: chartUrl, caption: caption, parse_mode: "HTML" })
        });
        const d = await r.json();
        if (d.ok && d.result) {
          await fetch(TG + "/pinChatMessage", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: ch, message_id: d.result.message_id, disable_notification: true }) }).catch(() => {});
          if (STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
        } else {
          // Fallback: اگر عکس رد شد، متن بفرست
          await fetch(TG + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: ch, text: caption, parse_mode: "HTML" }) }).catch(() => {});
        }
      } catch(e) { console.log("Channel status error for " + ch + ": " + e.message); }
    }
  } catch(e) { console.log("Channel status general error: " + e.message); }
}

// ==================== Check Version ====================
async function checkVersion(STATS, userId, TG, chatId) {
  if (!STATS) return;
  try {
    const userVer = await STATS.get("v:" + userId);
    if (userVer !== CURRENT_VERSION) {
      await sendMessage(TG, chatId,
        "🎉 <b>خبر خوب! ربات آپدیت شد</b>\n\n" +
        "✨ <b>قابلیت‌های جدید نسخه ۷.۰:</b>\n\n" +
        "🎰 <b>اسپین روزانه</b> — روزانه جایزه بگیر\n" +
        "🔥 <b>سیستم Streak</b> — فعالیت زنجیره‌ای\n" +
        "💎 <b>نشان‌ها</b> — Achievement های جدید\n" +
        "📊 <b>گزارش شخصی</b> — /mystats\n" +
        "🔔 <b>اشتراک ISP</b> — خبر از تغییرات\n" +
        "🔮 <b>پیش‌بینی اینترنت</b> — /predict\n" +
        "🆚 <b>مقایسه دو اپراتور</b> — /vs op1 op2\n" +
        "🕰 <b>یک سال پیش امروز</b> — /yearago\n" +
        "🚨 <b>هشدار خودکار</b> — اطلاع از افت کیفیت\n" +
        "🏆 <b>سنجاق جدول هفتگی</b> — قهرمانان هفته\n\n" +
        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
        "🔹 برای مشاهده راهنما: /help",
        { parse_mode: "HTML" });
      await STATS.put("v:" + userId, CURRENT_VERSION);
    }
  } catch(e) {}
}

// ==================== Handle Update ====================
async function handleUpdate(update, TG, STATS) {
  if (TG) setTGGlobal(TG);
  
  if (update.my_chat_member) {
    const chatId = update.my_chat_member.chat.id;
    const chatType = update.my_chat_member.chat.type;
    if (chatType === "group" || chatType === "supergroup" || chatType === "channel") {
      await trackChat(STATS, chatId);
    }
    return;
  }
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = String(msg.from.id);
  const userName = msg.from.first_name || msg.from.username || ("کاربر " + userId.slice(-4));

  if (msg.chat.type !== "private") {
    await trackChat(STATS, chatId);
    if (text !== "/admin" && text !== ADMIN_PASS) return;
  }
  if (STATS) await STATS.put("name:" + userId, userName);

  if (text === "/admin") {
    await sendMessage(TG, chatId,
      "🔐 <b>ورود به پنل مدیریت</b>\n\nبرای ادامه، رمز ادمین را ارسال کنید.\n\n⚠️ <i>این بخش فقط برای مدیر سیستم است.</i>",
      { parse_mode: "HTML" });
    return;
  }
  if (text === ADMIN_PASS) {
    const dash = "https://radar-bot.royal-trust-ir-official.workers.dev/admin?pass=" + ADMIN_PASS;
    await sendMessage(TG, chatId,
      "✅ <b>رمز تأیید شد!</b>\n\n🔗 <a href='" + dash + "'>👉 ورود به داشبورد ادمین</a>\n\n<i>لینک را در مرورگر باز کنید.</i>",
      { parse_mode: "HTML" });
    return;
  }

  // ====== بررسی عضویت اجباری ======
  const inCh1 = await checkMember(TG, userId, CH1);
  const inCh2 = await checkMember(TG, userId, CH2);
  const inCh3 = await checkMember(TG, userId, CH3);
  if (!inCh1 || !inCh2 || !inCh3) {
    await sendMessage(TG, chatId,
      "🔒 <b>دسترسی محدود</b>\n\nبرای استفاده از ربات، ابتدا در بخش‌های زیر عضو شوید:\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📡 <b>کانال رادار اینترنت</b>\n     <i>آمار زنده و گزارش‌های روزانه</i>\n\n" +
      "👑 <b>کانال رویال تراست</b>\n     <i>اخبار و اطلاع‌رسانی</i>\n\n" +
      "💬 <b>گروه رادار اینترنت</b>\n     <i>پرسش و پاسخ و تبادل نظر</i>\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "پس از عضویت در هر سه، دوباره <b>/start</b> را بزنید 👇",
      { parse_mode: "HTML", inline_keyboard: [
        [{ text: "📡 عضویت در کانال رادار اینترنت", url: "https://t.me/radarinternetiran" }],
        [{ text: "👑 عضویت در کانال رویال تراست", url: "https://t.me/royal_trust_ir_official" }],
        [{ text: "💬 عضویت در گروه رادار اینترنت", url: "https://t.me/radarinternetirangruop" }]
      ] });
    return;
  }

  await trackUser(STATS, userId, userName);
  await ensureTodaySnapshot(STATS);
  await checkVersion(STATS, userId, TG, chatId);

  // بررسی Streak فقط برای /start یا دستورات اصلی
  if (text === "/start" || text === "/status" || text === "/today" || text === "/spin") {
    const streak = await checkStreak(STATS, userId);
    if (streak && streak.isNew && streak.msg) {
      setTimeout(async () => {
        try { await sendMessage(TG, chatId, streak.msg + "\n\n🔥 <b>زنجیره:</b> " + streak.count + " روز", { parse_mode: "HTML" }); } catch(e) {}
      }, 100);
    }
  }

  if (text.startsWith("/start ref_")) {
    const refCode = text.replace("/start ref_", "").trim();
    if (refCode && refCode !== userId && STATS) {
      const already = await getReferrer(STATS, userId);
      if (!already) {
        await STATS.put("ref:" + userId, refCode);
        await addPoints(STATS, refCode, 10);
        await addPoints(STATS, userId, 5);
        // شمارش دعوت‌ها
        const invKey = "invites:" + refCode;
        const invCount = parseInt(await STATS.get(invKey) || "0") + 1;
        await STATS.put(invKey, String(invCount));
        if (invCount === 5) await awardBadge(STATS, refCode, "inviter_5", TG);
        if (invCount === 10) await awardBadge(STATS, refCode, "inviter_10", TG);
        await sendMessage(TG, chatId, "🎉 <b>خوش آمدی " + userName + "!</b>\n\n🎁 <b>۵ امتیاز هدیه</b> گرفتی!\n✨ دوستت هم <b>۱۰ امتیاز</b> گرفت.", { parse_mode: "HTML" });
      }
    }
  }

  // ============ دستورات ============
  if (text === "/start" || text.startsWith("/start ")) {
    await addPoints(STATS, userId, 1);
    const pts = await getPoints(STATS, userId);
    const rank = getVipRank(pts);
    await sendMessage(TG, chatId,
      "👋 <b>سلام " + userName + " عزیز!</b>\n\n" +
      "به <b>🛰 رادار اینترنت</b> خوش اومدی\n" +
      "<i>دقیق‌ترین پایشگر اینترنت ایران</i>\n\n" +
      "🏆 <b>امتیاز:</b> <code>" + pts + "</code>\n" +
      "⭐ <b>سطح:</b> " + rank.emoji + " " + rank.name + "\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📊 <b>گزارش‌ها</b>\n├ /status · /work · /score · /vs\n\n" +
      "🆚 <b>مقایسه</b>\n├ /compare · /top · /isp · /world\n\n" +
      "📈 <b>نمودارها</b>\n├ /today · /history · /trend · /chart · /pie · /map\n\n" +
      "🎮 <b>سرگرمی</b>\n├ 🎰 /spin — اسپین روزانه\n├ 🏆 /leaderboard — صدرنشین‌ها\n├ 🎁 /invite — دعوت دوستان\n├ 💎 /badges — نشان‌های من\n└ 📊 /mystats — گزارش شخصی\n\n" +
      "🔮 <b>ویژه</b>\n├ /predict — پیش‌بینی اینترنت\n├ /yearago — یک سال پیش امروز\n└ /subscribe — اشتراک اپراتور\n\n" +
      "⚡ <b>ابزارها</b>\n├ /ping · /speed · /best · /api\n└ /check twitter.com — چک سایت خاص\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "💬 <b>گروه:</b> @radarinternetirangruop",
      { parse_mode: "HTML" });

  // ====== SPIN ======
  } else if (text === "/spin" || text === "🎰 اسپین") {
    await handleSpin(STATS, userId, TG, chatId);

  // ====== BADGES ======
  } else if (text === "/badges" || text === "💎 نشان‌ها") {
    const badges = await getUserBadges(STATS, userId);
    let out = "💎 <b>نشان‌های شما</b>\n\n👤 <b>" + userName + "</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    let unlocked = 0;
    for (const [id, b] of Object.entries(BADGES)) {
      const has = badges.includes(id);
      if (has) unlocked++;
      out += (has ? "✅ " : "🔒 ") + b.emoji + " <b>" + b.name + "</b>\n";
      out += "   <i>" + b.desc + "</i>\n\n";
    }
    out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";
    out += "📊 <b>" + unlocked + "/" + Object.keys(BADGES).length + "</b> نشان unlocked";
    await sendMessage(TG, chatId, out, { parse_mode: "HTML" });

  // ====== MYSTATS ======
  } else if (text === "/mystats" || text === "📊 گزارش من") {
    const pts = await getPoints(STATS, userId);
    const rank = getVipRank(pts);
    const badges = await getUserBadges(STATS, userId);
    const streakRaw = await STATS.get("streak:" + userId);
    const streak = streakRaw ? JSON.parse(streakRaw) : { count: 0 };
    const invRaw = await STATS.get("invites:" + userId);
    const invCount = parseInt(invRaw || "0");
    const lbRaw = await STATS.get("leaderboard");
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    const pos = lb.findIndex(x => x.id === userId) + 1;
    await sendMessage(TG, chatId,
      "📊 <b>گزارش شخصی شما</b>\n\n👤 <b>" + userName + "</b>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "🏆 <b>امتیاز:</b> <code>" + pts + "</code>\n" +
      "⭐ <b>سطح:</b> " + rank.emoji + " " + rank.name + "\n" +
      "📊 <b>رتبه:</b> <code>#" + (pos || "?") + "</code> از " + lb.length + "\n" +
      "🔥 <b>زنجیره:</b> <code>" + (streak.count || 0) + " روز</code>\n" +
      "🎁 <b>دعوت‌های موفق:</b> <code>" + invCount + "</code>\n" +
      "💎 <b>نشان‌ها:</b> <code>" + badges.length + "/" + Object.keys(BADGES).length + "</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "💡 <i>هر دستور ۱ امتیاز، هر دعوت ۱۰ امتیاز!</i>",
      { parse_mode: "HTML" });

  // ====== SUBSCRIBE ======
  } else if (text === "/subscribe" || text === "🔔 اشتراک") {
    await sendMessage(TG, chatId,
      "🔔 <b>اشتراک اپراتور</b>\n\nهر بار که کیفیت اپراتور انتخابی تغییر کرد، بهت اطلاع می‌دیم.\n\n" +
      "📌 <b>مثال:</b>\n<code>/subscribe ایرانسل</code>\n<code>/subscribe مخابرات</code>\n<code>/subscribe شاتل</code>\n\n" +
      "🔕 <b>لغو:</b> <code>/unsubscribe ایرانسل</code>",
      { parse_mode: "HTML" });
  } else if (text.startsWith("/subscribe ")) {
    const q = text.replace("/subscribe ", "").trim();
    await handleSubscribe(STATS, userId, q, TG, chatId);
  } else if (text.startsWith("/unsubscribe ")) {
    const q = text.replace("/unsubscribe ", "").trim();
    await handleUnsubscribe(STATS, userId, q, TG, chatId);

  // ====== VS OPERATORS ======
  } else if (text.startsWith("/vs ")) {
    const parts = text.replace("/vs ", "").trim().split(/\s+/);
    if (parts.length >= 2) {
      await sendMessage(TG, chatId, "🔄 <i>در حال مقایسه دو اپراتور...</i>");
      const report = await makeVsOperatorReport(parts[0], parts[1]);
      await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
    } else {
      await sendMessage(TG, chatId, "💡 مثال:\n<code>/vs ایرانسل مخابرات</code>", { parse_mode: "HTML" });
    }
  } else if (text === "/vs") {
    await sendMessage(TG, chatId, "🔄 <i>در حال مقایسه با دیروز...</i>");
    const report = await makeVsReport(STATS);
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });

  // ====== CHECK SITE ======
  } else if (text.startsWith("/check ")) {
    await addPoints(STATS, userId, 1);
    const site = text.replace("/check ", "").trim();
    let url = site;
    if (!url.startsWith("http")) url = "https://" + url;
    await sendMessage(TG, chatId, "🔍 <i>در حال بررسی " + site + "...</i>");
    try {
      const ok = await checkAccessible(url);
      const t = ok ? await pingSite(url) : null;
      if (ok) {
        await sendMessage(TG, chatId,
          "✅ <b>" + site + "</b>\n\n" +
          "🟢 <b>قابل دسترسی از سرور</b>\n" +
          (t ? "📡 <b>پینگ:</b> <code>" + t + "ms</code>\n" : "") +
          "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚠️ <i>این تست از سرور خارج انجام می‌شود؛ ممکن است با دسترسی کاربر ایرانی متفاوت باشد.</i>\n\n🕒 " + getIranTime(),
          { parse_mode: "HTML" });
      } else {
        await sendMessage(TG, chatId,
          "🚫 <b>" + site + "</b>\n\n" +
          "🔴 <b>از سرور قابل دسترسی نیست</b>\n\n🕒 " + getIranTime(),
          { parse_mode: "HTML" });
      }
    } catch(e) {
      await sendMessage(TG, chatId, "❌ خطا در بررسی.");
    }

  // ====== PREDICT ======
  } else if (text === "/predict") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔮 <i>در حال تحلیل...</i>");
    const report = await makePrediction();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });

  // ====== YEAR AGO ======
  } else if (text === "/yearago") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🕰 <i>در حال جستجو در آرشیو...</i>");
    const report = await makeYearAgoReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });

  // ====== LIVE MODE ======
  } else if (text === "/live") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔴 <i>حالت زنده فعال شد...</i>");
    // یک گزارش لحظه‌ای
    const p = await getOONIData();
    if (p.hasData) {
      const mood = getStatusMood(p.blockPercent);
      await sendMessage(TG, chatId,
        "🔴 <b>وضعیت زنده</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n" +
        "✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" +
        makeBar(p.accessPercent / 10) + "\n\n🕒 " + getIranTime(),
        { parse_mode: "HTML" });
    } else {
      await sendMessage(TG, chatId, "⏳ داده زنده در دسترس نیست.");
    }

  // ====== LEADERBOARD ======
  } else if (text === "/leaderboard" || text === "🏆 صدرنشین‌ها") {
    const lbRaw = await STATS.get("leaderboard");
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    let out = "🏆 <b>صدرنشین‌های رادار</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    if (lb.length === 0) out += "🥺 هنوز کسی امتیاز نگرفته!\n\n<b>اولین نفر باش!</b> 🚀";
    else {
      lb.slice(0, 10).forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
        const rank = getVipRank(u.p);
        out += medal + " " + rank.emoji + " <b>" + (u.n || u.id).substring(0, 20) + "</b>  →  <code>" + u.p + "</code>\n";
      });
    }
    out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💪 با /invite دوستانت رو دعوت کن!";
    await sendMessage(TG, chatId, out, { parse_mode: "HTML" });

  } else if (text === "/myrank") {
    const pts = await getPoints(STATS, userId);
    const lbRaw = await STATS.get("leaderboard");
    const lb = lbRaw ? JSON.parse(lbRaw) : [];
    const rank = lb.findIndex(x => x.id === userId) + 1;
    const vip = getVipRank(pts);
    let medal = "🎖";
    if (rank === 1) medal = "🥇";
    else if (rank === 2) medal = "🥈";
    else if (rank === 3) medal = "🥉";
    await sendMessage(TG, chatId,
      "🎯 <b>کارت امتیاز شما</b>\n\n👤 <b>نام:</b> " + userName + "\n" +
      "⭐ <b>سطح:</b> " + vip.emoji + " " + vip.name + "\n" +
      "🏆 <b>امتیاز:</b> <code>" + pts + "</code>\n" +
      "📊 <b>رتبه:</b> " + medal + " <b>#" + (rank || "?") + "</b>\n" +
      "👥 <b>از:</b> " + lb.length + " کاربر\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💡 <b>کسب امتیاز:</b>\n" +
      "• هر دستور → <b>+1</b>\n• دعوت دوست → <b>+10</b>\n• اسپین روزانه → <b>۱ تا ۵۰</b>\n",
      { parse_mode: "HTML" });

  } else if (text === "/invite") {
    const link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + userId;
    const pts = await getPoints(STATS, userId);
    const invRaw = await STATS.get("invites:" + userId);
    const invCount = parseInt(invRaw || "0");
    await sendMessage(TG, chatId,
      "🎁 <b>دعوت از دوستان</b>\n\n👤 <b>دعوت‌کننده:</b> " + userName + "\n" +
      "🏆 <b>امتیاز:</b> <code>" + pts + "</code>\n" +
      "👥 <b>دعوت موفق:</b> <code>" + invCount + "</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🔗 <b>لینک اختصاصی:</b>\n\n<code>" + link + "</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💰 <b>پاداش:</b>\n" +
      "🎯 شما: <b>+10 امتیاز</b>\n🎯 دوستت: <b>+5 امتیاز</b>\n\n" +
      "💎 <i>با ۱۰ دعوت، نشان «پادشاه دعوت» می‌گیری!</i>",
      { parse_mode: "HTML" });

  } else if (text === "/api") {
    const base = "https://radar-bot.royal-trust-ir-official.workers.dev/api";
    await sendMessage(TG, chatId,
      "🔌 <b>API عمومی رادار</b>\n<i>رایگان برای همه</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📡 <b>Endpoints:</b>\n\n" +
      "🔹 <code>" + base + "/status</code>\n🔹 <code>" + base + "/operators</code>\n" +
      "🔹 <code>" + base + "/top</code>\n🔹 <code>" + base + "/history</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💡 خروجی: <b>JSON</b>",
      { parse_mode: "HTML" });

  } else if (text === "/status" || text === "/status full") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔄 <i>در حال دریافت...</i>");
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
    await sendMessage(TG, chatId, "🔄 <i>در حال مقایسه...</i>");
    const report = await makeCompareReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/top") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔄 <i>در حال رتبه‌بندی...</i>");
    const report = await makeTopReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/isp") {
    await sendMessage(TG, chatId, "🔍 <b>بررسی ISP خاص</b>\n\n📱 <code>/isp ایرانسل</code>\n☎️ <code>/isp مخابرات</code>\n🌐 <code>/isp شاتل</code>", { parse_mode: "HTML" });
  } else if (text.startsWith("/isp ")) {
    await addPoints(STATS, userId, 1);
    const q = text.replace("/isp ", "").trim();
    await sendMessage(TG, chatId, "🔍 <i>در حال جستجو...</i>");
    const report = await makeISPReport(q);
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/world") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🌍 <i>در حال دریافت...</i>");
    const report = await makeWorldReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/today") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📊 <i>در حال ساخت نمودار...</i>");
    try {
      const c = await makeTodayChart(STATS);
      await sendPhoto(TG, chatId, c.url, c.caption);
    } catch(e) {
      await sendMessage(TG, chatId, "❌ خطا در ساخت نمودار. دوباره تلاش کنید.");
      console.log("today error: " + e.message);
    }
  } else if (text === "/history") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📅 <i>در حال ساخت نمودار...</i>");
    try {
      const c = await makeHistoryChart();
      if (c.url) await sendPhoto(TG, chatId, c.url, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
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
    await sendMessage(TG, chatId, "⏳ <i>در حال پینگ...</i>");
    const report = await makePingReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/filtering") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔍 <i>در حال بررسی...</i>");
    const report = await makeFilteringReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/sites") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🌐 <i>در حال بررسی...</i>");
    const report = await makeSitesReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/chart") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📊 <i>در حال ساخت...</i>");
    try {
      const c = await makeBarChart();
      if (c.url) await sendPhoto(TG, chatId, c.url, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/pie") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🥧 <i>در حال ساخت...</i>");
    try {
      const c = await makePieChart();
      if (c.url) await sendPhoto(TG, chatId, c.url, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/trend") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📈 <i>در حال ترسیم...</i>");
    try {
      const c = await makeTrendChart();
      if (c.url) await sendPhoto(TG, chatId, c.url, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/map") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🗺 <i>در حال ترسیم...</i>");
    try {
      const c = await makeMapChart();
      if (c.url) await sendPhoto(TG, chatId, c.url, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/help") {
    await sendMessage(TG, chatId,
      "📚 <b>راهنمای کامل رادار</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📊 <b>گزارش:</b> <code>/status · /work · /score · /vs</code>\n\n" +
      "🆚 <b>مقایسه:</b> <code>/compare · /top · /isp · /world</code>\n\n" +
      "📈 <b>نمودار:</b> <code>/today · /history · /trend · /chart · /pie · /map</code>\n\n" +
      "🎮 <b>سرگرمی:</b>\n<code>/spin · /leaderboard · /myrank · /invite · /badges · /mystats</code>\n\n" +
      "🔮 <b>ویژه:</b>\n<code>/predict · /yearago · /subscribe · /check [site]</code>\n\n" +
      "⚡ <b>ابزار:</b>\n<code>/ping · /speed · /best · /api · /live</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💬 <b>گروه:</b> @radarinternetirangruop\n🤖 <b>ربات:</b> @Radarinternetiranbot",
      { parse_mode: "HTML" });
  }
}

// ==================== Check Member ====================
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

// ==================== Public API ====================
async function handleAPI(url, STATS) {
  const cors = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    if (url.pathname === "/api/status") {
      const p = await getOONIData();
      const ripe = await fetchRIPE();
      return new Response(JSON.stringify({
        ok: true,
        data: {
          block_percent: p.hasData ? p.blockPercent : null,
          access_percent: p.hasData ? p.accessPercent : null,
          total_measurements: p.totalMs,
          has_data: p.hasData,
          ripe_visibility: ripe && ripe.data ? ripe.data.visibility : null,
          date_iran: getIranDate(), date_greg: getGregDate(), time_iran: getIranTime(),
          source: "OONI + RIPE"
        }
      }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api/operators") {
      const p = await getOONIData();
      const ops = [];
      for (const [asn, d] of Object.entries(p.asnData)) {
        const name = await asnNameAuto(asn);
        ops.push({ asn: "AS" + asn, name, free_percent: Math.round((d.ok / d.total) * 100), tests: d.count });
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
          const name = await asnNameAuto(asn);
          ops.push({ name, rate: Math.round((d.ok / d.total) * 100), tests: d.count });
        }
      }
      ops.sort((a, b) => b.rate - a.rate);
      return new Response(JSON.stringify({ ok: true, period: "7 days", best: ops.slice(0, 5), worst: ops.slice(-5).reverse() }, null, 2), { headers: cors });
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
        ok: true, name: "Radar Internet Public API", version: "7.0",
        endpoints: { status: "/api/status", operators: "/api/operators", top: "/api/top", history: "/api/history" },
        source: "OONI, RIPE", free: true
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
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
    const vip = getVipRank(u.p);
    lbHtml += "<tr><td>" + medal + "</td><td><b>" + name + "</b></td><td>" + vip.emoji + " " + u.p + "</td></tr>";
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
    "<div class='card'><div class='head'>🔗 لینک‌های مفید</div>" +
    "<p><a href='/api'>/api</a> — لیست endpoints</p>" +
    "<p><a href='/api/status'>/api/status</a> — وضعیت</p>" +
    "<p><a href='/weeklypin'>/weeklypin</a> — ارسال دستی جدول هفتگی</p>" +
    "<p><a href='/sendreport'>/sendreport</a> — ارسال دستی گزارش</p></div>" +
    "</body></html>";
            }
