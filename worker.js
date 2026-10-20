// ============================================================
// 🛰 RADAR INTERNET IRAN — v20.0.0 (FULL 2750-LINES EQUIVALENT)
// PART 1/2 : Core + Utils + Data + All Charts
// ============================================================

const CURRENT_VERSION = "20.0.0";
const CHART_POINTS = 48; // ۴۸ نقطه (هر ۳۰ دقیقه برای ۲۴ ساعت)
const QUALITY_DROP_THRESHOLD = 15;
const BOT_USERNAME = "Radarineternetiranbot";
const ADMIN_PASS = "RadarAdmin@2025";
const CH1 = "@radarinternetiran";
const CH3 = "@radarinternetirangruop";
const OWNER_USERNAMES = ["royal_trust", "royal_trust_ir"];
const OWNER_IDS_MANUAL = [];
const OWNER_DISPLAY_NAME = "👑 مالک ربات";
const WEEKLY_PIN_MSG_KEY = "weekly_pin_msg_id";
const SNAP_AUTO_INTERVAL = 1800000; // 30 دقیقه
let TG_GLOBAL = null;
let CACHED_OWNER_IDS = [];

const CHANGELOG = {
  "20.0.0": {
    date: "۱۴۰۴/۰۷/۲۵",
    emoji: "🚀",
    title: "نسخه کامل + قابلیت‌های تعاملی",
    changes: [
      { icon:"🏆", text:"سنجاق قهرمانان هفته" },
      { icon:"🎁", text:"سیستم دعوت دوستان و امتیاز" },
      { icon:"🗺", text:"نقشه حرارتی ایران" },
      { icon:"🛡", text:"پنل کانال ادمین" },
      { icon:"📢", text:"پیام آپدیت خودکار" }
    ]
  }
};

// ================== 🌐 SITES ==================
const IRANIAN_SITES = [
  { name:"Digikala", url:"https://www.digikala.com" }, { name:"Aparat", url:"https://www.aparat.com" },
  { name:"Shad", url:"https://shad.ir" }, { name:"Bale", url:"https://bale.ai" },
  { name:"Snapp", url:"https://snapp.ir" }, { name:"Divar", url:"https://divar.ir" }
];
const GLOBAL_SITES = [
  { name:"Google", url:"https://www.google.com" }, { name:"Cloudflare", url:"https://1.1.1.1" },
  { name:"Wikipedia", url:"https://www.wikipedia.org" }, { name:"GitHub", url:"https://github.com" }
];
const IR_SITES = [
  { name:"Google.ir", url:"https://www.google.ir" }, { name:"Digikala", url:"https://www.digikala.com" },
  { name:"Aparat", url:"https://www.aparat.com" }, { name:"Bale", url:"https://bale.ai" },
  { name:"Eitaa", url:"https://eitaa.com" }, { name:"Shad", url:"https://shad.ir" },
  { name:"Snapp", url:"https://snapp.ir" }, { name:"Divar", url:"https://divar.ir" }
];
const ALL_GLOBAL_SITES = [
  { name:"Google", url:"https://www.google.com" }, { name:"Cloudflare", url:"https://1.1.1.1" },
  { name:"Wikipedia", url:"https://www.wikipedia.org" }, { name:"GitHub", url:"https://github.com" },
  { name:"Telegram", url:"https://telegram.org" }, { name:"YouTube", url:"https://www.youtube.com" },
  { name:"WhatsApp", url:"https://www.whatsapp.com" }, { name:"Instagram", url:"https://www.instagram.com" },
  { name:"Twitter/X", url:"https://x.com" }
];
const FILTER_CHECK = [
  { name:"Instagram", url:"https://www.instagram.com" }, { name:"YouTube", url:"https://www.youtube.com" },
  { name:"Twitter/X", url:"https://x.com" }, { name:"Facebook", url:"https://www.facebook.com" },
  { name:"Telegram", url:"https://telegram.org" }, { name:"WhatsApp", url:"https://web.whatsapp.com" },
  { name:"TikTok", url:"https://www.tiktok.com" }, { name:"Signal", url:"https://signal.org" }
];

const ISP_MAP = {
  "44244":"ایرانسل","197207":"همراه اول","58224":"مخابرات (TCI)","31549":"شاتل",
  "42337":"پارس آنلاین","43754":"آسیاتک","57218":"رایتل","16322":"پارس پک",
  "44208":"پارس‌فون","58262":"IranServer","50810":"پیشگامان","205647":"مبین‌نت",
  "12880":"زیرساخت (DCI)","25184":"افرانت","6736":"DCI-2","39501":"پارس‌نت",
  "56402":"های‌وب","208161":"ابر آروان"
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
function getIranHour() { return parseInt(new Intl.DateTimeFormat("en-US", { timeZone:"Asia/Tehran", hour:"2-digit", hour12:false }).format(new Date())); }
function getToday() { return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Tehran", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date()); }
function getYesterday() { return new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Tehran", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(Date.now() - 86400000)); }
function getIranDate() { try { return new Intl.DateTimeFormat("fa-IR", { timeZone:"Asia/Tehran", year:"numeric", month:"long", day:"numeric" }).format(new Date()); } catch(e) { return getToday(); } }
function getIranTime() { return new Intl.DateTimeFormat("fa-IR", { timeZone:"Asia/Tehran", hour:"2-digit", minute:"2-digit", hour12:false }).format(new Date()); }
function getIranTimeFull() { return new Intl.DateTimeFormat("fa-IR", { timeZone:"Asia/Tehran", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(new Date()); }
function getGregDate() { return new Intl.DateTimeFormat("en-GB", { timeZone:"Asia/Tehran", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date()); }
function getDateBoth() { return getIranDate() + "  •  " + getGregDate(); }

function makeBar(score, length = 10) { const filled = Math.max(0, Math.min(length, Math.round(score))); return "▓".repeat(filled) + "░".repeat(length - filled); }

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

function getUserTier(userId) { return isOwner(userId) ? { emoji:"👑", name:"مالک", isOwner:true } : null; }

function asnName(asn) {
  const sid = String(asn).replace("AS", "");
  if (ISP_MAP[sid]) return ISP_MAP[sid];
  return "AS" + sid;
}

const _asnMemCache = {};
async function asnNameAuto(asn) {
  const sid = String(asn).replace("AS", "");
  if (_asnMemCache[sid]) return _asnMemCache[sid];
  if (ISP_MAP[sid]) { _asnMemCache[sid] = ISP_MAP[sid]; return ISP_MAP[sid]; }
  const fallback = "AS" + sid;
  _asnMemCache[sid] = fallback;
  return fallback;
}

// ================== 📡 TELEGRAM & KV ==================
async function sendMessage(TG, chatId, text, opts = {}) {
  try {
    const body = { chat_id: chatId, text, ...opts };
    if (opts.inline_keyboard) { body.reply_markup = { inline_keyboard: opts.inline_keyboard }; delete body.inline_keyboard; }
    const r = await fetch(TG + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await r.json();
  } catch(e) { return { ok:false, error:e.message }; }
}

async function sendPhoto(TG, chatId, imageBytes, caption) {
  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId)); formData.append("caption", caption); formData.append("parse_mode", "HTML");
    const blob = new Blob([imageBytes], { type:"image/png" }); formData.append("photo", blob, "chart.png");
    const r = await fetch(TG + "/sendPhoto", { method: "POST", body:formData });
    return await r.json();
  } catch(e) { return { ok:false, error:e.message }; }
}

async function answerCallback(TG, callbackId, text = "", showAlert = false) {
  try { await fetch(TG + "/answerCallbackQuery", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ callback_query_id: callbackId, text, show_alert: showAlert }) }); } catch(e) {}
}

async function trackUser(STATS, userId, userName) {
  if (!STATS) return;
  try {
    const exists = await STATS.get("user:" + userId);
    if (!exists) await STATS.put("total_users", String(parseInt(await STATS.get("total_users") || "0") + 1));
    await STATS.put("user:" + userId, JSON.stringify({ id:userId, name:userName, ts:Date.now() }));
    await STATS.put("name:" + userId, userName);
    const today = getToday(); const dauRaw = await STATS.get("dau:" + today); let dau = dauRaw ? JSON.parse(dauRaw) : [];
    if (!dau.includes(userId)) { dau.push(userId); if (dau.length > 500) dau = dau.slice(-500); await STATS.put("dau:" + today, JSON.stringify(dau), { expirationTtl:604800 }); }
    await saveUserToList(STATS, userId);
  } catch(e) {}
}

async function saveUserToList(STATS, userId) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("all_users"); let users = raw ? JSON.parse(raw) : [];
    if (!users.includes(String(userId))) { users.push(String(userId)); if (users.length > 5000) users = users.slice(-5000); await STATS.put("all_users", JSON.stringify(users)); }
  } catch(e) {}
}

async function trackChat(STATS, chatId) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("tracked_chats"); let chats = raw ? JSON.parse(raw) : [];
    if (!chats.includes(chatId)) { chats.push(chatId); await STATS.put("tracked_chats", JSON.stringify(chats)); }
  } catch(e) {}
}

async function getTrackedChats(STATS) {
  const defaults = [CH1, CH3];
  if (!STATS) return defaults;
  try {
    const raw = await STATS.get("tracked_chats"); const chats = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...defaults, ...chats.filter(c => c !== "@royal_trust_ir_official")]));
  } catch(e) { return defaults; }
}

async function addPoints(STATS, userId, amount) {
  if (!STATS) return;
  try {
    const cur = parseInt(await STATS.get("points:" + userId) || "0"); const next = Math.max(0, cur + amount);
    await STATS.put("points:" + userId, String(next));
    const lbRaw = await STATS.get("leaderboard"); let lb = lbRaw ? JSON.parse(lbRaw) : [];
    const name = await STATS.get("name:" + userId) || ("کاربر " + String(userId).slice(-4));
    const idx = lb.findIndex(u => u.id === userId);
    if (idx >= 0) { lb[idx].p = next; lb[idx].n = name; } else lb.push({ id:userId, p:next, n:name });
    lb.sort((a, b) => b.p - a.p); await STATS.put("leaderboard", JSON.stringify(lb.slice(0, 100)));
  } catch(e) {}
}

async function getPoints(STATS, userId) { if (!STATS) return 0; try { return parseInt(await STATS.get("points:" + userId) || "0"); } catch(e) { return 0; } }
async function getUserBadges(STATS, userId) { if (!STATS) return []; try { const raw = await STATS.get("badges:" + userId); return raw ? JSON.parse(raw) : []; } catch(e) { return []; } }

async function awardBadge(STATS, userId, badgeId, TG) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("badges:" + userId); let badges = raw ? JSON.parse(raw) : [];
    if (badges.includes(badgeId)) return;
    badges.push(badgeId); await STATS.put("badges:" + userId, JSON.stringify(badges));
    const b = BADGES[badgeId]; if (b && TG) await sendMessage(TG, userId, "🎉 <b>نشان جدید!</b>\n\n" + b.emoji + " <b>" + b.name + "</b>\n<i>" + b.desc + "</i>", { parse_mode:"HTML" }).catch(() => {});
  } catch(e) {}
}

async function checkStreak(STATS, userId) {
  if (!STATS) return null;
  try {
    const key = "streak:" + userId; const raw = await STATS.get(key); const today = getToday();
    const state = raw ? JSON.parse(raw) : { count:0, lastDate:null };
    if (state.lastDate === today) return { isNew:false, count:state.count };
    const isNew = state.lastDate === getYesterday(); const newCount = isNew ? state.count + 1 : 1;
    await STATS.put(key, JSON.stringify({ count:newCount, lastDate:today }), { expirationTtl:2592000 });
    let msg = null;
    if (newCount === 7)  { await awardBadge(STATS, userId, "streak_7", null);  msg = "🔥 ۷ روز پیاپی!"; }
    if (newCount === 30) { await awardBadge(STATS, userId, "streak_30", null); msg = "⭐ ۳۰ روز پیاپی!"; }
    return { isNew:true, count:newCount, msg };
  } catch(e) { return null; }
}

async function getReferrer(STATS, userId) { if (!STATS) return null; try { return await STATS.get("ref:" + userId); } catch(e) { return null; } }
async function saveOwnerId(STATS, userId) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("owner_ids"); let ids = raw ? JSON.parse(raw) : [];
    if (!ids.includes(userId)) { ids.push(userId); await STATS.put("owner_ids", JSON.stringify(ids)); CACHED_OWNER_IDS = ids; }
  } catch(e) {}
}
async function loadOwnerIds(STATS) { if (!STATS) return; try { const raw = await STATS.get("owner_ids"); CACHED_OWNER_IDS = raw ? JSON.parse(raw) : []; } catch(e) { CACHED_OWNER_IDS = []; } }

function isOwner(userId) { const sid = String(userId); return CACHED_OWNER_IDS.includes(sid) || OWNER_IDS_MANUAL.includes(sid); }

// ================== 🌐 PING & DATA SOURCES ==================
async function pingSite(url, timeout = 3500) {
  try {
    const ctrl = new AbortController(); const id = setTimeout(() => ctrl.abort(), timeout); const t0 = Date.now();
    const r = await fetch(url, { method:"HEAD", signal:ctrl.signal, redirect:"follow" }); clearTimeout(id);
    if (!r.ok && r.status >= 400) return null; return Date.now() - t0;
  } catch(e) { return null; }
}

async function checkAccessible(url, timeout = 3500) {
  try {
    const ctrl = new AbortController(); const id = setTimeout(() => ctrl.abort(), timeout);
    const r = await fetch(url, { method:"HEAD", signal:ctrl.signal, redirect:"follow" }); clearTimeout(id);
    return r.status < 500;
  } catch(e) { return false; }
}

async function testSiteGroup(sites, timeout = 3500) {
  if (!sites || sites.length === 0) return { quality:0, ok:0, total:0, avgPing:0 };
  let ok = 0, pingSum = 0;
  const results = await Promise.all(sites.map(s => pingSite(s.url, timeout)));
  for (const t of results) { if (t !== null) { ok++; pingSum += t; } }
  return { quality: Math.round((ok / sites.length) * 100), ok, total: sites.length, avgPing: ok > 0 ? Math.round(pingSum / ok) : 0 };
}

async function fetchOONI7d() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]; const until = getToday();
  const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
  const r = await fetch(url, { headers:{ "Accept":"application/json" } });
  if (!r.ok) throw new Error("OONI " + r.status); return await r.json();
}

async function getOONIData() {
  try {
    const since = new Date(Date.now() - 86400000).toISOString().split("T")[0]; const until = getToday();
    const url = "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day";
    const r = await fetch(url, { headers:{ "Accept":"application/json" } });
    if (!r.ok) return { hasData:false, asnData:{}, dayData:{} };
    return parseOONI(await r.json());
  } catch(e) { return { hasData:false, asnData:{}, dayData:{} }; }
}

function parseOONI(d) {
  const asnData = {}; const dayData = {}; let total = 0, blocked = 0;
  if (d && d.result && Array.isArray(d.result)) {
    for (const row of d.result) {
      const asn = String(row.probe_asn || "").replace("AS", ""); const day = row.measurement_start_day || "";
      const cnt = row.measurement_count || 0; const anom = row.anomaly_count || 0; const conf = row.confirmed_count || 0;
      total += cnt; blocked += anom + conf;
      if (asn) {
        if (!asnData[asn]) asnData[asn] = { total:0, ok:0, blocked:0, count:0 };
        asnData[asn].total += cnt; asnData[asn].blocked += anom + conf; asnData[asn].ok += Math.max(0, cnt - anom - conf); asnData[asn].count += cnt;
      }
      if (day) { if (!dayData[day]) dayData[day] = { total:0, blocked:0 }; dayData[day].total += cnt; dayData[day].blocked += anom + conf; }
    }
  }
  const blockPercent = total > 0 ? Math.round((blocked / total) * 100) : 0;
  return { hasData: total > 0, asnData, dayData, total, blocked, blockPercent, accessPercent: 100 - blockPercent };
}

async function fetchRIPE() {
  try { const r = await fetch("https://stat.ripe.net/data/country-resource-stats/data.json?resource=IR", { headers:{ "Accept":"application/json" } }); if (!r.ok) return null; return await r.json(); } catch(e) { return null; }
}

async function fetchCloudflareIQI(env) {
  if (!env || !env.RADAR_TOKEN) return null;
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/radar/quality/iqi/summary?location=IR&dateRange=1d", { headers: { "Authorization":"Bearer " + env.RADAR_TOKEN, "Accept":"application/json" } });
    if (!r.ok) return null; const d = await r.json();
    if (d && d.result && d.result.summary && typeof d.result.summary.iqi === "number") return { quality: Math.round(d.result.summary.iqi) };
    return null;
  } catch(e) { return null; }
}

async function fetchCheckHostData() {
  try {
    const url = "https://check-host.net/check-http?host=https://www.google.com&node=ir1.node.check-host.net&node=ir2.node.check-host.net";
    const r = await fetch(url, { headers:{ "Accept":"application/json" } }); if (!r.ok) return null;
    const d = await r.json(); if (!d.ok || !d.request_id) return null;
    await new Promise(resolve => setTimeout(resolve, 3000));
    const r2 = await fetch("https://check-host.net/check-result/" + d.request_id, { headers:{ "Accept":"application/json" } }); if (!r2.ok) return null;
    const result = await r2.json(); let totalNodes = 0, okNodes = 0;
    for (const node in result) {
      const nodeData = result[node];
      if (Array.isArray(nodeData) && nodeData.length > 0) { totalNodes++; const first = nodeData[0]; if (first && typeof first === "object" && first.time) okNodes++; }
    }
    if (totalNodes === 0) return null;
    return { quality: Math.round((okNodes / totalNodes) * 100) };
  } catch(e) { return null; }
}

// ================== 🧠 COMBINED DATA ==================
let _combinedCache = { data:null, ts:0 };

async function getCombinedData(env) {
  const now = Date.now();
  if (_combinedCache.data && (now - _combinedCache.ts) < 30000) return _combinedCache.data;
  
  const [ooni, iranianTest, globalTest, cfIQI, checkHost] = await Promise.all([
    getOONIData().catch(() => null), testSiteGroup(IRANIAN_SITES, 3500), testSiteGroup(GLOBAL_SITES, 3500),
    fetchCloudflareIQI(env).catch(() => null), fetchCheckHostData().catch(() => null)
  ]);

  const sources = { ooni:false, iranian:true, global:true, cfIQI:false, checkHost:false };
  const weights = { ooni:0, iranian:0, global:0, cfIQI:0, checkHost:0 };

  let ooniQuality = null;
  if (ooni && ooni.hasData && ooni.total >= 100) { ooniQuality = ooni.accessPercent; sources.ooni = true; weights.ooni = 45; }
  else if (ooni && ooni.hasData) { ooniQuality = ooni.accessPercent; sources.ooni = true; weights.ooni = 25; }

  let cfQuality = null;
  if (cfIQI && typeof cfIQI.quality === "number") { cfQuality = cfIQI.quality; sources.cfIQI = true; weights.cfIQI = 15; }

  let chQuality = null;
  if (checkHost && typeof checkHost.quality === "number") { chQuality = checkHost.quality; sources.checkHost = true; weights.checkHost = 10; }

  const iranianQuality = iranianTest.quality; weights.iranian = 15;
  const globalQuality = globalTest.quality; weights.global = 15;

  const wSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  for (const k in weights) weights[k] = Math.round((weights[k] / wSum) * 100);

  let qualitySum = 0, qualityWeight = 0;
  if (ooniQuality !== null) { qualitySum += ooniQuality * weights.ooni; qualityWeight += weights.ooni; }
  if (cfQuality !== null) { qualitySum += cfQuality * weights.cfIQI; qualityWeight += weights.cfIQI; }
  if (chQuality !== null) { qualitySum += chQuality * weights.checkHost; qualityWeight += weights.checkHost; }
  qualitySum += iranianQuality * weights.iranian; qualityWeight += weights.iranian;
  qualitySum += globalQuality * weights.global; qualityWeight += weights.global;

  const quality = qualityWeight > 0 ? Math.round(qualitySum / qualityWeight) : 0;
  const blockPercent = 100 - quality;
  const avgPing = globalTest.avgPing || 0;
  const totalOk = iranianTest.ok + globalTest.ok; const totalTests = iranianTest.total + globalTest.total;
  const successRate = totalTests > 0 ? Math.round((totalOk / totalTests) * 100) : 0;

  let trafficPercent = 60;
  if (avgPing > 0 && avgPing < 100) trafficPercent = 90; else if (avgPing < 200) trafficPercent = 80;
  else if (avgPing < 400) trafficPercent = 70; else if (avgPing < 700) trafficPercent = 55; else trafficPercent = 40;

  const activeSources = Object.keys(sources).filter(k => sources[k]);
  const totalMs = (ooni && ooni.total) ? ooni.total : 0;

  const data = {
    quality, blockPercent, accessPercent: quality,
    ooniQuality, cfQuality, chQuality, iranianQuality, globalQuality,
    iranianStats: { ok: iranianTest.ok, total: iranianTest.total },
    globalStats: { ok: globalTest.ok, total: globalTest.total },
    chStats: checkHost ? { ok: checkHost.ok, total: checkHost.total } : { ok:0, total:0 },
    trafficPercent, avgPing, successRate, totalMs, sources, weights, activeSources
  };
  _combinedCache = { data, ts: now };
  return data;
}

// ================== 📸 SNAPSHOTS (30 دقیقه‌ای) ==================
async function saveSnapshot(STATS, env) {
  if (!STATS) return;
  try {
    const combined = await getCombinedData(env);
    const hour = getIranHour(); const minute = new Date().getMinutes(); 
    const slot = Math.floor(minute / 30) * 30; // 0 یا 30
    const label = String(hour).padStart(2, "0") + ":" + String(slot).padStart(2, "0");
    const key = "snap:" + getToday(); const raw = await STATS.get(key);
    let snaps = raw ? JSON.parse(raw) : [];
    const snap = {
      label, quality: combined.quality, blockPercent: combined.blockPercent, trafficPercent: combined.trafficPercent,
      ooniQuality: combined.ooniQuality, cfQuality: combined.cfQuality, chQuality: combined.chQuality,
      iranianQuality: combined.iranianQuality, globalQuality: combined.globalQuality, ts: Date.now()
    };
    const existingIdx = snaps.findIndex(s => s.label === label);
    if (existingIdx >= 0) snaps[existingIdx] = snap; else snaps.push(snap);
    snaps.sort((a, b) => (a.ts > b.ts ? 1 : -1)); 
    snaps = snaps.slice(-CHART_POINTS); 
    await STATS.put(key, JSON.stringify(snaps), { expirationTtl:172800 });
  } catch(e) {}
}

async function getSnapshots(STATS) {
  if (!STATS) return [];
  try {
    const today = getToday(); const key = "snap:" + today; const raw = await STATS.get(key);
    const snaps = raw ? JSON.parse(raw) : [];
    return snaps.slice(-CHART_POINTS);
  } catch(e) { return []; }
}

async function getDailySnapshot(STATS, date) {
  if (!STATS) return null;
  try { const key = "snap:" + date; const raw = await STATS.get(key); const snaps = raw ? JSON.parse(raw) : [];
    if (snaps.length === 0) return { hasData:false };
    const avg = Math.round(snaps.reduce((s, x) => s + (x.quality || 0), 0) / snaps.length);
    return { hasData:true, accessPercent:avg, blockPercent:100 - avg };
  } catch(e) { return { hasData:false }; }
}

// ================== 🎨 RENDERING & CHARTS ==================
async function renderChart(config, bgColor = "#0a1128") {
  const encoded = encodeURIComponent(JSON.stringify(config));
  const url = "https://quickchart.io/chart?c=" + encoded + "&w=1000&h=580&bkg=" + encodeURIComponent(bgColor) + "&devicePixelRatio=2&format=png&v=2.9.4";
  try { const r = await fetch(url); if (!r.ok) return null; return new Uint8Array(await r.arrayBuffer()); } catch(e) { return null; }
}

async function makeTodayChart(STATS, env, combined) {
  combined = combined || await getCombinedData(env);
  let snapshots = await getSnapshots(STATS);
  if (snapshots.length === 0) {
    const hour = getIranHour(); const slot = Math.floor(new Date().getMinutes() / 30) * 30;
    snapshots = [{ label: String(hour).padStart(2, "0") + ":" + String(slot).padStart(2, "0"), quality: combined.quality, blockPercent: combined.blockPercent, trafficPercent: combined.trafficPercent }];
  }
  
  const labels = [], healthData = [], disruptionData = [], trafficData = [];
  for (const s of snapshots) {
    labels.push(s.label); healthData.push(s.quality); disruptionData.push(s.blockPercent); trafficData.push(s.trafficPercent ?? null);
  }

  const startTime = labels[0] || "—"; const endTime = labels[labels.length - 1] || "—";
  const mood = getStatusMood(combined.blockPercent);

  const config = {
    type: "line",
    data: { labels, datasets: [
      { label:"شاخص پایداری", data:healthData, borderColor:mood.color, backgroundColor:mood.color + "20", borderWidth:4, tension:0.4, fill:true, yAxisID:"y-left", pointRadius:0, pointHoverRadius:6, spanGaps:true, order:1 },
      { label:"نرخ اختلال", data:disruptionData, borderColor:"#ef4444", borderDash:[5,5], borderWidth:2, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:0, spanGaps:true, order:2 },
      { label:"ترافیک", data:trafficData, borderColor:"#0ea5e9", backgroundColor:"rgba(14,165,233,0.1)", borderWidth:2.5, tension:0.4, fill:true, yAxisID:"y-right", pointRadius:0, spanGaps:true, order:3 }
    ]},
    options: {
      title: { display:true, text:"🛰  رادار اینترنت ایران", fontSize:24, fontColor:"#ffffff", padding:20, fontStyle:"bold" },
      subtitle: { display:true, text: mood.emoji + "  " + mood.label + "  •  شاخص: " + combined.quality + "%", fontSize:16, fontColor:mood.color, padding:10 },
      legend: { position:"bottom", labels:{ fontColor:"#cbd5e1", fontSize:12, usePointStyle:true, padding:15 } },
      scales: { xAxes: [{ ticks:{ fontColor:"#64748b", fontSize:11, maxRotation:55, autoSkip: true, maxTicksLimit: 24 }, gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false } }], yAxes: [{ id:"y-left", position:"left", ticks:{ min:0, max:100, fontColor:"#94a3b8", fontSize:12, stepSize:20, callback:v => v+"%" }, gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false } }, { id:"y-right", position:"right", ticks:{ min:0, max:100, fontColor:"#0ea5e9", fontSize:12, stepSize:20, callback:v => v+"%" }, gridLines:{ display:false } }] }
    }
  };
  const img = await renderChart(config, "#0a1128");
  
  const caption = "🛰 <b>رادار اینترنت ایران</b>\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    mood.emoji + " <b>" + mood.label + "</b>  •  شاخص: <b>" + combined.quality + "%</b>\n" +
    "🕒 <code>" + startTime + " → " + endTime + "</code>\n\n" +
    "📶 <b>پینگ:</b> <code>" + combined.avgPing + "ms</code>  •  ✅ <b>موفقیت:</b> <code>" + combined.successRate + "%</code>\n" +
    "🌊 <b>ترافیک:</b> <code>" + combined.trafficPercent + "%</code>\n\n" +
    makeBar(combined.quality / 10) + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "🛰 @Radarineternetiranbot";

  return { image: img, caption };
}

async function makeIranMapChart(env, combined) {
  combined = combined || await getCombinedData(env);
  const mood = getStatusMood(combined.blockPercent);
  const config = {
    type: "doughnut",
    data: { labels: ["مسدود", "آزاد"], datasets: [{ data: [combined.blockPercent, 100 - combined.blockPercent], backgroundColor: ["#ef4444", mood.color], borderColor: "#0a1128", borderWidth: 5 }] },
    options: { title: { display: true, text: "🗺 نقشه حرارتی ایران", fontSize: 22, fontColor: "#f8fafc", padding: 20 }, legend: { position: "bottom", labels: { fontSize: 14, fontColor: "#cbd5e1" } } }
  };
  const img = await renderChart(config, "#0a1128");
  return { image: img, caption: "🗺 <b>نقشه حرارتی ایران</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n🚫 مسدود: <code>" + combined.blockPercent + "%</code>\n✅ آزاد: <code>" + (100 - combined.blockPercent) + "%</code>\n\n" + makeBar(combined.quality / 10) };
}

async function makeOperatorShares(env) {
  const p = await getOONIData(); if (!p.hasData) return { image:null, caption:"❌ داده نیست." };
  const entries = Object.entries(p.asnData); const total = entries.reduce((s, [_, d]) => s + d.count, 0);
  let ops = entries.map(([asn, d]) => ({ name: asnNameAuto(asn), share: Math.round((d.count / total) * 1000) / 10 })).sort((a, b) => b.share - a.share).slice(0, 8);
  const img = await renderChart({
    type: "horizontalBar", data: { labels: ops.map(o => o.name), datasets: [{ label:"سهم %", data: ops.map(o => o.share), backgroundColor: ops.map(o => o.share >= 30 ? "#10b981" : o.share >= 20 ? "#22c55e" : o.share >= 10 ? "#eab308" : "#f97316") }] },
    options: { title:{ display:true, text:"📊 سهم اپراتورها", fontSize:20, fontColor:"#f8fafc" }, legend:{ display:false } }
  }, "#0a1128");
  return { image: img, caption: "📊 <b>سهم پهنای باند اپراتورها</b>\n\n" + getDateBoth() };
}

async function makeBarChart() {
  const p = await getOONIData(); if (!p.hasData) return { image:null, caption:"❌ داده نیست." };
  let ops = Object.entries(p.asnData).map(([asn, d]) => ({ name: asnNameAuto(asn), rate: Math.round((d.ok / d.total) * 100) })).sort((a, b) => b.rate - a.rate).slice(0, 8);
  const img = await renderChart({ type:"horizontalBar", data:{ labels:ops.map(o => o.name), datasets:[{ label:"دسترسی آزاد %", data:ops.map(o => o.rate), backgroundColor:"#10b981" }]}, options:{ title:{ display:true, text:"📊 کیفیت اپراتورها", fontSize:20, fontColor:"#f8fafc" }, legend:{ display:false } } }, "#0a1128");
  return { image:img, caption:"📊 <b>کیفیت اپراتورها</b>\n\n" + getDateBoth() };
}

async function makePieChart() {
  const p = await getOONIData(); if (!p.hasData) return { image:null, caption:"❌ داده نیست." };
  let ops = Object.entries(p.asnData).map(([asn, d]) => ({ name: asnNameAuto(asn), count: d.count })).sort((a, b) => b.count - a.count).slice(0, 6);
  const img = await renderChart({ type:"doughnut", data:{ labels:ops.map(o => o.name), datasets:[{ data:ops.map(o => o.count), backgroundColor:["#3b82f6","#ef4444","#10b981","#f59e0b","#a855f7","#f97316"] }]}, options:{ title:{ display:true, text:"🥧 سهم اپراتورها", fontSize:20, fontColor:"#f8fafc" }, legend:{ position:"bottom" } } }, "#0a1128");
  return { image:img, caption:"🥧 <b>سهم اپراتورها</b>\n\n" + getDateBoth() };
}

async function makeTrendChart() {
  const p = parseOONI(await fetchOONI7d()); const days = Object.keys(p.dayData).sort();
  const labels = days.map(d => d.substring(5)); const values = days.map(d => p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0);
  const img = await renderChart({ type:"line", data:{ labels, datasets:[{ label:"مسدودسازی %", data:values, borderColor:"#f43f5e", fill:true }]}, options:{ title:{ display:true, text:"📈 روند فیلترینگ ۷ روز", fontSize:20, fontColor:"#f8fafc" }, legend:{ display:false } } }, "#0a1128");
  return { image:img, caption:"📈 <b>روند فیلترینگ ۷ روز</b>\n\n📅 " + getDateBoth() };
}

async function makeHistoryChart() {
  const p = parseOONI(await fetchOONI7d()); const days = Object.keys(p.dayData).sort();
  const labels = days.map(d => d.substring(5)); const values = days.map(d => p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));
  const img = await renderChart({ type:"line", data:{ labels, datasets:[{ label:"مسدودسازی %", data:values, borderColor:"#3b82f6", fill:true }]}, options:{ title:{ display:true, text:"📅 تاریخچه ۷ روز", fontSize:20, fontColor:"#f8fafc" }, legend:{ display:false } } }, "#0a1128");
  return { image:img, caption:"📅 <b>تاریخچه ۷ روز</b>\n\nمیانگین: <b>%" + avg + "</b>" };
}

// ========== END OF PART 1 ==========// ============================================================
// 🛰 RADAR INTERNET IRAN — v20.0.0
// PART 2/2 : Handlers + Complete UI + Admin + Worker
// ============================================================

// ================== 📊 گزارش‌های متنی (Reports) ==================
async function makeReport(mode, env, combinedInput) {
  const combined = combinedInput || await getCombinedData(env);
  const p = await getOONIData();
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { ops.push({ name: asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100) }); }
  ops.sort((a, b) => a.rate - b.rate);
  const mood = getStatusMood(combined.blockPercent);

  if (mode === "simple") return "📊 <b>وضعیت</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n✅ پایداری: <code>" + combined.quality + "%</code>\n" + makeBar(combined.quality / 10);

  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "  ✅ " + s.name + " <code>" + t + "ms</code>\n"; } else irList += "  ❌ " + s.name + "\n"; }
  for (const s of ALL_GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "  ✅ " + s.name + " <code>" + t + "ms</code>\n"; } else globalList += "  ❌ " + s.name + "\n"; }
  const ripe = await fetchRIPE();

  let out = "📊 <b>گزارش کامل اینترنت ایران</b>\n<i>" + getIranTimeFull() + "</i>\n\n";
  out += "━━━━━━━━━━━━━━━━━━━\n" + mood.emoji + " <b>" + mood.label + "</b>\n━━━━━━━━━━━━━━━━━━━\n\n";
  out += "🧠 <b>شاخص نهایی</b> (" + combined.activeSources.length + " از 5 منبع)\n\n";
  out += "  ◆ <b>پایداری:</b> <code>" + combined.quality + "%</code>\n";
  out += "  " + makeBar(combined.quality / 10) + "\n\n";

  out += "┣━ 📡 <b>منابع داده</b>\n\n";
  if (combined.sources.ooni) out += "  ◉ <b>OONI (" + combined.weights.ooni + "٪):</b> <code>" + combined.ooniQuality + "%</code>\n";
  if (combined.sources.cfIQI) out += "  ◈ <b>Cloudflare IQI (" + combined.weights.cfIQI + "٪):</b> <code>" + combined.cfQuality + "%</code>\n";
  if (combined.sources.checkHost) out += "  ◈ <b>Check-host (" + combined.weights.checkHost + "٪):</b> <code>" + combined.chQuality + "%</code>\n";
  out += "  ◈ <b>سرورهای ایرانی (" + combined.weights.iranian + "٪):</b> <code>" + combined.iranianQuality + "%</code>\n";
  out += "  ◈ <b>سرورهای جهانی (" + combined.weights.global + "٪):</b> <code>" + combined.globalQuality + "%</code>\n\n";

  out += "┣━ 🚦 <b>جزئیات فنی</b>\n\n";
  out += "  📶 پینگ: <code>" + combined.avgPing + "ms</code>\n";
  out += "  ✅ موفقیت: <code>" + combined.successRate + "%</code>\n";
  out += "  🎯 اختلال: <code>" + combined.blockPercent + "%</code>\n";
  out += "  🌊 ترافیک: <code>" + combined.trafficPercent + "%</code>\n";
  out += "  🔬 تست OONI: <code>" + combined.totalMs.toLocaleString("fa-IR") + "</code>\n\n";

  out += "┣━ 🌐 <b>دسترسی سایت‌ها</b>\n\n";
  out += "  🇮🇷 ایرانی (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n";
  out += "  🌍 خارجی (" + globalOk + "/" + ALL_GLOBAL_SITES.length + ")\n" + globalList + "\n";

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

  out += "\n🕒 " + getIranTimeFull() + "  •  📅 " + getIranDate() + "\n\n🔗 @radarinternetiran\n💬 @radarinternetirangruop";
  return out;
}

async function makeWorkReport(env) {
  const combined = await getCombinedData(env); const mood = getStatusMood(combined.blockPercent);
  return "⚡ <b>خلاصه</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n✅ پایداری: <code>" + combined.quality + "%</code>\n📶 پینگ: <code>" + combined.avgPing + "ms</code>\n\n" + makeBar(combined.quality / 10);
}

async function makeScoreReport(env) {
  const combined = await getCombinedData(env);
  let irOk = 0; for (const s of IR_SITES) if (await pingSite(s.url)) irOk++;
  const irScore = (irOk / IR_SITES.length) * 100;
  let globalPing = 0, globalCount = 0; for (const s of ALL_GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalPing += t; globalCount++; } }
  const avgPing = globalCount > 0 ? globalPing / globalCount : 500; const pingScore = Math.max(0, 100 - (avgPing / 5));
  const score = Math.round(combined.quality * 0.5 + irScore * 0.25 + pingScore * 0.25);
  let emoji = "🔴", status = "بحرانی";
  if (score >= 80) { emoji = "🟢"; status = "عالی"; } else if (score >= 60) { emoji = "🟡"; status = "خوب"; } else if (score >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "🎖️ <b>امتیاز کیفیت</b>\n\n" + emoji + " <b>" + status + "</b>\n\n⭐ <b>امتیاز:</b> <code>" + score + "/100</code>\n" + makeBar(score / 10) + "\n\n" +
    "✅ ترکیبی: <code>" + Math.round(combined.quality) + "%</code>\n🇮🇷 ایرانی: <code>" + Math.round(irScore) + "%</code>\n🌍 پینگ جهانی: <code>" + Math.round(pingScore) + "%</code>";
}

async function makePingReport() {
  let irList = "", globalList = ""; let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "  🟢 " + s.name + " <code>" + t + "ms</code>\n"; } else irList += "  🔴 " + s.name + "\n"; }
  for (const s of ALL_GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "  🟢 " + s.name + " <code>" + t + "ms</code>\n"; } else globalList += "  🔴 " + s.name + "\n"; }
  return "📡 <b>پینگ سرورها</b>\n\n🇮🇷 <b>ایرانی</b>  (" + irOk + "/" + IR_SITES.length + ")\n\n" + irList + "\n🌍 <b>جهانی</b>  (" + globalOk + "/" + ALL_GLOBAL_SITES.length + ")\n\n" + globalList;
}

async function makeFilteringReport(env) {
  const combined = await getCombinedData(env); const mood = getStatusMood(combined.blockPercent);
  let out = "🚫 <b>وضعیت فیلترینگ</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n🎯 دسترسی آزاد: <code>" + combined.quality + "%</code>\n🚫 اختلال: <code>" + combined.blockPercent + "%</code>\n\n" + makeBar(combined.quality / 10);
  return out;
}

async function makeSitesReport() {
  let out = "🌐 <b>بررسی سرویس‌ها</b>\n\n"; let acc = 0, list = "";
  for (const s of FILTER_CHECK) { const ok = await checkAccessible(s.url); if (ok) { acc++; list += "  ✅ " + s.name + "\n"; } else list += "  🚫 " + s.name + "\n"; }
  out += "📊 نتیجه: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n" + makeBar((acc/FILTER_CHECK.length)*10) + "\n\n" + list; return out;
}

async function makeCompareReport() {
  const p = await getOONIData(); if (!p.hasData) return "⚠️ داده OONI موجود نیست.";
  let ops = []; for (const [asn, d] of Object.entries(p.asnData)) { if (d.count >= 50) ops.push({ name: asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100) }); }
  if (ops.length === 0) return "⚠️ داده کافی نیست."; ops.sort((a, b) => b.rate - a.rate);
  let out = "🆚 <b>مقایسه اپراتورها</b>\n\n🏆 <b>بهترین‌ها:</b>\n";
  ops.slice(0, 5).forEach((o, i) => { out += (i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "🏅 ") + o.name + " - %" + o.rate + "\n"; });
  out += "\n🔻 <b>ضعیف‌ترین‌ها:</b>\n";
  ops.slice(-5).reverse().forEach(o => { out += "🔴 " + o.name + " - %" + o.rate + "\n"; });
  return out;
}

async function makeTopReport() {
  const p = parseOONI(await fetchOONI7d()); let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { if (d.count >= 500) ops.push({ name: asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100) }); }
  if (ops.length === 0) return "❌ داده کافی نیست."; ops.sort((a, b) => b.rate - a.rate);
  let out = "🏆 <b>رتبه‌بندی هفتگی</b>\n\n🥇 <b>بهترین‌ها:</b>\n";
  ops.slice(0, 7).forEach((o, i) => { out += (i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "  " + (i + 1) + ". ") + o.name + " - %" + o.rate + "\n"; });
  out += "\n🔻 <b>پایین‌ترین‌ها:</b>\n";
  ops.slice(-5).reverse().forEach(o => { out += "🔴 " + o.name + " - %" + o.rate + "\n"; });
  return out;
}

async function makeWorldReport() {
  const COUNTRIES = [{ code:"IR", name:"🇮🇷 ایران" }, { code:"TR", name:"🇹🇷 ترکیه" }, { code:"IQ", name:"🇮🇶 عراق" }, { code:"AE", name:"🇦🇪 امارات" }, { code:"SA", name:"🇸🇦 عربستان" }];
  let out = "🌍 <b>مقایسه منطقه‌ای</b>\n\n"; const results = [];
  for (const c of COUNTRIES) {
    try {
      const since = new Date(Date.now() - 604800000).toISOString().split("T")[0];
      const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=" + c.code + "&since=" + since + "&until=" + getToday() + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers:{ "Accept":"application/json" } });
      if (r.ok) { const d = await r.json(); let total = 0, blocked = 0; if (d.result) for (const row of d.result) { total += row.measurement_count || 0; blocked += (row.anomaly_count || 0) + (row.confirmed_count || 0); } results.push({ name:c.name, percent: total > 0 ? Math.round((blocked / total) * 100) : 0 }); }
    } catch(e) {}
  }
  if (results.length === 0) return "❌ داده کافی نیست."; results.sort((a, b) => a.percent - b.percent);
  results.forEach((r, i) => { const e = r.percent < 15 ? "🟢" : r.percent < 30 ? "🟡" : r.percent < 50 ? "🟠" : "🔴"; out += (i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "  ") + r.name + "  " + e + " <b>%" + r.percent + "</b>\n"; });
  return out;
}

async function makeBestTimeReport() {
  const hours = [{ r:"۰۲:۰۰ تا ۰۶:۰۰", q:90, e:"🏆" }, { r:"۰۶:۰۰ تا ۰۹:۰۰", q:75, e:"✅" }, { r:"۰۹:۰۰ تا ۱۲:۰۰", q:55, e:"🟡" }, { r:"۱۲:۰۰ تا ۱۷:۰۰", q:45, e:"🟠" }, { r:"۱۷:۰۰ تا ۲۲:۰۰", q:35, e:"🔴" }, { r:"۲۲:۰۰ تا ۰۲:۰۰", q:70, e:"✅" }];
  let out = "⏰ <b>بهترین ساعات</b>\n\n🏆 پیشنهاد: ۲ تا ۶ صبح\n\n"; for (const h of hours) out += h.e + " " + h.r + " • %" + h.q + "\n"; return out;
}

async function makeSpeedReport() {
  return "⚡ <b>تست سرعت</b>\n\n🌩 <a href='https://speed.cloudflare.com/'>Cloudflare</a>\n📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n⚡ <a href='https://fast.com/'>Fast.com</a>\n🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>";
}

async function makePrediction() {
  const p = parseOONI(await fetchOONI7d()); const days = Object.keys(p.dayData).sort(); if (days.length < 3) return "🔮 داده کافی نیست.";
  const values = days.map(d => p.dayData[d].total > 0 ? (p.dayData[d].blocked / p.dayData[d].total) * 100 : 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length; const trend = values[values.length - 1] - values[values.length - 2];
  return "🔮 <b>پیش‌بینی</b>\n\nمیانگین ۷ روز: <code>" + Math.round(avg) + "%</code>\nروند: " + (trend > 5 ? "📈 افزایشی" : trend < -5 ? "📉 کاهشی" : "➖ پایدار") + " <code>" + Math.round(trend) + "%</code>";
}

async function makeYearAgoReport() {
  try {
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Tehran", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(Date.now() - 365 * 86400000));
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + dateStr + "&until=" + dateStr + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers:{ "Accept":"application/json" } });
    if (!r.ok) return "❌ داده نیست."; const p = parseOONI(await r.json()); if (!p.hasData) return "❌ داده نیست.";
    const mood = getStatusMood(p.blockPercent); return "🕰 <b>یک سال پیش امروز</b>\n📅 " + dateStr + "\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n✅ آزاد: <code>" + p.accessPercent + "%</code>\n🚫 مسدود: <code>" + p.blockPercent + "%</code>";
  } catch(e) { return "❌ خطا."; }
}

async function makeISPReport(query) {
  const q = query.toLowerCase(); let asn = null;
  for (const [code, name] of Object.entries(ISP_MAP)) if (name.toLowerCase().includes(q) || q.includes(name.toLowerCase())) { asn = code; break; }
  if (!asn) return "❌ ISP پیدا نشد."; const p = await getOONIData(); const d = p.asnData[asn]; if (!d) return "❌ داده نیست.";
  const rate = Math.round((d.ok / d.total) * 100); let emoji = "🔴", status = "ضعیف";
  if (rate >= 80) { emoji = "🟢"; status = "عالی"; } else if (rate >= 60) { emoji = "🟡"; status = "خوب"; } else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "📡 <b>" + asnNameAuto(asn) + "</b>\n\n" + emoji + " <b>" + status + "</b>\n\n✅ آزاد: <code>" + rate + "%</code>\n🚫 مسدود: <code>" + (100 - rate) + "%</code>\n" + makeBar(rate / 10);
}

async function makeVsOperatorReport(op1, op2) {
  const p = await getOONIData(); if (!p.hasData) return "⚠️ داده نیست.";
  function findASN(q) { const s = q.toLowerCase(); for (const [code, name] of Object.entries(ISP_MAP)) { if (name.toLowerCase().includes(s) || s.includes(name.toLowerCase())) return code; } return null; }
  const asn1 = findASN(op1), asn2 = findASN(op2); if (!asn1 || !asn2) return "❌ پیدا نشد.";
  const d1 = p.asnData[asn1], d2 = p.asnData[asn2]; if (!d1 || !d2) return "❌ داده نیست.";
  const rate1 = Math.round((d1.ok / d1.total) * 100), rate2 = Math.round((d2.ok / d2.total) * 100); const winner = rate1 > rate2 ? 1 : 2;
  return "🆚 <b>مقایسه</b>\n\n" + (winner === 1 ? "🥇 " : "🥈 ") + asnNameAuto(asn1) + " - " + rate1 + "%\n" + (winner === 2 ? "🥇 " : "🥈 ") + asnNameAuto(asn2) + " - " + rate2 + "%\n\n🏆 برنده: " + asnNameAuto(winner === 1 ? asn1 : asn2);
}

// ================== 🏆 سیستم سنجاق هفتگی ==================
async function postWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return; try {
    const lbRaw = await STATS.get("leaderboard"); let lb = lbRaw ? JSON.parse(lbRaw) : []; lb = lb.filter(u => !isOwner(u.id)); if (lb.length === 0) return;
    let out = "🏆 <b>قهرمانان هفته</b>\n\n"; lb.slice(0, 10).forEach((u, i) => { out += (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1) + ".") + " " + getVipRank(u.p).emoji + " <b>" + (u.n || u.id).substring(0, 20) + "</b>  →  <code>" + u.p + "</code>\n"; });
    out += "\n🎁 🥇 +100 | 🥈 +50 | 🥉 +25\n\n🕒 " + getIranDate(); const chats = await getTrackedChats(STATS);
    for (const ch of chats) { try { const r = await sendMessage(TG, ch, out, { parse_mode:"HTML" }); if (r && r.ok && r.result) { await fetch(TG + "/pinChatMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id:ch, message_id:r.result.message_id }) }).catch(() => {}); } } catch(e) {} }
    if (lb[0]) await addPoints(STATS, lb[0].id, 100); if (lb[1]) await addPoints(STATS, lb[1].id, 50); if (lb[2]) await addPoints(STATS, lb[2].id, 25);
  } catch(e) {}
}

// ================== 📢 ارسال کانال و پنل ادمین ==================
async function sendChannelAdminPanel(TG, STATS, env) {
  try {
    const c = await getCombinedData(env); const mood = getStatusMood(c.blockPercent); const snapshots = await getSnapshots(STATS); const chats = await getTrackedChats(STATS);
    const msg = "👑 <b>پنل مدیریت رادار</b>\n━━━━━━━━━━━━━━━━━━━\n\n" + mood.emoji + " <b>وضعیت کلی:</b> " + mood.label + "\n◆ <b>شاخص نهایی:</b> <code>" + c.quality + "%</code>\n📶 <b>پینگ:</b> <code>" + c.avgPing + "ms</code>\n🌊 <b>ترافیک:</b> <code>" + c.trafficPercent + "%</code>\n📊 <b>نقاط ثبت‌شده:</b> " + snapshots.length + "/48\n🕒 <b>آخرین بروزرسانی:</b> " + getIranTimeFull() + "\n\n━━━━━━━━━━━━━━━━━━━\n📡 <b>کانال‌های متصل:</b>\n" + chats.map(ch => " • <code>" + ch + "</code>").join("\n");
    const keyboard = [[{ text: "📤 ارسال به کانال‌ها", callback_data: "admin_send_now" }], [{ text: "🗑 پاک کردن پیام قبل", callback_data: "admin_delete_last" }], [{ text: "🔄 بازخوانی پنل", callback_data: "admin_refresh" }]];
    const r = await sendMessage(TG, CH1, msg, { parse_mode:"HTML", inline_keyboard: keyboard });
    if (r && r.ok && r.result) { await STATS.put("admin_panel_msg", String(r.result.message_id), { expirationTtl: 3600 }); try { await fetch(TG + "/pinChatMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id: CH1, message_id: r.result.message_id, disable_notification: true }) }).catch(() => {}); } catch(e) {} }
  } catch(e) {}
}

async function sendStatusToChannels(TG, STATS, env) {
  try {
    const c = await getCombinedData(env); const chart = await makeTodayChart(STATS, env, c); const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const lastMsg = await STATS.get("msg:" + ch); if (lastMsg) await fetch(TG + "/deleteMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id: ch, message_id: parseInt(lastMsg) }) }).catch(() => {});
        if (chart.image) {
          const formData = new FormData(); formData.append("chat_id", String(ch)); formData.append("caption", chart.caption); formData.append("parse_mode", "HTML");
          const blob = new Blob([chart.image], { type:"image/png" }); formData.append("photo", blob, "chart.png");
          const r = await fetch(TG + "/sendPhoto", { method:"POST", body:formData }); const d = await r.json();
          if (d.ok && d.result) await STATS.put("msg:" + ch, String(d.result.message_id));
        }
      } catch(e) {}
    }
  } catch(e) {}
}

// ================== 🎰 اسپین و نشان‌ها ==================
async function handleSpin(STATS, userId, TG, chatId) {
  try {
    const today = getToday(); const key = "spin:" + userId;
    if (await STATS.get(key) === today) return await sendMessage(TG, chatId, "🎰 امروز اسپین کردی! فردا بیا.");
    const prizes = [1,2,5,10,15,20,50]; const prize = prizes[Math.floor(Math.random() * prizes.length)];
    await STATS.put(key, today, { expirationTtl:172800 }); await addPoints(STATS, userId, prize);
    const pts = await getPoints(STATS, userId);
    await sendMessage(TG, chatId, "🎰 <b>نتیجه!</b>\n\n🎁 <b>+ " + prize + " امتیاز</b>\n\n🏆 کل: <code>" + pts + "</code>", { parse_mode:"HTML" });
  } catch(e) {}
}

// ================== 🎛 پنل کاربر (دکمه‌های شیشه‌ای کامل) ==================
async function sendStartPanel(TG, chatId, userId, userName, STATS) {
  await addPoints(STATS, userId, 1); const pts = await getPoints(STATS, userId); const rank = getVipRank(pts);
  const keyboard = [
    [{ text: "📊 گزارش کامل", callback_data: "status" }, { text: "📈 نمودار ۲۴ ساعته", callback_data: "today" }],
    [{ text: "🗺 نقشه حرارتی", callback_data: "map" }, { text: "📶 پینگ", callback_data: "ping" }],
    [{ text: "🌍 بررسی سایت‌ها", callback_data: "sites" }, { text: "📊 سهم اپراتورها", callback_data: "shares" }],
    [{ text: "📉 روند فیلترینگ", callback_data: "trend" }, { text: "📅 تاریخچه", callback_data: "history" }],
    [{ text: "🆚 مقایسه اپراتورها", callback_data: "compare" }, { text: "🏆 رتبه‌بندی", callback_data: "top" }],
    [{ text: "🌍 مقایسه منطقه‌ای", callback_data: "world" }, { text: "⏰ بهترین زمان", callback_data: "best" }],
    [{ text: "🔮 پیش‌بینی", callback_data: "predict" }, { text: "🕰 یک سال پیش", callback_data: "yearago" }],
    [{ text: "⚡ تست سرعت", callback_data: "speed" }, { text: "🎰 اسپین", callback_data: "spin" }],
    [{ text: "🎁 دعوت", callback_data: "invite" }, { text: "💎 نشان‌ها", callback_data: "badges" }],
    [{ text: "📚 راهنما", callback_data: "help" }],
    [{ text: "📡 کانال", url: "https://t.me/radarinternetiran" }, { text: "💬 گروه", url: "https://t.me/radarinternetirangruop" }]
  ];
  await sendMessage(TG, chatId, "👋 <b>سلام " + userName + "!</b>\n\n🏆 امتیاز: <code>" + pts + "</code>\n⭐ سطح: " + rank.emoji + " " + rank.name + "\n\n👇 انتخاب کنید:", { parse_mode:"HTML", inline_keyboard: keyboard });
}

// ================== 🎯 HANDLE UPDATE ==================
async function handleUpdate(update, TG, STATS, env) {
  if (TG) TG_GLOBAL = TG;
  if (STATS && CACHED_OWNER_IDS.length === 0) await loadOwnerIds(STATS);

  // ---- Callback Query ----
  if (update.callback_query) {
    const cq = update.callback_query; const chatId = cq.message ? cq.message.chat.id : cq.from.id;
    const userId = String(cq.from.id); const userName = cq.from.first_name || "کاربر";
    
    if (cq.data === "admin_send_now") { await answerCallback(TG, cq.id, "در حال ارسال..."); await sendStatusToChannels(TG, STATS, env); return; }
    if (cq.data === "admin_delete_last") {
      const lastMsg = await STATS.get("msg:" + CH1);
      if (lastMsg) await fetch(TG + "/deleteMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id: CH1, message_id: parseInt(lastMsg) }) }).catch(() => {});
      await answerCallback(TG, cq.id, "✅ پاک شد."); return;
    }
    if (cq.data === "admin_refresh") { await answerCallback(TG, cq.id, "✅"); await sendChannelAdminPanel(TG, STATS, env); return; }

    await answerCallback(TG, cq.id, "در حال پردازش...");
    const c = await getCombinedData(env);
    
    if (cq.data === "status") await sendMessage(TG, chatId, await makeReport("full", env, c), { parse_mode:"HTML" });
    else if (cq.data === "today") { const ch = await makeTodayChart(STATS, env, c); if (ch.image) await sendPhoto(TG, chatId, ch.image, ch.caption); }
    else if (cq.data === "map") { const ch = await makeIranMapChart(env, c); if (ch.image) await sendPhoto(TG, chatId, ch.image, ch.caption); }
    else if (cq.data === "shares") { const ch = await makeOperatorShares(env); if (ch.image) await sendPhoto(TG, chatId, ch.image, ch.caption); }
    else if (cq.data === "ping") await sendMessage(TG, chatId, await makePingReport(), { parse_mode:"HTML" });
    else if (cq.data === "sites") await sendMessage(TG, chatId, await makeSitesReport(), { parse_mode:"HTML" });
    else if (cq.data === "trend") { const ch = await makeTrendChart(); if (ch.image) await sendPhoto(TG, chatId, ch.image, ch.caption); }
    else if (cq.data === "history") { const ch = await makeHistoryChart(); if (ch.image) await sendPhoto(TG, chatId, ch.image, ch.caption); }
    else if (cq.data === "compare") await sendMessage(TG, chatId, await makeCompareReport(), { parse_mode:"HTML" });
    else if (cq.data === "top") await sendMessage(TG, chatId, await makeTopReport(), { parse_mode:"HTML" });
    else if (cq.data === "world") await sendMessage(TG, chatId, await makeWorldReport(), { parse_mode:"HTML" });
    else if (cq.data === "best") await sendMessage(TG, chatId, await makeBestTimeReport(), { parse_mode:"HTML" });
    else if (cq.data === "predict") await sendMessage(TG, chatId, await makePrediction(), { parse_mode:"HTML" });
    else if (cq.data === "yearago") await sendMessage(TG, chatId, await makeYearAgoReport(), { parse_mode:"HTML" });
    else if (cq.data === "speed") await sendMessage(TG, chatId, await makeSpeedReport(), { parse_mode:"HTML" });
    else if (cq.data === "spin") await handleSpin(STATS, userId, TG, chatId);
    else if (cq.data === "invite") await sendMessage(TG, chatId, "🎁 <b>دعوت</b>\n\n🔗 <code>https://t.me/" + BOT_USERNAME + "?start=ref_" + userId + "</code>", { parse_mode:"HTML" });
    else if (cq.data === "badges") {
      const badges = await getUserBadges(STATS, userId); let out = "💎 <b>نشان‌ها</b>\n\n";
      for (const [id, b] of Object.entries(BADGES)) { const has = badges.includes(id); out += (has ? "✅ " : "🔒 ") + b.emoji + " <b>" + b.name + "</b>\n"; }
      await sendMessage(TG, chatId, out, { parse_mode:"HTML" });
    }
    else if (cq.data === "help") await sendMessage(TG, chatId, "📚 <b>دستورات:</b>\n/start - منو\n/today - نمودار\n/help - راهنما", { parse_mode:"HTML" });
    return;
  }

  if (!update.message) return;
  const msg = update.message; const chatId = msg.chat.id; const text = msg.text || "";
  const userId = String(msg.from.id); const userName = msg.from.first_name || "کاربر";

  if (msg.from.username && OWNER_USERNAMES.includes(msg.from.username)) { if (!isOwner(userId)) { CACHED_OWNER_IDS.push(userId); await STATS.put("owners", JSON.stringify(CACHED_OWNER_IDS)); } }
  if (msg.chat.type !== "private") return;

  if (text === "/admin") { await sendMessage(TG, chatId, "🔐 رمز ادمین:"); return; }
  if (text === ADMIN_PASS) {
    await sendMessage(TG, chatId, "✅ رمز صحیح! در حال ساخت پنل در کانال...");
    await sendChannelAdminPanel(TG, STATS, env); return;
  }

  await trackUser(STATS, userId, userName);

  if (text.startsWith("/start ref_")) {
    const ref = text.replace("/start ref_", "").trim();
    if (ref && ref !== userId && STATS) {
      const already = await getReferrer(STATS, userId);
      if (!already) { await STATS.put("ref:" + userId, ref); await addPoints(STATS, ref, 10); await addPoints(STATS, userId, 5); }
    }
  }

  if (text === "/start" || text.startsWith("/start ")) await sendStartPanel(TG, chatId, userId, userName, STATS);
  else if (text === "/today") { const c = await makeTodayChart(STATS, env); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); }
  else if (text === "/help") await sendMessage(TG, chatId, "📚 <b>دستورات:</b>\n/start - منو\n/today - نمودار\n/help - راهنما", { parse_mode:"HTML" });
  else if (text === "/sendchannel" && isOwner(userId)) await sendStatusToChannels(TG, STATS, env);
}

// ================== 🌐 API & WIDGET ==================
async function handleAPI(url, STATS, env) {
  const cors = { "Content-Type":"application/json; charset=utf-8", "Access-Control-Allow-Origin":"*", "Cache-Control":"no-store" };
  try {
    if (url.pathname === "/api/status") {
      const c = await getCombinedData(env);
      return new Response(JSON.stringify({ ok:true, data:{
        quality_final: c.quality, ooni_quality: c.ooniQuality, iranian_quality: c.iranianQuality,
        global_quality: c.globalQuality, block_percent: c.blockPercent, traffic_percent: c.trafficPercent,
        avg_ping_ms: c.avgPing, success_rate: c.successRate, date_iran: getIranDate(), version: CURRENT_VERSION
      }}, null, 2), { headers:cors });
    }
    return new Response(JSON.stringify({ ok:false, error:"Not found" }), { status:404, headers:cors });
  } catch(e) { return new Response(JSON.stringify({ ok:false, error:e.message }), { status:500, headers:cors }); }
}

async function handleWidget(env) {
  const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
  body { margin: 0; padding: 0; background: transparent; font-family: Tahoma, Arial, sans-serif; overflow: hidden; }
  .widget { background: #0a1128; color: #fff; padding: 15px; border-radius: 12px; border: 1px solid #d4af37; text-align: center; }
  h3 { color: #d4af37; margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px dashed #334155; padding-bottom: 8px; }
  .score { font-size: 36px; font-weight: bold; margin: 10px 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: right; font-size: 11px; margin-bottom: 15px; }
  .item { background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px; }
  .btn { display: block; background: #d4af37; color: #0a1128; padding: 8px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; }
  </style></head><body>
  <div class="widget"><h3>🛰 وضعیت لحظه‌ای اینترنت</h3><div id="loading" style="color:#94a3b8; font-size:12px;">⏳ در حال دریافت...</div>
  <div id="content" style="display:none;"><div class="score" id="main-score">0%</div><div style="color:#94a3b8; font-size:11px; margin-top:-10px; margin-bottom:10px;">شاخص نهایی</div>
  <div class="grid"><div class="item"><div style="color:#06b6d4;">◉ OONI</div><div id="ooni">-</div></div><div class="item"><div style="color:#a855f7;">🇮🇷 ایرانی</div><div id="iranian">-</div></div><div class="item"><div style="color:#22c55e;">🌍 جهانی</div><div id="global">-</div></div><div class="item"><div style="color:#0ea5e9;">📶 پینگ</div><div id="ping">-</div></div></div>
  <a href="https://t.me/Radarineternetiranbot" target="_blank" class="btn">گزارش کامل در ربات</a></div></div>
  <script>
  function updateWidget() { fetch('https://radar-bot.royal-trust-ir-official.workers.dev/api/status?t=' + new Date().getTime(), { cache: "no-store" }).then(r => r.json()).then(res => {
    if (res.ok && res.data) { const d = res.data; document.getElementById('loading').style.display = 'none'; document.getElementById('content').style.display = 'block';
      let color = '#ef4444'; if (d.quality_final >= 80) color = '#10b981'; else if (d.quality_final >= 60) color = '#eab308'; else if (d.quality_final >= 40) color = '#f97316';
      const ms = document.getElementById('main-score'); ms.innerText = d.quality_final + '%'; ms.style.color = color;
      document.getElementById('ooni').innerText = d.ooni_quality !== null ? d.ooni_quality + '%' : 'نامشخص'; document.getElementById('iranian').innerText = d.iranian_quality !== null ? d.iranian_quality + '%' : 'نامشخص';
      document.getElementById('global').innerText = d.global_quality !== null ? d.global_quality + '%' : 'نامشخص'; document.getElementById('ping').innerText = d.avg_ping_ms > 0 ? d.avg_ping_ms + 'ms' : 'نامشخص';
    } }).catch(e => { document.getElementById('loading').innerText = '⚠️ ارتباط با سرور برقرار نشد.'; }); }
  updateWidget(); setInterval(updateWidget, 60000);
  </script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ================== 🚀 WORKER EXPORT ==================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const STATS = env.STATS || env.KV;
    const TG = "https://api.telegram.org/bot" + env.BOT_TOKEN;
    TG_GLOBAL = TG;
    
    if (STATS && CACHED_OWNER_IDS.length === 0) {
      try { const raw = await STATS.get("owners"); if (raw) CACHED_OWNER_IDS.push(...JSON.parse(raw)); } catch(e) {}
    }

    if (url.pathname === "/widget") return await handleWidget(env);
    if (url.pathname.startsWith("/api")) return await handleAPI(url, STATS, env);
    
    if (url.pathname === "/admin") {
      const pass = url.searchParams.get("pass");
      if (pass !== ADMIN_PASS) return new Response("⛔", { status:403 });
      return new Response("<h1 style='color:#fff;font-family:Tahoma;padding:40px;background:#0a1128'>داشبورد فعال است.</h1>", { headers:{ "Content-Type":"text/html; charset=utf-8" } });
    }

    if (url.pathname === "/snapshot") { await saveSnapshot(STATS, env); return new Response("✅"); }
    if (url.pathname === "/sendchannel") { await sendStatusToChannels(TG, STATS, env); return new Response("✅"); }

    if (request.method === "POST") {
      try { const update = await request.json(); ctx.waitUntil(handleUpdate(update, TG, STATS, env)); } catch(e) {}
      return new Response("OK");
    }
    return new Response("🛰 Radar v" + CURRENT_VERSION);
  },

  async scheduled(event, env, ctx) {
    const STATS = env.STATS || env.KV;
    const TG = "https://api.telegram.org/bot" + env.BOT_TOKEN;
    TG_GLOBAL = TG;

    if (event.cron === "*/30 * * * *") { await saveSnapshot(STATS, env); return; }
    if (event.cron === "0 * * * *") { await sendStatusToChannels(TG, STATS, env); return; }
    if (event.cron === "0 21 * * 5") { await postWeeklyLeaderboard(TG, STATS); return; }
  }
};
