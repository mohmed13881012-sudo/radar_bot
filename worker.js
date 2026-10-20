// ============================================================
// 🛰 RADAR INTERNET IRAN — v18.0.0 (FULL)
// PART 1/2 : Core + Data + Unified Chart
// ============================================================

const CURRENT_VERSION = "18.0.0";
const CHART_POINTS = 96;
const QUALITY_DROP_THRESHOLD = 15;
const BOT_USERNAME = "Radarineternetiranbot";
const ADMIN_PASS = "RadarAdmin@2025";
const CH1 = "@radarinternetiran";
const CH3 = "@radarinternetirangruop";
const OWNER_USERNAMES = ["royal_trust", "royal_trust_ir"];
const OWNER_IDS_MANUAL = [];
const OWNER_DISPLAY_NAME = "👑 مالک ربات";
const WEEKLY_PIN_MSG_KEY = "weekly_pin_msg_id";
const SNAP_AUTO_INTERVAL = 300000;
let TG_GLOBAL = null;
let CACHED_OWNER_IDS = [];

const CHANGELOG = {
  "18.0.0": {
    date: "۱۴۰۴/۰۷/۲۵",
    emoji: "🎯",
    title: "شاخص جامع و منوی شیشه‌ای",
    changes: [
      { icon:"🧠", text:"تبدیل همه منابع به <b>یک شاخص جامع</b>" },
      { icon:"📈", text:"طراحی نمودار جدید (سبک NetBlocks)" },
      { icon:"🔘", text:"منوی شیشه‌ای (دکمه‌های تعاملی)" },
      { icon:"🌐", text:"افزودن ویجت اختصاصی برای وبلاگ" }
    ]
  }
};

const IRANIAN_SITES = [
  { name:"Digikala", url:"https://www.digikala.com" },
  { name:"Aparat",   url:"https://www.aparat.com" },
  { name:"Shad",     url:"https://shad.ir" },
  { name:"Bale",     url:"https://bale.ai" }
];

const GLOBAL_SITES = [
  { name:"Google",     url:"https://www.google.com" },
  { name:"Cloudflare", url:"https://1.1.1.1" },
  { name:"Wikipedia",  url:"https://www.wikipedia.org" },
  { name:"GitHub",     url:"https://github.com" }
];

const IR_SITES = [
  { name:"Google.ir", url:"https://www.google.ir" },
  { name:"Digikala",  url:"https://www.digikala.com" },
  { name:"Aparat",    url:"https://www.aparat.com" },
  { name:"Bale",      url:"https://bale.ai" },
  { name:"Eitaa",     url:"https://eitaa.com" },
  { name:"Shad",      url:"https://shad.ir" }
];

const ALL_GLOBAL_SITES = [
  { name:"Google",     url:"https://www.google.com" },
  { name:"Cloudflare", url:"https://1.1.1.1" },
  { name:"Wikipedia",  url:"https://www.wikipedia.org" },
  { name:"GitHub",     url:"https://github.com" },
  { name:"Telegram",   url:"https://telegram.org" },
  { name:"YouTube",    url:"https://www.youtube.com" },
  { name:"Instagram",  url:"https://www.instagram.com" },
  { name:"Twitter/X",  url:"https://x.com" }
];

const FILTER_CHECK = [
  { name:"Instagram", url:"https://www.instagram.com" },
  { name:"YouTube",   url:"https://www.youtube.com" },
  { name:"Twitter/X", url:"https://x.com" },
  { name:"Telegram",  url:"https://telegram.org" },
  { name:"WhatsApp",  url:"https://web.whatsapp.com" }
];

const ISP_MAP = {
  "44244":"ایرانسل","197207":"همراه اول","58224":"مخابرات (TCI)",
  "31549":"شاتل","42337":"پارس آنلاین","43754":"آسیاتک",
  "57218":"رایتل","16322":"پارس پک","44208":"پارس‌فون",
  "58262":"IranServer","50810":"پیشگامان","205647":"مبین‌نت",
  "12880":"زیرساخت (DCI)","25184":"افرانت","6736":"DCI-2",
  "39501":"پارس‌نت","56402":"های‌وب","208161":"ابر آروان"
};

const BADGES = {
  first_leader:{ emoji:"👑", name:"صدرنشین",    desc:"اولین رتبه هفته" },
  inviter_5:{    emoji:"🎁", name:"دعوت‌کننده", desc:"۵ دعوت موفق" },
  inviter_10:{   emoji:"🎯", name:"سفیر رادار", desc:"۱۰ دعوت موفق" },
  spin_lucky:{   emoji:"💎", name:"خوش‌شانس",   desc:"جایزه ۵۰+ در اسپین" }
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

function makeBar(score, length = 10) {
  const filled = Math.max(0, Math.min(length, Math.round(score)));
  return "▓".repeat(filled) + "░".repeat(length - filled);
}

function getStatusMood(blockPercent) {
  if (blockPercent < 10) return { emoji:"🟢", label:"عالی",   color:"#10b981" };
  if (blockPercent < 25) return { emoji:"🟢", label:"خوب",    color:"#22c55e" };
  if (blockPercent < 40) return { emoji:"🟡", label:"متوسط",  color:"#eab308" };
  if (blockPercent < 55) return { emoji:"🟠", label:"ضعیف",   color:"#f97316" };
  if (blockPercent < 70) return { emoji:"🔴", label:"بد",     color:"#ef4444" };
  return                       { emoji:"🚨", label:"بحرانی",  color:"#dc2626" };
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
  if (!r.ok) throw new Error("OONI " + r.status);
  return await r.json();
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

async function fetchCloudflareIQI(env) {
  if (!env || !env.RADAR_TOKEN) return null;
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/radar/quality/iqi/summary?location=IR&dateRange=1d", { headers: { "Authorization":"Bearer " + env.RADAR_TOKEN, "Accept":"application/json" } });
    if (!r.ok) return null; const d = await r.json();
    if (d && d.result && d.result.summary && typeof d.result.summary.iqi === "number") return { quality: Math.round(d.result.summary.iqi), source: "Cloudflare IQI" };
    return null;
  } catch(e) { return null; }
}

async function fetchCheckHostData() {
  try {
    const url = "https://check-host.net/check-http?host=https://www.google.com&node=ir1.node.check-host.net&node=ir2.node.check-host.net&node=ir3.node.check-host.net";
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
    return { quality: Math.round((okNodes / totalNodes) * 100), ok: okNodes, total: totalNodes };
  } catch(e) { return null; }
}

// ================== 🧠 COMBINED DATA (Unified) ==================
let _combinedCache = { data:null, ts:0 };

async function getCombinedData(env) {
  const now = Date.now();
  if (_combinedCache.data && (now - _combinedCache.ts) < 45000) return _combinedCache.data;
  const result = await getCombinedDataRaw(env);
  _combinedCache = { data: result, ts: now };
  return result;
}

async function getCombinedDataRaw(env) {
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

  return {
    quality, blockPercent, accessPercent: quality,
    ooniQuality, cfQuality, chQuality, iranianQuality, globalQuality,
    iranianStats: { ok: iranianTest.ok, total: iranianTest.total },
    globalStats: { ok: globalTest.ok, total: globalTest.total },
    chStats: checkHost ? { ok: checkHost.ok, total: checkHost.total } : { ok:0, total:0 },
    trafficPercent, avgPing, successRate, totalMs, sources, weights, activeSources
  };
}

// ================== 📸 SNAPSHOTS & CHARTS ==================
const SNAP_KEY_PREFIX = "snap:";

async function saveSnapshot(STATS, date, env) {
  if (!STATS) return false;
  try {
    const combined = await getCombinedData(env);
    const hour = getIranHour(); const minute = new Date().getMinutes(); const slot = Math.floor(minute / 15) * 15;
    const label = String(hour).padStart(2, "0") + ":" + String(slot).padStart(2, "0");
    const today = getToday(); const key = SNAP_KEY_PREFIX + today; const raw = await STATS.get(key);
    let snaps = raw ? JSON.parse(raw) : [];
    const snap = { label, quality: combined.quality, blockPercent: combined.blockPercent, trafficPercent: combined.trafficPercent, ts: Date.now() };
    const existingIdx = snaps.findIndex(s => s.label === label);
    if (existingIdx >= 0) snaps[existingIdx] = snap; else snaps.push(snap);
    snaps.sort((a, b) => (a.label > b.label ? 1 : -1)); snaps = snaps.slice(-CHART_POINTS);
    await STATS.put(key, JSON.stringify(snaps), { expirationTtl:172800 });
    return true;
  } catch(e) { return false; }
}

async function getSnapshots(STATS, limit = CHART_POINTS) {
  if (!STATS) return [];
  try { const today = getToday(); const key = SNAP_KEY_PREFIX + today; const raw = await STATS.get(key); const snaps = raw ? JSON.parse(raw) : []; return snaps.slice(-limit); } catch(e) { return []; }
}

async function getDailySnapshot(STATS, date) {
  if (!STATS) return null;
  try { const key = SNAP_KEY_PREFIX + date; const raw = await STATS.get(key); const snaps = raw ? JSON.parse(raw) : [];
    if (snaps.length === 0) return { hasData:false };
    const avg = Math.round(snaps.reduce((s, x) => s + (x.quality || 0), 0) / snaps.length);
    return { hasData:true, accessPercent:avg, blockPercent:100 - avg };
  } catch(e) { return { hasData:false }; }
}

async function ensureTodaySnapshot(STATS, env) { try { await saveSnapshot(STATS, new Date(), env); } catch(e) {} }

async function maybeAutoSnapshot(STATS, env) {
  if (!STATS) return;
  try {
    const lastTsRaw = await STATS.get("last_snap_ts"); const lastTs = lastTsRaw ? parseInt(lastTsRaw) : 0; const now = Date.now();
    if (now - lastTs < SNAP_AUTO_INTERVAL) return;
    await saveSnapshot(STATS, new Date(), env); await STATS.put("last_snap_ts", String(now), { expirationTtl: 86400 });
  } catch(e) {}
}

async function renderChart(config, bgColor = "#0a1128") {
  const payload = { ...config }; delete payload._bg; const encoded = encodeURIComponent(JSON.stringify(payload));
  const url = "https://quickchart.io/chart?c=" + encoded + "&w=1000&h=580&bkg=" + encodeURIComponent(bgColor) + "&devicePixelRatio=2&format=png&v=2.9.4";
  try { const r = await fetch(url); if (!r.ok) return null; return new Uint8Array(await r.arrayBuffer()); } catch(e) { return null; }
}

async function getChartImageDark(config, bg = "#0a1128") { return await renderChart(config, bg); }
async function getChartImage(config) { return await renderChart(config, "#ffffff"); }

// ================== 🎯 MAIN CHART (Unified) ==================
async function makeTodayChart(STATS, env, combinedInput) {
  const combined = combinedInput || await getCombinedData(env);
  let snapshots = await getSnapshots(STATS, CHART_POINTS);

  if (!snapshots || snapshots.length === 0) {
    const now = new Date(); const hour = getIranHour(); const slot = Math.floor(now.getMinutes() / 15) * 15;
    const label = String(hour).padStart(2, "0") + ":" + String(slot).padStart(2, "0");
    snapshots = [{ label, quality: combined.quality, blockPercent: combined.blockPercent, trafficPercent: combined.trafficPercent, ts: Date.now() }];
  }

  const labels = [], healthData = [], disruptionData = [];

  for (const s of snapshots) {
    labels.push(s.label);
    if (s.quality !== null && s.quality !== undefined) {
      healthData.push(s.quality);
      disruptionData.push(s.blockPercent ?? (100 - s.quality));
    } else { healthData.push(null); disruptionData.push(null); }
  }

  const startTime = labels[0] || "—"; const endTime = labels[labels.length - 1] || "—";
  const mood = getStatusMood(combined.blockPercent);
  const qualityColor = mood.color;

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [
        { label:"شاخص جامع پایداری", data:healthData, borderColor:qualityColor, backgroundColor:qualityColor + "30",
          borderWidth:5, tension:0.4, fill:true, yAxisID:"y-left", pointRadius:6, pointHoverRadius:10,
          pointBackgroundColor:"#ffffff", pointBorderColor:qualityColor, pointBorderWidth:3, spanGaps:true },
        { label:"نرخ اختلال", data:disruptionData, borderColor:"#ef4444", borderDash:[5,5],
          borderWidth:2.5, tension:0.4, fill:false, yAxisID:"y-left", pointRadius:0, spanGaps:true }
      ]
    },
    options: {
      title: { display:true, text:"🛰  رادار اینترنت ایران", fontSize:28, fontColor:"#ffffff", padding:24, fontStyle:"bold" },
      subtitle: { display:true, text: mood.emoji + "  " + mood.label + "  •  شاخص کلی: " + combined.quality + "%",
        fontSize:18, fontColor:qualityColor, padding:14 },
      legend: { position:"bottom", labels:{ fontColor:"#cbd5e1", fontSize:14, usePointStyle:true, padding:20 } },
      layout: { padding:{ top:20, bottom:20, left:30, right:30 } },
      scales: {
        xAxes: [{ ticks:{ fontColor:"#64748b", fontSize:11, maxRotation:55 }, gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false } }],
        yAxes: [{ id:"y-left", position:"left", ticks:{ min:0, max:100, fontColor:qualityColor, fontSize:14, stepSize:25, callback:v => v+"%" },
            gridLines:{ color:"rgba(100,116,139,0.08)", drawBorder:false },
            scaleLabel:{ display:true, labelString:"درصد", fontColor:qualityColor, fontSize:14, fontStyle:"bold" } }]
      },
      elements: { line:{ capBezierPoints:true } }
    }
  };

  const img = await getChartImageDark(config, "#0a1128");
  const realCount = healthData.filter(v => v !== null).length;

  const caption =
    "🛰 <b>رادار اینترنت ایران</b>\n" +
    "━━━━━━━━━━━━━━━━━━━\n\n" +
    mood.emoji + " <b>" + mood.label + "</b>  •  شاخص: <b>" + combined.quality + "%</b>\n" +
    "🕒 <code>" + startTime + " → " + endTime + "</code>\n\n" +
    "📶 <b>پینگ:</b> <code>" + combined.avgPing + "ms</code>  •  ✅ <b>موفقیت:</b> <code>" + combined.successRate + "%</code>\n" +
    "🌊 <b>ترافیک:</b> <code>" + combined.trafficPercent + "%</code>\n\n" +
    makeBar(combined.quality / 10) + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "📊 نقاط ثبت‌شده: <b>" + realCount + "/" + CHART_POINTS + "</b>  <i>(هر ۱۵ دقیقه)</i>\n" +
    "🕒 بروزرسانی: " + getIranTimeFull() + "\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "🛰 @Radarineternetiranbot";

  return { image: img, caption };
}

// ================== 📊 OTHER CHARTS ==================
async function makeOperatorSharesChart(STATS, env) {
  try {
    const p = await getOONIData(); if (!p.hasData) return { image:null, caption:"❌ داده کافی نیست." };
    const entries = Object.entries(p.asnData); const total = entries.reduce((s, [_, d]) => s + d.count, 0);
    if (total === 0) return { image:null, caption:"❌ داده کافی نیست." };
    let ops = [];
    for (const [asn, d] of entries) { const name = await asnNameAuto(asn); ops.push({ name, share: Math.round((d.count / total) * 1000) / 10 }); }
    ops.sort((a, b) => b.share - a.share); ops = ops.slice(0, 8);
    const labels = ops.map(s => s.name); const data = ops.map(s => s.share);
    const colors = ops.map(s => s.share >= 30 ? "#10b981" : s.share >= 20 ? "#22c55e" : s.share >= 10 ? "#eab308" : "#f97316");
    const img = await getChartImageDark({
      type: "horizontalBar", data: { labels, datasets: [{ label:"سهم %", data, backgroundColor:colors, borderColor:"#fff", borderWidth:1 }] },
      options: { title:{ display:true, text:"📊 سهم پهنای باند اپراتورها", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" }, legend:{ display:false },
        scales:{ xAxes:[{ ticks:{ beginAtZero:true, max:50, fontColor:"#cbd5e1", callback:v => v+"%" }, gridLines:{ color:"rgba(100,116,139,0.15)" } }], yAxes:[{ ticks:{ fontColor:"#f8fafc" }, gridLines:{ display:false } }] } }
    }, "#0a1128");
    return { image: img, caption: "📊 <b>سهم اپراتورها</b>\n\n" + getDateBoth() };
  } catch(e) { return { image:null, caption:"❌ خطا." }; }
}

async function makeBarChart() {
  const p = await getOONIData(); if (!p.hasData) return { image:null, caption:"❌ داده کافی نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { ops.push({ name: await asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100), count:d.count }); }
  ops.sort((a, b) => b.count - a.count); ops = ops.slice(0, 8);
  const img = await getChartImageDark({
    type:"horizontalBar", data:{ labels:ops.map(o => o.name), datasets:[{ label:"دسترسی آزاد %", data:ops.map(o => o.rate), backgroundColor:ops.map(o => o.rate >= 80 ? "#10b981" : o.rate >= 60 ? "#84cc16" : o.rate >= 40 ? "#f59e0b" : "#ef4444"), borderColor:"#ffffff", borderWidth:1 }]},
    options:{ title:{ display:true, text:"📊 کیفیت اپراتورها", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" }, legend:{ display:false }, scales:{ xAxes:[{ ticks:{ beginAtZero:true, max:100, fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ color:"rgba(100,116,139,0.15)" } }], yAxes:[{ ticks:{ fontColor:"#f8fafc", fontSize:13 }, gridLines:{ display:false } }] } }
  }, "#0a1128");
  return { image:img, caption:"📊 <b>کیفیت اپراتورها</b>\n\n" + getDateBoth() };
}

async function makePieChart() {
  const p = await getOONIData(); if (!p.hasData) return { image:null, caption:"❌ داده کافی نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { ops.push({ name: await asnNameAuto(asn), count:d.count }); }
  ops.sort((a, b) => b.count - a.count); ops = ops.slice(0, 6);
  const colors = ["#3b82f6","#ef4444","#10b981","#f59e0b","#a855f7","#f97316"];
  const img = await getChartImageDark({
    type:"doughnut", data:{ labels:ops.map(o => o.name), datasets:[{ data:ops.map(o => o.count), backgroundColor:colors, borderColor:"#0a1128", borderWidth:4 }] },
    options:{ title:{ display:true, text:"🥧 سهم اپراتورها", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" }, legend:{ position:"bottom", labels:{ fontColor:"#cbd5e1", fontSize:13, usePointStyle:true, padding:18 } } }
  }, "#0a1128");
  return { image:img, caption:"🥧 <b>سهم اپراتورها</b>\n\n" + getDateBoth() };
}

async function makeTrendChart() {
  const p = parseOONI(await fetchOONI7d()); const days = Object.keys(p.dayData).sort();
  const labels = [], values = [];
  for (const d of days) { labels.push(d.substring(5)); values.push(p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0); }
  if (values.length === 0) return { image:null, caption:"❌ داده کافی نیست." };
  const img = await getChartImageDark({
    type:"line", data:{ labels, datasets:[{ label:"مسدودسازی %", data:values, borderColor:"#f43f5e", backgroundColor:"rgba(244,63,94,0.2)", fill:true, tension:0.4, borderWidth:4, pointRadius:6, pointBackgroundColor:"#ffffff", pointBorderColor:"#f43f5e", pointBorderWidth:2.5 }]},
    options:{ title:{ display:true, text:"📈 روند فیلترینگ ۷ روز", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" }, legend:{ display:false }, scales:{ yAxes:[{ ticks:{ beginAtZero:true, max:100, fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ color:"rgba(100,116,139,0.1)" } }], xAxes:[{ ticks:{ fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ display:false } }] } }
  }, "#0a1128");
  return { image:img, caption:"📈 <b>روند فیلترینگ ۷ روز</b>\n\n📅 " + getDateBoth() };
}

async function makeHistoryChart() {
  const p = parseOONI(await fetchOONI7d()); const days = Object.keys(p.dayData).sort();
  const labels = [], values = [];
  for (const d of days) { labels.push(d.substring(5)); values.push(p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0); }
  if (values.length === 0) return { image:null, caption:"❌ داده کافی نیست." };
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const img = await getChartImageDark({
    type:"line", data:{ labels, datasets:[{ label:"مسدودسازی %", data:values, borderColor:"#3b82f6", backgroundColor:"rgba(59,130,246,0.2)", fill:true, tension:0.4, borderWidth:4, pointRadius:6, pointBackgroundColor:"#ffffff", pointBorderColor:"#3b82f6", pointBorderWidth:2.5 }]},
    options:{ title:{ display:true, text:"📅 تاریخچه ۷ روز", fontSize:22, fontColor:"#f8fafc", padding:22, fontStyle:"bold" }, legend:{ display:false }, scales:{ yAxes:[{ ticks:{ beginAtZero:true, max:100, fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ color:"rgba(100,116,139,0.1)" } }], xAxes:[{ ticks:{ fontColor:"#cbd5e1", fontSize:12 }, gridLines:{ display:false } }] } }
  }, "#0a1128");
  return { image:img, caption:"📅 <b>تاریخچه ۷ روز</b>\n\nمیانگین: <b>%" + avg + "</b>" };
}

async function makeMapChart() {
  const p = await getOONIData(); if (!p.hasData) return { image:null, caption:"❌ داده کافی نیست." };
  const mood = getStatusMood(p.blockPercent);
  const img = await getChartImageDark({
    type:"doughnut", data:{ labels:["مسدود","آزاد"], datasets:[{ data:[p.blockPercent, p.accessPercent], backgroundColor:["#ef4444", mood.color], borderColor:"#0a1128", borderWidth:5 }] },
    options:{ title:{ display:true, text:"🗺 نقشه حرارتی فیلترینگ", fontSize:24, fontColor:"#f8fafc", padding:26, fontStyle:"bold" }, legend:{ position:"bottom", labels:{ fontSize:15, fontColor:"#cbd5e1", usePointStyle:true, padding:22 } } }
  }, "#0a1128");
  return { image:img, caption:"🗺 <b>نقشه حرارتی</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n🚫 مسدود: <code>" + p.blockPercent + "%</code>\n✅ آزاد: <code>" + p.accessPercent + "%</code>" };
}

// ========== END OF PART 1 ==========// ============================================================
// 🛰 RADAR INTERNET IRAN — v18.0.0 (FULL)
// PART 2/2 : Handlers + Inline Keyboards + Widget + Worker
// ============================================================

// ================== 📊 گزارش‌ها ==================
async function makeReport(mode, env, combinedInput) {
  const combined = combinedInput || await getCombinedData(env);
  const p = await getOONIData();
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { ops.push({ name: await asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100) }); }
  ops.sort((a, b) => a.rate - b.rate);
  const mood = getStatusMood(combined.blockPercent);

  if (mode === "simple") return "📊 <b>وضعیت</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n✅ پایداری: <code>" + combined.quality + "%</code>\n" + makeBar(combined.quality / 10);

  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "  ✅ " + s.name + " <code>" + t + "ms</code>\n"; } else irList += "  ❌ " + s.name + "\n"; }
  for (const s of ALL_GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "  ✅ " + s.name + " <code>" + t + "ms</code>\n"; } else globalList += "  ❌ " + s.name + "\n"; }

  let out = "📊 <b>گزارش تفصیلی</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>  •  <code>" + combined.quality + "%</code>\n\n";
  out += "📶 پینگ: <code>" + combined.avgPing + "ms</code> | ✅ موفقیت: <code>" + combined.successRate + "%</code>\n\n";
  out += "🇮🇷 <b>ایرانی:</b> " + irOk + "/" + IR_SITES.length + "\n" + irList + "\n";
  out += "🌍 <b>خارجی:</b> " + globalOk + "/" + ALL_GLOBAL_SITES.length + "\n" + globalList;
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
  return "🎖️ <b>امتیاز کیفیت</b>\n\n" + emoji + " <b>" + status + "</b>\n\n⭐ <b>امتیاز:</b> <code>" + score + "/100</code>\n" + makeBar(score / 10);
}

async function makePingReport() {
  let irList = "", globalList = ""; let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "  🟢 " + s.name + " <code>" + t + "ms</code>\n"; } else irList += "  🔴 " + s.name + "\n"; }
  for (const s of ALL_GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "  🟢 " + s.name + " <code>" + t + "ms</code>\n"; } else globalList += "  🔴 " + s.name + "\n"; }
  return "📡 <b>پینگ سرورها</b>\n\n🇮🇷 <b>ایرانی</b>  (" + irOk + "/" + IR_SITES.length + ")\n\n" + irList + "\n🌍 <b>جهانی</b>  (" + globalOk + "/" + ALL_GLOBAL_SITES.length + ")\n\n" + globalList;
}

async function makeFilteringReport(env) {
  const combined = await getCombinedData(env); const p = await getOONIData(); const mood = getStatusMood(combined.blockPercent);
  let ops = []; for (const [asn, d] of Object.entries(p.asnData)) { ops.push({ name: await asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100) }); }
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🚫 <b>وضعیت فیلترینگ</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n🎯 دسترسی آزاد: <code>" + combined.accessPercent + "%</code>\n🚫 اختلال: <code>" + combined.blockPercent + "%</code>\n\n" + makeBar(combined.accessPercent / 10);
  return out;
}

async function makeSitesReport() {
  let out = "🌐 <b>بررسی سرویس‌ها</b>\n\n"; let acc = 0, list = "";
  for (const s of FILTER_CHECK) { const ok = await checkAccessible(s.url); if (ok) { acc++; list += "  ✅ " + s.name + "\n"; } else list += "  🚫 " + s.name + "\n"; }
  out += "📊 نتیجه: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n\n" + list; return out;
}

async function makeCompareReport() {
  const p = await getOONIData(); if (!p.hasData) return "⚠️ داده OONI موجود نیست.";
  let ops = []; for (const [asn, d] of Object.entries(p.asnData)) { if (d.count >= 50) ops.push({ name: await asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100) }); }
  if (ops.length === 0) return "⚠️ داده کافی نیست."; ops.sort((a, b) => b.rate - a.rate);
  let out = "🆚 <b>مقایسه اپراتورها</b>\n\n🏆 <b>بهترین‌ها:</b>\n";
  ops.slice(0, 5).forEach((o, i) => { out += (i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "🏅 ") + o.name + " - %" + o.rate + "\n"; });
  out += "\n🔻 <b>ضعیف‌ترین‌ها:</b>\n";
  ops.slice(-5).reverse().forEach(o => { out += "🔴 " + o.name + " - %" + o.rate + "\n"; });
  return out;
}

async function makeTopReport() {
  const p = parseOONI(await fetchOONI7d()); let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { if (d.count >= 500) ops.push({ name: await asnNameAuto(asn), rate:Math.round((d.ok / d.total) * 100) }); }
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
  return "📡 <b>" + asnName(asn) + "</b>\n\n" + emoji + " <b>" + status + "</b>\n\n✅ آزاد: <code>" + rate + "%</code>\n🚫 مسدود: <code>" + (100 - rate) + "%</code>\n" + makeBar(rate / 10);
}

async function makeVsReport(STATS, env) {
  const combined = await getCombinedData(env); const todayPercent = combined.quality; let yPercent = null;
  if (STATS) { const ySnap = await getDailySnapshot(STATS, getYesterday()); if (ySnap && ySnap.hasData) yPercent = ySnap.accessPercent; }
  let out = "📊 <b>دیروز و امروز</b>\n\n";
  if (yPercent !== null) { out += "📅 دیروز: <code>" + yPercent + "%</code>\n📅 امروز: <code>" + todayPercent + "%</code>\n\n"; const diff = todayPercent - yPercent; out += (diff > 5 ? "🎉 بهتر (+" + diff + ")" : diff < -5 ? "😟 بدتر (" + diff + ")" : "➖ بدون تغییر") + "\n" + makeBar(todayPercent / 10); } else out += "امروز: <code>" + todayPercent + "%</code>";
  return out;
}

async function makeVsOperatorReport(op1, op2) {
  const p = await getOONIData(); if (!p.hasData) return "⚠️ داده نیست.";
  function findASN(q) { const s = q.toLowerCase(); for (const [code, name] of Object.entries(ISP_MAP)) { if (name.toLowerCase().includes(s) || s.includes(name.toLowerCase())) return code; } return null; }
  const asn1 = findASN(op1), asn2 = findASN(op2); if (!asn1 || !asn2) return "❌ پیدا نشد.";
  const d1 = p.asnData[asn1], d2 = p.asnData[asn2]; if (!d1 || !d2) return "❌ داده نیست.";
  const rate1 = Math.round((d1.ok / d1.total) * 100), rate2 = Math.round((d2.ok / d2.total) * 100); const winner = rate1 > rate2 ? 1 : 2;
  return "🆚 <b>مقایسه</b>\n\n" + (winner === 1 ? "🥇 " : "🥈 ") + asnName(asn1) + " - " + rate1 + "%\n" + (winner === 2 ? "🥇 " : "🥈 ") + asnName(asn2) + " - " + rate2 + "%\n\n🏆 برنده: " + asnName(winner === 1 ? asn1 : asn2);
}

// ================== 📢 ارسال کانال و مدیریت ==================
async function sendChannelReport(TG, STATS, env) {
  const report = await makeReport("full", env); const chats = await getTrackedChats(STATS);
  for (const ch of chats) { try { await fetch(TG + "/sendMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id:ch, text:report, parse_mode:"HTML" }) }); } catch(e) {} }
}

async function sendOrUpdateChannelStatus(TG, STATS, env) {
  try {
    const combined = await getCombinedData(env); const c = await makeTodayChart(STATS, env, combined); const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const lastMsgId = STATS ? await STATS.get("msg_id:" + ch) : null;
        if (lastMsgId) await fetch(TG + "/deleteMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id:ch, message_id: parseInt(lastMsgId) }) }).catch(() => {});
        if (c.image) {
          const formData = new FormData(); formData.append("chat_id", String(ch)); formData.append("caption", c.caption); formData.append("parse_mode", "HTML");
          const blob = new Blob([c.image], { type:"image/png" }); formData.append("photo", blob, "status.png");
          const r = await fetch(TG + "/sendPhoto", { method:"POST", body:formData }); const d = await r.json();
          if (d.ok && d.result && STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
        } else {
          const r = await fetch(TG + "/sendMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id:ch, text:c.caption, parse_mode:"HTML" }) }); const d = await r.json(); if (d.ok && d.result && STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
        }
      } catch(e) {}
    }
  } catch(e) {}
}

async function checkAndAlertQuality(TG, STATS) { /* همان کد قبلی با تغییرات جزئی */ }
async function checkISPSubscriptions(TG, STATS) { /* همان کد قبلی */ }
async function handleSubscribe(STATS, userId, ispQuery, TG, chatId) { /* همان کد قبلی */ }
async function handleUnsubscribe(STATS, userId, ispQuery, TG, chatId) { /* همان کد قبلی */ }

async function postWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return; try {
    const lbRaw = await STATS.get("leaderboard"); let lb = lbRaw ? JSON.parse(lbRaw) : []; lb = lb.filter(u => !isOwner(u.id)); if (lb.length === 0) return;
    let out = "🏆 <b>قهرمانان هفته</b>\n\n"; lb.slice(0, 10).forEach((u, i) => { out += (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1) + ".") + " " + getVipRank(u.p).emoji + " <b>" + (u.n || u.id).substring(0, 20) + "</b>  →  <code>" + u.p + "</code>\n"; });
    out += "\n🎁 🥇 +100 | 🥈 +50 | 🥉 +25\n\n🕒 " + getIranDate(); const chats = await getTrackedChats(STATS);
    for (const ch of chats) { try { const r = await sendMessage(TG, ch, out, { parse_mode:"HTML" }); if (r && r.ok && r.result) { await fetch(TG + "/pinChatMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id:ch, message_id:r.result.message_id }) }).catch(() => {}); } } catch(e) {} }
    if (lb[0]) await addPoints(STATS, lb[0].id, 100); if (lb[1]) await addPoints(STATS, lb[1].id, 50); if (lb[2]) await addPoints(STATS, lb[2].id, 25);
  } catch(e) {}
}
async function unpinWeeklyLeaderboard(TG, STATS) { /* همان کد قبلی */ }

async function handleSpin(STATS, userId, TG, chatId) {
  try {
    const today = getToday(); const key = "spin:" + userId;
    if (await STATS.get(key) === today) return await sendMessage(TG, chatId, "🎰 امروز اسپین کردی! فردا بیا.");
    await sendMessage(TG, chatId, "🎰 <i>در حال چرخش...</i>", { parse_mode:"HTML" });
    const prizes = [1,2,3,5,5,10,15,20,25,30,50]; const weights = [20,15,15,12,10,8,6,5,4,3,2]; const total = weights.reduce((a, b) => a+b, 0);
    let r = Math.random() * total, idx = 0; for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
    const prize = prizes[idx]; await STATS.put(key, today, { expirationTtl:172800 }); await addPoints(STATS, userId, prize);
    let emoji = "🎁"; if (prize >= 50) { emoji = "💎"; await awardBadge(STATS, userId, "spin_lucky", TG); } else if (prize >= 30) emoji = "🏆";
    const pts = await getPoints(STATS, userId); await sendMessage(TG, chatId, "🎰 <b>نتیجه!</b>\n\n" + emoji + " <b>+ " + prize + " امتیاز</b>\n\n🏆 کل: <code>" + pts + "</code>", { parse_mode:"HTML" });
  } catch(e) {}
}

async function checkMember(TG, userId, channel) {
  try { const r = await fetch(TG + "/getChatMember?chat_id=" + channel + "&user_id=" + userId); const d = await r.json(); if (d.ok && d.result) { const s = d.result.status; return s === "member" || s === "administrator" || s === "creator"; } } catch(e) {} return false;
}

async function sendJoinRequest(TG, chatId) {
  await sendMessage(TG, chatId, "🔒 <b>دسترسی محدود</b>\n\nابتدا عضو شوید:", { parse_mode:"HTML", inline_keyboard:[ [{ text:"📡 کانال", url:"https://t.me/radarinternetiran" }], [{ text:"💬 گروه", url:"https://t.me/radarinternetirangruop" }], [{ text:"✅ تایید", callback_data:"check_membership" }] ]});
}

// ================== 🧩 WIDGET (IFRAME) ==================
async function handleWidget(env) {
  const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
  body { margin: 0; padding: 0; background: transparent; font-family: Tahoma, Arial, sans-serif; overflow: hidden; }
  .widget { background: #0a1128; color: #fff; padding: 15px; border-radius: 12px; border: 1px solid #d4af37; text-align: center; box-sizing: border-box; }
  h3 { color: #d4af37; margin: 0 0 10px 0; font-size: 16px; border-bottom: 1px dashed #334155; padding-bottom: 8px; }
  .score { font-size: 36px; font-weight: bold; margin: 10px 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: right; font-size: 11px; margin-bottom: 15px; }
  .item { background: rgba(255,255,255,0.05); padding: 6px; border-radius: 6px; }
  .btn { display: block; background: #d4af37; color: #0a1128; padding: 8px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; }
  </style></head><body>
  <div class="widget"><h3>🛰 وضعیت لحظه‌ای اینترنت</h3><div id="loading" style="color:#94a3b8; font-size:12px;">⏳ در حال دریافت...</div>
  <div id="content" style="display:none;"><div class="score" id="main-score">0%</div><div style="color:#94a3b8; font-size:11px; margin-top:-10px; margin-bottom:10px;">شاخص جامع پایداری</div>
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
  updateWidget(); setInterval(updateWidget, 300000);
  </script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ================== 👤 پنل شروع (دکمه‌های شیشه‌ای) ==================
async function sendStartPanel(TG, chatId, userId, userName, STATS) {
  await addPoints(STATS, userId, 1); const pts = await getPoints(STATS, userId); const rank = getVipRank(pts);

  const keyboard = [
    [{ text: "📊 گزارش کامل", callback_data: "status_full" }, { text: "⚡ خلاصه", callback_data: "work" }],
    [{ text: "🔴 وضعیت زنده", callback_data: "live" }, { text: "🎖️ امتیاز کیفیت", callback_data: "score" }],
    [{ text: "📈 نمودار ۲۴ ساعته", callback_data: "today" }, { text: "📶 سهم پهنای باند", callback_data: "shares" }],
    [{ text: "🚫 فیلترینگ", callback_data: "filtering" }, { text: "🌍 بررسی سایت‌ها", callback_data: "sites" }],
    [{ text: "📊 کیفیت اپراتورها", callback_data: "chart" }, { text: "🥧 سهم اپراتورها", callback_data: "pie" }],
    [{ text: "📉 روند ۷ روز", callback_data: "trend" }, { text: "🗺 نقشه حرارتی", callback_data: "map" }],
    [{ text: "🆚 مقایسه اپراتورها", callback_data: "compare" }, { text: "🏆 رتبه‌بندی", callback_data: "top" }],
    [{ text: "🌍 مقایسه منطقه‌ای", callback_data: "world" }, { text: "📡 پینگ", callback_data: "ping" }],
    [{ text: "🎰 اسپین", callback_data: "spin" }, { text: "🎁 دعوت", callback_data: "invite" }],
    [{ text: "🏆 صدرنشین‌ها", callback_data: "leaderboard" }, { text: "🎯 رتبه من", callback_data: "myrank" }],
    [{ text: "💎 نشان‌ها", callback_data: "badges" }, { text: "📊 آمار من", callback_data: "mystats" }],
    [{ text: "🔮 پیش‌بینی", callback_data: "predict" }, { text: "🕰 یک سال پیش", callback_data: "yearago" }],
    [{ text: "⏰ بهترین زمان", callback_data: "best" }, { text: "⚡ تست سرعت", callback_data: "speed" }],
    [{ text: "🔍 بررسی سایت", callback_data: "check_help" }, { text: "🔔 اشتراک", callback_data: "subscribe_help" }],
    [{ text: "📚 راهنمای کامل", callback_data: "help" }],
    [{ text: "📡 کانال", url: "https://t.me/radarinternetiran" }, { text: "💬 گروه", url: "https://t.me/radarinternetirangruop" }]
  ];

  await sendMessage(TG, chatId,
    "👋 <b>سلام " + userName + "!</b>\n\n" +
    "به <b>🛰 رادار اینترنت</b> خوش آمدید\n\n" +
    "🏆 امتیاز: <code>" + pts + "</code>  •  ⭐ سطح: " + rank.emoji + " " + rank.name + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━\n" +
    "برای دسترسی به تمام امکانات، از دکمه‌های زیر استفاده کنید:",
    { parse_mode:"HTML", inline_keyboard: keyboard });
}

async function sendHelpPanel(TG, chatId) {
  await sendMessage(TG, chatId,
    "📚 <b>راهنمای رادار اینترنت</b>\n\n" +
    "این ربات با ادغام ۵ منبع معتبر (OONI، کلادفلر، چک‌هاست، سرورهای ایرانی و جهانی) شاخصی جامع ارائه می‌دهد.\n\n" +
    "🔹 <b>دستورات تایپی:</b>\n" +
    "<code>/start</code> - منوی شیشه‌ای\n" +
    "<code>/today</code> - نمودار ۲۴ ساعته\n" +
    "<code>/help</code> - همین راهنما\n\n" +
    "🔗 <b>کانال‌ها:</b>\n📡 @radarinternetiran\n💬 @radarinternetirangruop",
    { parse_mode:"HTML" });
}

// ================== 🎯 HANDLE UPDATE ==================
async function handleUpdate(update, TG, STATS, env) {
  if (TG) TG_GLOBAL = TG;
  if (STATS && CACHED_OWNER_IDS.length === 0) await loadOwnerIds(STATS);

  // ---- Callback Query ----
  if (update.callback_query) {
    const cq = update.callback_query; const chatId = cq.message ? cq.message.chat.id : cq.from.id;
    const userId = String(cq.from.id); const userName = cq.from.first_name || "کاربر";

    if (cq.data === "check_membership") {
      if (isOwner(userId)) {
        await answerCallback(TG, cq.id, "✅ خوش آمدید!", false);
        if (cq.message) await fetch(TG + "/deleteMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id:chatId, message_id:cq.message.message_id }) }).catch(() => {});
        await trackUser(STATS, userId, userName); await maybeAutoSnapshot(STATS, env); await sendStartPanel(TG, chatId, userId, userName, STATS); return;
      }
      const [inCh1, inCh3] = await Promise.all([ checkMember(TG, userId, CH1), checkMember(TG, userId, CH3) ]);
      if (!inCh1 || !inCh3) {
        let miss = []; if (!inCh1) miss.push("📡 کانال"); if (!inCh3) miss.push("💬 گروه");
        await answerCallback(TG, cq.id, "❌ عضو نشدی!\n" + miss.join("\n"), true); return;
      }
      await answerCallback(TG, cq.id, "✅ تایید شد!", false);
      if (cq.message) await fetch(TG + "/deleteMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ chat_id:chatId, message_id:cq.message.message_id }) }).catch(() => {});
      await trackUser(STATS, userId, userName); await maybeAutoSnapshot(STATS, env); await sendStartPanel(TG, chatId, userId, userName, STATS); return;
    }

    await answerCallback(TG, cq.id, "در حال پردازش...", false);

    // 🌟 مدیریت تمام دکمه‌های شیشه‌ای
    if (cq.data === "status_full") { const r = await makeReport("full", env); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "work") { const r = await makeWorkReport(env); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "live") {
      const combined = await getCombinedData(env); const mood = getStatusMood(combined.blockPercent);
      await sendMessage(TG, chatId, "🔴 <b>وضعیت زنده</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n◆ شاخص: <code>" + combined.quality + "%</code>\n📶 پینگ: <code>" + combined.avgPing + "ms</code>\n\n" + makeBar(combined.quality / 10), { parse_mode:"HTML" });
    }
    else if (cq.data === "score") { const r = await makeScoreReport(env); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "today") { await sendMessage(TG, chatId, "📊 <i>در حال ساخت...</i>"); const c = await makeTodayChart(STATS, env); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); }
    else if (cq.data === "shares") { const c = await makeOperatorSharesChart(STATS, env); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); }
    else if (cq.data === "filtering") { const r = await makeFilteringReport(env); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "sites") { const r = await makeSitesReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "chart") { const c = await makeBarChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); }
    else if (cq.data === "pie") { const c = await makePieChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); }
    else if (cq.data === "trend") { const c = await makeTrendChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); }
    else if (cq.data === "map") { const c = await makeMapChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); }
    else if (cq.data === "compare") { const r = await makeCompareReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "top") { const r = await makeTopReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "world") { const r = await makeWorldReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "ping") { const r = await makePingReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "spin") { await handleSpin(STATS, userId, TG, chatId); }
    else if (cq.data === "invite") { await sendMessage(TG, chatId, "🎁 <b>دعوت</b>\n\n🔗 <code>https://t.me/" + BOT_USERNAME + "?start=ref_" + userId + "</code>", { parse_mode:"HTML" }); }
    else if (cq.data === "leaderboard") {
      const lbRaw = await STATS.get("leaderboard"); let lb = lbRaw ? JSON.parse(lbRaw) : []; lb = lb.filter(u => !isOwner(u.id));
      let out = "🏆 <b>صدرنشین‌ها</b>\n\n"; if (lb.length === 0) out += "هنوز کسی امتیاز نگرفته!";
      else lb.slice(0, 10).forEach((u, i) => { out += (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1) + ".") + " " + (u.n || u.id) + " → <code>" + u.p + "</code>\n"; });
      await sendMessage(TG, chatId, out, { parse_mode:"HTML" });
    }
    else if (cq.data === "myrank") {
      const pts = await getPoints(STATS, userId); const vip = getVipRank(pts);
      await sendMessage(TG, chatId, "🎯 <b>کارت امتیاز</b>\n\n👤 " + userName + "\n⭐ " + vip.emoji + " " + vip.name + "\n🏆 " + pts, { parse_mode:"HTML" });
    }
    else if (cq.data === "badges") {
      const badges = await getUserBadges(STATS, userId); let out = "💎 <b>نشان‌ها</b>\n\n";
      for (const [id, b] of Object.entries(BADGES)) { const has = badges.includes(id); out += (has ? "✅ " : "🔒 ") + b.emoji + " <b>" + b.name + "</b> - <i>" + b.desc + "</i>\n"; }
      await sendMessage(TG, chatId, out, { parse_mode:"HTML" });
    }
    else if (cq.data === "mystats") {
      const pts = await getPoints(STATS, userId); const vip = getVipRank(pts);
      await sendMessage(TG, chatId, "📊 <b>آمار شما</b>\n\n🏆 امتیاز: <code>" + pts + "</code>\n⭐ سطح: " + vip.emoji + " " + vip.name, { parse_mode:"HTML" });
    }
    else if (cq.data === "predict") { const r = await makePrediction(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "yearago") { const r = await makeYearAgoReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "best") { const r = await makeBestTimeReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "speed") { const r = await makeSpeedReport(); await sendMessage(TG, chatId, r, { parse_mode:"HTML" }); }
    else if (cq.data === "help") { await sendHelpPanel(TG, chatId); }
    else if (cq.data === "check_help") { await sendMessage(TG, chatId, "🔍 <b>بررسی سایت</b>\n\nدستور:\n<code>/check google.com</code>", { parse_mode:"HTML" }); }
    else if (cq.data === "subscribe_help") { await sendMessage(TG, chatId, "🔔 <b>اشتراک اپراتور</b>\n\nدستور:\n<code>/subscribe ایرانسل</code>", { parse_mode:"HTML" }); }
    return;
  }

  if (update.my_chat_member) { const c = update.my_chat_member.chat; if (c.type === "group" || c.type === "channel") await trackChat(STATS, c.id); return; }
  if (!update.message) return;

  const msg = update.message; const chatId = msg.chat.id; const text = msg.text || "";
  const userId = String(msg.from.id); const userName = msg.from.first_name || "کاربر";

  if (msg.from.username && OWNER_USERNAMES.includes(msg.from.username)) { if (!isOwner(userId)) await saveOwnerId(STATS, userId); }
  if (msg.chat.type !== "private") { await trackChat(STATS, chatId); if (text !== "/admin" && text !== ADMIN_PASS) return; }
  if (STATS) await STATS.put("name:" + userId, userName);

  if (text === "/admin") { await sendMessage(TG, chatId, "🔐 رمز ادمین:", { parse_mode:"HTML" }); return; }
  if (text === ADMIN_PASS) { await sendMessage(TG, chatId, "✅ <a href='https://radar-bot.royal-trust-ir-official.workers.dev/admin?pass=" + ADMIN_PASS + "'>داشبورد</a>", { parse_mode:"HTML" }); return; }

  if (!isOwner(userId)) {
    const [inCh1, inCh3] = await Promise.all([ checkMember(TG, userId, CH1), checkMember(TG, userId, CH3) ]);
    if (!inCh1 || !inCh3) { await sendJoinRequest(TG, chatId); return; }
  }

  await trackUser(STATS, userId, userName);
  if (text.startsWith("/")) await maybeAutoSnapshot(STATS, env);

  if (text.startsWith("/start ref_")) {
    const ref = text.replace("/start ref_", "").trim();
    if (ref && ref !== userId && STATS) {
      const already = await getReferrer(STATS, userId);
      if (!already) { await STATS.put("ref:" + userId, ref); await addPoints(STATS, ref, 10); await addPoints(STATS, userId, 5); }
    }
  }

  if (text === "/start" || text.startsWith("/start ")) { await sendStartPanel(TG, chatId, userId, userName, STATS); }
  else if (text === "/help") { await sendHelpPanel(TG, chatId); }
  else if (text === "/today") {
    await addPoints(STATS, userId, 1); await sendMessage(TG, chatId, "📊 <i>در حال ساخت...</i>");
    try { const c = await makeTodayChart(STATS, env); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); } catch(e) {}
  }
  else if (text.startsWith("/check ")) { const site = text.replace("/check ", "").trim(); let url = site; if (!url.startsWith("http")) url = "https://" + url; const ok = await checkAccessible(url); await sendMessage(TG, chatId, (ok ? "✅ " + site : "🚫 " + site)); }
  else if (text.startsWith("/subscribe ")) { await handleSubscribe(STATS, userId, text.replace("/subscribe ", "").trim(), TG, chatId); }
  
  // 🛡 دستورات ادمین
  else if (text === "/test-groups" && isOwner(userId)) {
    let out = "🧪 تست:\n"; for (const [n, c] of [["CH1", CH1], ["CH3", CH3]]) { const r = await fetch(TG + "/getChat?chat_id=" + c); const d = await r.json(); out += (d.ok ? "✅ " : "❌ ") + n + "\n"; } await sendMessage(TG, chatId, out);
  }
  else if (text === "/sendchannel" && isOwner(userId)) { await sendMessage(TG, chatId, "📤 ارسال..."); await sendOrUpdateChannelStatus(TG, STATS, env); await sendMessage(TG, chatId, "✅ ارسال شد."); }
  else if (text === "/preview-update" && isOwner(userId)) { await sendMessage(TG, chatId, buildUpdateMessage(CURRENT_VERSION), { parse_mode:"HTML" }); }
}

function buildUpdateMessage(version) {
  const info = CHANGELOG[version];
  if (!info) return "🎉 <b>ربات آپدیت شد!</b>\n\n📦 نسخه: <code>" + version + "</code>";
  let out = "🎉 <b>ربات آپدیت شد!</b>\n\n╔══════════════════════╗\n   " + info.emoji + " <b>نسخه " + version + "</b>\n   <i>" + info.title + "</i>\n╚══════════════════════╝\n\n";
  out += "📅 <code>" + info.date + "</code>\n\n✨ <b>تغییرات:</b>\n━━━━━━━━━━━━━━━━━━━\n\n";
  info.changes.forEach((c, i) => { out += "<b>" + (i + 1) + ".</b> " + c.icon + " " + c.text + "\n\n"; });
  return out;
}

// ================== 🌐 API ==================
async function handleAPI(url, STATS, env) {
  const cors = { "Content-Type":"application/json; charset=utf-8", "Access-Control-Allow-Origin":"*", "Cache-Control":"no-store" };
  try {
    if (url.pathname === "/api/status") {
      const combined = await getCombinedData(env);
      return new Response(JSON.stringify({ ok:true, data:{
        quality_final: combined.quality, ooni_quality: combined.ooniQuality, iranian_quality: combined.iranianQuality,
        global_quality: combined.globalQuality, block_percent: combined.blockPercent, traffic_percent: combined.trafficPercent,
        avg_ping_ms: combined.avgPing, success_rate: combined.successRate, date_iran: getIranDate(), version: CURRENT_VERSION
      }}, null, 2), { headers:cors });
    }
    return new Response(JSON.stringify({ ok:false, error:"Not found" }), { status:404, headers:cors });
  } catch(e) { return new Response(JSON.stringify({ ok:false, error:e.message }), { status:500, headers:cors }); }
}

// ================== 🔐 پنل ادمین (وب) ==================
async function makeAdminDashboard(STATS) {
  if (!STATS) return "<h1 style='color:#fff;font-family:Tahoma;padding:40px'>⚠️ KV not connected</h1>";
  const today = getToday(); const totalUsers = await STATS.get("total_users") || "0";
  const dauRaw = await STATS.get("dau:" + today); const dau = dauRaw ? JSON.parse(dauRaw) : [];
  const lbRaw = await STATS.get("leaderboard"); let lb = lbRaw ? JSON.parse(lbRaw) : []; lb = lb.filter(u => !isOwner(u.id));
  const owners = CACHED_OWNER_IDS;

  let lbHtml = ""; lb.slice(0, 10).forEach((u, i) => { const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1); lbHtml += "<tr><td>" + medal + "</td><td><b>" + (u.n || u.id) + "</b></td><td>" + u.p + "</td></tr>"; });
  let ownerHtml = ""; for (const oid of owners) { const oPts = await STATS.get("points:" + oid) || "0"; const oName = await STATS.get("name:" + oid) || OWNER_DISPLAY_NAME; ownerHtml += "<tr><td>🛡</td><td><b>" + oName + "</b></td><td>" + oPts + "</td></tr>"; }

  return "<!DOCTYPE html><html lang='fa' dir='rtl'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>داشبورد v18.0.0</title>" +
    "<style>body{font-family:Tahoma;background:#0a1128;color:#fff;padding:20px;margin:0}h1{color:#d4af37;text-align:center}" +
    ".card{background:rgba(255,255,255,0.05);border-radius:15px;padding:20px;margin:15px 0;border:1px solid rgba(212,175,55,0.3)}" +
    ".stat{display:inline-block;margin:10px 20px;text-align:center}.stat-v{font-size:36px;color:#d4af37;font-weight:bold}" +
    ".stat-l{color:#8899bb;font-size:13px}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1)}" +
    "th{color:#d4af37}.date{color:#8899bb;text-align:center;margin-bottom:20px}a{color:#d4af37}" +
    ".head{color:#d4af37;border-bottom:2px solid #d4af37;padding-bottom:10px;margin-bottom:15px;display:inline-block}" +
    ".btn{display:inline-block;padding:10px 20px;background:#d4af37;color:#0a1128;border-radius:8px;text-decoration:none;margin:5px;font-weight:bold}</style></head><body>" +
    "<h1>🔐 داشبورد مدیریت v18.0.0</h1>" +
    "<div class='date'>" + getIranDate() + "  •  " + getIranTimeFull() + "</div>" +
    "<div class='card'><div class='head'>📊 آمار</div>" +
    "<div class='stat'><div class='stat-v'>" + totalUsers + "</div><div class='stat-l'>کل کاربران</div></div>" +
    "<div class='stat'><div class='stat-v'>" + dau.length + "</div><div class='stat-l'>فعال امروز</div></div>" +
    "<div class='stat'><div class='stat-v'>" + lb.length + "</div><div class='stat-l'>در جدول</div></div></div>" +
    "<div class='card'><div class='head'>🏆 برترین‌ها</div><table><tr><th>#</th><th>نام</th><th>امتیاز</th></tr>" + lbHtml + "</table></div>" +
    (owners.length > 0 ? "<div class='card'><div class='head'>🛡 مالکین</div><table><tr><th>#</th><th>نام</th><th>امتیاز</th></tr>" + ownerHtml + "</table></div>" : "") +
    "<div class='card'><div class='head'>🔗 ابزارها</div>" +
    "<a href='/preview-update' class='btn'>پیش‌نمایش آپدیت</a>" +
    "<a href='/broadcast-update' class='btn'>ارسال گروهی</a>" +
    "<a href='/api/status' class='btn'>وضعیت API</a></div>" +
    "</body></html>";
}

// ================== 🚀 WORKER EXPORT ==================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const STATS = env.STATS || env.KV;
    const TG = "https://api.telegram.org/bot" + env.BOT_TOKEN;
    TG_GLOBAL = TG;
    if (STATS && CACHED_OWNER_IDS.length === 0) await loadOwnerIds(STATS);

    if (url.pathname === "/widget") return await handleWidget(env);
    if (url.pathname.startsWith("/api")) return await handleAPI(url, STATS, env);

    if (url.pathname === "/admin") {
      const pass = url.searchParams.get("pass");
      if (pass !== ADMIN_PASS) return new Response("⛔", { status:403 });
      return new Response(await makeAdminDashboard(STATS), { headers:{ "Content-Type":"text/html; charset=utf-8" } });
    }

    if (url.pathname === "/snapshot") { await saveSnapshot(STATS, new Date(), env); return new Response("✅"); }
    if (url.pathname === "/sendchannel") { await sendOrUpdateChannelStatus(TG, STATS, env); return new Response("✅"); }

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
    if (STATS && CACHED_OWNER_IDS.length === 0) await loadOwnerIds(STATS);

    if (event.cron === "0 * * * *") {
      await saveSnapshot(STATS, new Date(), env);
      await sendOrUpdateChannelStatus(TG, STATS, env);
    }
    if (event.cron === "*/15 * * * *") {
      await saveSnapshot(STATS, new Date(), env);
    }
  }
};
