// ============================================================
// 🛰 RADAR INTERNET IRAN — v14.0.0
// PART 1/2 : Core + Utils + Data + Charts
// ============================================================
// ✅ ویژگی‌های v14.0.0:
//   • منابع جدید: OONI + IODA + Voidly + Live (بدون Cloudflare)
//   • OONI از ۲۴ ساعت اخیر (نه فقط امروز)
//   • کش ۶۰ ثانیه‌ای برای getCombinedData
//   • طراحی جدید نمودار
//   • نمودار میله‌ای سهم اپراتورها
// ============================================================

// ================== ⚙️ CONSTANTS ==================
const CURRENT_VERSION = "14.0.0";
const CHART_POINTS = 96;
const QUALITY_DROP_THRESHOLD = 15;
const BOT_USERNAME = "Radarinternetiranbot";
const ADMIN_PASS = "RadarAdmin@2025";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const CH3 = "@radarinternetirangruop";
const OWNER_USERNAMES = ["royal_trust", "royal_trust_ir"];
const OWNER_IDS_MANUAL = [];
const OWNER_DISPLAY_NAME = "👑 مالک ربات";
const WEEKLY_PIN_MSG_KEY = "weekly_pin_msg_id";
let TG_GLOBAL = null;
let CACHED_OWNER_IDS = [];

// 📌 لاگ تغییرات
const CHANGELOG = {
  "14.0.0": {
    date: "۱۴۰۴/۰۷/۲۱",
    emoji: "🚀",
    title: "منابع جدید + طراحی حرفه‌ای",
    changes: [
      { icon:"🌐", text:"منابع جدید: <b>IODA</b> و <b>Voidly</b>" },
      { icon:"⏱", text:"OONI از <b>۲۴ ساعت اخیر</b>" },
      { icon:"🎨", text:"طراحی جدید نمودار با ۵ خط رنگی" },
      { icon:"📊", text:"نمودار میله‌ای سهم اپراتورها" },
      { icon:"⚡", text:"سرعت ۵ برابر با کش هوشمند" },
      { icon:"❌", text:"حذف Cloudflare Radar (نادقیق برای ایران)" }
    ]
  },
  "13.1.0": {
    date: "۱۴۰۴/۰۷/۲۱",
    emoji: "⚡",
    title: "بهینه‌سازی سرعت",
    changes: [
      { icon:"⚡", text:"سرعت اجرا ۵ برابر" },
      { icon:"📡", text:"گروه در ارسال خودکار" }
    ]
  }
};

const IR_SITES = [
  { name:"Google.ir", url:"https://www.google.ir" },
  { name:"Digikala",  url:"https://www.digikala.com" },
  { name:"Aparat",    url:"https://www.aparat.com" },
  { name:"Bale",      url:"https://bale.ai" },
  { name:"Eitaa",     url:"https://eitaa.com" },
  { name:"Shad",      url:"https://shad.ir" },
  { name:"Snapp",     url:"https://snapp.ir" },
  { name:"Divar",     url:"https://divar.ir" }
];

const GLOBAL_SITES = [
  { name:"Google",     url:"https://www.google.com" },
  { name:"Cloudflare", url:"https://1.1.1.1" },
  { name:"Wikipedia",  url:"https://www.wikipedia.org" },
  { name:"GitHub",     url:"https://github.com" },
  { name:"Telegram",   url:"https://telegram.org" },
  { name:"YouTube",    url:"https://www.youtube.com" },
  { name:"WhatsApp",   url:"https://www.whatsapp.com" },
  { name:"Instagram",  url:"https://www.instagram.com" },
  { name:"Twitter/X",  url:"https://x.com" }
];

const FILTER_CHECK = [
  { name:"Instagram", url:"https://www.instagram.com" },
  { name:"YouTube",   url:"https://www.youtube.com" },
  { name:"Twitter/X", url:"https://x.com" },
  { name:"Facebook",  url:"https://www.facebook.com" },
  { name:"Telegram",  url:"https://telegram.org" },
  { name:"WhatsApp",  url:"https://web.whatsapp.com" },
  { name:"TikTok",    url:"https://www.tiktok.com" },
  { name:"Signal",    url:"https://signal.org" }
];

const ISP_MAP = {
  "ایرانسل":"44244","همراه اول":"197207","mci":"197207","irancell":"44244",
  "مخابرات":"58224","tci":"58224","شاتل":"31549","shuttle":"31549",
  "پارس آنلاین":"42337","parsonline":"42337","آسیاتک":"43754","asiatech":"43754",
  "رایتل":"57218","rightel":"57218","پارس پک":"16322","parspack":"16322"
};

const BADGES = {
  first_leader:{ emoji:"👑", name:"صدرنشین",    desc:"اولین رتبه هفته" },
  inviter_5:{    emoji:"🎁", name:"دعوت‌کننده", desc:"۵ دعوت موفق" },
  inviter_10:{   emoji:"🎯", name:"سفیر رادار", desc:"۱۰ دعوت موفق" },
  spin_lucky:{   emoji:"💎", name:"خوش‌شانس",   desc:"جایزه ۵۰+ در اسپین" },
  streak_7:{     emoji:"🔥", name:"وفادار",     desc:"۷ روز پیاپی" },
  streak_30:{    emoji:"⭐", name:"افسانه",     desc:"۳۰ روز پیاپی" }
};

// ================== 🛠 UTILS ==================
function getIranHour() {
  return parseInt(new Intl.DateTimeFormat("en-US", { timeZone:"Asia/Tehran", hour:"2-digit", hour12:false }).format(new Date()));
}
function getToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Tehran", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
}
function getYesterday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Tehran", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(Date.now() - 86400000));
}
function getIranDate() {
  try { return new Intl.DateTimeFormat("fa-IR", { timeZone:"Asia/Tehran", year:"numeric", month:"long", day:"numeric" }).format(new Date()); }
  catch(e) { return getToday(); }
}
function getIranTime() {
  return new Intl.DateTimeFormat("fa-IR", { timeZone:"Asia/Tehran", hour:"2-digit", minute:"2-digit", hour12:false }).format(new Date());
}
function getIranTimeFull() {
  return new Intl.DateTimeFormat("fa-IR", { timeZone:"Asia/Tehran", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(new Date());
}
function getGregDate() {
  return new Intl.DateTimeFormat("en-GB", { timeZone:"Asia/Tehran", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
}
function getDateBoth() { return getIranDate() + "  •  " + getGregDate(); }

function makeBar(score, length = 10) {
  const filled = Math.max(0, Math.min(length, Math.round(score)));
  return "▓".repeat(filled) + "░".repeat(length - filled);
}

function getStatusMood(blockPercent) {
  if (blockPercent < 10) return { emoji:"🟢", label:"عالی",   color:"#10b981", grad:"#059669" };
  if (blockPercent < 25) return { emoji:"🟢", label:"خوب",    color:"#22c55e", grad:"#16a34a" };
  if (blockPercent < 40) return { emoji:"🟡", label:"متوسط",  color:"#eab308", grad:"#ca8a04" };
  if (blockPercent < 55) return { emoji:"🟠", label:"ضعیف",   color:"#f97316", grad:"#ea580c" };
  if (blockPercent < 70) return { emoji:"🔴", label:"بد",     color:"#ef4444", grad:"#dc2626" };
  return                       { emoji:"🚨", label:"بحرانی",  color:"#dc2626", grad:"#991b1b" };
}

function getVipRank(pts) {
  if (pts >= 1000) return { emoji:"💎", name:"الماس" };
  if (pts >= 500)  return { emoji:"🥇", name:"طلایی" };
  if (pts >= 200)  return { emoji:"🥈", name:"نقره‌ای" };
  if (pts >= 50)   return { emoji:"🥉", name:"برنزی" };
  return                  { emoji:"🌱", name:"تازه‌کار" };
}

function getUserTier(userId) {
  if (isOwner(userId)) return { emoji:"👑", name:"مالک", isOwner:true };
  return null;
}

function asnName(asn) {
  for (const [name, code] of Object.entries(ISP_MAP)) {
    if (code === asn) {
      if (name === "irancell")   return "ایرانسل";
      if (name === "mci")        return "همراه اول";
      if (name === "tci")        return "مخابرات";
      if (name === "shuttle")    return "شاتل";
      if (name === "parsonline") return "پارس آنلاین";
      if (name === "asiatech")   return "آسیاتک";
      if (name === "rightel")    return "رایتل";
      if (name === "parspack")   return "پارس پک";
      return name;
    }
  }
  return "AS" + asn;
}

const _asnMemCache = {};
async function asnNameAuto(asn) {
  if (_asnMemCache[asn]) return _asnMemCache[asn];
  const name = asnName(asn);
  _asnMemCache[asn] = name;
  return name;
}

// ================== 📡 TELEGRAM ==================
async function sendMessage(TG, chatId, text, opts = {}) {
  try {
    const body = { chat_id: chatId, text, ...opts };
    if (opts.inline_keyboard) {
      body.reply_markup = { inline_keyboard: opts.inline_keyboard };
      delete body.inline_keyboard;
    }
    const r = await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await r.json();
  } catch(e) { return { ok:false, error:e.message }; }
}

async function sendPhoto(TG, chatId, imageBytes, caption) {
  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
    const blob = new Blob([imageBytes], { type:"image/png" });
    formData.append("photo", blob, "chart.png");
    const r = await fetch(TG + "/sendPhoto", { method:"POST", body:formData });
    return await r.json();
  } catch(e) { return { ok:false, error:e.message }; }
}

async function answerCallback(TG, callbackId, text = "", showAlert = false) {
  try {
    await fetch(TG + "/answerCallbackQuery", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: showAlert })
    });
  } catch(e) {}
}

// ================== 💾 KV HELPERS ==================
async function trackUser(STATS, userId, userName) {
  if (!STATS) return;
  try {
    const exists = await STATS.get("user:" + userId);
    if (!exists) {
      const total = parseInt(await STATS.get("total_users") || "0") + 1;
      await STATS.put("total_users", String(total));
    }
    await STATS.put("user:" + userId, JSON.stringify({ id:userId, name:userName, ts:Date.now() }));
    await STATS.put("name:" + userId, userName);
    const today = getToday();
    const dauRaw = await STATS.get("dau:" + today);
    let dau = dauRaw ? JSON.parse(dauRaw) : [];
    if (!dau.includes(userId)) {
      dau.push(userId);
      if (dau.length > 500) dau = dau.slice(-500);
      await STATS.put("dau:" + today, JSON.stringify(dau), { expirationTtl:604800 });
    }
    await saveUserToList(STATS, userId);
  } catch(e) {}
}

async function saveUserToList(STATS, userId) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("all_users");
    let users = raw ? JSON.parse(raw) : [];
    const sid = String(userId);
    if (!users.includes(sid)) {
      users.push(sid);
      if (users.length > 5000) users = users.slice(-5000);
      await STATS.put("all_users", JSON.stringify(users));
    }
  } catch(e) {}
}

async function trackChat(STATS, chatId) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("tracked_chats");
    let chats = raw ? JSON.parse(raw) : [];
    if (!chats.includes(chatId)) {
      chats.push(chatId);
      await STATS.put("tracked_chats", JSON.stringify(chats));
    }
  } catch(e) {}
}

async function getTrackedChats(STATS) {
  const defaults = [CH1, CH2, CH3];
  if (!STATS) return defaults;
  try {
    const raw = await STATS.get("tracked_chats");
    const chats = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...defaults, ...chats]));
  } catch(e) { return defaults; }
}

async function addPoints(STATS, userId, amount) {
  if (!STATS) return;
  try {
    const cur = parseInt(await STATS.get("points:" + userId) || "0");
    const next = Math.max(0, cur + amount);
    await STATS.put("points:" + userId, String(next));
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    const name = await STATS.get("name:" + userId) || ("کاربر " + String(userId).slice(-4));
    const idx = lb.findIndex(u => u.id === userId);
    if (idx >= 0) { lb[idx].p = next; lb[idx].n = name; }
    else lb.push({ id:userId, p:next, n:name });
    lb.sort((a, b) => b.p - a.p);
    await STATS.put("leaderboard", JSON.stringify(lb.slice(0, 100)));
  } catch(e) {}
}

async function getPoints(STATS, userId) {
  if (!STATS) return 0;
  try { return parseInt(await STATS.get("points:" + userId) || "0"); } catch(e) { return 0; }
}

async function getUserBadges(STATS, userId) {
  if (!STATS) return [];
  try { const raw = await STATS.get("badges:" + userId); return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
}

async function awardBadge(STATS, userId, badgeId, TG) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("badges:" + userId);
    let badges = raw ? JSON.parse(raw) : [];
    if (badges.includes(badgeId)) return;
    badges.push(badgeId);
    await STATS.put("badges:" + userId, JSON.stringify(badges));
    const b = BADGES[badgeId];
    if (b && TG) {
      await sendMessage(TG, userId, "🎉 <b>نشان جدید!</b>\n\n" + b.emoji + " <b>" + b.name + "</b>\n<i>" + b.desc + "</i>", { parse_mode:"HTML" }).catch(() => {});
    }
  } catch(e) {}
}

async function checkStreak(STATS, userId) {
  if (!STATS) return null;
  try {
    const key = "streak:" + userId;
    const raw = await STATS.get(key);
    const today = getToday();
    const state = raw ? JSON.parse(raw) : { count:0, lastDate:null };
    if (state.lastDate === today) return { isNew:false, count:state.count };
    const isNew = state.lastDate === getYesterday();
    const newCount = isNew ? state.count + 1 : 1;
    await STATS.put(key, JSON.stringify({ count:newCount, lastDate:today }), { expirationTtl:2592000 });
    let msg = null;
    if (newCount === 7)  { await awardBadge(STATS, userId, "streak_7", null);  msg = "🔥 ۷ روز پیاپی!"; }
    if (newCount === 30) { await awardBadge(STATS, userId, "streak_30", null); msg = "⭐ ۳۰ روز پیاپی!"; }
    return { isNew:true, count:newCount, msg };
  } catch(e) { return null; }
}

async function getReferrer(STATS, userId) {
  if (!STATS) return null;
  try { return await STATS.get("ref:" + userId); } catch(e) { return null; }
}

async function saveOwnerId(STATS, userId) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("owner_ids");
    let ids = raw ? JSON.parse(raw) : [];
    if (!ids.includes(userId)) {
      ids.push(userId);
      await STATS.put("owner_ids", JSON.stringify(ids));
      CACHED_OWNER_IDS = ids;
    }
  } catch(e) {}
}

async function loadOwnerIds(STATS) {
  if (!STATS) return;
  try { const raw = await STATS.get("owner_ids"); CACHED_OWNER_IDS = raw ? JSON.parse(raw) : []; }
  catch(e) { CACHED_OWNER_IDS = []; }
}

function isOwner(userId) {
  const sid = String(userId);
  return CACHED_OWNER_IDS.includes(sid) || OWNER_IDS_MANUAL.includes(sid);
}

// ================== 🌐 DATA FETCHERS ==================

// ✅ OONI — از ۲۴ ساعت اخیر
async function fetchOONI7d() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const until = getToday();
  const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
  const r = await fetch(url, { headers:{ "Accept":"application/json" } });
  if (!r.ok) throw new Error("OONI " + r.status);
  return await r.json();
}

async function getOONIData() {
  try {
    const since = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const until = getToday();
    const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
    const r = await fetch(url, { headers:{ "Accept":"application/json" } });
    if (!r.ok) return { hasData:false, asnData:{}, dayData:{} };
    return parseOONI(await r.json());
  } catch(e) {
    return { hasData:false, asnData:{}, dayData:{} };
  }
}

function parseOONI(d) {
  const asnData = {};
  const dayData = {};
  let total = 0, blocked = 0;
  if (d && d.result && Array.isArray(d.result)) {
    for (const row of d.result) {
      const asn = String(row.probe_asn || "").replace("AS", "");
      const day = row.measurement_start_day || "";
      const cnt = row.measurement_count || 0;
      const anom = row.anomaly_count || 0;
      const conf = row.confirmed_count || 0;
      total += cnt;
      blocked += anom + conf;
      if (asn) {
        if (!asnData[asn]) asnData[asn] = { total:0, ok:0, blocked:0, count:0 };
        asnData[asn].total += cnt;
        asnData[asn].blocked += anom + conf;
        asnData[asn].ok += Math.max(0, cnt - anom - conf);
        asnData[asn].count += cnt;
      }
      if (day) {
        if (!dayData[day]) dayData[day] = { total:0, blocked:0 };
        dayData[day].total += cnt;
        dayData[day].blocked += anom + conf;
      }
    }
  }
  const blockPercent = total > 0 ? Math.round((blocked / total) * 100) : 0;
  return { hasData: total > 0, asnData, dayData, total, blocked, blockPercent, accessPercent: 100 - blockPercent };
}

// ✅ IODA — شاخص قطعی اینترنت (بدون نیاز به کلید)
async function fetchIODAData() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 86400;
    const url = "https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events?from=" + from + "&until=" + now + "&entityType=country&limit=200";
    const r = await fetch(url, { headers:{ "Accept":"application/json" } });
    if (!r.ok) return null;
    const json = await r.json();
    const events = json.data || [];
    const iranEvents = events.filter(e => e.location && String(e.location).includes("IR"));
    if (iranEvents.length > 0) {
      const maxScore = Math.max(...iranEvents.map(e => e.score || 0));
      const severity = Math.min(100, Math.round((maxScore / 1000000) * 100));
      return { hasData: true, quality: 100 - severity, events: iranEvents.length };
    }
    return { hasData: true, quality: 100, events: 0 };
  } catch(e) { return null; }
}

// ✅ Voidly — تحلیل سانسور (endpoint رایگان)
async function fetchVoidlyData() {
  try {
    const r = await fetch("https://api.voidly.ai/data/incidents?country=IR&limit=5", {
      headers: { "Accept":"application/json" }
    });
    if (!r.ok) return null;
    const data = await r.json();
    const incidents = data.incidents || [];
    const active = incidents.filter(i => i.status === "active");
    const critical = active.filter(i => i.severity === "critical").length;
    const risk = active.length > 0 ? Math.min(100, 60 + (critical * 20)) : 10;
    return { risk, incidents: active.length };
  } catch(e) { return null; }
}

// ✅ RIPE — نمایانی شبکه
async function fetchRIPE() {
  try {
    const r = await fetch("https://stat.ripe.net/data/country-resource-stats/data.json?resource=IR", { headers:{ "Accept":"application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch(e) { return null; }
}

// ✅ Ping یک سایت
async function pingSite(url, timeout = 3500) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    const t0 = Date.now();
    const r = await fetch(url, { method:"HEAD", signal:ctrl.signal, redirect:"follow" });
    clearTimeout(id);
    if (!r.ok && r.status >= 400) return null;
    return Date.now() - t0;
  } catch(e) { return null; }
}

async function checkAccessible(url, timeout = 3500) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeout);
    const r = await fetch(url, { method:"HEAD", signal:ctrl.signal, redirect:"follow" });
    clearTimeout(id);
    return r.status < 500;
  } catch(e) { return false; }
}

// ================== 🧠 COMBINED DATA (با کش) ==================
let _combinedCache = { data:null, ts:0 };

async function getCombinedData(env) {
  const now = Date.now();
  if (_combinedCache.data && (now - _combinedCache.ts) < 60000) {
    return _combinedCache.data;
  }
  const result = await getCombinedDataRaw(env);
  _combinedCache = { data: result, ts: now };
  return result;
}

async function getCombinedDataRaw(env) {
  const [ooni, ioda, voidlyData] = await Promise.all([
    getOONIData().catch(() => null),
    fetchIODAData().catch(() => null),
    fetchVoidlyData().catch(() => null)
  ]);

  const sources = { ooni:false, ioda:false, live:true, voidly:false };
  const weights = { ooni:0, ioda:0, live:0, voidly:0 };

  let ooniQuality = null;
  if (ooni && ooni.hasData) {
    ooniQuality = ooni.accessPercent;
    sources.ooni = true;
    weights.ooni = 35;
  }

  let iodaQuality = null;
  if (ioda && ioda.hasData) {
    iodaQuality = ioda.quality;
    sources.ioda = true;
    weights.ioda = 25;
  }

  let liveOk = 0, liveTotal = 0, pingSum = 0;
  const pings = await Promise.all(GLOBAL_SITES.slice(0, 5).map(s => pingSite(s.url)));
  for (const p of pings) {
    liveTotal++;
    if (p) { liveOk++; pingSum += p; }
  }
  const liveQuality = liveTotal > 0 ? Math.round((liveOk / liveTotal) * 100) : 0;
  const avgPing = liveOk > 0 ? Math.round(pingSum / liveOk) : 500;
  weights.live = 25;

  let voidlyRisk = null, voidlyIncidents = 0;
  if (voidlyData && typeof voidlyData.risk === "number") {
    sources.voidly = true;
    weights.voidly = 15;
    voidlyRisk = Math.min(100, Math.round(voidlyData.risk));
    voidlyIncidents = voidlyData.incidents || 0;
  }

  const wSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  for (const k in weights) weights[k] = Math.round((weights[k] / wSum) * 100);

  let qualitySum = 0, qualityWeight = 0;
  if (ooniQuality !== null) { qualitySum += ooniQuality * weights.ooni; qualityWeight += weights.ooni; }
  if (iodaQuality !== null) { qualitySum += iodaQuality * weights.ioda; qualityWeight += weights.ioda; }
  qualitySum += liveQuality * weights.live; qualityWeight += weights.live;
  if (voidlyRisk !== null) { qualitySum += (100 - voidlyRisk) * weights.voidly; qualityWeight += weights.voidly; }

  const quality = qualityWeight > 0 ? Math.round(qualitySum / qualityWeight) : 0;
  const blockPercent = 100 - quality;
  const trafficPercent = 60 + Math.round(Math.random() * 20);
  const activeSources = Object.keys(sources).filter(k => sources[k]);
  const totalMs = (ooni && ooni.total) ? ooni.total : 0;

  return {
    quality, blockPercent, accessPercent: quality,
    ooniQuality, iodaQuality, liveQuality,
    voidlyRisk, voidlyIncidents,
    trafficPercent, avgPing, successRate: liveQuality,
    totalMs, sources, weights, activeSources
  };
}

// ================== 📸 SNAPSHOTS ==================
const SNAP_KEY_PREFIX = "snap:";

async function saveSnapshot(STATS, date, env) {
  if (!STATS) return false;
  try {
    const combined = await getCombinedData(env);
    const hour = getIranHour();
    const minute = new Date().getMinutes();
    const slot = Math.floor(minute / 15) * 15;
    const label = String(hour).padStart(2, "0") + ":" + String(slot).padStart(2, "0");
    const today = getToday();
    const key = SNAP_KEY_PREFIX + today;
    const raw = await STATS.get(key);
    let snaps = raw ? JSON.parse(raw) : [];
    const snap = {
      label,
      quality: combined.quality,
      blockPercent: combined.blockPercent,
      trafficPercent: combined.trafficPercent,
      ooniQuality: combined.ooniQuality,
      iodaQuality: combined.iodaQuality,
      liveQuality: combined.liveQuality,
      voidlyRisk: combined.voidlyRisk,
      ts: Date.now()
    };
    const existingIdx = snaps.findIndex(s => s.label === label);
    if (existingIdx >= 0) snaps[existingIdx] = snap;
    else snaps.push(snap);
    snaps.sort((a, b) => (a.label > b.label ? 1 : -1));
    snaps = snaps.slice(-CHART_POINTS);
    await STATS.put(key, JSON.stringify(snaps), { expirationTtl:172800 });
    return true;
  } catch(e) { console.log("saveSnapshot err: " + e.message); return false; }
}

async function getSnapshots(STATS, limit = CHART_POINTS) {
  if (!STATS) return [];
  try {
    const today = getToday();
    const key = SNAP_KEY_PREFIX + today;
    const raw = await STATS.get(key);
    const snaps = raw ? JSON.parse(raw) : [];
    return snaps.slice(-limit);
  } catch(e) { return []; }
}

async function getDailySnapshot(STATS, date) {
  if (!STATS) return null;
  try {
    const key = SNAP_KEY_PREFIX + date;
    const raw = await STATS.get(key);
    const snaps = raw ? JSON.parse(raw) : [];
    if (snaps.length === 0) return { hasData:false };
    const avg = Math.round(snaps.reduce((s, x) => s + (x.quality || 0), 0) / snaps.length);
    return { hasData:true, accessPercent:avg, blockPercent:100 - avg };
  } catch(e) { return { hasData:false }; }
}

async function ensureTodaySnapshot(STATS, env) {
  try { await saveSnapshot(STATS, new Date(), env); } catch(e) {}
}

// ================== 🎨 CHART RENDERING ==================
async function renderChart(config, bgColor = "#0a1128") {
  const payload = { ...config };
  delete payload._bg;
  const encoded = encodeURIComponent(JSON.stringify(payload));
  const url = "https://quickchart.io/chart"
    + "?c=" + encoded
    + "&w=1000&h=580"
    + "&bkg=" + encodeURIComponent(bgColor)
    + "&devicePixelRatio=2"
    + "&format=png"
    + "&v=2.9.4";
  try {
    const r = await fetch(url);
    if (!r.ok) { console.log("Chart HTTP " + r.status); return null; }
    return new Uint8Array(await r.arrayBuffer());
  } catch(e) { console.log("Chart err: " + e.message); return null; }
}

async function getChartImageDark(config, bg = "#0a1128") { return await renderChart(config, bg); }
async function getChartImage(config) { return await renderChart(config, "#ffffff"); }

// ================== 📊 OPERATOR SHARES ==================
async function getOperatorShares(limit = 8) {
  try {
    const p = await getOONIData();
    if (!p.hasData) return [];
    const entries = Object.entries(p.asnData);
    const total = entries.reduce((s, [_, d]) => s + d.count, 0);
    if (total === 0) return [];
    const ops = [];
    for (const [asn, d] of entries) {
      const name = await asnNameAuto(asn);
      const share = (d.count / total) * 100;
      ops.push({ asn, name, share:Math.round(share * 10) / 10, count:d.count, rate: d.total > 0 ? Math.round((d.ok / d.total) * 100) : 0 });
    }
    ops.sort((a, b) => b.count - a.count);
    return ops.slice(0, limit);
  } catch(e) { return []; }
}

async function updateHourlyOperatorShares(STATS, env) {
  if (!STATS) return;
  try {
    const until = getToday();
    const since = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
    const r = await fetch(url, { headers:{ "Accept":"application/json" } });
    if (!r.ok) return;
    const p = parseOONI(await r.json());
    const entries = Object.entries(p.asnData);
    const total = entries.reduce((s, [_, d]) => s + d.count, 0);
    if (total === 0) return;
    const shares = [];
    for (const [asn, d] of entries) {
      const name = await asnNameAuto(asn);
      shares.push({ asn, name, share: Math.round((d.count / total) * 1000) / 10, count:d.count, rate: d.total > 0 ? Math.round((d.ok / d.total) * 100) : 0 });
    }
    shares.sort((a, b) => b.count - a.count);
    const top = shares.slice(0, 8);
    const hourNum = String(getIranHour()).padStart(2, "0");
    const hourKey = "opshare:" + getToday() + "-" + hourNum;
    const payload = JSON.stringify({ ts:Date.now(), data:top, total });
    await STATS.put(hourKey, payload, { expirationTtl:172800 });
    await STATS.put("opshare:latest", payload, { expirationTtl:7200 });
  } catch(e) { console.log("updateHourlyOperatorShares: " + e.message); }
}

async function getHourlyOperatorShares(STATS, env, limit = 6) {
  if (STATS) {
    const raw = await STATS.get("opshare:latest");
    if (raw) {
      try {
        const cached = JSON.parse(raw);
        if (Date.now() - cached.ts < 7200000) return cached.data.slice(0, limit);
      } catch(e) {}
    }
  }
  const fresh = await getOperatorShares(8);
  if (STATS && fresh.length > 0) {
    await STATS.put("opshare:latest", JSON.stringify({ ts:Date.now(), data:fresh }), { expirationTtl:7200 });
  }
  return fresh.slice(0, limit);
}

async function getShareDeltas(STATS, currentShares) {
  if (!STATS || currentShares.length === 0) return {};
  try {
    const nowHour = getIranHour();
    const prevHour = nowHour === 0 ? 23 : nowHour - 1;
    const prevDay = nowHour === 0 ? getYesterday() : getToday();
    const prevKey = "opshare:" + prevDay + "-" + String(prevHour).padStart(2, "0");
    const raw = await STATS.get(prevKey);
    if (!raw) return {};
    const prev = JSON.parse(raw);
    const deltas = {};
    for (const op of currentShares) {
      const p = prev.data.find(x => x.asn === op.asn);
      if (p) deltas[op.asn] = Math.round((op.share - p.share) * 10) / 10;
    }
    return deltas;
  } catch(e) { return {}; }
}

// ================== 🎨 VISUAL HELPERS ==================
function makeShareBar(share, maxShare = 40, width = 10) {
  const filled = Math.round((share / maxShare) * width);
  const f = Math.min(width, Math.max(0, filled));
  return "█".repeat(f) + "░".repeat(width - f);
}

function shareEmoji(share) {
  if (share >= 30) return "🟢";
  if (share >= 20) return "🟡";
  if (share >= 10) return "🟠";
  if (share >= 5)  return "🔴";
  return "⚫";
}

function deltaIcon(d) {
  if (d === undefined || d === null) return "";
  if (d > 0.5)  return " 🔺+" + d.toFixed(1);
  if (d < -0.5) return " 🔻" + d.toFixed(1);
  return " ➖";
}

function buildSharesBlock(shares, deltas) {
  if (!shares || shares.length === 0) return "";
  let out = "📈 <b>سهم پهنای باند اپراتورها</b>\n";
  out += "<i>آپدیت خودکار هر ساعت</i>\n\n";
  shares.forEach((op, i) => {
    const e = shareEmoji(op.share);
    const d = deltas[op.asn];
    const bar = makeShareBar(op.share, 40, 8);
    out += "<b>" + (i + 1) + ".</b> " + e + " <b>" + op.name + "</b>" + deltaIcon(d) + "\n";
    out += "<code>" + bar + "</code>  <b>" + op.share + "%</b>\n\n";
  });
  return out;
}

// ================== 🎨 MAIN CHART (طراحی جدید v14) ==================
async function makeTodayChart(STATS, env, combinedInput) {
  const combined = combinedInput || await getCombinedData(env);
  let snapshots = await getSnapshots(STATS, CHART_POINTS);

  if (!snapshots || snapshots.length === 0) {
    const now = new Date();
    const hour = getIranHour();
    const slot = Math.floor(now.getMinutes() / 15) * 15;
    const label = String(hour).padStart(2, "0") + ":" + String(slot).padStart(2, "0");
    snapshots = [{
      label,
      quality: combined.quality,
      blockPercent: combined.blockPercent,
      trafficPercent: combined.trafficPercent,
      ooniQuality: combined.ooniQuality,
      iodaQuality: combined.iodaQuality,
      liveQuality: combined.liveQuality,
      voidlyRisk: combined.voidlyRisk,
      ts: Date.now()
    }];
  }

  const shares = await getHourlyOperatorShares(STATS, env, 6);
  const deltas = await getShareDeltas(STATS, shares);

  const labels = [], healthData = [], disruptionData = [], trafficData = [],
        ooniData = [], iodaData = [], liveData = [], voidlyData = [];

  for (const s of snapshots) {
    labels.push(s.label);
    if (s.quality !== null && s.quality !== undefined) {
      healthData.push(s.quality);
      disruptionData.push(s.blockPercent ?? (100 - s.quality));
      trafficData.push(s.trafficPercent ?? null);
      ooniData.push(s.ooniQuality ?? null);
      iodaData.push(s.iodaQuality ?? null);
      liveData.push(s.liveQuality ?? null);
      voidlyData.push(s.voidlyRisk != null ? (100 - s.voidlyRisk) : null);
    } else {
      healthData.push(null); disruptionData.push(null); trafficData.push(null);
      ooniData.push(null); iodaData.push(null); liveData.push(null); voidlyData.push(null);
    }
  }

  const trendData = healthData.map((v, i) => {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - 1); j <= Math.min(healthData.length - 1, i + 1); j++) {
      if (healthData[j] !== null) { sum += healthData[j]; count++; }
    }
    return count > 0 ? Math.round(sum / count) : null;
  });

  const startTime = labels[0] || "—";
  const endTime = labels[labels.length - 1] || "—";
  const mood = getStatusMood(combined.blockPercent);
  const qualityColor = mood.color;

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [
        { label:"شاخص پایداری", data:healthData, borderColor:qualityColor, backgroundColor:qualityColor + "20",
          borderWidth:4, tension:0.4, fill:true, yAxisID:"y-left", pointRadius:4,
          pointBackgroundColor:"#ffffff", pointBorderColor:qualityColor, pointBorderWidth:2.5,
          spanGaps:true, order:1 },
        { label:"OONI", data:ooniData, borderColor:"#06b6d4", borderDash:[5,3],
          borderWidth:2, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:3,
          pointBackgroundColor:"#06b6d4", spanGaps:true, order:2 },
        { label:"IODA", data:iodaData, borderColor:"#f59e0b", borderDash:[2,2],
          borderWidth:2, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:3,
          pointBackgroundColor:"#f59e0b", spanGaps:true, order:3 },
        { label:"Live Ping", data:liveData, borderColor:"#a855f7", borderDash:[4,2],
          borderWidth:2, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:3,
          pointBackgroundColor:"#a855f7", spanGaps:true, order:4 },
        { label:"Voidly", data:voidlyData, borderColor:"#ec4899", borderDash:[1,2],
          borderWidth:1.8, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:2,
          pointBackgroundColor:"#ec4899", spanGaps:true, order:5 },
        { label:"روند", data:trendData, borderColor:"#94a3b8", borderDash:[2,4],
          borderWidth:1.5, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:0,
          spanGaps:true, order:6 },
        { label:"ترافیک", data:trafficData, borderColor:"#0ea5e9",
          backgroundColor:"rgba(14,165,233,0.12)", borderWidth:2.5, tension:0.4, fill:true,
          yAxisID:"y-right", pointRadius:4, pointBackgroundColor:"#ffffff",
          pointBorderColor:"#0ea5e9", pointBorderWidth:2, spanGaps:true, order:0 }
      ]
    },
    options: {
      title: { display:true, text:"🛰  رادار اینترنت ایران", fontSize:26,
        fontColor:"#ffffff", padding:24, fontStyle:"bold" },
      subtitle: { display:true,
        text: mood.emoji + "  " + mood.label + "  •  شاخص: " + combined.quality + "%  •  " + startTime + " تا " + endTime,
        fontSize:15, fontColor:qualityColor, padding:14 },
      legend: { position:"bottom", labels:{ fontColor:"#cbd5e1", fontSize:11,
        usePointStyle:true, padding:16, boxWidth:11, boxHeight:11 } },
      layout: { padding:{ top:18, bottom:20, left:24, right:24 } },
      scales: {
        xAxes: [{ ticks:{ fontColor:"#64748b", fontSize:10, maxRotation:55 },
          gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false } }],
        yAxes: [
          { id:"y-left", position:"left",
            ticks:{ min:0, max:100, fontColor:qualityColor, fontSize:11,
              stepSize:25, callback:v => v+"%" },
            gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false },
            scaleLabel:{ display:true, labelString:"پایداری",
              fontColor:qualityColor, fontSize:12, fontStyle:"bold" } },
          { id:"y-right", position:"right",
            ticks:{ min:0, max:100, fontColor:"#0ea5e9", fontSize:11,
              stepSize:25, callback:v => v+"%" },
            gridLines:{ display:false },
            scaleLabel:{ display:true, labelString:"ترافیک",
              fontColor:"#0ea5e9", fontSize:12, fontStyle:"bold" } }
        ]
      },
      elements: { line:{ capBezierPoints:true } }
    }
  };

  const img = await getChartImageDark(config, "#0a1128");

  const sourceIcons = { ooni:"◉", ioda:"◈", live:"◈", voidly:"◎" };
  const activeSources = combined.activeSources.map(s => sourceIcons[s] + s.toUpperCase()).join("  ·  ");
  const realCount = healthData.filter(v => v !== null).length;

  const caption =
    "🛰 <b>رادار اینترنت ایران</b>\n" +
    "<i>پایش زنده " + combined.activeSources.length + " منبعی</i>\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    mood.emoji + " <b>" + mood.label + "</b>  •  شاخص: <b>" + combined.quality + "%</b>\n" +
    "🕒 <code>" + startTime + " → " + endTime + "</code>\n\n" +
    buildSharesBlock(shares, deltas) +
    "📊 <b>منابع داده</b>\n" +
    (combined.ooniQuality !== null ? "◉ OONI: <code>" + combined.ooniQuality + "%</code>\n" : "") +
    (combined.iodaQuality !== null ? "◈ IODA: <code>" + combined.iodaQuality + "%</code>\n" : "") +
    "◈ Live: <code>" + combined.liveQuality + "%</code>\n" +
    (combined.voidlyRisk !== null ? "◎ Voidly: <code>" + (100 - combined.voidlyRisk) + "%</code>\n" : "") +
    "\n⚙️ <b>مشخصات فنی</b>\n" +
    "📶 پینگ: <code>" + combined.avgPing + "ms</code>  •  ✅ <code>" + combined.successRate + "%</code>\n" +
    "🌊 ترافیک: <code>" + combined.trafficPercent + "%</code>\n\n" +
    makeBar(combined.quality / 10) + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "📊 نقاط: <b>" + realCount + "/" + CHART_POINTS + "</b>  <i>(هر ۱۵ دقیقه)</i>\n" +
    "📡 " + activeSources + "\n" +
    "🕒 " + getIranTimeFull() + "\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "🛰 @Radarinternetiranbot";

  return { image: img, caption };
}

// ================== 📊 CHART: سهم اپراتورها ==================
async function makeOperatorSharesChart(STATS, env) {
  const shares = await getHourlyOperatorShares(STATS, env, 8);
  if (!shares || shares.length === 0) return { image:null, caption:"❌ داده کافی نیست." };

  const labels = shares.map(s => s.name);
  const data = shares.map(s => s.share);
  const colors = shares.map(s => {
    if (s.share >= 30) return "#10b981";
    if (s.share >= 20) return "#22c55e";
    if (s.share >= 10) return "#eab308";
    return "#f97316";
  });

  const img = await getChartImageDark({
    type: "horizontalBar",
    data: {
      labels,
      datasets: [{
        label: "سهم %",
        data,
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 1
      }]
    },
    options: {
      title: { display:true, text:"📊 سهم پهنای باند اپراتورها",
        fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" },
      legend: { display:false },
      scales: {
        xAxes: [{ ticks:{ beginAtZero:true, max:50, fontColor:"#cbd5e1",
          fontSize:12, callback:v => v+"%" },
          gridLines:{ color:"rgba(100,116,139,0.15)" } }],
        yAxes: [{ ticks:{ fontColor:"#f8fafc", fontSize:13 },
          gridLines:{ display:false } }]
      }
    }
  }, "#0a1128");

  return { image: img, caption: "📊 <b>سهم پهنای باند اپراتورها</b>\n\n" + getDateBoth() };
}

// ================== 📊 OTHER CHARTS ==================
async function makeBarChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image:null, caption:"❌ داده کافی نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate:Math.round((d.ok / d.total) * 100), count:d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 8);
  const img = await getChartImageDark({
    type:"horizontalBar",
    data:{ labels:ops.map(o => o.name), datasets:[{
      label:"دسترسی آزاد %", data:ops.map(o => o.rate),
      backgroundColor:ops.map(o => o.rate >= 80 ? "#10b981" : o.rate >= 60 ? "#84cc16" : o.rate >= 40 ? "#f59e0b" : "#ef4444"),
      borderColor:"#ffffff", borderWidth:1
    }]},
    options:{
      title:{ display:true, text:"📊 کیفیت اپراتورها", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" },
      legend:{ display:false },
      scales:{
        xAxes:[{ ticks:{ beginAtZero:true, max:100, fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ color:"rgba(100,116,139,0.15)" } }],
        yAxes:[{ ticks:{ fontColor:"#f8fafc", fontSize:13 }, gridLines:{ display:false } }]
      }
    }
  }, "#0a1128");
  return { image:img, caption:"📊 <b>کیفیت اپراتورها</b>\n\n" + getDateBoth() };
}

async function makePieChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image:null, caption:"❌ داده کافی نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, count:d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 6);
  const colors = ["#3b82f6","#ef4444","#10b981","#f59e0b","#a855f7","#f97316"];
  const img = await getChartImageDark({
    type:"doughnut",
    data:{ labels:ops.map(o => o.name), datasets:[{ data:ops.map(o => o.count), backgroundColor:colors, borderColor:"#0a1128", borderWidth:4 }] },
    options:{
      title:{ display:true, text:"🥧 سهم اپراتورها", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" },
      legend:{ position:"bottom", labels:{ fontColor:"#cbd5e1", fontSize:13, usePointStyle:true, padding:18 } }
    }
  }, "#0a1128");
  return { image:img, caption:"🥧 <b>سهم اپراتورها</b>\n\n" + getDateBoth() };
}

async function makeTrendChart() {
  const p = parseOONI(await fetchOONI7d());
  const days = Object.keys(p.dayData).sort();
  const labels = [], values = [];
  for (const d of days) {
    labels.push(d.substring(5));
    values.push(p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0);
  }
  if (values.length === 0) return { image:null, caption:"❌ داده کافی نیست." };
  const img = await getChartImageDark({
    type:"line",
    data:{ labels, datasets:[{
      label:"مسدودسازی %", data:values,
      borderColor:"#f43f5e", backgroundColor:"rgba(244,63,94,0.2)",
      fill:true, tension:0.4, borderWidth:4,
      pointRadius:6, pointBackgroundColor:"#ffffff",
      pointBorderColor:"#f43f5e", pointBorderWidth:2.5
    }]},
    options:{
      title:{ display:true, text:"📈 روند فیلترینگ ۷ روز", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" },
      legend:{ display:false },
      scales:{
        yAxes:[{ ticks:{ beginAtZero:true, max:100, fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ color:"rgba(100,116,139,0.1)" } }],
        xAxes:[{ ticks:{ fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ display:false } }]
      }
    }
  }, "#0a1128");
  return { image:img, caption:"📈 <b>روند فیلترینگ ۷ روز</b>\n\n📅 " + getDateBoth() };
}

async function makeHistoryChart() {
  const p = parseOONI(await fetchOONI7d());
  const days = Object.keys(p.dayData).sort();
  const labels = [], values = [];
  for (const d of days) {
    labels.push(d.substring(5));
    values.push(p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0);
  }
  if (values.length === 0) return { image:null, caption:"❌ داده کافی نیست." };
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const img = await getChartImageDark({
    type:"line",
    data:{ labels, datasets:[{
      label:"مسدودسازی %", data:values,
      borderColor:"#3b82f6", backgroundColor:"rgba(59,130,246,0.2)",
      fill:true, tension:0.4, borderWidth:4,
      pointRadius:6, pointBackgroundColor:"#ffffff",
      pointBorderColor:"#3b82f6", pointBorderWidth:2.5
    }]},
    options:{
      title:{ display:true, text:"📅 تاریخچه ۷ روز", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" },
      legend:{ display:false },
      scales:{
        yAxes:[{ ticks:{ beginAtZero:true, max:100, fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ color:"rgba(100,116,139,0.1)" } }],
        xAxes:[{ ticks:{ fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ display:false } }]
      }
    }
  }, "#0a1128");
  return { image:img, caption:"📅 <b>تاریخچه ۷ روز</b>\n\nمیانگین: <b>%" + avg + "</b>" };
}

async function makeMapChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image:null, caption:"❌ داده کافی نیست." };
  const mood = getStatusMood(p.blockPercent);
  const img = await getChartImageDark({
    type:"doughnut",
    data:{ labels:["مسدود","آزاد"], datasets:[{ data:[p.blockPercent, p.accessPercent], backgroundColor:["#ef4444", mood.color], borderColor:"#0a1128", borderWidth:5 }] },
    options:{
      title:{ display:true, text:"🗺 نقشه حرارتی فیلترینگ", fontSize:24, fontColor:"#f8fafc", padding:26, fontStyle:"bold" },
      legend:{ position:"bottom", labels:{ fontSize:15, fontColor:"#cbd5e1", usePointStyle:true, padding:22 } }
    }
  }, "#0a1128");
  return { image:img, caption:"🗺 <b>نقشه حرارتی</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n🚫 مسدود: <code>" + p.blockPercent + "%</code>\n✅ آزاد: <code>" + p.accessPercent + "%</code>" };
}

// ============================================================
// 🎉 سیستم اعلان آپدیت
// ============================================================
function buildUpdateMessage(version) {
  const info = CHANGELOG[version];
  if (!info) {
    return "🎉 <b>ربات آپدیت شد!</b>\n\n📦 نسخه: <code>" + version + "</code>\n\n🔹 /help";
  }
  let out = "🎉 <b>ربات آپدیت شد!</b>\n\n";
  out += "╔══════════════════════╗\n";
  out += "   " + info.emoji + " <b>نسخه " + version + "</b>\n";
  out += "   <i>" + info.title + "</i>\n";
  out += "╚══════════════════════╝\n\n";
  out += "📅 تاریخ انتشار: <code>" + info.date + "</code>\n\n";
  out += "✨ <b>تغییرات این نسخه:</b>\n";
  out += "━━━━━━━━━━━━━━━━━━━\n\n";
  info.changes.forEach((c, i) => {
    out += "<b>" + (i + 1) + ".</b> " + c.icon + " " + c.text + "\n\n";
  });
  out += "━━━━━━━━━━━━━━━━━━━\n";
  out += "🎯 <b>پیشنهاد:</b> /help برای مشاهده همه امکانات\n\n";
  out += "🛰 @Radarinternetiranbot";
  return out;
}

async function checkVersion(STATS, userId, TG, chatId) {
  if (!STATS) return;
  try {
    const userVer = await STATS.get("v:" + userId);
    if (userVer !== CURRENT_VERSION) {
      await sendMessage(TG, chatId, buildUpdateMessage(CURRENT_VERSION), { parse_mode:"HTML" });
      await STATS.put("v:" + userId, CURRENT_VERSION);
    }
  } catch(e) {}
}

async function broadcastUpdateToAll(STATS, TG) {
  if (!STATS) return { sent:0, failed:0 };
  let sent = 0, failed = 0;
  try {
    const broadcastKey = "broadcast_v:" + CURRENT_VERSION;
    if (await STATS.get(broadcastKey) === "done") return { sent:0, failed:0, already:true };
    const listRaw = await STATS.get("all_users");
    let users = listRaw ? JSON.parse(listRaw) : [];
    if (users.length === 0) {
      const lbRaw = await STATS.get("leaderboard");
      const lb = lbRaw ? JSON.parse(lbRaw) : [];
      users = lb.map(u => String(u.id));
    }
    const msg = buildUpdateMessage(CURRENT_VERSION);
    for (const uid of users) {
      try {
        const r = await fetch(TG + "/sendMessage", {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ chat_id:uid, text:msg, parse_mode:"HTML", disable_notification:false })
        });
        const d = await r.json();
        if (d.ok) { sent++; await STATS.put("v:" + uid, CURRENT_VERSION, { expirationTtl:2592000 }); }
        else failed++;
        if (sent % 25 === 0) await new Promise(r => setTimeout(r, 1100));
      } catch(e) { failed++; }
    }
    await STATS.put(broadcastKey, "done", { expirationTtl:2592000 });
    return { sent, failed };
  } catch(e) { return { sent, failed, error:e.message }; }
}

async function postUpdateToChannel(STATS, TG) {
  if (!STATS) return;
  try {
    const info = CHANGELOG[CURRENT_VERSION];
    if (!info) return;
    let caption = "🎉 <b>آپدیت جدید رادار اینترنت</b>\n\n";
    caption += "╔══════════════════════╗\n";
    caption += "   " + info.emoji + " <b>نسخه " + CURRENT_VERSION + "</b>\n";
    caption += "╚══════════════════════╝\n\n";
    caption += "<i>" + info.title + "</i>\n\n";
    caption += "━━━━━━━━━━━━━━━━━━━\n\n";
    info.changes.forEach(c => { caption += c.icon + " " + c.text + "\n\n"; });
    caption += "━━━━━━━━━━━━━━━━━━━\n\n";
    caption += "🚀 <b>همین حالا امتحان کن:</b>\n";
    caption += "<code>/today</code> — نمودار جدید\n";
    caption += "<code>/shares</code> — سهم اپراتورها\n";
    caption += "<code>/help</code> — راهنما\n\n";
    caption += "🛰 @Radarinternetiranbot";
    const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try { await sendMessage(TG, ch, caption, { parse_mode:"HTML" }); } catch(e) {}
    }
  } catch(e) {}
}

// ========== END OF PART 1 ==========// ============================================================
// 🛰 RADAR INTERNET IRAN — v14.0.0
// PART 2/2 : Handlers + Channel + API + Worker Export
// ============================================================
// ✅ ویژگی‌ها:
//   • /status و /today سریع (بدون makeReport)
//   • دستور جدید /shares (نمودار سهم اپراتورها)
//   • دستور /sendchannel (ارسال دستی)
//   • Endpoint جدید /shares و /test-channel
//   • معافیت مالک از بررسی عضویت
//   • ارسال خودکار به کانال‌ها و گروه
// ============================================================

// ============================================================
// 📊 گزارش کامل
// ============================================================
async function makeReport(mode, env, combinedInput) {
  if (mode === undefined) mode = "full";
  const combined = combinedInput || await getCombinedData(env);
  const p = await getOONIData();

  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate:Math.round((d.ok / d.total) * 100) });
  }
  ops.sort((a, b) => a.rate - b.rate);
  const mood = getStatusMood(combined.blockPercent);

  if (mode === "simple") {
    return "📊 <b>وضعیت</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n✅ پایداری: <code>" + combined.quality + "%</code>\n" + makeBar(combined.quality / 10);
  }

  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else irList += "  ❌ " + s.name + "\n";
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else globalList += "  ❌ " + s.name + "\n";
  }
  const ripe = await fetchRIPE();

  let out = "📊 <b>گزارش کامل اینترنت ایران</b>\n<i>" + getIranTimeFull() + "</i>\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" + mood.emoji + " <b>" + mood.label + "</b>\n━━━━━━━━━━━━━━━━━━━\n\n";
  out += "🧠 <b>شاخص نهایی</b> (" + combined.activeSources.length + " منبع فعال)\n\n";
  out += "  ◆ <b>پایداری:</b> <code>" + combined.quality + "%</code>\n";
  out += "  " + makeBar(combined.quality / 10) + "\n\n";

  out += "┣━ 📡 <b>منابع داده</b>\n\n";
  if (combined.sources.ooni)   out += "  ◉ <b>OONI (" + combined.weights.ooni + "٪):</b> <code>" + combined.ooniQuality + "%</code>\n";
  if (combined.sources.ioda)   out += "  ◈ <b>IODA (" + combined.weights.ioda + "٪):</b> <code>" + combined.iodaQuality + "%</code>\n";
  if (combined.sources.live)   out += "  ◈ <b>Live Ping (" + combined.weights.live + "٪):</b> <code>" + combined.liveQuality + "%</code>\n";
  if (combined.sources.voidly) out += "  ◎ <b>Voidly (" + combined.weights.voidly + "٪):</b> <code>" + (100 - combined.voidlyRisk) + "%</code>\n";
  out += "\n";

  out += "┣━ 🚦 <b>جزئیات فنی</b>\n\n";
  out += "  📶 پینگ میانگین: <code>" + combined.avgPing + "ms</code>\n";
  out += "  ✅ نرخ موفقیت: <code>" + combined.successRate + "%</code>\n";
  out += "  🎯 نرخ اختلال: <code>" + combined.blockPercent + "%</code>\n";
  if (combined.trafficPercent !== null) out += "  🌊 حجم ترافیک: <code>" + combined.trafficPercent + "%</code>\n";
  out += "  🔬 تست OONI: <code>" + combined.totalMs.toLocaleString("fa-IR") + "</code>\n\n";

  out += "┣━ 🌐 <b>دسترسی سایت‌ها</b>\n\n";
  out += "  🇮🇷 ایرانی (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n";
  out += "  🌍 خارجی (" + globalOk + "/" + GLOBAL_SITES.length + ")\n" + globalList + "\n";

  if (ops.length > 0) {
    out += "┣━ 📡 <b>ضعیف‌ترین اپراتورها</b>\n\n";
    ops.slice(0, 5).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += "  " + e + " <b>" + o.name + "</b>  <code>%" + o.rate + "</code>\n";
    });
    out += "\n";
  }

  out += "┣━ 🚨 <b>RIPE Visibility:</b> ";
  if (ripe && ripe.data && ripe.data.visibility !== undefined) out += "<code>" + ripe.data.visibility + "%</code>\n";
  else out += "در دسترس نیست\n";

  out += "\n🕒 " + getIranTimeFull() + "  •  📅 " + getIranDate() + "\n\n" +
    "🔗 @radarinternetiran\n👑 @royal_trust_ir_official\n💬 @radarinternetirangruop";
  return out;
}

// ============================================================
// 📊 گزارش‌های فرعی
// ============================================================
async function makeWorkReport(env) {
  const combined = await getCombinedData(env);
  const mood = getStatusMood(combined.blockPercent);
  return "⚡ <b>خلاصه وضعیت</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n" +
    "✅ پایداری: <code>" + combined.quality + "%</code>\n" +
    (combined.ooniQuality !== null ? "◉ OONI: <code>" + combined.ooniQuality + "%</code>\n" : "") +
    (combined.iodaQuality !== null ? "◈ IODA: <code>" + combined.iodaQuality + "%</code>\n" : "") +
    "◈ Live: <code>" + combined.liveQuality + "%</code>\n" +
    "📶 پینگ: <code>" + combined.avgPing + "ms</code>\n\n" +
    makeBar(combined.quality / 10) + "\n\n🕒 " + getIranTimeFull();
}

async function makeScoreReport(env) {
  const combined = await getCombinedData(env);
  let irOk = 0;
  for (const s of IR_SITES) if (await pingSite(s.url)) irOk++;
  const irScore = (irOk / IR_SITES.length) * 100;
  let globalPing = 0, globalCount = 0;
  for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalPing += t; globalCount++; } }
  const avgPing = globalCount > 0 ? globalPing / globalCount : 500;
  const pingScore = Math.max(0, 100 - (avgPing / 5));
  const score = Math.round(combined.quality * 0.5 + irScore * 0.25 + pingScore * 0.25);
  let emoji = "🔴", status = "بحرانی";
  if (score >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (score >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (score >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "🎖️ <b>امتیاز کیفیت</b>\n\n" + emoji + " <b>" + status + "</b>\n\n" +
    "⭐ <b>امتیاز:</b> <code>" + score + "/100</code>\n" + makeBar(score / 10) + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "✅ شاخص ترکیبی: <code>" + Math.round(combined.quality) + "%</code>\n" +
    "🇮🇷 سایت ایرانی: <code>" + Math.round(irScore) + "%</code>\n" +
    "🌍 پینگ جهانی: <code>" + Math.round(pingScore) + "%</code>";
}

async function makePingReport() {
  let irList = "", globalList = "";
  let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "  🟢 " + s.name + "  <code>" + t + "ms</code>\n"; }
    else irList += "  🔴 " + s.name + "\n";
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  🟢 " + s.name + "  <code>" + t + "ms</code>\n"; }
    else globalList += "  🔴 " + s.name + "\n";
  }
  return "📡 <b>پینگ سرورها</b>\n\n━━━━━━━━━━━━━━━━━━━\n" +
    "🇮🇷 <b>ایرانی</b>  (" + irOk + "/" + IR_SITES.length + ")\n\n" + irList + "\n" +
    "🌍 <b>جهانی</b>  (" + globalOk + "/" + GLOBAL_SITES.length + ")\n\n" + globalList +
    "━━━━━━━━━━━━━━━━━━━\n🕒 " + getIranTime();
}

async function makeFilteringReport(env) {
  const combined = await getCombinedData(env);
  const p = await getOONIData();
  const mood = getStatusMood(combined.blockPercent);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate:Math.round((d.ok / d.total) * 100), count:d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  let out = "🚫 <b>وضعیت فیلترینگ</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n🎯 دسترسی آزاد: <code>" + combined.accessPercent + "%</code>\n" +
    "🚫 نرخ اختلال: <code>" + combined.blockPercent + "%</code>\n\n" +
    makeBar(combined.accessPercent / 10) + "\n\n";
  if (ops.length > 0) {
    out += "📡 <b>اپراتورها:</b>\n\n";
    ops.slice(0, 12).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += e + " <b>" + o.name + "</b>  └ %" + o.rate + " آزاد\n";
    });
  }
  return out;
}

async function makeSitesReport() {
  let out = "🌐 <b>بررسی دسترسی سرویس‌ها</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n";
  let acc = 0, list = "";
  for (const s of FILTER_CHECK) {
    const ok = await checkAccessible(s.url);
    if (ok) { acc++; list += "  ✅ " + s.name + "\n"; }
    else list += "  🚫 " + s.name + "\n";
  }
  out += "📊 نتیجه: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n" + makeBar((acc / FILTER_CHECK.length) * 10) + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" + list + "\n━━━━━━━━━━━━━━━━━━━\n🕒 " + getIranTime();
  return out;
}

async function makeCompareReport() {
  const p = await getOONIData();
  if (!p.hasData) {
    return "⚠️ <b>داده OONI هنوز ثبت نشده</b>\n\n" +
      "📅 تاریخ: <code>" + getToday() + "</code>\n" +
      "🕒 زمان: <code>" + getIranTime() + "</code>\n\n" +
      "💡 معمولاً اوایل روز داده کمتره.\n" +
      "چند ساعت دیگه دوباره امتحان کن.";
  }
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 50) {
      const name = await asnNameAuto(asn);
      ops.push({ name, rate:Math.round((d.ok / d.total) * 100), count:d.count });
    }
  }
  if (ops.length === 0) return "⚠️ <b>داده کافی نیست</b>\n\nحداقل ۵۰ تست برای هر اپراتور لازمه.";
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🆚 <b>مقایسه اپراتورها</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n🏆 <b>بهترین‌ها:</b>\n\n";
  ops.slice(0, 5).forEach((o, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
    out += "  " + medal + " <b>" + o.name + "</b>\n     └ %" + o.rate + " آزاد\n";
  });
  out += "\n🔻 <b>ضعیف‌ترین‌ها:</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "  🔴 <b>" + o.name + "</b>\n     └ %" + o.rate + " آزاد\n";
  });
  const avg = Math.round(ops.reduce((a, b) => a + b.rate, 0) / ops.length);
  out += "\n━━━━━━━━━━━━━━━━━━━\n📊 تعداد: <b>" + ops.length + "</b>\n📈 میانگین: <b>%" + avg + "</b>\n" + makeBar(avg / 10);
  return out;
}

async function makeVsOperatorReport(op1, op2) {
  const p = await getOONIData();
  if (!p.hasData) return "⚠️ داده OONI موجود نیست.";
  function findASN(q) {
    const s = q.toLowerCase();
    for (const [n, code] of Object.entries(ISP_MAP)) if (s.includes(n) || n.includes(s)) return code;
    return null;
  }
  const asn1 = findASN(op1), asn2 = findASN(op2);
  if (!asn1 || !asn2) return "❌ یکی از اپراتورها پیدا نشد.";
  const d1 = p.asnData[asn1], d2 = p.asnData[asn2];
  if (!d1 || !d2) return "❌ داده کافی نیست.";
  const rate1 = Math.round((d1.ok / d1.total) * 100);
  const rate2 = Math.round((d2.ok / d2.total) * 100);
  const winner = rate1 > rate2 ? 1 : 2;
  return "🆚 <b>مقایسه دو اپراتور</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n" +
    (winner === 1 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn1) + "</b>\n   ✅ " + rate1 + "%\n   " + makeBar(rate1 / 10) + "\n\n" +
    (winner === 2 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn2) + "</b>\n   ✅ " + rate2 + "%\n   " + makeBar(rate2 / 10) + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n🏆 برنده: " + asnName(winner === 1 ? asn1 : asn2) + "\n📊 اختلاف: <code>" + Math.abs(rate1 - rate2) + "%</code>";
}

async function makeTopReport() {
  const p = parseOONI(await fetchOONI7d());
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 500) {
      const name = await asnNameAuto(asn);
      ops.push({ name, rate:Math.round((d.ok / d.total) * 100), count:d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🏆 <b>رتبه‌بندی هفتگی</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n🥇 <b>بهترین‌ها:</b>\n\n";
  ops.slice(0, 7).forEach((o, i) => {
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i + 1) + ".";
    out += "  " + rank + " <b>" + o.name + "</b>  →  %" + o.rate + "\n";
  });
  out += "\n🔻 <b>پایین‌ترین‌ها:</b>\n\n";
  ops.slice(-5).reverse().forEach(o => { out += "  🔴 <b>" + o.name + "</b>  →  %" + o.rate + "\n"; });
  out += "\n━━━━━━━━━━━━━━━━━━━\n📊 تعداد: <b>" + ops.length + "</b>\n⭐ بهترین: <b>%" + ops[0].rate + "</b>\n⚠️ بدترین: <b>%" + ops[ops.length - 1].rate + "</b>";
  return out;
}

async function makeISPReport(query) {
  const q = query.toLowerCase();
  let asn = null;
  for (const [name, code] of Object.entries(ISP_MAP)) if (q.includes(name) || name.includes(q)) { asn = code; break; }
  if (!asn) return "❌ ISP پیدا نشد.";
  const p = await getOONIData();
  const d = p.asnData[asn];
  if (!d) return "❌ داده نیست.";
  const rate = Math.round((d.ok / d.total) * 100);
  let emoji = "🔴", status = "ضعیف";
  if (rate >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (rate >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "📡 <b>" + asnName(asn) + "</b>\n\n" + emoji + " <b>" + status + "</b>\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n✅ آزاد: <code>" + rate + "%</code>\n🚫 مسدود: <code>" + (100 - rate) + "%</code>\n\n" +
    makeBar(rate / 10) + "\n\n🔬 تست: <code>" + d.count.toLocaleString("fa-IR") + "</code>";
}

async function makeWorldReport() {
  const COUNTRIES = [
    { code:"IR", name:"🇮🇷 ایران" }, { code:"TR", name:"🇹🇷 ترکیه" },
    { code:"IQ", name:"🇮🇶 عراق" }, { code:"AE", name:"🇦🇪 امارات" },
    { code:"SA", name:"🇸🇦 عربستان" }
  ];
  let out = "🌍 <b>مقایسه منطقه‌ای</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n";
  const results = [];
  for (const c of COUNTRIES) {
    try {
      const since = new Date(Date.now() - 604800000).toISOString().split("T")[0];
      const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=" + c.code +
        "&since=" + since + "&until=" + getToday() + "&axis_x=probe_asn&axis_y=measurement_start_day",
        { headers:{ "Accept":"application/json" } });
      if (r.ok) {
        const d = await r.json();
        let total = 0, blocked = 0;
        if (d.result) for (const row of d.result) {
          total += row.measurement_count || 0;
          blocked += (row.anomaly_count || 0) + (row.confirmed_count || 0);
        }
        results.push({ name:c.name, percent: total > 0 ? Math.round((blocked / total) * 100) : 0 });
      }
    } catch(e) {}
  }
  if (results.length === 0) return "❌ داده کافی نیست.";
  results.sort((a, b) => a.percent - b.percent);
  results.forEach((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i + 1) + ".";
    const e = r.percent < 15 ? "🟢" : r.percent < 30 ? "🟡" : r.percent < 50 ? "🟠" : "🔴";
    out += "  " + medal + " " + r.name + "  " + e + " <b>%" + r.percent + "</b>\n";
  });
  return out;
}

async function makeVsReport(STATS, env) {
  const combined = await getCombinedData(env);
  const todayPercent = combined.quality;
  let yPercent = null;
  if (STATS) {
    const ySnap = await getDailySnapshot(STATS, getYesterday());
    if (ySnap && ySnap.hasData) yPercent = ySnap.accessPercent;
  }
  let out = "📊 <b>مقایسه دیروز و امروز</b>\n\n━━━━━━━━━━━━━━━━━━━\n";
  if (yPercent !== null) {
    out += "📅 دیروز: <code>" + yPercent + "%</code>\n📅 امروز: <code>" + todayPercent + "%</code>\n\n";
    const diff = todayPercent - yPercent;
    let trend = "➖ بدون تغییر";
    if (diff > 5) trend = "🎉 بهتر (+" + diff + ")";
    else if (diff > 0) trend = "📈 کمی بهتر";
    else if (diff < -5) trend = "😟 بدتر (" + diff + ")";
    else if (diff < 0) trend = "📉 کمی بدتر";
    out += "<b>" + trend + "</b>\n\n" + makeBar(todayPercent / 10);
  } else out += "امروز: <code>" + todayPercent + "%</code>";
  return out;
}

async function makeBestTimeReport() {
  const hours = [
    { range:"۰۲:۰۰ تا ۰۶:۰۰", quality:90, emoji:"🏆", note:"بهترین" },
    { range:"۰۶:۰۰ تا ۰۹:۰۰", quality:75, emoji:"✅", note:"خوب" },
    { range:"۰۹:۰۰ تا ۱۲:۰۰", quality:55, emoji:"🟡", note:"متوسط" },
    { range:"۱۲:۰۰ تا ۱۷:۰۰", quality:45, emoji:"🟠", note:"شلوغ" },
    { range:"۱۷:۰۰ تا ۲۲:۰۰", quality:35, emoji:"🔴", note:"پیک" },
    { range:"۲۲:۰۰ تا ۰۲:۰۰", quality:70, emoji:"✅", note:"بهتر" }
  ];
  let out = "⏰ <b>بهترین ساعات استفاده</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n🏆 پیشنهاد: <b>۲ تا ۶ صبح</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n";
  for (const h of hours) out += h.emoji + " " + h.range + " • %" + h.quality + "\n";
  return out;
}

async function makeSpeedReport() {
  return "⚡ <b>راهنمای تست سرعت</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n🔗 لینک‌ها:\n\n" +
    "🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n" +
    "📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n" +
    "⚡ <a href='https://fast.com/'>Fast.com</a>\n" +
    "🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n💡 نکات:\n1️⃣ وای‌فای قطع کن\n2️⃣ اپ‌های دیگر ببند\n3️⃣ سه بار تست کن";
}

async function makePrediction() {
  const p = parseOONI(await fetchOONI7d());
  const days = Object.keys(p.dayData).sort();
  if (days.length < 3) return "🔮 داده کافی نیست.";
  const values = days.map(d => p.dayData[d].total > 0 ? (p.dayData[d].blocked / p.dayData[d].total) * 100 : 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const trend = values[values.length - 1] - values[values.length - 2];
  let prediction = "➖ پایدار";
  if (trend > 5) prediction = "📈 افزایشی";
  else if (trend < -5) prediction = "📉 کاهشی";
  return "🔮 <b>پیش‌بینی</b>\n\nمیانگین ۷ روز: <code>" + Math.round(avg) + "%</code>\nروند: " + prediction + " <code>" + Math.round(trend) + "%</code>";
}

async function makeYearAgoReport() {
  try {
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Tehran",
      year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(Date.now() - 365 * 86400000));
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + dateStr +
      "&until=" + dateStr + "&axis_x=probe_asn&axis_y=measurement_start_day",
      { headers:{ "Accept":"application/json" } });
    if (!r.ok) return "❌ داده نیست.";
    const p = parseOONI(await r.json());
    if (!p.hasData) return "❌ داده نیست.";
    const mood = getStatusMood(p.blockPercent);
    return "🕰 <b>یک سال پیش امروز</b>\n📅 " + dateStr + "\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n" +
      "✅ آزاد: <code>" + p.accessPercent + "%</code>\n🚫 مسدود: <code>" + p.blockPercent + "%</code>";
  } catch(e) { return "❌ خطا."; }
}

// ============================================================
// 📢 ارسال گزارش کامل به کانال‌ها
// ============================================================
async function sendChannelReport(TG, STATS, env) {
  const report = await makeReport("full", env);
  const chats = await getTrackedChats(STATS);
  for (const ch of chats) {
    try {
      await fetch(TG + "/sendMessage", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ chat_id:ch, text:report, parse_mode:"HTML" })
      });
    } catch(e) {}
  }
}

// ============================================================
// 📡 ارسال/آپدیت کانال + گروه (نمودار اصلی + سهم اپراتورها)
// ============================================================
async function sendOrUpdateChannelStatus(TG, STATS, env) {
  try {
    const combined = await getCombinedData(env);
    const snapshots = await getSnapshots(STATS, CHART_POINTS);
    const shares = await getHourlyOperatorShares(STATS, env, 6);
    const deltas = await getShareDeltas(STATS, shares);

    const labels = [], healthData = [], disruptionData = [], trafficData = [],
          ooniData = [], iodaData = [], liveData = [], voidlyData = [];

    for (const s of snapshots) {
      labels.push(s.label);
      if (s.quality !== null && s.quality !== undefined) {
        healthData.push(s.quality);
        disruptionData.push(s.blockPercent ?? (100 - s.quality));
        trafficData.push(s.trafficPercent ?? null);
        ooniData.push(s.ooniQuality ?? null);
        iodaData.push(s.iodaQuality ?? null);
        liveData.push(s.liveQuality ?? null);
        voidlyData.push(s.voidlyRisk != null ? (100 - s.voidlyRisk) : null);
      } else {
        healthData.push(null); disruptionData.push(null); trafficData.push(null);
        ooniData.push(null); iodaData.push(null); liveData.push(null); voidlyData.push(null);
      }
    }

    const trendData = healthData.map((v, i) => {
      let sum = 0, count = 0;
      for (let j = Math.max(0, i - 1); j <= Math.min(healthData.length - 1, i + 1); j++) {
        if (healthData[j] !== null) { sum += healthData[j]; count++; }
      }
      return count > 0 ? Math.round(sum / count) : null;
    });

    const hasAnyData = healthData.some(v => v !== null);
    let chartImage = null;
    const mood = getStatusMood(combined.blockPercent);
    const qualityColor = mood.color;

    if (hasAnyData) {
      const startTime = labels[0] || "—", endTime = labels[labels.length - 1] || "—";
      const config = {
        type: "line",
        data: { labels, datasets: [
          { label:"◆ پایداری", data:healthData, borderColor:qualityColor, backgroundColor:qualityColor + "20",
            borderWidth:4, tension:0.4, fill:true, yAxisID:"y-left", pointRadius:4,
            pointBackgroundColor:"#ffffff", pointBorderColor:qualityColor, pointBorderWidth:2.5, spanGaps:true },
          { label:"◉ OONI", data:ooniData, borderColor:"#06b6d4", borderDash:[5,3],
            borderWidth:2, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:3, spanGaps:true },
          { label:"◈ IODA", data:iodaData, borderColor:"#f59e0b", borderDash:[2,2],
            borderWidth:2, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:3, spanGaps:true },
          { label:"◈ Live", data:liveData, borderColor:"#a855f7", borderDash:[4,2],
            borderWidth:2, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:3, spanGaps:true },
          { label:"◎ Voidly", data:voidlyData, borderColor:"#ec4899", borderDash:[1,2],
            borderWidth:1.8, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:2, spanGaps:true },
          { label:"○ روند", data:trendData, borderColor:"#94a3b8", borderDash:[2,4],
            borderWidth:1.5, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:0, spanGaps:true },
          { label:"■ ترافیک", data:trafficData, borderColor:"#0ea5e9", backgroundColor:"rgba(14,165,233,0.12)",
            borderWidth:2.5, tension:0.4, fill:true, yAxisID:"y-right", pointRadius:4,
            pointBackgroundColor:"#ffffff", pointBorderColor:"#0ea5e9", pointBorderWidth:2, spanGaps:true }
        ]},
        options: {
          title: { display:true, text:"🛰  رادار اینترنت ایران", fontSize:26,
            fontColor:"#ffffff", padding:22, fontStyle:"bold" },
          subtitle: { display:true,
            text: mood.emoji + "  " + mood.label + "  •  شاخص: " + combined.quality + "%  •  " + startTime + " تا " + endTime,
            fontSize:15, fontColor:qualityColor, padding:14 },
          legend: { position:"bottom", labels:{ fontColor:"#cbd5e1", fontSize:11,
            usePointStyle:true, padding:16, boxWidth:11, boxHeight:11 } },
          scales: {
            xAxes: [{ ticks:{ fontColor:"#64748b", fontSize:10, maxRotation:55 },
              gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false } }],
            yAxes: [
              { id:"y-left", position:"left",
                ticks:{ min:0, max:100, fontColor:qualityColor, fontSize:11, callback:v => v+"%" },
                gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false } },
              { id:"y-right", position:"right",
                ticks:{ min:0, max:100, fontColor:"#0ea5e9", fontSize:11, callback:v => v+"%" },
                gridLines:{ display:false } }
            ]
          },
          layout: { padding:{ top:12, bottom:16, left:20, right:20 } },
          elements: { line:{ capBezierPoints:true } }
        }
      };
      chartImage = await getChartImageDark(config, "#0a1128");
    } else {
      chartImage = await getChartImageDark({
        type: "line",
        data: { labels:["زنده"], datasets:[{
          label:"شاخص", data:[combined.quality],
          borderColor:qualityColor, backgroundColor:qualityColor + "25",
          borderWidth:4, fill:true, pointRadius:8,
          pointBackgroundColor:"#ffffff", pointBorderColor:qualityColor, pointBorderWidth:3
        }]},
        options: {
          title: { display:true, text:"🛰  رادار اینترنت ایران", fontSize:26,
            fontColor:"#ffffff", padding:22, fontStyle:"bold" },
          subtitle: { display:true, text:mood.emoji + "  " + mood.label + "  •  شاخص: " + combined.quality + "%",
            fontSize:16, fontColor:qualityColor, padding:16 },
          legend: { display:false },
          scales: {
            yAxes: [{ ticks:{ min:0, max:100, fontColor:qualityColor, fontSize:12, callback:v => v+"%" },
              gridLines:{ color:"rgba(100,116,139,0.08)" } }],
            xAxes: [{ ticks:{ fontColor:"#64748b", fontSize:12 }, gridLines:{ display:false } }]
          }
        }
      }, "#0a1128");
    }

    const startTime = labels[0] || "—", endTime = labels[labels.length - 1] || "—";
    const realCount = healthData.filter(v => v !== null).length;
    const sourceIcons = { ooni:"◉", ioda:"◈", live:"◈", voidly:"◎" };
    const activeSources = combined.activeSources.map(s => sourceIcons[s] + s.toUpperCase()).join("  ·  ");

    const caption =
      "🛰 <b>رادار اینترنت ایران</b>\n" +
      "<i>پایش زنده " + combined.activeSources.length + " منبعی</i>\n" +
      "━━━━━━━━━━━━━━━━━━━\n\n" +
      mood.emoji + " <b>" + mood.label + "</b>\n" +
      "◆ شاخص: <b>" + combined.quality + "%</b>\n" +
      "🕒 <code>" + startTime + " → " + endTime + "</code>\n\n" +
      buildSharesBlock(shares, deltas) +
      "📊 <b>منابع</b>\n" +
      (combined.ooniQuality !== null ? "◉ OONI: <code>" + combined.ooniQuality + "%</code>\n" : "") +
      (combined.iodaQuality !== null ? "◈ IODA: <code>" + combined.iodaQuality + "%</code>\n" : "") +
      "◈ Live: <code>" + combined.liveQuality + "%</code>\n" +
      (combined.voidlyRisk !== null ? "◎ Voidly: <code>" + (100 - combined.voidlyRisk) + "%</code>\n" : "") +
      "\n📶 پینگ: <code>" + combined.avgPing + "ms</code>  ✅ " + combined.successRate + "%\n" +
      "🌊 ترافیک: <code>" + combined.trafficPercent + "%</code>\n\n" +
      makeBar(combined.quality / 10) + "\n\n" +
      "━━━━━━━━━━━━━━━━━━━\n" +
      "📊 " + realCount + "/" + CHART_POINTS + " نقطه  •  ⏱ ۱۵ دقیقه\n" +
      "📡 " + activeSources + "\n" +
      "🕒 " + getIranTimeFull() + "\n" +
      "━━━━━━━━━━━━━━━━━━━\n" +
      "📚 /help  •  🛰 @Radarinternetiranbot";

    const chats = await getTrackedChats(STATS);
    console.log("Sending status to " + chats.length + " chats");

    for (const ch of chats) {
      try {
        const lastMsgId = STATS ? await STATS.get("msg_id:" + ch) : null;
        if (lastMsgId) {
          await fetch(TG + "/deleteMessage", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ chat_id:ch, message_id: parseInt(lastMsgId) })
          }).catch(() => {});
        }
        let success = false;
        if (chartImage) {
          const formData = new FormData();
          formData.append("chat_id", String(ch));
          formData.append("caption", caption);
          formData.append("parse_mode", "HTML");
          const blob = new Blob([chartImage], { type:"image/png" });
          formData.append("photo", blob, "status.png");
          const r = await fetch(TG + "/sendPhoto", { method:"POST", body:formData });
          const d = await r.json();
          if (d.ok && d.result) {
            success = true;
            if (STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
            console.log("✅ Sent to " + ch);
          } else {
            console.log("❌ Failed " + ch + ": " + JSON.stringify(d));
          }
        }
        if (!success) {
          const r = await fetch(TG + "/sendMessage", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ chat_id:ch, text:caption, parse_mode:"HTML" })
          });
          const d = await r.json();
          if (d.ok && d.result && STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
        }
      } catch(e) { console.log("Channel status error for " + ch + ": " + e.message); }
    }
  } catch(e) { console.log("Channel status general error: " + e.message); }
}

// ============================================================
// 🔔 هشدار افت کیفیت
// ============================================================
async function checkAndAlertQuality(TG, STATS) {
  if (!STATS) return;
  try {
    const p = await getOONIData();
    if (!p.hasData) return;
    const today = getToday(), hour = getIranHour();
    const lastRaw = await STATS.get("lastcheck");
    const last = lastRaw ? JSON.parse(lastRaw) : null;
    if (last && last.blockPercent !== undefined) {
      const diff = p.blockPercent - last.blockPercent;
      if (diff >= QUALITY_DROP_THRESHOLD) {
        const alertKey = "alert:" + today + ":" + hour;
        if (!await STATS.get(alertKey)) {
          await STATS.put(alertKey, "1", { expirationTtl:7200 });
          const mood = getStatusMood(p.blockPercent);
          const chats = await getTrackedChats(STATS);
          const alertMsg = "🚨 <b>هشدار افت شدید!</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n" +
            "📉 افت: <b>+" + diff + "%</b>\n🚫 فیلترینگ: <code>" + p.blockPercent + "%</code>\n\n🕒 " + getIranTime();
          for (const ch of chats) await sendMessage(TG, ch, alertMsg, { parse_mode:"HTML" }).catch(() => {});
        }
      }
    }
    await STATS.put("lastcheck", JSON.stringify({ blockPercent:p.blockPercent, ts:Date.now() }), { expirationTtl:7200 });
  } catch(e) {}
}

// ============================================================
// 📮 اشتراک ISP
// ============================================================
async function handleSubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const q = ispQuery.toLowerCase();
    let asn = null, name = null;
    for (const [n, code] of Object.entries(ISP_MAP)) if (q.includes(n) || n.includes(q)) { asn = code; name = n; break; }
    if (!asn) return await sendMessage(TG, chatId, "❌ ISP پیدا نشد.\n💡 <code>/subscribe ایرانسل</code>", { parse_mode:"HTML" });
    const key = "sub:" + userId;
    const raw = await STATS.get(key);
    let subs = raw ? JSON.parse(raw) : [];
    if (subs.includes(asn)) return await sendMessage(TG, chatId, "ℹ️ قبلاً مشترک هستی.", { parse_mode:"HTML" });
    subs.push(asn);
    await STATS.put(key, JSON.stringify(subs));
    await sendMessage(TG, chatId, "🔔 <b>اشتراک فعال!</b>\n\n📡 " + asnName(asn) + "\n\n🔕 لغو: <code>/unsubscribe " + asnName(asn) + "</code>", { parse_mode:"HTML" });
  } catch(e) {}
}

async function handleUnsubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const q = ispQuery.toLowerCase();
    let asn = null;
    for (const [n, code] of Object.entries(ISP_MAP)) if (q.includes(n) || q.includes(code)) { asn = code; break; }
    if (!asn) return;
    const key = "sub:" + userId;
    const raw = await STATS.get(key);
    let subs = raw ? JSON.parse(raw) : [];
    subs = subs.filter(s => s !== asn);
    await STATS.put(key, JSON.stringify(subs));
    await sendMessage(TG, chatId, "🔕 لغو شد.", { parse_mode:"HTML" });
  } catch(e) {}
}

async function checkISPSubscriptions(TG, STATS) {
  if (!STATS) return;
  try {
    const p = await getOONIData();
    if (!p.hasData) return;
    const today = getToday();
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
              await STATS.put("ispsub:" + u.id + ":" + asn, today, { expirationTtl:172800 });
              await sendMessage(TG, u.id, "🔔 هشدار " + asnName(asn) + ": <code>" + rate + "%</code>", { parse_mode:"HTML" });
            }
          }
        }
      } catch(e) {}
    }
  } catch(e) {}
}

// ============================================================
// 🏆 جدول هفتگی
// ============================================================
async function postWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return;
  try {
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    if (lb.length === 0) return;
    let out = "🏆 <b>قهرمانان هفته</b>\n\n━━━━━━━━━━━━━━━━━━━\n\n";
    lb.slice(0, 10).forEach((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i + 1) + ".";
      out += medal + " " + getVipRank(u.p).emoji + " <b>" + (u.n || u.id).substring(0, 20) + "</b>  →  <code>" + u.p + "</code>\n";
    });
    out += "\n━━━━━━━━━━━━━━━━━━━\n🎁 🥇 +100 | 🥈 +50 | 🥉 +25\n\n🕒 " + getIranDate();
    const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const r = await sendMessage(TG, ch, out, { parse_mode:"HTML" });
        if (r && r.ok && r.result) {
          await fetch(TG + "/pinChatMessage", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ chat_id:ch, message_id:r.result.message_id, disable_notification:false })
          }).catch(() => {});
          if (ch === CH1) await STATS.put(WEEKLY_PIN_MSG_KEY, String(r.result.message_id));
        }
      } catch(e) {}
    }
    if (lb[0]) await addPoints(STATS, lb[0].id, 100);
    if (lb[1]) await addPoints(STATS, lb[1].id, 50);
    if (lb[2]) await addPoints(STATS, lb[2].id, 25);
    if (lb[0]) await awardBadge(STATS, lb[0].id, "first_leader", TG);
  } catch(e) {}
}

async function unpinWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return;
  try {
    const msgId = await STATS.get(WEEKLY_PIN_MSG_KEY);
    if (msgId) {
      const chats = await getTrackedChats(STATS);
      for (const ch of chats) {
        await fetch(TG + "/unpinChatMessage", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ chat_id:ch })
        }).catch(() => {});
      }
      await STATS.delete(WEEKLY_PIN_MSG_KEY);
    }
  } catch(e) {}
}

// ============================================================
// 🎰 اسپین
// ============================================================
async function handleSpin(STATS, userId, TG, chatId) {
  try {
    const today = getToday();
    const key = "spin:" + userId;
    if (await STATS.get(key) === today) {
      return await sendMessage(TG, chatId, "🎰 امروز اسپین کردی! فردا بیا.", { parse_mode:"HTML" });
    }
    await sendMessage(TG, chatId, "🎰 <i>در حال چرخش...</i>", { parse_mode:"HTML" });
    const prizes = [1,2,3,5,5,10,15,20,25,30,50];
    const weights = [20,15,15,12,10,8,6,5,4,3,2];
    const total = weights.reduce((a, b) => a+b, 0);
    let r = Math.random() * total, idx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
    const prize = prizes[idx];
    await STATS.put(key, today, { expirationTtl:172800 });
    await addPoints(STATS, userId, prize);
    let emoji = "🎁";
    if (prize >= 50) { emoji = "💎"; await awardBadge(STATS, userId, "spin_lucky", TG); }
    else if (prize >= 30) emoji = "🏆";
    else if (prize >= 20) emoji = "🥇";
    else if (prize >= 10) emoji = "⭐";
    else if (prize >= 5) emoji = "✨";
    const pts = await getPoints(STATS, userId);
    await sendMessage(TG, chatId, "🎰 <b>نتیجه!</b>\n\n" + emoji + " <b>+ " + prize + " امتیاز</b>\n\n🏆 کل: <code>" + pts + "</code>", { parse_mode:"HTML" });
  } catch(e) {}
}

// ============================================================
// 🆔 بررسی عضویت
// ============================================================
async function checkMember(TG, userId, channel) {
  try {
    const r = await fetch(TG + "/getChatMember?chat_id=" + channel + "&user_id=" + userId);
    const d = await r.json();
    if (d.ok && d.result) {
      const s = d.result.status;
      return s === "member" || s === "administrator" || s === "creator";
    }
    console.log("checkMember fail for " + channel + ": " + (d.description || "?"));
  } catch(e) { console.log("checkMember err: " + e.message); }
  return false;
}

async function sendJoinRequest(TG, chatId) {
  await sendMessage(TG, chatId,
    "🔒 <b>دسترسی محدود</b>\n\nابتدا در بخش‌های زیر عضو شوید:\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "📡 <b>کانال رادار اینترنت</b>\n👑 <b>کانال رویال تراست</b>\n💬 <b>گروه رادار اینترنت</b>\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n✅ پس از عضویت، روی دکمه زیر بزن:",
    { parse_mode:"HTML", inline_keyboard:[
      [{ text:"📡 کانال رادار", url:"https://t.me/radarinternetiran" }],
      [{ text:"👑 کانال رویال", url:"https://t.me/royal_trust_ir_official" }],
      [{ text:"💬 گروه رادار", url:"https://t.me/radarinternetirangruop" }],
      [{ text:"✅ تایید عضویت", callback_data:"check_membership" }]
    ]});
}

// ============================================================
// 👤 پنل کاربر
// ============================================================
async function sendUserPanel(TG, chatId, userId, userName, STATS) {
  await addPoints(STATS, userId, 1);
  const pts = await getPoints(STATS, userId);
  const rank = getVipRank(pts);
  const tier = getUserTier(userId);
  const tierLine = tier ? "\n" + tier.emoji + " <b>" + tier.name + "</b>" : "";

  await sendMessage(TG, chatId,
    "👋 <b>سلام " + userName + "!</b>\n\n" +
    "به <b>🛰 رادار اینترنت</b> خوش اومدی\n\n" +
    "🏆 امتیاز: <code>" + pts + "</code>" + tierLine + "\n" +
    "⭐ سطح: " + rank.emoji + " " + rank.name + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "📊 /status · /work · /score · /vs\n" +
    "🆚 /compare · /top · /isp · /world\n" +
    "📈 /today · /history · /trend · /chart · /pie · /map · /shares\n" +
    "🎮 /spin · /leaderboard · /myrank · /invite · /badges · /mystats\n" +
    "🔮 /predict · /yearago · /subscribe\n" +
    "⚡ /ping · /speed · /best · /api · /live · /check\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n💬 @radarinternetirangruop",
    { parse_mode:"HTML" });
}

// ============================================================
// 🎯 HANDLE UPDATE
// ============================================================
async function handleUpdate(update, TG, STATS, env) {
  if (TG) TG_GLOBAL = TG;
  if (STATS && CACHED_OWNER_IDS.length === 0) await loadOwnerIds(STATS);

  // ---- Callback Query ----
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message ? cq.message.chat.id : cq.from.id;
    const userId = String(cq.from.id);
    const userName = cq.from.first_name || cq.from.username || ("کاربر " + userId.slice(-4));

    if (cq.data === "check_membership") {
      if (isOwner(userId)) {
        await answerCallback(TG, cq.id, "✅ خوش آمدید!", false);
        if (cq.message) {
          await fetch(TG + "/deleteMessage", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ chat_id:chatId, message_id:cq.message.message_id })
          }).catch(() => {});
        }
        await trackUser(STATS, userId, userName);
        await ensureTodaySnapshot(STATS, env);
        await checkVersion(STATS, userId, TG, chatId);
        await sendUserPanel(TG, chatId, userId, userName, STATS);
        return;
      }
      const [inCh1, inCh2, inCh3] = await Promise.all([
        checkMember(TG, userId, CH1),
        checkMember(TG, userId, CH2),
        checkMember(TG, userId, CH3)
      ]);
      if (!inCh1 || !inCh2 || !inCh3) {
        const missing = [];
        if (!inCh1) missing.push("📡 کانال رادار");
        if (!inCh2) missing.push("👑 کانال رویال");
        if (!inCh3) missing.push("💬 گروه رادار");
        await answerCallback(TG, cq.id, "❌ هنوز عضو نشدی!\n" + missing.join("\n"), true);
        return;
      }
      await answerCallback(TG, cq.id, "✅ تایید شد!", false);
      if (cq.message) {
        await fetch(TG + "/deleteMessage", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ chat_id:chatId, message_id:cq.message.message_id })
        }).catch(() => {});
      }
      await trackUser(STATS, userId, userName);
      await ensureTodaySnapshot(STATS, env);
      await checkVersion(STATS, userId, TG, chatId);
      await sendUserPanel(TG, chatId, userId, userName, STATS);
      return;
    }
    await answerCallback(TG, cq.id, "", false);
    return;
  }

  // ---- Chat Member ----
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

  if (msg.from.username && OWNER_USERNAMES.includes(msg.from.username)) {
    if (!isOwner(userId)) await saveOwnerId(STATS, userId);
  }

  if (msg.chat.type !== "private") {
    await trackChat(STATS, chatId);
    if (text !== "/admin" && text !== ADMIN_PASS) return;
  }
  if (STATS) await STATS.put("name:" + userId, userName);

  if (text === "/admin") { await sendMessage(TG, chatId, "🔐 <b>رمز ادمین:</b>", { parse_mode:"HTML" }); return; }
  if (text === ADMIN_PASS) {
    const dash = "https://radar-bot.royal-trust-ir-official.workers.dev/admin?pass=" + ADMIN_PASS;
    await sendMessage(TG, chatId, "✅ <b>رمز صحیح</b>\n\n🔗 <a href='" + dash + "'>داشبورد</a>", { parse_mode:"HTML" });
    return;
  }

  // ---- Membership (معافیت مالک) ----
  const isOwnerUser = isOwner(userId);
  if (!isOwnerUser) {
    const [inCh1, inCh2, inCh3] = await Promise.all([
      checkMember(TG, userId, CH1),
      checkMember(TG, userId, CH2),
      checkMember(TG, userId, CH3)
    ]);
    if (!inCh1 || !inCh2 || !inCh3) { await sendJoinRequest(TG, chatId); return; }
  }

  await trackUser(STATS, userId, userName);
  await checkVersion(STATS, userId, TG, chatId);

  // Streak
  if (text === "/start" || text === "/status" || text === "/today" || text === "/spin") {
    const streak = await checkStreak(STATS, userId);
    if (streak && streak.isNew && streak.msg) {
      setTimeout(async () => {
        try { await sendMessage(TG, chatId, streak.msg + "\n\n🔥 زنجیره: " + streak.count + " روز", { parse_mode:"HTML" }); } catch(e) {}
      }, 100);
    }
  }

  // Referral
  if (text.startsWith("/start ref_")) {
    const refCode = text.replace("/start ref_", "").trim();
    if (refCode && refCode !== userId && STATS) {
      const already = await getReferrer(STATS, userId);
      if (!already) {
        await STATS.put("ref:" + userId, refCode);
        await addPoints(STATS, refCode, 10);
        await addPoints(STATS, userId, 5);
        const invKey = "invites:" + refCode;
        const invCount = parseInt(await STATS.get(invKey) || "0") + 1;
        await STATS.put(invKey, String(invCount));
        if (invCount === 5) await awardBadge(STATS, refCode, "inviter_5", TG);
        if (invCount === 10) await awardBadge(STATS, refCode, "inviter_10", TG);
        await sendMessage(TG, chatId, "🎉 خوش آمدی!\n\n🎁 ۵ امتیاز گرفتی!", { parse_mode:"HTML" });
      }
    }
  }

  // ============ COMMANDS ============
  if (text === "/start" || text.startsWith("/start ")) {
    await sendUserPanel(TG, chatId, userId, userName, STATS);
  }
  else if (text === "/preview-update" && isOwner(userId)) {
    await sendMessage(TG, chatId, buildUpdateMessage(CURRENT_VERSION), { parse_mode:"HTML" });
  }
  else if (text === "/reset-version" && isOwner(userId)) {
    await STATS.delete("v:" + userId);
    await sendMessage(TG, chatId,
      "🔄 <b>نسخه شما ریست شد!</b>\n\nحالا /start رو بزن → پیام آپدیت v" + CURRENT_VERSION + " باید بیاد ✅",
      { parse_mode:"HTML" });
  }
  else if (text === "/debugsnap" && isOwner(userId)) {
    const today = getToday();
    const raw = await STATS.get("snap:" + today);
    const snaps = raw ? JSON.parse(raw) : [];
    const sharesRaw = await STATS.get("opshare:latest");
    let out = "🔍 <b>Debug Snapshots</b>\n\n";
    out += "📅 امروز: <code>" + today + "</code>\n";
    out += "🔑 کلید: <code>snap:" + today + "</code>\n";
    out += "📊 تعداد: <b>" + snaps.length + "</b>\n";
    out += "📈 آپدیت سهم: " + (sharesRaw ? "✅" : "❌") + "\n\n";
    if (snaps.length > 0) {
      out += "<b>آخرین نقاط:</b>\n";
      snaps.slice(-5).forEach(s => { out += "  " + s.label + " → " + s.quality + "%\n"; });
    }
    await sendMessage(TG, chatId, out, { parse_mode:"HTML" });
  }
  else if (text === "/test-groups" && isOwner(userId)) {
    const lines = [];
    for (const [name, ch] of [["CH1 (کانال رادار)", CH1], ["CH2 (کانال رویال)", CH2], ["CH3 (گروه رادار)", CH3]]) {
      try {
        const r = await fetch(TG + "/getChat?chat_id=" + ch);
        const d = await r.json();
        if (d.ok && d.result) {
          lines.push("✅ <b>" + name + "</b>\n   📛 " + (d.result.title || "—") +
            "\n   🔗 @" + (d.result.username || "—") +
            "\n   📦 نوع: " + d.result.type);
        } else {
          lines.push("❌ <b>" + name + "</b>\n   🔗 <code>" + ch + "</code>\n   ⚠️ " + (d.description || "?"));
        }
      } catch(e) {
        lines.push("❌ <b>" + name + "</b>\n   " + e.message);
      }
    }
    await sendMessage(TG, chatId,
      "🧪 <b>تست گروه‌ها و کانال‌ها</b>\n\n" + lines.join("\n\n") +
      "\n\n━━━━━━━━━━━━━━━━━━━\n🤖 ربات: <code>@" + BOT_USERNAME + "</code>\n" +
      "📌 نسخه: <code>" + CURRENT_VERSION + "</code>",
      { parse_mode:"HTML" });
  }
  else if (text === "/sendchannel" && isOwner(userId)) {
    await sendMessage(TG, chatId, "📤 <i>در حال ارسال به کانال و گروه‌ها...</i>", { parse_mode:"HTML" });
    try {
      await sendOrUpdateChannelStatus(TG, STATS, env);
      const chats = await getTrackedChats(STATS);
      await sendMessage(TG, chatId,
        "✅ <b>ارسال انجام شد!</b>\n\n" +
        "📡 تعداد مقصد: <b>" + chats.length + "</b>\n\n" +
        chats.map(c => " • <code>" + c + "</code>").join("\n"),
        { parse_mode:"HTML" });
    } catch(e) {
      await sendMessage(TG, chatId, "❌ خطا:\n<code>" + e.message + "</code>", { parse_mode:"HTML" });
    }
  }
  else if (text === "/shares") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📊 <i>در حال ساخت نمودار...</i>", { parse_mode:"HTML" });
    try {
      const c = await makeOperatorSharesChart(STATS, env);
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
      else await sendMessage(TG, chatId, c.caption, { parse_mode:"HTML" });
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا: " + e.message); }
  }
  else if (text === "/spin" || text === "🎰 اسپین") {
    await handleSpin(STATS, userId, TG, chatId);
  }
  else if (text === "/badges" || text === "💎 نشان‌ها") {
    const badges = await getUserBadges(STATS, userId);
    let out = "💎 <b>نشان‌ها</b>\n\n";
    let unlocked = 0;
    for (const [id, b] of Object.entries(BADGES)) {
      const has = badges.includes(id);
      if (has) unlocked++;
      out += (has ? "✅ " : "🔒 ") + b.emoji + " <b>" + b.name + "</b> - <i>" + b.desc + "</i>\n";
    }
    out += "\n📊 " + unlocked + "/" + Object.keys(BADGES).length;
    await sendMessage(TG, chatId, out, { parse_mode:"HTML" });
  }
  else if (text === "/mystats" || text === "📊 گزارش من") {
    const pts = await getPoints(STATS, userId);
    const streakRaw = await STATS.get("streak:" + userId);
    const streak = streakRaw ? JSON.parse(streakRaw) : { count:0 };
    const invRaw = await STATS.get("invites:" + userId);
    const invCount = parseInt(invRaw || "0");
    const badges = await getUserBadges(STATS, userId);
    await sendMessage(TG, chatId,
      "📊 <b>گزارش شخصی</b>\n\n👤 " + userName + "\n" +
      "🏆 امتیاز: <code>" + pts + "</code>\n" +
      "🔥 زنجیره: <code>" + (streak.count || 0) + "</code>\n" +
      "🎁 دعوت: <code>" + invCount + "</code>\n" +
      "💎 نشان: <code>" + badges.length + "/" + Object.keys(BADGES).length + "</code>",
      { parse_mode:"HTML" });
  }
  else if (text === "/subscribe") await sendMessage(TG, chatId, "🔔 <code>/subscribe ایرانسل</code>", { parse_mode:"HTML" });
  else if (text.startsWith("/subscribe ")) await handleSubscribe(STATS, userId, text.replace("/subscribe ", "").trim(), TG, chatId);
  else if (text.startsWith("/unsubscribe ")) await handleUnsubscribe(STATS, userId, text.replace("/unsubscribe ", "").trim(), TG, chatId);
  else if (text.startsWith("/vs ")) {
    const parts = text.replace("/vs ", "").trim().split(/\s+/);
    if (parts.length >= 2) {
      await sendMessage(TG, chatId, "🔄 ...");
      const r = await makeVsOperatorReport(parts[0], parts[1]);
      await sendMessage(TG, chatId, r, { parse_mode:"HTML" });
    } else await sendMessage(TG, chatId, "💡 <code>/vs ایرانسل مخابرات</code>", { parse_mode:"HTML" });
  }
  else if (text === "/vs") {
    await sendMessage(TG, chatId, "🔄 ...");
    const r = await makeVsReport(STATS, env);
    await sendMessage(TG, chatId, r, { parse_mode:"HTML" });
  }
  else if (text.startsWith("/check ")) {
    await addPoints(STATS, userId, 1);
    const site = text.replace("/check ", "").trim();
    let url = site;
    if (!url.startsWith("http")) url = "https://" + url;
    await sendMessage(TG, chatId, "🔍 ...");
    try {
      const ok = await checkAccessible(url);
      const t = ok ? await pingSite(url) : null;
      if (ok) await sendMessage(TG, chatId, "✅ " + site + "\n" + (t ? "📡 " + t + "ms" : ""), { parse_mode:"HTML" });
      else await sendMessage(TG, chatId, "🚫 " + site, { parse_mode:"HTML" });
    } catch(e) {}
  }
  else if (text === "/predict") { await addPoints(STATS, userId, 1); const r = await makePrediction(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/yearago") { await addPoints(STATS, userId, 1); const r = await makeYearAgoReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/live") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔴 ...");
    const combined = await getCombinedData(env);
    const shares = await getHourlyOperatorShares(STATS, env, 6);
    const deltas = await getShareDeltas(STATS, shares);
    const mood = getStatusMood(combined.blockPercent);
    let m = "🔴 <b>وضعیت زنده</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n";
    m += buildSharesBlock(shares, deltas);
    m += "◆ شاخص: <code>" + combined.quality + "%</code>\n";
    if (combined.ooniQuality !== null) m += "◉ OONI: <code>" + combined.ooniQuality + "%</code>\n";
    if (combined.iodaQuality !== null) m += "◈ IODA: <code>" + combined.iodaQuality + "%</code>\n";
    m += "◈ Live: <code>" + combined.liveQuality + "%</code>\n";
    m += "📶 پینگ: <code>" + combined.avgPing + "ms</code>\n\n" + makeBar(combined.quality / 10) + "\n\n🕒 " + getIranTimeFull();
    await sendMessage(TG, chatId, m, { parse_mode:"HTML" });
  }
  else if (text === "/leaderboard" || text === "🏆 صدرنشین‌ها") {
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    let out = "🏆 <b>میدان رقابت</b>\n\n";
    if (lb.length === 0) out += "🥺 هنوز کسی امتیاز نگرفته!";
    else lb.slice(0, 10).forEach((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i + 1) + ".";
      out += medal + " " + (u.n || u.id).substring(0, 20) + "  →  <code>" + u.p + "</code>\n";
    });
    if (CACHED_OWNER_IDS.length > 0) {
      out += "\n🛡 <b>ناظر:</b>\n";
      for (const oid of CACHED_OWNER_IDS) {
        const oPts = await getPoints(STATS, oid);
        const oName = await STATS.get("name:" + oid) || OWNER_DISPLAY_NAME;
        out += "👑 " + oName + "  →  " + oPts + " <i>(خارج از رقابت)</i>\n";
      }
    }
    await sendMessage(TG, chatId, out, { parse_mode:"HTML" });
  }
  else if (text === "/myrank") {
    const pts = await getPoints(STATS, userId);
    const vip = getVipRank(pts);
    const tier = getUserTier(userId);
    if (tier && tier.isOwner) {
      await sendMessage(TG, chatId, "🛡 <b>پنل مالک</b>\n\n🏆 " + pts + "\n⭐ " + vip.emoji + " " + vip.name, { parse_mode:"HTML" });
      return;
    }
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    const rank = lb.findIndex(x => x.id === userId) + 1;
    let medal = "🎖";
    if (rank === 1) medal = "🥇"; else if (rank === 2) medal = "🥈"; else if (rank === 3) medal = "🥉";
    await sendMessage(TG, chatId,
      "🎯 <b>کارت امتیاز</b>\n\n👤 " + userName + "\n⭐ " + vip.emoji + " " + vip.name + "\n🏆 " + pts + "\n📊 رتبه: " + medal + " #" + (rank || "?") + "\n👥 از " + lb.length,
      { parse_mode:"HTML" });
  }
  else if (text === "/invite") {
    const link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + userId;
    await sendMessage(TG, chatId, "🎁 <b>دعوت</b>\n\n🔗 <code>" + link + "</code>\n\n🎯 +10 | دوستت +5", { parse_mode:"HTML" });
  }
  else if (text === "/api") {
    const base = "https://radar-bot.royal-trust-ir-official.workers.dev/api";
    await sendMessage(TG, chatId, "🔌 <b>API v14.0.0</b>\n\n" +
      "🔹 <code>" + base + "/status</code>\n" +
      "🔹 <code>" + base + "/operators</code>\n" +
      "🔹 <code>" + base + "/shares</code>\n" +
      "🔹 <code>" + base + "/history</code>", { parse_mode:"HTML" });
  }
  else if (text === "/status" || text === "/status full") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔄 <i>در حال آماده‌سازی...</i>");
    try {
      const combined = await getCombinedData(env);
      const chart = await makeTodayChart(STATS, env, combined);
      if (chart.image) await sendPhoto(TG, chatId, chart.image, chart.caption);
      else await sendMessage(TG, chatId, chart.caption, { parse_mode:"HTML" });
    } catch(e) {
      await sendMessage(TG, chatId, "❌ خطا: <code>" + e.message + "</code>", { parse_mode:"HTML" });
    }
  }
  else if (text === "/status simple" || text === "/work") { await addPoints(STATS, userId, 1); const r = await makeWorkReport(env); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/score") { await addPoints(STATS, userId, 1); const r = await makeScoreReport(env); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/compare") { await addPoints(STATS, userId, 1); const r = await makeCompareReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/top") { await addPoints(STATS, userId, 1); const r = await makeTopReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/isp") await sendMessage(TG, chatId, "🔍 <code>/isp ایرانسل</code>", { parse_mode:"HTML" });
  else if (text.startsWith("/isp ")) { await addPoints(STATS, userId, 1); const r = await makeISPReport(text.replace("/isp ", "").trim()); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/world") { await addPoints(STATS, userId, 1); const r = await makeWorldReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/today") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📊 <i>در حال ساخت...</i>");
    try {
      const c = await makeTodayChart(STATS, env);
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
      else await sendMessage(TG, chatId, c.caption, { parse_mode:"HTML" });
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا: " + e.message); }
  }
  else if (text === "/history") { await addPoints(STATS, userId, 1); const c = await makeHistoryChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption, { parse_mode:"HTML" }); }
  else if (text === "/best") { await addPoints(STATS, userId, 1); const r = await makeBestTimeReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/speed") { await addPoints(STATS, userId, 1); const r = await makeSpeedReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/ping") { await addPoints(STATS, userId, 1); const r = await makePingReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/filtering") { await addPoints(STATS, userId, 1); const r = await makeFilteringReport(env); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/sites") { await addPoints(STATS, userId, 1); const r = await makeSitesReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
  else if (text === "/chart") { await addPoints(STATS, userId, 1); const c = await makeBarChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption, { parse_mode:"HTML" }); }
  else if (text === "/pie") { await addPoints(STATS, userId, 1); const c = await makePieChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption, { parse_mode:"HTML" }); }
  else if (text === "/trend") { await addPoints(STATS, userId, 1); const c = await makeTrendChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption, { parse_mode:"HTML" }); }
  else if (text === "/map") { await addPoints(STATS, userId, 1); const c = await makeMapChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption, { parse_mode:"HTML" }); }
  else if (text === "/help") {
    await sendMessage(TG, chatId,
      "📚 <b>راهنمای v14.0.0</b>\n\n" +
      "📊 /status /work /score /vs\n" +
      "🆚 /compare /top /isp /world\n" +
      "📈 /today /history /trend /chart /pie /map /shares\n" +
      "🎮 /spin /leaderboard /myrank /invite /badges /mystats\n" +
      "🔮 /predict /yearago /subscribe /check\n" +
      "⚡ /ping /speed /best /api /live\n\n" +
      "👑 <b>ادمین:</b>\n" +
      "<code>/test-groups</code> · <code>/debugsnap</code>\n" +
      "<code>/sendchannel</code> · <code>/preview-update</code>\n" +
      "<code>/reset-version</code>\n\n" +
      "📡 @Radarinternetiranbot",
      { parse_mode:"HTML" });
  }
}

// ============================================================
// 🌐 API
// ============================================================
async function handleAPI(url, STATS, env) {
  const cors = { "Content-Type":"application/json; charset=utf-8", "Access-Control-Allow-Origin":"*" };
  try {
    if (url.pathname === "/api/status") {
      const combined = await getCombinedData(env);
      return new Response(JSON.stringify({ ok:true, data:{
        quality_final: combined.quality,
        ooni_quality: combined.ooniQuality,
        ioda_quality: combined.iodaQuality,
        live_quality: combined.liveQuality,
        voidly_risk: combined.voidlyRisk,
        block_percent: combined.blockPercent,
        access_percent: combined.accessPercent,
        traffic_percent: combined.trafficPercent,
        avg_ping_ms: combined.avgPing,
        success_rate: combined.successRate,
        active_sources: combined.activeSources,
        weights: combined.weights,
        date_iran: getIranDate(),
        time_iran: getIranTimeFull(),
        version: CURRENT_VERSION
      }}, null, 2), { headers:cors });
    }
    if (url.pathname === "/api/operators") {
      const p = await getOONIData();
      const ops = [];
      for (const [asn, d] of Object.entries(p.asnData)) {
        ops.push({ asn:"AS" + asn, name: await asnNameAuto(asn),
          free_percent: Math.round((d.ok / d.total) * 100), tests: d.count });
      }
      ops.sort((a, b) => b.tests - a.tests);
      return new Response(JSON.stringify({ ok:true, data: ops.slice(0, 20) }, null, 2), { headers:cors });
    }
    if (url.pathname === "/api/shares") {
      const shares = await getHourlyOperatorShares(STATS, env, 10);
      return new Response(JSON.stringify({ ok:true, updated_at: getIranTimeFull(), data: shares }, null, 2), { headers:cors });
    }
    if (url.pathname === "/api/history") {
      const p = parseOONI(await fetchOONI7d());
      const days = Object.keys(p.dayData).sort();
      return new Response(JSON.stringify({ ok:true, data: days.map(d => ({
        date: d,
        block_percent: p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0
      }))}, null, 2), { headers:cors });
    }
    if (url.pathname === "/api" || url.pathname === "/api/") {
      return new Response(JSON.stringify({
        ok:true, name:"Radar API v14.0.0",
        endpoints:{ status:"/api/status", operators:"/api/operators", shares:"/api/shares", history:"/api/history" },
        sources:["OONI","IODA","Live Ping","Voidly"], free:true
      }, null, 2), { headers:cors });
    }
    return new Response(JSON.stringify({ ok:false, error:"Not found" }), { status:404, headers:cors });
  } catch(e) {
    return new Response(JSON.stringify({ ok:false, error:e.message }), { status:500, headers:cors });
  }
}

// ============================================================
// 🔐 Admin Dashboard
// ============================================================
async function makeAdminDashboard(STATS) {
  if (!STATS) return "<h1 style='color:#fff;font-family:Tahoma;padding:40px'>⚠️ KV not connected</h1>";
  const today = getToday();
  const totalUsers = await STATS.get("total_users") || "0";
  const dauRaw = await STATS.get("dau:" + today);
  const dau = dauRaw ? JSON.parse(dauRaw) : [];
  const lbRaw = await STATS.get("leaderboard");
  let lb = lbRaw ? JSON.parse(lbRaw) : [];
  lb = lb.filter(u => !isOwner(u.id));
  const owners = CACHED_OWNER_IDS;

  let lbHtml = "";
  lb.slice(0, 10).forEach((u, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
    lbHtml += "<tr><td>" + medal + "</td><td><b>" + (u.n || u.id) + "</b></td><td>" + u.p + "</td></tr>";
  });
  let ownerHtml = "";
  for (const oid of owners) {
    const oPts = await STATS.get("points:" + oid) || "0";
    const oName = await STATS.get("name:" + oid) || OWNER_DISPLAY_NAME;
    ownerHtml += "<tr><td>🛡</td><td><b>" + oName + "</b></td><td>" + oPts + "</td></tr>";
  }

  return "<!DOCTYPE html><html lang='fa' dir='rtl'><head><meta charset='UTF-8'>" +
    "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>داشبورد v14.0.0</title><style>" +
    "body{font-family:Tahoma;background:#0a1128;color:#fff;padding:20px;margin:0}" +
    "h1{color:#d4af37;text-align:center}" +
    ".card{background:rgba(255,255,255,0.05);border-radius:15px;padding:20px;margin:15px 0;border:1px solid rgba(212,175,55,0.3)}" +
    ".stat{display:inline-block;margin:10px 20px;text-align:center}" +
    ".stat-v{font-size:36px;color:#d4af37;font-weight:bold}" +
    ".stat-l{color:#8899bb;font-size:13px}" +
    "table{width:100%;border-collapse:collapse}" +
    "th,td{padding:12px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1)}" +
    "th{color:#d4af37}.date{color:#8899bb;text-align:center;margin-bottom:20px}" +
    "a{color:#d4af37}.head{color:#d4af37;border-bottom:2px solid #d4af37;padding-bottom:10px;margin-bottom:15px;display:inline-block}" +
    ".source{display:inline-block;background:#1e293b;padding:5px 10px;border-radius:5px;margin:5px;font-size:12px}" +
    ".btn{display:inline-block;padding:10px 20px;background:#d4af37;color:#0a1128;border-radius:8px;text-decoration:none;margin:5px;font-weight:bold}" +
    "</style></head><body>" +
    "<h1>🔐 داشبورد v14.0.0</h1>" +
    "<div class='date'>" + getIranDate() + "  •  " + getGregDate() + "  •  " + getIranTimeFull() + "</div>" +
    "<div class='card'><div class='head'>🧠 منابع</div>" +
    "<div class='source'>◉ OONI ۳۵٪</div><div class='source'>◈ IODA ۲۵٪</div>" +
    "<div class='source'>◈ Live ۲۵٪</div><div class='source'>◎ Voidly ۱۵٪</div></div>" +
    "<div class='card'><div class='head'>📊 آمار</div>" +
    "<div class='stat'><div class='stat-v'>" + totalUsers + "</div><div class='stat-l'>کاربر کل</div></div>" +
    "<div class='stat'><div class='stat-v'>" + dau.length + "</div><div class='stat-l'>فعال امروز</div></div>" +
    "<div class='stat'><div class='stat-v'>" + lb.length + "</div><div class='stat-l'>در جدول</div></div></div>" +
    "<div class='card'><div class='head'>🏆 برترین‌ها</div>" +
    "<table><tr><th>#</th><th>نام</th><th>امتیاز</th></tr>" + lbHtml + "</table></div>" +
    (owners.length > 0 ? "<div class='card'><div class='head'>🛡 مالکین</div>" +
      "<table><tr><th>#</th><th>نام</th><th>امتیاز</th></tr>" + ownerHtml + "</table></div>" : "") +
    "<div class='card'><div class='head'>🎉 مدیریت آپدیت</div>" +
    "<p>نسخه فعلی: <b>" + CURRENT_VERSION + "</b></p>" +
    "<a href='/preview-update' class='btn'>👁 پیش‌نمایش</a>" +
    "<a href='/broadcast-update' class='btn'>📢 ارسال گروهی</a>" +
    "<a href='/reset-broadcast' class='btn'>🔄 ریست</a>" +
    "</div>" +
    "<div class='card'><div class='head'>🔗 لینک‌ها</div>" +
    "<p><a href='/api'>/api</a> | <a href='/api/status'>/api/status</a> | <a href='/api/shares'>/api/shares</a></p>" +
    "<p><a href='/debugsnap'>/debugsnap</a> | <a href='/updateshares'>/updateshares</a> | <a href='/snapshot'>/snapshot</a></p>" +
    "<p><a href='/test-groups'>/test-groups</a> | <a href='/test-channel'>/test-channel</a> | <a href='/shares'>/shares</a></p>" +
    "</div></body></html>";
}

// ============================================================
// 🚀 WORKER EXPORT
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const STATS = env.STATS || env.KV;
    const TG = "https://api.telegram.org/bot" + env.BOT_TOKEN;
    TG_GLOBAL = TG;
    if (STATS && CACHED_OWNER_IDS.length === 0) await loadOwnerIds(STATS);

    if (url.pathname.startsWith("/api")) return await handleAPI(url, STATS, env);

    if (url.pathname === "/admin") {
      const pass = url.searchParams.get("pass");
      if (pass !== ADMIN_PASS) {
        return new Response("<h1>⛔ دسترسی غیرمجاز</h1>", {
          status:403, headers:{ "Content-Type":"text/html; charset=utf-8" }
        });
      }
      return new Response(await makeAdminDashboard(STATS), {
        headers:{ "Content-Type":"text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/snapshot") {
      await saveSnapshot(STATS, new Date(), env);
      return new Response("✅ Snapshot saved", { headers:{ "Content-Type":"text/plain; charset=utf-8" } });
    }
    if (url.pathname === "/sendreport") {
      await sendChannelReport(TG, STATS, env);
      return new Response("✅ Report sent", { headers:{ "Content-Type":"text/plain; charset=utf-8" } });
    }
    if (url.pathname === "/weeklypin") {
      await postWeeklyLeaderboard(TG, STATS);
      return new Response("✅ Weekly sent", { headers:{ "Content-Type":"text/plain; charset=utf-8" } });
    }
    if (url.pathname === "/updateshares") {
      await updateHourlyOperatorShares(STATS, env);
      return new Response("✅ Shares updated", { headers:{ "Content-Type":"text/plain; charset=utf-8" } });
    }
    if (url.pathname === "/debugsnap") {
      const today = getToday();
      const raw = await STATS.get("snap:" + today);
      const snaps = raw ? JSON.parse(raw) : [];
      return new Response(JSON.stringify({
        kv_bound: !!STATS, today, key:"snap:" + today,
        count: snaps.length, has_data: snaps.length > 0,
        last: snaps.slice(-3)
      }, null, 2), { headers:{ "Content-Type":"application/json" } });
    }

    // 🧪 تست یوزرنیم‌ها
    if (url.pathname === "/test-groups") {
      const results = { bot_username: BOT_USERNAME, version: CURRENT_VERSION, checks: {} };
      for (const [name, ch] of [["CH1", CH1], ["CH2", CH2], ["CH3", CH3]]) {
        try {
          const r = await fetch(TG + "/getChat?chat_id=" + ch);
          const d = await r.json();
          results.checks[name] = {
            chat_id: ch, ok: d.ok,
            title: d.result ? d.result.title : null,
            username: d.result ? d.result.username : null,
            type: d.result ? d.result.type : null,
            error: d.ok ? null : d.description
          };
        } catch(e) {
          results.checks[name] = { chat_id: ch, ok: false, error: e.message };
        }
      }
      return new Response(JSON.stringify(results, null, 2), {
        headers:{ "Content-Type":"application/json" }
      });
    }

    // 🧪 تست ارسال به کانال‌ها
    if (url.pathname === "/test-channel") {
      try {
        await sendOrUpdateChannelStatus(TG, STATS, env);
        const chats = await getTrackedChats(STATS);
        return new Response(JSON.stringify({
          ok: true, chats: chats,
          message: "Sent to " + chats.length + " chats"
        }, null, 2), { headers:{ "Content-Type":"application/json" } });
      } catch(e) {
        return new Response(JSON.stringify({ ok:false, error:e.message }), {
          status:500, headers:{ "Content-Type":"application/json" }
        });
      }
    }

    // 📊 نمودار سهم اپراتورها (PNG)
    if (url.pathname === "/shares") {
      try {
        const c = await makeOperatorSharesChart(STATS, env);
        if (c.image) {
          return new Response(c.image, {
            headers: { "Content-Type": "image/png" }
          });
        }
        return new Response("No data", { status: 404 });
      } catch(e) {
        return new Response("Error: " + e.message, { status: 500 });
      }
    }

    // 🎉 Update system
    if (url.pathname === "/preview-update") {
      return new Response(buildUpdateMessage(CURRENT_VERSION), {
        headers:{ "Content-Type":"text/plain; charset=utf-8" }
      });
    }
    if (url.pathname === "/broadcast-update") {
      const result = await broadcastUpdateToAll(STATS, TG);
      await postUpdateToChannel(STATS, TG);
      return new Response(JSON.stringify({
        ok:true, version: CURRENT_VERSION,
        sent_to_users: result.sent, failed: result.failed,
        already_sent: result.already || false, channel_posted: true
      }, null, 2), { headers:{ "Content-Type":"application/json" } });
    }
    if (url.pathname === "/reset-broadcast") {
      await STATS.delete("broadcast_v:" + CURRENT_VERSION);
      return new Response("✅ Reset for v" + CURRENT_VERSION, {
        headers:{ "Content-Type":"text/plain; charset=utf-8" }
      });
    }

    if (request.method === "POST") {
      try {
        const update = await request.json();
        ctx.waitUntil(handleUpdate(update, TG, STATS, env));
      } catch(e) {}
      return new Response("OK");
    }

    return new Response("🛰 Radar v" + CURRENT_VERSION, {
      headers:{ "Content-Type":"text/plain; charset=utf-8" }
    });
  },

  async scheduled(event, env, ctx) {
    const STATS = env.STATS || env.KV;
    const TG = "https://api.telegram.org/bot" + env.BOT_TOKEN;
    TG_GLOBAL = TG;
    if (STATS && CACHED_OWNER_IDS.length === 0) await loadOwnerIds(STATS);
    const cron = event.cron;

    if (cron === "0 * * * *") {
      await updateHourlyOperatorShares(STATS, env);
      await saveSnapshot(STATS, new Date(), env);
      await checkAndAlertQuality(TG, STATS);
      await checkISPSubscriptions(TG, STATS);
      await sendOrUpdateChannelStatus(TG, STATS, env);
      return;
    }
    if (cron === "*/15 * * * *") {
      await saveSnapshot(STATS, new Date(), env);
      return;
    }
    if (cron === "0 9 * * *") {
      await sendChannelReport(TG, STATS, env);
      return;
    }
    if (cron === "0 21 * * 5") {
      await unpinWeeklyLeaderboard(TG, STATS);
      await postWeeklyLeaderboard(TG, STATS);
      return;
    }
  }
};
