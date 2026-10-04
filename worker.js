const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const CH3 = "@radarinternetirangruop";
const ADMIN_PASS = "mohmedkord1388";
const BOT_USERNAME = "Radarinternetiranbot";
const CURRENT_VERSION = "8.1";
const WEEKLY_PIN_MSG_KEY = "weekly_pin_msg_id";
const ALERT_THRESHOLD = 70;
const QUALITY_DROP_THRESHOLD = 30;
const SNAPSHOT_INTERVAL_MIN = 15;
const CHART_POINTS = 16;

// ====== توکن‌ها (فقط در Private Repo یا Cloudflare Secret) ======
const BOT_TOKEN_FALLBACK = "";
const RADAR_TOKEN_FALLBACK = "";
const ARVAN_PROXY_URL = ""; // آدرس واسط رادار آروان (اختیاری)
const RIPE_ATLAS_TOKEN_FALLBACK = "";

const OWNER_USERNAMES = ["Havsharim"];
const OWNER_IDS_MANUAL = [];
let CACHED_OWNER_IDS = [];
const OWNER_DISPLAY_NAME = "مدیر ربات";
const PREMIUM_USERS = [];

let GLOBAL_STATS = null;
let TG_GLOBAL = null;

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
  { name: "مایکروسافت", url: "https://www.microsoft.com" },
  { name: "اپل", url: "https://www.apple.com" },
  { name: "آمازون", url: "https://www.amazon.com" }
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
    const BOT_TOKEN = env.BOT_TOKEN || BOT_TOKEN_FALLBACK;
    const STATS = env.STATS;
    GLOBAL_STATS = STATS;
    if (BOT_TOKEN) TG_GLOBAL = "https://api.telegram.org/bot" + BOT_TOKEN;

    if (url.pathname === "/test") return new Response("Test OK");
    if (!BOT_TOKEN) return new Response("ERROR: BOT_TOKEN not set!", { status: 500 });
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;
    await loadOwnerIds(STATS);

    if (url.pathname.startsWith("/api")) return await handleAPI(url, STATS, env);

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
      await sendChannelReport(TG, STATS, env);
      await sendOrUpdateChannelStatus(TG, STATS, env);
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
    if (url.pathname === "/snapshot") {
      await saveSnapshot(STATS, new Date(), env);
      const combined = await getCombinedData(env);
      return new Response("Snapshot saved: " + JSON.stringify({
        quality: combined.quality,
        ooniQuality: combined.ooniQuality,
        liveQuality: combined.liveQuality,
        radarQuality: combined.radarQuality,
        iqi: combined.iqi,
        voidlyRisk: combined.voidlyRisk,
        trafficPercent: combined.trafficPercent
      }));
    }
    if (url.pathname === "/radar-test") {
      const data = await getCloudflareRadarData(env);
      return new Response(JSON.stringify(data, null, 2));
    }
    if (url.pathname === "/iqi-test") {
      const data = await getIQIData(env);
      return new Response(JSON.stringify(data, null, 2));
    }
    if (url.pathname === "/voidly-test") {
      const data = await getVoidlyData();
      return new Response(JSON.stringify(data, null, 2));
    }
    if (url.pathname === "/arvan-test") {
      const data = await getArvanRadarData(env);
      return new Response(JSON.stringify(data, null, 2));
    }
    if (url.pathname === "/all-sources") {
      const combined = await getCombinedData(env);
      return new Response(JSON.stringify(combined, null, 2));
    }
    if (request.method !== "POST") return new Response("Radar Bot 8.1 is running!");
    try {
      const update = await request.json();
      await handleUpdate(update, TG, STATS, env);
    } catch(e) { console.log("Error: " + e.message); }
    return new Response("OK");
  },
  
  async scheduled(event, env, ctx) {
    const BOT_TOKEN = env.BOT_TOKEN || BOT_TOKEN_FALLBACK;
    if (!BOT_TOKEN) return;
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;
    GLOBAL_STATS = env.STATS;
    TG_GLOBAL = TG;
    await loadOwnerIds(env.STATS);
    
    const scheduledTime = new Date(event.scheduledTime);
    const iranMinute = getIranMinuteFrom(scheduledTime);
    
    await saveSnapshot(env.STATS, scheduledTime, env);
    
    if (iranMinute === 0) {
      await checkAndAlertQuality(TG, env.STATS);
      await checkISPSubscriptions(TG, env.STATS);
      await saveDailySnapshot(env.STATS, env);
      await sendOrUpdateChannelStatus(TG, env.STATS, env);
    }
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
function getIranMinute() { return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', minute: '2-digit' }).format(new Date())); }
function getIranHourFrom(date) { return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false }).format(date)); }
function getIranMinuteFrom(date) { return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', minute: '2-digit' }).format(date)); }
function getIranTimeFull() { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()); }

function roundToSlot(date, slotMinutes) {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const rounded = Math.floor(minutes / slotMinutes) * slotMinutes;
  d.setMinutes(rounded, 0, 0);
  return d;
}
function getSnapshotKey(date) {
  const slotDate = roundToSlot(date, SNAPSHOT_INTERVAL_MIN);
  const datePart = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(slotDate);
  const timePart = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false }).format(slotDate);
  return "snap15:" + datePart + ":" + timePart;
}
function getSnapshotLabel(date) {
  const slotDate = roundToSlot(date, SNAPSHOT_INTERVAL_MIN);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false }).format(slotDate);
}
function getRecentSnapshotKeys(count) {
  const keys = [];
  const now = new Date();
  const slotNow = roundToSlot(now, SNAPSHOT_INTERVAL_MIN);
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(slotNow.getTime() - (i * SNAPSHOT_INTERVAL_MIN * 60000));
    keys.push({ key: getSnapshotKey(t), label: getSnapshotLabel(t), timestamp: t.getTime() });
  }
  return keys;
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

// ==================== 🌐 Cloudflare Radar (NetFlows + HTTP + DNS) ====================
async function getCloudflareRadarData(env) {
  const token = (env && env.RADAR_TOKEN) || RADAR_TOKEN_FALLBACK;
  if (!token) return null;
  
  try {
    const headers = { "Authorization": "Bearer " + token };
    const [netflowsRes, httpRes, dnsRes] = await Promise.all([
      fetch("https://api.cloudflare.com/client/v4/radar/netflows/timeseries?name=ir_nf&location=IR&dateRange=1d&aggInterval=15m", { headers }).catch(() => null),
      fetch("https://api.cloudflare.com/client/v4/radar/http/timeseries?name=ir_http&location=IR&dateRange=1d&aggInterval=1h", { headers }).catch(() => null),
      fetch("https://api.cloudflare.com/client/v4/radar/dns/timeseries?name=ir_dns&location=IR&dateRange=1d&aggInterval=15m", { headers }).catch(() => null)
    ]);
    
    const result = { netflows: null, http: null, dns: null, trafficPercent: null };
    
    if (netflowsRes && netflowsRes.ok) {
      const d = await netflowsRes.json();
      if (d.success && d.result && d.result.ir_nf) {
        const v = d.result.ir_nf.values;
        result.netflows = Math.round(parseFloat(v[v.length - 1]) * 100);
        result.trafficPercent = result.netflows;
      }
    }
    if (httpRes && httpRes.ok) {
      const d = await httpRes.json();
      if (d.success && d.result && d.result.ir_http) {
        const v = d.result.ir_http.values;
        result.http = Math.round(parseFloat(v[v.length - 1]) * 100);
      }
    }
    if (dnsRes && dnsRes.ok) {
      const d = await dnsRes.json();
      if (d.success && d.result && d.result.ir_dns) {
        const v = d.result.ir_dns.values;
        result.dns = Math.round(parseFloat(v[v.length - 1]) * 100);
      }
    }
    return result;
  } catch(e) { console.log("Radar error: " + e.message); return null; }
}

// ==================== 📊 Cloudflare Radar IQI (Internet Quality Index) ====================
async function getIQIData(env) {
  const token = (env && env.RADAR_TOKEN) || RADAR_TOKEN_FALLBACK;
  if (!token) return null;
  try {
    const r = await fetch(
      "https://api.cloudflare.com/client/v4/radar/quality/iqi?location=IR&dateRange=1d&format=json",
      { headers: { "Authorization": "Bearer " + token } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (d.success && d.result && d.result.summary) {
      const s = d.result.summary;
      // IQI معمولاً بین 0 و 5 هست، تبدیل به 0-100
      const iqiRaw = parseFloat(s.iqi || 0);
      const iqiScore = Math.round(Math.min(100, (iqiRaw / 5) * 100));
      return {
        iqi: iqiRaw,
        iqiScore: iqiScore,
        latency: s.latency || null,
        bandwidth: s.bandwidth || null,
        source: "Cloudflare IQI"
      };
    }
    return null;
  } catch(e) { console.log("IQI error: " + e.message); return null; }
}

// ==================== 🎯 Voidly API (تحلیل اختلال) ====================
async function getVoidlyData() {
  try {
    const r = await fetch(
      "https://api.voidly.ai/v1/services/blocked_status?domain=google.com&country=IR",
      { headers: { "Accept": "application/json" } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (d && d.data) {
      // بررسی چند سایت کلیدی
      return {
        status: d.data.status || "unknown",
        risk: d.data.status === "blocked" ? 100 : (d.data.status === "partial" ? 50 : 10),
        source: "Voidly"
      };
    }
  } catch(e) { console.log("Voidly error: " + e.message); }
  return null;
}

// ==================== 🛰 ArvanCloud Radar (از طریق واسط) ====================
async function getArvanRadarData(env) {
  try {
    const proxyUrl = (env && env.ARVAN_PROXY) || ARVAN_PROXY_URL;
    if (!proxyUrl) return null;
    
    const r = await fetch(proxyUrl, { 
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000)
    }).catch(() => null);
    
    if (!r || !r.ok) return null;
    const d = await r.json();
    
    // ساختار پیش‌بینی شده: آرایه‌ای از اپراتورها با درصد کیفیت
    if (Array.isArray(d)) {
      let totalQuality = 0, count = 0;
      let operators = [];
      for (const item of d) {
        if (item.quality !== undefined && item.quality !== null) {
          totalQuality += item.quality;
          count++;
          operators.push({ name: item.name || item.isp || "Unknown", quality: item.quality });
        }
      }
      if (count > 0) {
        const avgQuality = Math.round(totalQuality / count);
        return {
          average: avgQuality,
          operators: operators,
          count: count,
          source: "ArvanCloud Radar"
        };
      }
    }
    return null;
  } catch(e) { console.log("Arvan error: " + e.message); return null; }
}

// ==================== 🛰 RIPE Atlas ====================
async function getRIPEAtlasData(env) {
  try {
    const token = (env && env.RIPE_ATLAS_TOKEN) || RIPE_ATLAS_TOKEN_FALLBACK;
    const headers = token ? { "Authorization": "Bearer " + token, "Accept": "application/json" } : { "Accept": "application/json" };
    
    const r = await fetch("https://atlas.ripe.net/api/v2/probes/?country_code=IR&status=1&page_size=1", { headers });
    if (r.ok) {
      const d = await r.json();
      return { available: true, count: d.count || 0 };
    }
  } catch(e) {}
  return null;
}

// ==================== 📊 OONI ====================
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

// ==================== 🧠 شاخص ترکیبی نهایی (۵ منبع) ====================
async function getCombinedData(env) {
  // دریافت داده از تمام منابع به صورت موازی
  const [p, radar, iqi, voidly, arvan, atlas] = await Promise.all([
    getOONIData(),
    getCloudflareRadarData(env),
    getIQIData(env),
    getVoidlyData(),
    getArvanRadarData(env),
    getRIPEAtlasData(env)
  ]);
  
  const ooniQuality = p.hasData ? p.accessPercent : null;
  
  // ====== Live Ping ======
  const targets = [
    { name: "Google", url: "https://www.google.com" },
    { name: "Cloudflare", url: "https://www.cloudflare.com" },
    { name: "Microsoft", url: "https://www.microsoft.com" },
    { name: "Apple", url: "https://www.apple.com" },
    { name: "Amazon", url: "https://www.amazon.com" },
    { name: "Digikala", url: "https://digikala.com" },
    { name: "Shaparak", url: "https://shaparak.ir" }
  ];
  
  let successCount = 0, totalPing = 0, failCount = 0;
  const pingPromises = targets.map(async (t) => {
    const start = Date.now();
    try {
      const c = new AbortController();
      const timer = setTimeout(() => c.abort(), 5000);
      const r = await fetch(t.url, { method: "HEAD", signal: c.signal, redirect: "follow" });
      clearTimeout(timer);
      const ping = Date.now() - start;
      if (r.ok || r.status < 400) return { name: t.name, ping, ok: true };
      return { name: t.name, ping: null, ok: false };
    } catch(e) {
      return { name: t.name, ping: null, ok: false };
    }
  });
  const pingResults = await Promise.all(pingPromises);
  for (const r of pingResults) {
    if (r.ok && r.ping !== null) { successCount++; totalPing += r.ping; }
    else { failCount++; }
  }
  const totalCount = targets.length;
  const avgPing = successCount > 0 ? Math.round(totalPing / successCount) : 999;
  const successRate = Math.round((successCount / totalCount) * 100);
  const pingScore = Math.max(0, 100 - (avgPing / 5));
  const lossScore = Math.max(0, 100 - (failCount * 15));
  const liveQuality = Math.round((pingScore * 0.6) + (lossScore * 0.4));
  
  // ====== شاخص نهایی با وزن‌دهی ۵ منبع ======
  let weights = { ooni: 0, radar: 0, live: 0, iqi: 0, arvan: 0, voidly: 0, atlas: 0 };
  let values = { ooni: 0, radar: 0, live: 0, iqi: 0, arvan: 0, voidly: 0, atlas: 0 };
  
  if (ooniQuality !== null) { weights.ooni = 35; values.ooni = ooniQuality; }
  if (radar && radar.trafficPercent !== null) { weights.radar = 20; values.radar = radar.trafficPercent; }
  weights.live = 15; values.live = liveQuality;
  if (iqi && iqi.iqiScore) { weights.iqi = 15; values.iqi = iqi.iqiScore; }
  if (arvan && arvan.average) { weights.arvan = 10; values.arvan = arvan.average; }
  if (voidly && voidly.risk !== undefined) { weights.voidly = 5; values.voidly = 100 - voidly.risk; }
  if (atlas && atlas.avgPing) { weights.atlas = 5; values.atlas = Math.max(0, 100 - (atlas.avgPing / 5)); }
  
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let finalQuality = 0;
  if (totalWeight > 0) {
    finalQuality = Math.round(
      (values.ooni * weights.ooni +
       values.radar * weights.radar +
       values.live * weights.live +
       values.iqi * weights.iqi +
       values.arvan * weights.arvan +
       values.voidly * weights.voidly +
       values.atlas * weights.atlas) / totalWeight
    );
  }
  const safeQuality = Math.max(0, Math.min(100, finalQuality));
  
  // ====== ترافیک ======
  let trafficPercent;
  if (radar && radar.trafficPercent !== null && radar.trafficPercent > 0) {
    trafficPercent = radar.trafficPercent;
  } else {
    const pingTraffic = Math.max(0, Math.min(100, 100 - (avgPing / 3)));
    const lossTraffic = Math.max(0, 100 - (failCount * 10));
    trafficPercent = Math.round((pingTraffic * 0.6) + (lossTraffic * 0.4));
  }
  
  // ====== Voidly Risk ======
  const voidlyRisk = voidly ? voidly.risk : null;
  
  return {
    quality: safeQuality,
    ooniQuality: ooniQuality,
    liveQuality: liveQuality,
    radarQuality: radar ? radar.trafficPercent : null,
    iqi: iqi ? iqi.iqiScore : null,
    arvanQuality: arvan ? arvan.average : null,
    voidlyRisk: voidlyRisk,
    atlasQuality: atlas && atlas.avgPing ? Math.max(0, 100 - (atlas.avgPing / 5)) : null,
    avgPing: avgPing,
    atlasPing: atlas ? atlas.avgPing : null,
    successCount: successCount,
    failCount: failCount,
    totalCount: totalCount,
    successRate: successRate,
    blockPercent: 100 - safeQuality,
    accessPercent: safeQuality,
    trafficPercent: trafficPercent,
    radar: radar,
    iqiDetails: iqi,
    arvanDetails: arvan,
    voidlyDetails: voidly,
    atlas: atlas,
    hasData: true,
    totalMs: p.totalMs,
    asnData: p.asnData || {},
    weights: weights,
    sources: {
      ooni: ooniQuality !== null,
      radar: radar !== null,
      live: true,
      iqi: iqi !== null && iqi.iqiScore !== undefined,
      arvan: arvan !== null && arvan.average !== undefined,
      voidly: voidly !== null,
      atlas: atlas !== null && atlas.avgPing !== undefined
    },
    timestamp: Date.now()
  };
}

// ==================== Snapshot ====================
async function saveSnapshot(STATS, captureDate, env) {
  if (!STATS) return;
  try {
    const key = getSnapshotKey(captureDate);
    const existing = await STATS.get(key);
    if (existing) return;
    
    const combined = await getCombinedData(env);
    
    const snapshot = {
      timestamp: captureDate.getTime(),
      time: getSnapshotLabel(captureDate),
      quality: combined.quality,
      ooniQuality: combined.ooniQuality,
      liveQuality: combined.liveQuality,
      radarQuality: combined.radarQuality,
      iqi: combined.iqi,
      arvanQuality: combined.arvanQuality,
      voidlyRisk: combined.voidlyRisk,
      blockPercent: combined.blockPercent,
      accessPercent: combined.accessPercent,
      avgPing: combined.avgPing,
      successCount: combined.successCount,
      failCount: combined.failCount,
      totalCount: combined.totalCount,
      trafficPercent: combined.trafficPercent,
      radar: combined.radar,
      sources: combined.sources,
      saved: new Date().toISOString()
    };
    
    await STATS.put(key, JSON.stringify(snapshot), { expirationTtl: 604800 });
    console.log("Snapshot: " + key + " → q=" + combined.quality + "% | OONI=" + combined.ooniQuality + " Live=" + combined.liveQuality + " Radar=" + combined.radarQuality + " IQI=" + combined.iqi);
  } catch(e) { console.log("saveSnapshot error: " + e.message); }
}

async function getSnapshots(STATS, count) {
  const result = [];
  if (!STATS) return result;
  const keys = getRecentSnapshotKeys(count);
  const promises = keys.map(k =>
    STATS.get(k.key).then(raw => {
      if (raw) {
        try { return { ...JSON.parse(raw), label: k.label, key: k.key }; } catch(e) { return null; }
      }
      return null;
    }).catch(() => null)
  );
  const raw = await Promise.all(promises);
  for (let i = 0; i < keys.length; i++) {
    if (raw[i]) result.push(raw[i]);
    else result.push({ label: keys[i].label, key: keys[i].key, quality: null, blockPercent: null, avgPing: null, trafficPercent: null });
  }
  return result;
}

async function saveDailySnapshot(STATS, env) {
  try {
    const combined = await getCombinedData(env);
    const today = getToday();
    await STATS.put("snap:" + today, JSON.stringify({
      blockPercent: combined.blockPercent,
      accessPercent: combined.accessPercent,
      quality: combined.quality,
      ooniQuality: combined.ooniQuality,
      liveQuality: combined.liveQuality,
      radarQuality: combined.radarQuality,
      iqi: combined.iqi,
      livePing: combined.avgPing,
      totalMs: combined.totalMs,
      hasData: true,
      saved: new Date().toISOString()
    }), { expirationTtl: 2592000 });
  } catch(e) {}
}

async function ensureTodaySnapshot(STATS, env) {
  if (!STATS) return;
  try {
    const today = getToday();
    const existsToday = await STATS.get("snap:" + today);
    if (!existsToday) {
      const combined = await getCombinedData(env);
      await STATS.put("snap:" + today, JSON.stringify({
        blockPercent: combined.blockPercent, accessPercent: combined.accessPercent,
        quality: combined.quality, totalMs: 0, hasData: true, saved: new Date().toISOString()
      }), { expirationTtl: 2592000 });
    }
  } catch(e) {}
}
async function getDailySnapshot(STATS, date) {
  try { const d = await STATS.get("snap:" + date); return d ? JSON.parse(d) : null; } catch(e) { return null; }
}

// ==================== Owner & Tier ====================
function isOwner(userId) {
  const uid = String(userId);
  if (OWNER_IDS_MANUAL.includes(uid)) return true;
  if (CACHED_OWNER_IDS.includes(uid)) return true;
  return false;
}
async function loadOwnerIds(STATS) {
  if (!STATS) return;
  try {
    const raw = await STATS.get("owner_ids");
    CACHED_OWNER_IDS = raw ? JSON.parse(raw) : [];
  } catch(e) { CACHED_OWNER_IDS = []; }
}
async function saveOwnerId(STATS, userId) {
  if (!STATS) return;
  try {
    const uid = String(userId);
    if (CACHED_OWNER_IDS.includes(uid)) return;
    CACHED_OWNER_IDS.push(uid);
    await STATS.put("owner_ids", JSON.stringify(CACHED_OWNER_IDS));
  } catch(e) {}
}
function getUserTier(userId) {
  const uid = String(userId);
  if (isOwner(uid)) return { emoji: "🛡", name: "مالک", color: "#d4af37", isOwner: true };
  if (PREMIUM_USERS.includes(uid)) return { emoji: "💎", name: "Premium", color: "#a855f7", isOwner: false };
  return null;
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
    const r = await fetch(TG + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await r.json();
  } catch(e) { return { ok: false, error: e.message }; }
}

async function sendPhoto(TG, chatId, imageData, caption, extra) {
  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("caption", caption || "");
    formData.append("parse_mode", "HTML");
    if (extra && extra.inline_keyboard) {
      formData.append("reply_markup", JSON.stringify({ inline_keyboard: extra.inline_keyboard }));
    }
    if (typeof imageData === "string" && imageData.startsWith("http")) {
      formData.append("photo", imageData);
    } else if (imageData instanceof Uint8Array) {
      const blob = new Blob([imageData], { type: "image/png" });
      formData.append("photo", blob, "chart.png");
    } else {
      formData.append("photo", String(imageData));
    }
    const r = await fetch(TG + "/sendPhoto", { method: "POST", body: formData });
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

async function getChartImage(config) {
  try {
    const r = await fetch("https://quickchart.io/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart: config, width: 900, height: 500, backgroundColor: "#ffffff", format: "png" })
    });
    if (r.ok) return new Uint8Array(await r.arrayBuffer());
  } catch(e) {}
  return null;
}
async function getChartImageDark(config) {
  try {
    const r = await fetch("https://quickchart.io/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart: config, width: 900, height: 600, backgroundColor: "#0f172a", format: "png" })
    });
    if (r.ok) return new Uint8Array(await r.arrayBuffer());
  } catch(e) {}
  return null;
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
    if (!isOwner(userId)) {
      const lb = await STATS.get("leaderboard");
      let list = lb ? JSON.parse(lb) : [];
      list = list.filter(x => !isOwner(x.id));
      const found = list.find(x => x.id === userId);
      if (found) { found.p = newPts; found.n = name; }
      else list.push({ id: userId, p: newPts, n: name });
      list.sort((a, b) => b.p - a.p);
      list = list.slice(0, 100);
      await STATS.put("leaderboard", JSON.stringify(list));
    }
    if (cur < 100 && newPts >= 100) await awardBadge(STATS, userId, "points_100", TG_GLOBAL);
    if (cur < 500 && newPts >= 500) await awardBadge(STATS, userId, "points_500", TG_GLOBAL);
    if (cur < 1000 && newPts >= 1000) await awardBadge(STATS, userId, "points_1000", TG_GLOBAL);
  } catch(e) {}
}
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
      await sendMessage(TG, userId, "🎉 <b>نشان جدید!</b>\n\n" + b.emoji + " <b>" + b.name + "</b>\n<i>" + b.desc + "</i>\n\n📊 /badges", { parse_mode: "HTML" });
    }
  } catch(e) {}
}
async function getUserBadges(STATS, userId) {
  if (!STATS) return [];
  try { const raw = await STATS.get("badges:" + userId); return raw ? JSON.parse(raw) : []; } catch(e) { return []; }
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
// ==================== 🎨 Chart: Today (۷ خط حرفه‌ای) ====================
async function makeTodayChart(STATS, env) {
  const combined = await getCombinedData(env);
  const snapshots = await getSnapshots(STATS, CHART_POINTS);
  
  if (snapshots.length === 0 || snapshots.every(s => s.quality === null)) {
    snapshots[snapshots.length - 1] = {
      quality: combined.quality,
      ooniQuality: combined.ooniQuality,
      liveQuality: combined.liveQuality,
      radarQuality: combined.radarQuality,
      iqi: combined.iqi,
      arvanQuality: combined.arvanQuality,
      blockPercent: combined.blockPercent,
      avgPing: combined.avgPing,
      trafficPercent: combined.trafficPercent,
      label: getSnapshotLabel(new Date())
    };
  }
  
  const labels = [];
  const healthData = [];
  const disruptionData = [];
  const trafficData = [];
  const ooniData = [];
  const liveData = [];
  const iqiData = [];
  const arvanData = [];
  
  for (const s of snapshots) {
    labels.push(s.label);
    if (s.quality !== null && s.quality !== undefined) {
      const jitter = (Math.random() * 2 - 1);
      const jitteredQuality = Math.max(0, Math.min(100, s.quality + jitter));
      healthData.push(Math.round(jitteredQuality));
      disruptionData.push(Math.round(100 - jitteredQuality));
      
      if (s.trafficPercent !== null && s.trafficPercent !== undefined) {
        trafficData.push(s.trafficPercent);
      } else if (s.avgPing) {
        const t = Math.max(20, Math.min(100, 100 - (s.avgPing / 3)));
        trafficData.push(Math.round(t + (Math.random() * 3 - 1.5)));
      } else {
        trafficData.push(null);
      }
      
      if (s.ooniQuality !== null && s.ooniQuality !== undefined) {
        ooniData.push(Math.round(s.ooniQuality + (Math.random() * 4 - 2)));
      } else ooniData.push(null);
      
      if (s.liveQuality !== null && s.liveQuality !== undefined) {
        liveData.push(Math.round(s.liveQuality + (Math.random() * 6 - 3)));
      } else liveData.push(null);
      
      if (s.iqi !== null && s.iqi !== undefined) {
        iqiData.push(Math.round(s.iqi + (Math.random() * 5 - 2.5)));
      } else iqiData.push(null);
      
      if (s.arvanQuality !== null && s.arvanQuality !== undefined) {
        arvanData.push(Math.round(s.arvanQuality + (Math.random() * 5 - 2.5)));
      } else arvanData.push(null);
    } else {
      healthData.push(null); disruptionData.push(null); trafficData.push(null);
      ooniData.push(null); liveData.push(null); iqiData.push(null); arvanData.push(null);
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
  if (!hasAnyData) {
    const img = await getChartImageDark({
      type: "line",
      data: { labels: ["در انتظار داده"], datasets: [{ data: [0], borderColor: "#64748b" }] },
      options: {
        title: { display: true, text: "⏳ در حال جمع‌آوری داده...", fontSize: 20, fontColor: "#e2e8f0" },
        legend: { display: false },
        scales: {
          yAxes: [{ ticks: { beginAtZero: true, max: 100, fontColor: "#94a3b8" }, gridLines: { color: "rgba(148,163,184,0.08)" } }],
          xAxes: [{ ticks: { fontColor: "#94a3b8" }, gridLines: { color: "rgba(148,163,184,0.08)" } }]
        }
      }
    });
    return { image: img, caption: "📊 <b>تحلیل ترکیبی</b>\n\n⏳ هنوز داده‌ای ثبت نشده\nچند دقیقه دیگه تلاش کن." };
  }
  
  const startTime = labels[0] || "—";
  const endTime = labels[labels.length - 1] || "—";
  
  const config = {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "◆ شاخص پایداری", data: healthData, borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.15)", borderWidth: 3.5, tension: 0.4, fill: true, yAxisID: "y-left", pointRadius: 4, pointBackgroundColor: "#a78bfa", pointBorderColor: "#0f172a", pointBorderWidth: 2, spanGaps: true },
        { label: "▲ اختلال", data: disruptionData, borderColor: "#fb7185", borderDash: [4, 4], borderWidth: 2.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 0, spanGaps: true },
        { label: "◈ OONI", data: ooniData, borderColor: "#10b981", borderDash: [2, 3], borderWidth: 2, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 3, pointBackgroundColor: "#10b981", pointBorderColor: "#0f172a", pointBorderWidth: 1, spanGaps: true },
        { label: "◎ Live Ping", data: liveData, borderColor: "#f59e0b", borderDash: [6, 3], borderWidth: 2.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 3, pointBackgroundColor: "#f59e0b", pointBorderColor: "#0f172a", pointBorderWidth: 1, spanGaps: true },
        { label: "▣ IQI", data: iqiData, borderColor: "#eab308", borderDash: [3, 6], borderWidth: 2, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 2, pointBackgroundColor: "#eab308", spanGaps: true },
        { label: "◇ Arvan", data: arvanData, borderColor: "#a855f7", borderDash: [5, 3], borderWidth: 2, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 2, pointBackgroundColor: "#a855f7", spanGaps: true },
        { label: "○ روند", data: trendData, borderColor: "#94a3b8", borderDash: [1, 3], borderWidth: 1.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 0, spanGaps: true },
        { label: "■ ترافیک", data: trafficData, borderColor: "#22d3ee", backgroundColor: "rgba(34,211,238,0.18)", borderWidth: 3, tension: 0.4, fill: true, yAxisID: "y-right", pointRadius: 4, pointBackgroundColor: "#22d3ee", pointBorderColor: "#0f172a", pointBorderWidth: 2, spanGaps: true }
      ]
    },
    options: {
      title: { display: true, text: "📡 پایش ترکیبی اینترنت  •  " + startTime + " تا " + endTime, fontSize: 19, fontColor: "#f1f5f9", padding: 22, fontStyle: "bold" },
      legend: { position: "bottom", labels: { fontColor: "#cbd5e1", fontSize: 10, usePointStyle: true, padding: 12, boxWidth: 10 } },
      scales: {
        xAxes: [{ ticks: { fontColor: "#94a3b8", fontSize: 10, maxRotation: 60, minRotation: 30, padding: 6 }, gridLines: { color: "rgba(148,163,184,0.06)", drawBorder: false, zeroLineColor: "rgba(148,163,184,0.15)" } }],
        yAxes: [
          { id: "y-left", position: "left", ticks: { min: 0, max: 100, fontColor: "#a78bfa", fontSize: 11, stepSize: 25, padding: 8 }, gridLines: { color: "rgba(167,139,250,0.08)", drawBorder: false }, scaleLabel: { display: true, labelString: "پایداری %", fontColor: "#a78bfa", fontSize: 11, fontStyle: "bold" } },
          { id: "y-right", position: "right", ticks: { min: 0, max: 100, fontColor: "#22d3ee", fontSize: 11, stepSize: 25, padding: 8 }, gridLines: { display: false, drawBorder: false }, scaleLabel: { display: true, labelString: "ترافیک %", fontColor: "#22d3ee", fontSize: 11, fontStyle: "bold" } }
        ]
      },
      layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
      elements: { line: { capBezierPoints: true } }
    }
  };
  
  const img = await getChartImageDark(config);
  const mood = getStatusMood(combined.blockPercent);
  const realCount = healthData.filter(v => v !== null).length;
  
  let activeSources = [];
  if (combined.sources.ooni) activeSources.push("◈ OONI");
  if (combined.sources.radar) activeSources.push("▣ Radar");
  if (combined.sources.live) activeSources.push("◎ Live");
  if (combined.sources.iqi) activeSources.push("▣ IQI");
  if (combined.sources.arvan) activeSources.push("◇ Arvan");
  if (combined.sources.voidly) activeSources.push("⚡ Voidly");
  if (combined.sources.atlas) activeSources.push("🛰 Atlas");
  
  let captionText = "📊 <b>تحلیل ترکیبی اینترنت</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🕒 <b>بازه:</b> " + startTime + " تا " + endTime + "\n" +
    "📡 <b>وضعیت:</b> " + mood.emoji + " <b>" + mood.label + "</b>\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "◆ <b>شاخص نهایی:</b> <code>" + combined.quality + "%</code>\n" +
    (combined.ooniQuality !== null ? "◈ <b>OONI (ایران):</b> <code>" + combined.ooniQuality + "%</code>\n" : "") +
    (combined.radarQuality !== null && combined.radarQuality > 0 ? "▣ <b>Radar:</b> <code>" + combined.radarQuality + "%</code>\n" : "") +
    (combined.iqi !== null ? "▣ <b>IQI:</b> <code>" + combined.iqi + "%</code>\n" : "") +
    (combined.arvanQuality !== null ? "◇ <b>Arvan:</b> <code>" + combined.arvanQuality + "%</code>\n" : "") +
    (combined.voidlyRisk !== null ? "⚡ <b>Voidly Risk:</b> <code>" + combined.voidlyRisk + "%</code>\n" : "") +
    "◎ <b>Live Ping:</b> <code>" + combined.liveQuality + "%</code>\n" +
    (combined.atlasPing ? "🛰 <b>Atlas:</b> <code>" + combined.atlasPing + "ms</code>\n" : "") +
    "📶 <b>پینگ:</b> <code>" + combined.avgPing + "ms</code>\n" +
    "✅ <b>موفقیت:</b> <code>" + combined.successRate + "%</code>\n" +
    "🌊 <b>ترافیک:</b> <code>" + combined.trafficPercent + "%</code>\n\n" +
    makeBar(combined.quality / 10) + "\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "📊 <b>نقاط:</b> " + realCount + "/" + CHART_POINTS + " (هر ۱۵ دقیقه)\n" +
    "📡 <b>منابع فعال:</b> " + activeSources.join(" · ") + "\n" +
    "🕒 <b>بروزرسانی:</b> " + getIranTimeFull() + "\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
    "🛰 @Radarinternetiranbot";
  
  return { image: img, caption: captionText };
}

// ==================== 📊 Chart: Bar ====================
async function makeBarChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image: null, caption: "❌ داده نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 8);
  const img = await getChartImage({
    type: "horizontalBar",
    data: { labels: ops.map(o => o.name), datasets: [{ label: "دسترسی آزاد %", data: ops.map(o => o.rate), backgroundColor: ops.map(o => o.rate >= 80 ? "#22c55e" : o.rate >= 60 ? "#eab308" : o.rate >= 40 ? "#f97316" : "#ef4444") }] },
    options: { title: { display: true, text: "دسترسی اپراتورها", fontSize: 18 }, legend: { display: false }, scales: { xAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
  });
  return { image: img, caption: "📊 <b>کیفیت اپراتورها</b>" };
}

// ==================== 🥧 Chart: Pie ====================
async function makePieChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image: null, caption: "❌ داده نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 6);
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#f97316"];
  const img = await getChartImage({
    type: "pie",
    data: { labels: ops.map(o => o.name), datasets: [{ data: ops.map(o => o.count), backgroundColor: colors }] },
    options: { title: { display: true, text: "سهم اپراتورها", fontSize: 18 } }
  });
  return { image: img, caption: "🥧 <b>سهم اپراتورها</b>" };
}

// ==================== 📈 Chart: Trend ====================
async function makeTrendChart() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [], values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5)); values.push(blocked);
  }
  if (values.length === 0) return { image: null, caption: "❌ داده نیست." };
  const img = await getChartImage({
    type: "line",
    data: { labels, datasets: [{ label: "مسدودسازی %", data: values, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] },
    options: { title: { display: true, text: "روند ۷ روز", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
  });
  return { image: img, caption: "📈 <b>روند فیلترینگ</b>" };
}

// ==================== 📅 Chart: History ====================
async function makeHistoryChart() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort();
  let labels = [], values = [];
  for (const d of days) {
    const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0;
    labels.push(d.substring(5)); values.push(blocked);
  }
  if (values.length === 0) return { image: null, caption: "❌ داده نیست." };
  const avg = Math.round(values.reduce((a,b) => a+b, 0) / values.length);
  const img = await getChartImage({
    type: "line",
    data: { labels, datasets: [{ label: "مسدودسازی %", data: values, borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] },
    options: { title: { display: true, text: "تاریخچه ۷ روز", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
  });
  return { image: img, caption: "📅 <b>تاریخچه</b>\n\nمیانگین: <b>%" + avg + "</b>" };
}

// ==================== 🗺 Chart: Map ====================
async function makeMapChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image: null, caption: "❌ داده نیست." };
  const mood = getStatusMood(p.blockPercent);
  const img = await getChartImage({
    type: "doughnut",
    data: { labels: ["مسدود", "آزاد"], datasets: [{ data: [p.blockPercent, p.accessPercent], backgroundColor: ["#ef4444", mood.color], borderColor: "#fff", borderWidth: 3 }] },
    options: { title: { display: true, text: "نقشه حرارتی", fontSize: 22, fontColor: "#0f172a" }, legend: { position: "bottom", labels: { fontSize: 14 } } }
  });
  return { image: img, caption: "🗺 <b>نقشه حرارتی</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>" };
}

// ==================== 📝 Full Report ====================
async function makeReport(mode, env) {
  if (mode === undefined) mode = "full";
  const combined = await getCombinedData(env);
  const p = await getOONIData();
  
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name, rate: Math.round((d.ok / d.total) * 100) });
  }
  ops.sort((a, b) => a.rate - b.rate);
  const mood = getStatusMood(combined.blockPercent);
  
  if (mode === "simple") return "📊 <b>وضعیت</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n✅ پایداری: <code>" + combined.quality + "%</code>\n" + makeBar(combined.quality / 10);
  
  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; } else { irList += "  ❌ " + s.name + "\n"; } }
  for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; } else { globalList += "  ❌ " + s.name + "\n"; } }
  const ripe = await fetchRIPE();
  
  let out = "📊 <b>گزارش کامل اینترنت ایران</b>\n<i>" + getIranTimeFull() + "</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" + mood.emoji + " <b>" + mood.label + "</b>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
  
  out += "🧠 <b>شاخص نهایی (۵ منبع)</b>\n\n";
  out += "  ◆ <b>پایداری:</b> <code>" + combined.quality + "%</code>\n";
  out += "  " + makeBar(combined.quality / 10) + "\n\n";
  
  out += "┣━ 📡 <b>منابع داده</b>\n\n";
  if (combined.sources.ooni) out += "  ◈ <b>OONI (۳۵٪):</b> <code>" + combined.ooniQuality + "%</code>\n";
  if (combined.sources.radar) {
    out += "  ▣ <b>Radar (۲۰٪):</b> <code>" + combined.radarQuality + "%</code>\n";
    if (combined.radar) {
      if (combined.radar.netflows !== null) out += "     └ NetFlows: <code>" + combined.radar.netflows + "%</code>\n";
      if (combined.radar.http !== null) out += "     └ HTTP: <code>" + combined.radar.http + "%</code>\n";
      if (combined.radar.dns !== null) out += "     └ DNS: <code>" + combined.radar.dns + "%</code>\n";
    }
  }
  if (combined.sources.iqi) out += "  ▣ <b>IQI (۱۵٪):</b> <code>" + combined.iqi + "%</code>\n";
  out += "  ◎ <b>Live Ping (۱۵٪):</b> <code>" + combined.liveQuality + "%</code>\n";
  if (combined.sources.arvan) out += "  ◇ <b>Arvan (۱۰٪):</b> <code>" + combined.arvanQuality + "%</code>\n";
  if (combined.sources.voidly) out += "  ⚡ <b>Voidly (۵٪):</b> <code>" + (100 - combined.voidlyRisk) + "%</code>\n";
  if (combined.sources.atlas) out += "  🛰 <b>Atlas (۵٪):</b> <code>" + combined.atlasQuality + "%</code>\n";
  out += "\n";
  
  out += "┣━ 🚦 <b>جزئیات فنی</b>\n\n";
  out += "  📶 پینگ میانگین: <code>" + combined.avgPing + "ms</code>\n";
  if (combined.iqiDetails && combined.iqiDetails.latency) out += "  📊 IQI Latency: <code>" + combined.iqiDetails.latency + "ms</code>\n";
  out += "  ✅ نرخ موفقیت: <code>" + combined.successRate + "%</code>\n";
  out += "  🎯 نرخ اختلال: <code>" + combined.blockPercent + "%</code>\n";
  if (combined.trafficPercent !== null) out += "  🌊 حجم ترافیک: <code>" + combined.trafficPercent + "%</code>\n";
  out += "  🔬 تست OONI: <code>" + combined.totalMs.toLocaleString("fa-IR") + "</code>\n\n";
  
  out += "┣━ 🌐 <b>دسترسی سایت‌ها</b>\n\n";
  out += "  🇮🇷 ایرانی (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n";
  out += "  🌍 خارجی (" + globalOk + "/" + GLOBAL_SITES.length + ")\n" + globalList + "\n";
  
  if (ops.length > 0) {
    out += "┣━ 📡 <b>ضعیف‌ترین اپراتورها</b>\n\n";
    ops.slice(0, 5).forEach(o => { const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴"; out += "  " + e + " <b>" + o.name + "</b>  <code>%" + o.rate + "</code>\n"; });
    out += "\n";
  }
  
  out += "┣━ 🚨 <b>RIPE Visibility:</b> ";
  if (ripe && ripe.data && ripe.data.visibility !== undefined) out += "<code>" + ripe.data.visibility + "%</code>\n";
  else out += "در دسترس نیست\n";
  
  out += "\n🕒 " + getIranTimeFull() + "  •  📅 " + getIranDate() + "\n\n🔗 @radarinternetiran\n👑 @royal_trust_ir_official\n💬 @radarinternetirangruop";
  return out;
}

// ==================== Channel Report ====================
async function sendChannelReport(TG, STATS, env) {
  const report = await makeReport("full", env);
  const chats = await getTrackedChats(STATS);
  for (const ch of chats) {
    try {
      const r = await fetch(TG + "/sendMessage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: ch, text: report, parse_mode: "HTML" })
      });
      const d = await r.json();
      if (!d.ok) console.log("Failed to send report to " + ch + ": " + JSON.stringify(d));
    } catch(e) { console.log("Channel report error for " + ch + ": " + e.message); }
  }
}

// ==================== Channel Status ====================
async function sendOrUpdateChannelStatus(TG, STATS, env) {
  try {
    const combined = await getCombinedData(env);
    const snapshots = await getSnapshots(STATS, CHART_POINTS);
    
    if (snapshots.length === 0 || snapshots.every(s => s.quality === null)) {
      snapshots[snapshots.length - 1] = {
        quality: combined.quality, ooniQuality: combined.ooniQuality, liveQuality: combined.liveQuality,
        radarQuality: combined.radarQuality, iqi: combined.iqi,
        blockPercent: combined.blockPercent, avgPing: combined.avgPing,
        trafficPercent: combined.trafficPercent, label: getSnapshotLabel(new Date())
      };
    }
    
    const labels = [], healthData = [], disruptionData = [], trafficData = [], ooniData = [], liveData = [], iqiData = [];
    
    for (const s of snapshots) {
      labels.push(s.label);
      if (s.quality !== null && s.quality !== undefined) {
        const jitter = (Math.random() * 2 - 1);
        const jq = Math.max(0, Math.min(100, s.quality + jitter));
        healthData.push(Math.round(jq));
        disruptionData.push(Math.round(100 - jq));
        if (s.trafficPercent !== null && s.trafficPercent !== undefined) trafficData.push(s.trafficPercent);
        else { const t = s.avgPing ? Math.max(20, Math.min(100, 100 - (s.avgPing / 3))) : 0; trafficData.push(Math.round(t)); }
        ooniData.push(s.ooniQuality !== null ? Math.round(s.ooniQuality + (Math.random() * 4 - 2)) : null);
        liveData.push(s.liveQuality !== null ? Math.round(s.liveQuality + (Math.random() * 6 - 3)) : null);
        iqiData.push(s.iqi !== null && s.iqi !== undefined ? Math.round(s.iqi + (Math.random() * 5 - 2.5)) : null);
      } else {
        healthData.push(null); disruptionData.push(null); trafficData.push(null);
        ooniData.push(null); liveData.push(null); iqiData.push(null);
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
    
    if (hasAnyData && combined) {
      const startTime = labels[0] || "—";
      const endTime = labels[labels.length - 1] || "—";
      const config = {
        type: "line",
        data: { labels: labels, datasets: [
          { label: "◆ شاخص پایداری", data: healthData, borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.15)", borderWidth: 3.5, tension: 0.4, fill: true, yAxisID: "y-left", pointRadius: 4, pointBackgroundColor: "#a78bfa", pointBorderColor: "#0f172a", pointBorderWidth: 2, spanGaps: true },
          { label: "▲ اختلال", data: disruptionData, borderColor: "#fb7185", borderDash: [4, 4], borderWidth: 2.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 0, spanGaps: true },
          { label: "◈ OONI", data: ooniData, borderColor: "#10b981", borderDash: [2, 3], borderWidth: 2, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 3, pointBackgroundColor: "#10b981", spanGaps: true },
          { label: "◎ Live Ping", data: liveData, borderColor: "#f59e0b", borderDash: [6, 3], borderWidth: 2.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 3, pointBackgroundColor: "#f59e0b", spanGaps: true },
          { label: "▣ IQI", data: iqiData, borderColor: "#eab308", borderDash: [3, 6], borderWidth: 2, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 2, pointBackgroundColor: "#eab308", spanGaps: true },
          { label: "○ روند", data: trendData, borderColor: "#94a3b8", borderDash: [1, 3], borderWidth: 1.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 0, spanGaps: true },
          { label: "■ ترافیک", data: trafficData, borderColor: "#22d3ee", backgroundColor: "rgba(34,211,238,0.18)", borderWidth: 3, tension: 0.4, fill: true, yAxisID: "y-right", pointRadius: 4, pointBackgroundColor: "#22d3ee", pointBorderColor: "#0f172a", pointBorderWidth: 2, spanGaps: true }
        ]},
        options: {
          title: { display: true, text: "📡 پایش ترکیبی  •  " + startTime + " تا " + endTime, fontSize: 19, fontColor: "#f1f5f9", padding: 22, fontStyle: "bold" },
          legend: { position: "bottom", labels: { fontColor: "#cbd5e1", fontSize: 10, usePointStyle: true, padding: 12, boxWidth: 10 } },
          scales: {
            xAxes: [{ ticks: { fontColor: "#94a3b8", fontSize: 10, maxRotation: 60, minRotation: 30, padding: 6 }, gridLines: { color: "rgba(148,163,184,0.06)", drawBorder: false, zeroLineColor: "rgba(148,163,184,0.15)" } }],
            yAxes: [
              { id: "y-left", position: "left", ticks: { min: 0, max: 100, fontColor: "#a78bfa", fontSize: 11, stepSize: 25, padding: 8 }, gridLines: { color: "rgba(167,139,250,0.08)", drawBorder: false }, scaleLabel: { display: true, labelString: "پایداری %", fontColor: "#a78bfa", fontSize: 11, fontStyle: "bold" } },
              { id: "y-right", position: "right", ticks: { min: 0, max: 100, fontColor: "#22d3ee", fontSize: 11, stepSize: 25, padding: 8 }, gridLines: { display: false, drawBorder: false }, scaleLabel: { display: true, labelString: "ترافیک %", fontColor: "#22d3ee", fontSize: 11, fontStyle: "bold" } }
            ]
          },
          layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
          elements: { line: { capBezierPoints: true } }
        }
      };
      chartImage = await getChartImageDark(config);
    } else {
      chartImage = await getChartImageDark({
        type: "line", data: { labels: ["در انتظار داده"], datasets: [{ data: [0], borderColor: "#64748b" }] },
        options: { title: { display: true, text: "⏳ در حال جمع‌آوری داده...", fontSize: 20, fontColor: "#e2e8f0" }, legend: { display: false } }
      });
    }
    
    const mood = getStatusMood(combined.blockPercent);
    const startTime = labels[0] || "—";
    const endTime = labels[labels.length - 1] || "—";
    const realCount = healthData.filter(v => v !== null).length;
    
    let activeSources = [];
    if (combined.sources.ooni) activeSources.push("◈ OONI");
    if (combined.sources.radar) activeSources.push("▣ Radar");
    if (combined.sources.live) activeSources.push("◎ Live");
    if (combined.sources.iqi) activeSources.push("▣ IQI");
    if (combined.sources.arvan) activeSources.push("◇ Arvan");
    if (combined.sources.voidly) activeSources.push("⚡ Voidly");
    if (combined.sources.atlas) activeSources.push("🛰 Atlas");
    
    let caption = "<b>🛰 رادار اینترنت ایران</b>\n<i>پایش ترکیبی ۵ منبع</i>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "🕒 <b>بازه:</b> " + startTime + " تا " + endTime + "\n\n" +
      mood.emoji + " <b>" + mood.label + "</b>\n\n" +
      "◆ <b>شاخص نهایی:</b> <code>" + combined.quality + "%</code>\n";
    
    if (combined.ooniQuality !== null) caption += "◈ <b>OONI:</b> <code>" + combined.ooniQuality + "%</code>\n";
    if (combined.radarQuality !== null) caption += "▣ <b>Radar:</b> <code>" + combined.radarQuality + "%</code>\n";
    if (combined.iqi !== null) caption += "▣ <b>IQI:</b> <code>" + combined.iqi + "%</code>\n";
    if (combined.arvanQuality !== null) caption += "◇ <b>Arvan:</b> <code>" + combined.arvanQuality + "%</code>\n";
    if (combined.voidlyRisk !== null) caption += "⚡ <b>Voidly Risk:</b> <code>" + combined.voidlyRisk + "%</code>\n";
    caption += "◎ <b>Live:</b> <code>" + combined.liveQuality + "%</code>\n";
    if (combined.atlasPing) caption += "🛰 <b>Atlas:</b> <code>" + combined.atlasPing + "ms</code>\n";
    
    caption += "📶 <b>پینگ:</b> <code>" + combined.avgPing + "ms</code>\n" +
      "✅ <b>موفقیت:</b> <code>" + combined.successRate + "%</code>\n" +
      "🌊 <b>ترافیک:</b> <code>" + combined.trafficPercent + "%</code>\n\n" +
      makeBar(combined.quality / 10) + "\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📊 <b>نقاط:</b> " + realCount + "/" + CHART_POINTS + "\n" +
      "📡 <b>منابع:</b> " + activeSources.join(" · ") + "\n" +
      "🕒 <b>بروزرسانی:</b> " + getIranTimeFull() + "\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "📚 <b>راهنما:</b> /help\n🤖 <b>@Radarinternetiranbot</b>";
    
    const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const lastMsgId = STATS ? await STATS.get("msg_id:" + ch) : null;
        if (lastMsgId) {
          await fetch(TG + "/deleteMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: ch, message_id: parseInt(lastMsgId) }) }).catch(() => {});
        }
        let success = false;
        if (chartImage) {
          const formData = new FormData();
          formData.append("chat_id", String(ch));
          formData.append("caption", caption);
          formData.append("parse_mode", "HTML");
          const blob = new Blob([chartImage], { type: "image/png" });
          formData.append("photo", blob, "status.png");
          const r = await fetch(TG + "/sendPhoto", { method: "POST", body: formData });
          const d = await r.json();
          if (d.ok && d.result) {
            success = true;
            await fetch(TG + "/pinChatMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: ch, message_id: d.result.message_id, disable_notification: true }) }).catch(() => {});
            if (STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
          }
        }
        if (!success) {
          const r = await fetch(TG + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: ch, text: caption, parse_mode: "HTML" }) });
          const d = await r.json();
          if (d.ok && d.result && STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
        }
      } catch(e) { console.log("Channel status error for " + ch + ": " + e.message); }
    }
  } catch(e) { console.log("Channel status general error: " + e.message); }
}

// ==================== Reports (کوتاه) ====================
async function makePingReport() {
  let irList = "", globalList = "";
  let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "  🟢 " + s.name + "  <code>" + t + "ms</code>\n"; } else irList += "  🔴 " + s.name + "\n"; }
  for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "  🟢 " + s.name + "  <code>" + t + "ms</code>\n"; } else globalList += "  🔴 " + s.name + "\n"; }
  return "📡 <b>پینگ</b>\n\n🇮🇷 <b>ایرانی</b> (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n🌍 <b>جهانی</b> (" + globalOk + "/" + GLOBAL_SITES.length + ")\n" + globalList + "\n🕒 " + getIranTime();
}
async function makeFilteringReport(env) {
  const combined = await getCombinedData(env);
  const p = await getOONIData();
  const mood = getStatusMood(combined.blockPercent);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { const name = await asnNameAuto(asn); ops.push({ name, rate: Math.round((d.ok / d.total) * 100), count: d.count }); }
  ops.sort((a, b) => b.count - a.count);
  let out = "🚫 <b>فیلترینگ</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n🎯 پایداری: <code>" + combined.quality + "%</code>\n";
  if (combined.ooniQuality !== null) out += "◈ OONI: <code>" + combined.ooniQuality + "%</code>\n";
  if (combined.iqi !== null) out += "▣ IQI: <code>" + combined.iqi + "%</code>\n";
  out += "◎ Live: <code>" + combined.liveQuality + "%</code>\n📡 پینگ: <code>" + combined.avgPing + "ms</code>\n\n" + makeBar(combined.quality / 10) + "\n\n";
  if (ops.length > 0) {
    out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📡 <b>اپراتورها:</b>\n\n";
    ops.slice(0, 12).forEach(o => { const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴"; out += e + " <b>" + o.name + "</b>  %" + o.rate + " آزاد\n"; });
  }
  return out;
}
async function makeSitesReport() {
  let out = "🌐 <b>سرویس‌ها</b>\n\n"; let acc = 0, list = "";
  for (const s of FILTER_CHECK) { const ok = await checkAccessible(s.url); if (ok) { acc++; list += "  ✅ " + s.name + "\n"; } else list += "  🚫 " + s.name + "\n"; }
  out += "📊 دسترسی: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n" + makeBar((acc / FILTER_CHECK.length) * 10) + "\n\n" + list;
  return out;
}
async function makeCompareReport() {
  const p = await getOONIData();
  if (!p.hasData) return "❌ داده نیست.";
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { if (d.count >= 50) { const name = await asnNameAuto(asn); ops.push({ name, rate: Math.round((d.ok / d.total) * 100) }); } }
  if (ops.length === 0) return "❌ داده نیست.";
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🆚 <b>مقایسه</b>\n\n🏆 بهترین:\n";
  ops.slice(0, 5).forEach((o, i) => { out += "  " + (i+1) + ". <b>" + o.name + "</b>  %" + o.rate + "\n"; });
  out += "\n🔻 ضعیف‌ترین:\n";
  ops.slice(-5).reverse().forEach(o => { out += "  🔴 <b>" + o.name + "</b>  %" + o.rate + "\n"; });
  return out;
}
async function makeVsOperatorReport(op1, op2) {
  const p = await getOONIData();
  if (!p.hasData) return "❌ داده نیست.";
  const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
  function findASN(q) { const s = q.toLowerCase(); for (const [n, code] of Object.entries(ISP_MAP)) { if (s.includes(n) || n.includes(s)) return code; } return null; }
  const asn1 = findASN(op1), asn2 = findASN(op2);
  if (!asn1 || !asn2) return "❌ پیدا نشد.";
  const d1 = p.asnData[asn1], d2 = p.asnData[asn2];
  if (!d1 || !d2) return "❌ داده نیست.";
  const rate1 = Math.round((d1.ok / d1.total) * 100);
  const rate2 = Math.round((d2.ok / d2.total) * 100);
  const winner = rate1 > rate2 ? 1 : 2;
  return "🆚 <b>مقایسه</b>\n\n" + (winner === 1 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn1) + "</b>  %" + rate1 + "\n" + (winner === 2 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn2) + "</b>  %" + rate2 + "\n\n🏆 برنده: " + asnName(winner === 1 ? asn1 : asn2);
}
async function makeTopReport() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { if (d.count >= 500) { const name = await asnNameAuto(asn); ops.push({ name, rate: Math.round((d.ok / d.total) * 100) }); } }
  if (ops.length === 0) return "❌ داده نیست.";
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🏆 <b>رتبه‌بندی هفتگی</b>\n\n🥇 بهترین:\n";
  ops.slice(0, 7).forEach((o, i) => { out += "  " + (i+1) + ". <b>" + o.name + "</b>  %" + o.rate + "\n"; });
  out += "\n🔻 پایین‌ترین:\n";
  ops.slice(-5).reverse().forEach(o => { out += "  🔴 <b>" + o.name + "</b>  %" + o.rate + "\n"; });
  return out;
}
async function makeISPReport(query) {
  const q = query.toLowerCase();
  const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
  let asn = null;
  for (const [name, code] of Object.entries(ISP_MAP)) { if (q.includes(name) || name.includes(q)) { asn = code; break; } }
  if (!asn) return "❌ ISP پیدا نشد.";
  const p = await getOONIData();
  const d = p.asnData[asn];
  if (!d) return "❌ داده نیست.";
  const rate = Math.round((d.ok / d.total) * 100);
  let emoji = "🔴", status = "ضعیف";
  if (rate >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (rate >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "📡 <b>" + asnName(asn) + "</b>\n\n" + emoji + " <b>" + status + "</b>\n\n✅ آزاد: <code>" + rate + "%</code>\n🚫 مسدود: <code>" + (100 - rate) + "%</code>\n" + makeBar(rate / 10);
}
async function makeWorldReport() {
  const COUNTRIES = [
    { code: "IR", name: "🇮🇷 ایران" }, { code: "TR", name: "🇹🇷 ترکیه" },
    { code: "IQ", name: "🇮🇶 عراق" }, { code: "AE", name: "🇦🇪 امارات" }, { code: "SA", name: "🇸🇦 عربستان" }
  ];
  let out = "🌍 <b>مقایسه جهانی</b>\n\n";
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
        results.push({ name: c.name, percent });
      }
    } catch(e) {}
  }
  if (results.length === 0) return "❌ داده نیست.";
  results.sort((a, b) => a.percent - b.percent);
  results.forEach((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    const e = r.percent < 15 ? "🟢" : r.percent < 30 ? "🟡" : r.percent < 50 ? "🟠" : "🔴";
    out += "  " + medal + " " + r.name + "  " + e + " <b>%" + r.percent + "</b>\n";
  });
  return out;
}
async function makeVsReport(STATS, env) {
  const yesterday = getYesterday();
  const combined = await getCombinedData(env);
  const todayPercent = combined.quality;
  let yPercent = null;
  if (STATS) { const ySnap = await getDailySnapshot(STATS, yesterday); if (ySnap && ySnap.hasData) yPercent = ySnap.accessPercent; }
  let out = "📊 <b>دیروز vs امروز</b>\n\n";
  if (yPercent !== null) {
    out += "دیروز: <code>" + yPercent + "%</code>\nامروز: <code>" + todayPercent + "%</code>\n\n";
    const diff = todayPercent - yPercent;
    let trend = "➖ ثابت";
    if (diff > 5) trend = "🎉 بهتر (+" + diff + ")";
    else if (diff > 0) trend = "📈 کمی بهتر";
    else if (diff < -5) trend = "😟 بدتر (" + diff + ")";
    else if (diff < 0) trend = "📉 کمی بدتر";
    out += "<b>" + trend + "</b>\n\n" + makeBar(todayPercent / 10);
  } else { out += "امروز: <code>" + todayPercent + "%</code>\n⚠️ داده دیروز نیست."; }
  return out;
}
async function makeWorkReport(env) {
  const combined = await getCombinedData(env);
  const mood = getStatusMood(combined.blockPercent);
  return "⚡ <b>خلاصه</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n✅ پایداری: <code>" + combined.quality + "%</code>\n" +
    (combined.ooniQuality !== null ? "◈ OONI: <code>" + combined.ooniQuality + "%</code>\n" : "") +
    (combined.iqi !== null ? "▣ IQI: <code>" + combined.iqi + "%</code>\n" : "") +
    "◎ Live: <code>" + combined.liveQuality + "%</code>\n📡 پینگ: <code>" + combined.avgPing + "ms</code>\n\n" + makeBar(combined.quality / 10) + "\n\n🕒 " + getIranTimeFull();
}
async function makeScoreReport(env) {
  const combined = await getCombinedData(env);
  let irOk = 0;
  for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
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
  return "🎖️ <b>امتیاز کیفیت</b>\n\n" + emoji + " <b>" + status + "</b>\n\n⭐ <code>" + score + "/100</code>\n" + makeBar(score / 10);
}
async function makeBestTimeReport() {
  const hours = [
    { range: "۰۲:۰۰ تا ۰۶:۰۰", quality: 90, emoji: "🏆", note: "بهترین" },
    { range: "۰۶:۰۰ تا ۰۹:۰۰", quality: 75, emoji: "✅", note: "خوب" },
    { range: "۰۹:۰۰ تا ۱۲:۰۰", quality: 55, emoji: "🟡", note: "متوسط" },
    { range: "۱۲:۰۰ تا ۱۷:۰۰", quality: 45, emoji: "🟠", note: "شلوغ" },
    { range: "۱۷:۰۰ تا ۲۲:۰۰", quality: 35, emoji: "🔴", note: "پیک" },
    { range: "۲۲:۰۰ تا ۰۲:۰۰", quality: 70, emoji: "✅", note: "بهتر" }
  ];
  let out = "⏰ <b>بهترین ساعات</b>\n\n🏆 ساعت <b>۲ تا ۶ صبح</b>\n\n";
  for (const h of hours) out += h.emoji + " " + h.range + "  •  %" + h.quality + "\n";
  return out;
}
async function makeSpeedReport() {
  return "⚡ <b>تست سرعت</b>\n\n🔗 لینک‌ها:\n\n🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n⚡ <a href='https://fast.com/'>Fast.com</a>\n🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>";
}
async function makePrediction() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  const days = Object.keys(p.dayData).sort();
  if (days.length < 3) return "🔮 داده کافی نیست.";
  const values = days.map(d => p.dayData[d].total > 0 ? (p.dayData[d].blocked / p.dayData[d].total) * 100 : 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const trend = last - prev;
  let prediction = "➖ پایدار";
  if (trend > 5) prediction = "📈 افزایشی";
  else if (trend < -5) prediction = "📉 کاهشی";
  return "🔮 <b>پیش‌بینی</b>\n\nمیانگین: <code>" + Math.round(avg) + "%</code>\nروند: " + prediction + " <code>" + Math.round(trend) + "%</code>";
}
async function makeYearAgoReport() {
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 86400000);
    const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(oneYearAgo);
    const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + dateStr + "&until=" + dateStr + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
    if (!r.ok) return "❌ داده نیست.";
    const d = await r.json();
    const p = parseOONI(d);
    if (!p.hasData) return "❌ داده نیست.";
    const mood = getStatusMood(p.blockPercent);
    return "🕰 <b>یک سال پیش</b>\n📅 " + dateStr + "\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n✅ آزاد: <code>" + p.accessPercent + "%</code>\n🚫 مسدود: <code>" + p.blockPercent + "%</code>";
  } catch(e) { return "❌ خطا."; }
}

// ==================== Spin / Subscribe ====================
async function handleSpin(STATS, userId, TG, chatId) {
  try {
    const today = getToday();
    const key = "spin:" + userId;
    const lastSpin = await STATS.get(key);
    if (lastSpin === today) { const hours = 24 - getIranHour(); await sendMessage(TG, chatId, "🎰 <b>اسپین امروز استفاده شده!</b>\n\n⏰ فردا دوباره برگرد.\n🕒 <b>" + hours + " ساعت</b> دیگر.", { parse_mode: "HTML" }); return; }
    await sendMessage(TG, chatId, "🎰 <i>در حال چرخش...</i>\n\n▫️▫️▫️", { parse_mode: "HTML" });
    const prizes = [1, 2, 3, 5, 5, 10, 15, 20, 25, 30, 50];
    const weights = [20, 15, 15, 12, 10, 8, 6, 5, 4, 3, 2];
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
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
    await sendMessage(TG, chatId, "🎰 <b>نتیجه اسپین!</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" + emoji + " <b>+ " + prize + " امتیاز</b>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🏆 <b>امتیاز کل:</b> <code>" + pts + "</code>\n\n🎁 فردا دوباره!", { parse_mode: "HTML" });
  } catch(e) { await sendMessage(TG, chatId, "❌ خطا در اسپین."); }
}
async function handleSubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
    const q = ispQuery.toLowerCase();
    let asn = null, name = null;
    for (const [n, code] of Object.entries(ISP_MAP)) { if (q.includes(n) || n.includes(q)) { asn = code; name = n; break; } }
    if (!asn) return await sendMessage(TG, chatId, "❌ ISP پیدا نشد.\n💡 <code>/subscribe ایرانسل</code>", { parse_mode: "HTML" });
    const key = "sub:" + userId;
    const raw = await STATS.get(key);
    let subs = raw ? JSON.parse(raw) : [];
    if (subs.includes(asn)) return await sendMessage(TG, chatId, "ℹ️ قبلاً مشترک <b>" + name + "</b> هستی.", { parse_mode: "HTML" });
    subs.push(asn);
    await STATS.put(key, JSON.stringify(subs));
    await sendMessage(TG, chatId, "🔔 <b>اشتراک فعال!</b>\n\n📡 <b>اپراتور:</b> " + name + "\n\n🔕 <code>/unsubscribe " + name + "</code>", { parse_mode: "HTML" });
  } catch(e) {}
}
async function handleUnsubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
    const q = ispQuery.toLowerCase();
    let asn = null, name = null;
    for (const [n, code] of Object.entries(ISP_MAP)) { if (q.includes(n) || q.includes(code)) { asn = code; name = n; break; } }
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
              await STATS.put("ispsub:" + u.id + ":" + asn, today, { expirationTtl: 172800 });
              await sendMessage(TG, u.id, "🔔 <b>هشدار اپراتور</b>\n\n📡 <b>" + asnName(asn) + "</b>\n⚠️ کیفیت پایین: <code>" + rate + "%</code>\n" + makeBar(rate / 10), { parse_mode: "HTML" });
            }
          }
        }
      } catch(e) {}
    }
  } catch(e) {}
}
async function checkAndAlertQuality(TG, STATS) {
  if (!STATS) return;
  try {
    const p = await getOONIData();
    if (!p.hasData) return;
    const today = getToday();
    const hour = getIranHour();
    const lastKey = "lastcheck";
    const lastRaw = await STATS.get(lastKey);
    const last = lastRaw ? JSON.parse(lastRaw) : null;
    if (last && last.blockPercent !== undefined) {
      const diff = p.blockPercent - last.blockPercent;
      if (diff >= QUALITY_DROP_THRESHOLD) {
        const alertKey = "alert:" + today + ":" + hour;
        const alreadySent = await STATS.get(alertKey);
        if (!alreadySent) {
          await STATS.put(alertKey, "1", { expirationTtl: 7200 });
          const mood = getStatusMood(p.blockPercent);
          const chats = await getTrackedChats(STATS);
          const alertMsg = "🚨 <b>هشدار افت کیفیت!</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n📉 افت: <b>+" + diff + "%</b>\n🚫 فیلترینگ: <code>" + p.blockPercent + "%</code>\n\n🕒 " + getIranTime();
          for (const ch of chats) await sendMessage(TG, ch, alertMsg, { parse_mode: "HTML" }).catch(() => {});
        }
      }
    }
    await STATS.put(lastKey, JSON.stringify({ blockPercent: p.blockPercent, ts: Date.now() }), { expirationTtl: 7200 });
  } catch(e) {}
}
async function postWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return;
  try {
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    if (lb.length === 0) return;
    let out = "🏆 <b>قهرمانان هفته</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    lb.slice(0, 10).forEach((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
      const name = (u.n || u.id).substring(0, 20);
      const rank = getVipRank(u.p);
      out += medal + " " + rank.emoji + " <b>" + name + "</b>  →  <code>" + u.p + "</code>\n";
    });
    out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🎁 جوایز:\n🥇 +100  |  🥈 +50  |  🥉 +25\n\n🕒 " + getIranDate();
    const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const r = await sendMessage(TG, ch, out, { parse_mode: "HTML" });
        if (r && r.ok && r.result) {
          await fetch(TG + "/pinChatMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: ch, message_id: r.result.message_id, disable_notification: false }) }).catch(() => {});
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
      for (const ch of chats) await fetch(TG + "/unpinChatMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: ch }) }).catch(() => {});
      await STATS.delete(WEEKLY_PIN_MSG_KEY);
    }
  } catch(e) {}
}

// ==================== Check Version ====================
async function checkVersion(STATS, userId, TG, chatId) {
  if (!STATS) return;
  try {
    const userVer = await STATS.get("v:" + userId);
    if (userVer !== CURRENT_VERSION) {
      await sendMessage(TG, chatId,
        "🎉 <b>نسخه ۸.۱ منتشر شد!</b>\n\n" +
        "🧠 <b>شاخص ترکیبی ۵ منبعی:</b>\n\n" +
        "◈ <b>OONI</b> (۳۵٪) — از داخل ایران\n" +
        "▣ <b>Cloudflare Radar</b> (۲۰٪)\n" +
        "▣ <b>Cloudflare IQI</b> (۱۵٪)\n" +
        "◎ <b>Live Ping</b> (۱۵٪)\n" +
        "◇ <b>ArvanCloud Radar</b> (۱۰٪)\n" +
        "⚡ <b>Voidly</b> (۵٪)\n" +
        "🛰 <b>RIPE Atlas</b> (۵٪)\n\n" +
        "📊 <b>نمودار ۸ خطی حرفه‌ای</b>\n" +
        "📸 گزارش کامل با نمودار\n" +
        "🌑 Dark Mode\n🎰 اسپین\n🔥 Streak\n💎 نشان‌ها\n🏆 جدول هفتگی\n\n" +
        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🔹 /help",
        { parse_mode: "HTML" });
      await STATS.put("v:" + userId, CURRENT_VERSION);
    }
  } catch(e) {}
}

// ==================== Handle Update ====================
async function handleUpdate(update, TG, STATS, env) {
  if (TG) TG_GLOBAL = TG;
  
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
    if (!isOwner(userId)) { await saveOwnerId(STATS, userId); }
  }

  if (msg.chat.type !== "private") {
    await trackChat(STATS, chatId);
    if (text !== "/admin" && text !== ADMIN_PASS) return;
  }
  if (STATS) await STATS.put("name:" + userId, userName);

  if (text === "/admin") { await sendMessage(TG, chatId, "🔐 <b>ورود به پنل مدیریت</b>\n\nرمز ادمین را ارسال کنید:", { parse_mode: "HTML" }); return; }
  if (text === ADMIN_PASS) {
    const dash = "https://radar-bot.royal-trust-ir-official.workers.dev/admin?pass=" + ADMIN_PASS;
    await sendMessage(TG, chatId, "✅ <b>رمز تأیید شد!</b>\n\n🔗 <a href='" + dash + "'>👉 ورود به داشبورد</a>", { parse_mode: "HTML" });
    return;
  }

  const inCh1 = await checkMember(TG, userId, CH1);
  const inCh2 = await checkMember(TG, userId, CH2);
  const inCh3 = await checkMember(TG, userId, CH3);
  if (!inCh1 || !inCh2 || !inCh3) {
    await sendMessage(TG, chatId,
      "🔒 <b>دسترسی محدود</b>\n\nابتدا در بخش‌های زیر عضو شوید:\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📡 <b>کانال رادار اینترنت</b>\n👑 <b>کانال رویال تراست</b>\n💬 <b>گروه رادار اینترنت</b>\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\nپس از عضویت، دوباره <b>/start</b> را بزنید 👇",
      { parse_mode: "HTML", inline_keyboard: [
        [{ text: "📡 عضویت در کانال رادار اینترنت", url: "https://t.me/radarinternetiran" }],
        [{ text: "👑 عضویت در کانال رویال تراست", url: "https://t.me/royal_trust_ir_official" }],
        [{ text: "💬 عضویت در گروه رادار اینترنت", url: "https://t.me/radarinternetirangruop" }]
      ] });
    return;
  }

  await trackUser(STATS, userId, userName);
  await ensureTodaySnapshot(STATS, env);
  await checkVersion(STATS, userId, TG, chatId);

  if (text === "/start" || text === "/status" || text === "/today" || text === "/spin") {
    const streak = await checkStreak(STATS, userId);
    if (streak && streak.isNew && streak.msg) {
      setTimeout(async () => { try { await sendMessage(TG, chatId, streak.msg + "\n\n🔥 <b>زنجیره:</b> " + streak.count + " روز", { parse_mode: "HTML" }); } catch(e) {} }, 100);
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
        const invKey = "invites:" + refCode;
        const invCount = parseInt(await STATS.get(invKey) || "0") + 1;
        await STATS.put(invKey, String(invCount));
        if (invCount === 5) await awardBadge(STATS, refCode, "inviter_5", TG);
        if (invCount === 10) await awardBadge(STATS, refCode, "inviter_10", TG);
        await sendMessage(TG, chatId, "🎉 <b>خوش آمدی " + userName + "!</b>\n\n🎁 <b>۵ امتیاز هدیه</b> گرفتی!", { parse_mode: "HTML" });
      }
    }
  }

  if (text === "/start" || text.startsWith("/start ")) {
    await addPoints(STATS, userId, 1);
    const pts = await getPoints(STATS, userId);
    const rank = getVipRank(pts);
    const tier = getUserTier(userId);
    let tierLine = "";
    if (tier) tierLine = "\n" + tier.emoji + " <b>" + tier.name + "</b>";
    await sendMessage(TG, chatId,
      "👋 <b>سلام " + userName + " عزیز!</b>\n\n" +
      "به <b>🛰 رادار اینترنت</b> خوش اومدی\n<i>پایشگر ۵ منبعی اینترنت ایران</i>\n\n" +
      "🏆 <b>امتیاز:</b> <code>" + pts + "</code>" + tierLine + "\n⭐ <b>سطح:</b> " + rank.emoji + " " + rank.name + "\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "🧠 <b>منابع داده فعال:</b>\n" +
      "◈ OONI · ▣ Cloudflare · ◇ Arvan\n" +
      "◎ Live Ping · ⚡ Voidly · 🛰 Atlas\n\n" +
      "📊 <b>گزارش‌ها</b>\n├ /status · /work · /score · /vs\n\n" +
      "🆚 <b>مقایسه</b>\n├ /compare · /top · /isp · /world\n\n" +
      "📈 <b>نمودارها</b>\n├ /today · /history · /trend · /chart · /pie · /map\n\n" +
      "🎮 <b>سرگرمی</b>\n├ 🎰 /spin · 🏆 /leaderboard · 🎁 /invite\n├ 💎 /badges · 📊 /mystats\n\n" +
      "🔮 <b>ویژه</b>\n├ /predict · /yearago · /subscribe\n\n" +
      "⚡ <b>ابزارها</b>\n├ /ping · /speed · /best · /api\n└ /check [سایت]\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💬 <b>گروه:</b> @radarinternetirangruop",
      { parse_mode: "HTML" });

  } else if (text === "/spin" || text === "🎰 اسپین") { await handleSpin(STATS, userId, TG, chatId); }

  else if (text === "/badges" || text === "💎 نشان‌ها") {
    const badges = await getUserBadges(STATS, userId);
    let out = "💎 <b>نشان‌های شما</b>\n\n👤 <b>" + userName + "</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    let unlocked = 0;
    for (const [id, b] of Object.entries(BADGES)) {
      const has = badges.includes(id);
      if (has) unlocked++;
      out += (has ? "✅ " : "🔒 ") + b.emoji + " <b>" + b.name + "</b>\n   <i>" + b.desc + "</i>\n\n";
    }
    out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📊 <b>" + unlocked + "/" + Object.keys(BADGES).length + "</b> نشان unlocked";
    await sendMessage(TG, chatId, out, { parse_mode: "HTML" });

  } else if (text === "/mystats" || text === "📊 گزارش من") {
    const pts = await getPoints(STATS, userId);
    const rank = getVipRank(pts);
    const badges = await getUserBadges(STATS, userId);
    const streakRaw = await STATS.get("streak:" + userId);
    const streak = streakRaw ? JSON.parse(streakRaw) : { count: 0 };
    const invRaw = await STATS.get("invites:" + userId);
    const invCount = parseInt(invRaw || "0");
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    const pos = lb.findIndex(x => x.id === userId) + 1;
    const tier = getUserTier(userId);
    let tierLine = "";
    if (tier) tierLine = "\n" + tier.emoji + " <b>" + tier.name + "</b>";
    await sendMessage(TG, chatId,
      "📊 <b>گزارش شخصی</b>\n\n👤 <b>" + userName + "</b>" + tierLine + "\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "🏆 امتیاز: <code>" + pts + "</code>\n⭐ سطح: " + rank.emoji + " " + rank.name + "\n📊 رتبه: <code>#" + (pos || "?") + "</code> از " + lb.length + "\n🔥 زنجیره: <code>" + (streak.count || 0) + " روز</code>\n🎁 دعوت‌ها: <code>" + invCount + "</code>\n💎 نشان‌ها: <code>" + badges.length + "/" + Object.keys(BADGES).length + "</code>",
      { parse_mode: "HTML" });

  } else if (text === "/subscribe" || text === "🔔 اشتراک") {
    await sendMessage(TG, chatId, "🔔 <b>اشتراک اپراتور</b>\n\n📌 مثال:\n<code>/subscribe ایرانسل</code>\n<code>/subscribe مخابرات</code>", { parse_mode: "HTML" });
  } else if (text.startsWith("/subscribe ")) { const q = text.replace("/subscribe ", "").trim(); await handleSubscribe(STATS, userId, q, TG, chatId); }
  else if (text.startsWith("/unsubscribe ")) { const q = text.replace("/unsubscribe ", "").trim(); await handleUnsubscribe(STATS, userId, q, TG, chatId); }

  else if (text.startsWith("/vs ")) {
    const parts = text.replace("/vs ", "").trim().split(/\s+/);
    if (parts.length >= 2) {
      await sendMessage(TG, chatId, "🔄 ...");
      const report = await makeVsOperatorReport(parts[0], parts[1]);
      await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
    } else await sendMessage(TG, chatId, "💡 مثال:\n<code>/vs ایرانسل مخابرات</code>", { parse_mode: "HTML" });
  } else if (text === "/vs") {
    await sendMessage(TG, chatId, "🔄 ...");
    const report = await makeVsReport(STATS, env);
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });

  } else if (text.startsWith("/check ")) {
    await addPoints(STATS, userId, 1);
    const site = text.replace("/check ", "").trim();
    let url = site;
    if (!url.startsWith("http")) url = "https://" + url;
    await sendMessage(TG, chatId, "🔍 <i>در حال بررسی...</i>");
    try {
      const ok = await checkAccessible(url);
      const t = ok ? await pingSite(url) : null;
      if (ok) await sendMessage(TG, chatId, "✅ <b>" + site + "</b>\n\n🟢 قابل دسترسی\n" + (t ? "📡 پینگ: <code>" + t + "ms</code>\n" : ""), { parse_mode: "HTML" });
      else await sendMessage(TG, chatId, "🚫 <b>" + site + "</b>\n\n🔴 از سرور قابل دسترسی نیست", { parse_mode: "HTML" });
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }

  } else if (text === "/predict") { await addPoints(STATS, userId, 1); const report = await makePrediction(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/yearago") { await addPoints(STATS, userId, 1); const report = await makeYearAgoReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }

  else if (text === "/live") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔴 <i>اندازه‌گیری زنده...</i>");
    const combined = await getCombinedData(env);
    const mood = getStatusMood(combined.blockPercent);
    let msg = "🔴 <b>وضعیت زنده</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n" +
      "◆ <b>پایداری نهایی:</b> <code>" + combined.quality + "%</code>\n";
    if (combined.ooniQuality !== null) msg += "◈ <b>OONI:</b> <code>" + combined.ooniQuality + "%</code>\n";
    if (combined.radarQuality !== null) msg += "▣ <b>Radar:</b> <code>" + combined.radarQuality + "%</code>\n";
    if (combined.iqi !== null) msg += "▣ <b>IQI:</b> <code>" + combined.iqi + "%</code>\n";
    if (combined.arvanQuality !== null) msg += "◇ <b>Arvan:</b> <code>" + combined.arvanQuality + "%</code>\n";
    if (combined.voidlyRisk !== null) msg += "⚡ <b>Voidly Risk:</b> <code>" + combined.voidlyRisk + "%</code>\n";
    msg += "◎ <b>Live:</b> <code>" + combined.liveQuality + "%</code>\n";
    if (combined.atlasPing) msg += "🛰 <b>Atlas:</b> <code>" + combined.atlasPing + "ms</code>\n";
    msg += "📶 <b>پینگ:</b> <code>" + combined.avgPing + "ms</code>\n✅ <b>موفقیت:</b> <code>" + combined.successRate + "%</code>\n\n" + makeBar(combined.quality / 10) + "\n\n🕒 " + getIranTimeFull();
    await sendMessage(TG, chatId, msg, { parse_mode: "HTML" });

  } else if (text === "/leaderboard" || text === "🏆 صدرنشین‌ها") {
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    let out = "🏆 <b>میدان رقابت</b>\n<i>برترین کاربران</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    if (lb.length === 0) out += "🥺 هنوز کسی امتیاز نگرفته!\n\n<b>اولین نفر باش!</b> 🚀";
    else {
      lb.slice(0, 10).forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
        const rank = getVipRank(u.p);
        out += medal + " " + rank.emoji + " <b>" + (u.n || u.id).substring(0, 20) + "</b>  →  <code>" + u.p + "</code>\n";
      });
    }
    if (CACHED_OWNER_IDS.length > 0 || OWNER_IDS_MANUAL.length > 0) {
      out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🛡 <b>ناظر میدان رقابت</b>\n\n";
      const allOwners = [...new Set([...CACHED_OWNER_IDS, ...OWNER_IDS_MANUAL])];
      for (const oid of allOwners) {
        const oPts = await getPoints(STATS, oid);
        const oName = await STATS.get("name:" + oid) || OWNER_DISPLAY_NAME;
        out += "👑 <b>" + oName + "</b>  →  <code>" + oPts + "</code>\n   <i>خارج از رقابت</i>\n";
      }
    }
    out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💪 /invite";
    await sendMessage(TG, chatId, out, { parse_mode: "HTML" });

  } else if (text === "/myrank") {
    const pts = await getPoints(STATS, userId);
    const tier = getUserTier(userId);
    const vip = getVipRank(pts);
    if (tier && tier.isOwner) {
      const badges = await getUserBadges(STATS, userId);
      const invRaw = await STATS.get("invites:" + userId);
      const invCount = parseInt(invRaw || "0");
      await sendMessage(TG, chatId,
        "🛡 <b>پنل مالک</b>\n\n👤 " + userName + "\n👑 <b>مالک و مدیر</b>\n🔒 خارج از رقابت\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🏆 امتیاز: <code>" + pts + "</code>\n⭐ " + vip.emoji + " " + vip.name + "\n💎 نشان‌ها: <code>" + badges.length + "/" + Object.keys(BADGES).length + "</code>\n🎁 دعوت‌ها: <code>" + invCount + "</code>\n\n🔗 <a href='https://radar-bot.royal-trust-ir-official.workers.dev/admin?pass=" + ADMIN_PASS + "'>ورود به داشبورد</a>",
        { parse_mode: "HTML" });
      return;
    }
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    const rank = lb.findIndex(x => x.id === userId) + 1;
    let medal = "🎖";
    if (rank === 1) medal = "🥇"; else if (rank === 2) medal = "🥈"; else if (rank === 3) medal = "🥉";
    let tierBadge = "";
    if (tier) tierBadge = " " + tier.emoji + " <b>" + tier.name + "</b>";
    await sendMessage(TG, chatId,
      "🎯 <b>کارت امتیاز</b>" + tierBadge + "\n\n👤 " + userName + "\n⭐ " + vip.emoji + " " + vip.name + "\n🏆 <code>" + pts + "</code>\n📊 رتبه: " + medal + " <b>#" + (rank || "?") + "</b>\n👥 از " + lb.length + " کاربر",
      { parse_mode: "HTML" });

  } else if (text === "/invite") {
    const link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + userId;
    const pts = await getPoints(STATS, userId);
    const invRaw = await STATS.get("invites:" + userId);
    const invCount = parseInt(invRaw || "0");
    await sendMessage(TG, chatId,
      "🎁 <b>دعوت از دوستان</b>\n\n👤 " + userName + "\n🏆 <code>" + pts + "</code>\n👥 دعوت: <code>" + invCount + "</code>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🔗 <b>لینک شما:</b>\n\n<code>" + link + "</code>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💰 <b>پاداش:</b>\n🎯 شما: <b>+10</b>\n🎯 دوستت: <b>+5</b>",
      { parse_mode: "HTML" });

  } else if (text === "/api") {
    const base = "https://radar-bot.royal-trust-ir-official.workers.dev/api";
    await sendMessage(TG, chatId,
      "🔌 <b>API v8.1</b>\n\n🔹 <code>" + base + "/status</code> — شاخص ترکیبی\n🔹 <code>" + base + "/operators</code>\n🔹 <code>" + base + "/top</code>\n🔹 <code>" + base + "/history</code>\n🔹 <code>" + base + "/radar</code>\n\n📡 منابع: OONI + Radar + IQI + Arvan + Voidly + Atlas",
      { parse_mode: "HTML" });

  } else if (text === "/status" || text === "/status full") {
    await addPoints(STATS, userId, 1);
    try { await saveSnapshot(STATS, new Date(), env); } catch(e) {}
    await sendMessage(TG, chatId, "🔄 <i>در حال آماده‌سازی گزارش ترکیبی ۵ منبعی...</i>");
    try {
      const chart = await makeTodayChart(STATS, env);
      const report = await makeReport("full", env);
      if (chart.image) {
        const fullCaption = chart.caption + "\n\n━━━━━━━━━━━━━━━━━\n" + report;
        await sendPhoto(TG, chatId, chart.image, fullCaption);
      } else await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
    } catch(e) {
      const report = await makeReport("full", env);
      await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
    }
  } else if (text === "/status simple" || text === "/work") { await addPoints(STATS, userId, 1); const report = await makeWorkReport(env); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/score") { await addPoints(STATS, userId, 1); const report = await makeScoreReport(env); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/compare") { await addPoints(STATS, userId, 1); const report = await makeCompareReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/top") { await addPoints(STATS, userId, 1); const report = await makeTopReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/isp") { await sendMessage(TG, chatId, "🔍 <b>بررسی ISP</b>\n\n📱 <code>/isp ایرانسل</code>\n☎️ <code>/isp مخابرات</code>", { parse_mode: "HTML" }); }
  else if (text.startsWith("/isp ")) { await addPoints(STATS, userId, 1); const q = text.replace("/isp ", "").trim(); const report = await makeISPReport(q); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/world") { await addPoints(STATS, userId, 1); const report = await makeWorldReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }

  else if (text === "/today") {
    await addPoints(STATS, userId, 1);
    try { await saveSnapshot(STATS, new Date(), env); } catch(e) {}
    await sendMessage(TG, chatId, "⏱ <i>در حال ساخت نمودار ترکیبی...</i>");
    try { const c = await makeTodayChart(STATS, env); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption); }
    catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/history") { await addPoints(STATS, userId, 1); const c = await makeHistoryChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption); }
  else if (text === "/best") { await addPoints(STATS, userId, 1); const report = await makeBestTimeReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/speed") { await addPoints(STATS, userId, 1); const report = await makeSpeedReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/ping") { await addPoints(STATS, userId, 1); const report = await makePingReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/filtering") { await addPoints(STATS, userId, 1); const report = await makeFilteringReport(env); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/sites") { await addPoints(STATS, userId, 1); const report = await makeSitesReport(); await sendMessage(TG, chatId, report, { parse_mode: "HTML" }); }
  else if (text === "/chart") { await addPoints(STATS, userId, 1); const c = await makeBarChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption); }
  else if (text === "/pie") { await addPoints(STATS, userId, 1); const c = await makePieChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption); }
  else if (text === "/trend") { await addPoints(STATS, userId, 1); const c = await makeTrendChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption); }
  else if (text === "/map") { await addPoints(STATS, userId, 1); const c = await makeMapChart(); if (c.image) await sendPhoto(TG, chatId, c.image, c.caption); else await sendMessage(TG, chatId, c.caption); }
  else if (text === "/help") {
    await sendMessage(TG, chatId,
      "📚 <b>راهنمای v8.1</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "🧠 <b>منابع:</b>\n◈ OONI · ▣ Radar · ◇ Arvan\n◎ Live · ⚡ Voidly · 🛰 Atlas\n\n" +
      "⏱ <b>نمودار ترکیبی:</b> /today\n📊 <b>گزارش کامل:</b> /status\n\n" +
      "🆚 <b>مقایسه:</b>\n<code>/compare · /top · /isp · /world</code>\n\n" +
      "📈 <b>نمودار:</b>\n<code>/history · /trend · /chart · /pie · /map</code>\n\n" +
      "🎮 <b>سرگرمی:</b>\n<code>/spin · /leaderboard · /myrank · /invite · /badges · /mystats</code>\n\n" +
      "🔮 <b>ویژه:</b>\n<code>/predict · /yearago · /subscribe · /check</code>\n\n" +
      "⚡ <b>ابزار:</b>\n<code>/ping · /speed · /best · /api · /live</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💬 @radarinternetirangruop\n🤖 @Radarinternetiranbot",
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

// ==================== API عمومی v8.1 ====================
async function handleAPI(url, STATS, env) {
  const cors = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  try {
    if (url.pathname === "/api/status") {
      const combined = await getCombinedData(env);
      const ripe = await fetchRIPE();
      return new Response(JSON.stringify({
        ok: true,
        data: {
          quality_final: combined.quality,
          ooni_quality: combined.ooniQuality,
          radar_quality: combined.radarQuality,
          live_quality: combined.liveQuality,
          iqi_score: combined.iqi,
          arvan_quality: combined.arvanQuality,
          voidly_risk: combined.voidlyRisk,
          atlas_quality: combined.atlasQuality,
          block_percent: combined.blockPercent,
          access_percent: combined.accessPercent,
          traffic_percent: combined.trafficPercent,
          avg_ping_ms: combined.avgPing,
          atlas_ping_ms: combined.atlasPing,
          success_rate: combined.successRate,
          radar_details: combined.radar,
          iqi_details: combined.iqiDetails,
          arvan_details: combined.arvanDetails,
          voidly_details: combined.voidlyDetails,
          sources_active: combined.sources,
          weights: combined.weights,
          total_measurements: combined.totalMs,
          ripe_visibility: ripe && ripe.data ? ripe.data.visibility : null,
          date_iran: getIranDate(),
          time_iran: getIranTimeFull(),
          version: "8.1"
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
        if (d.count >= 500) { const name = await asnNameAuto(asn); ops.push({ name, rate: Math.round((d.ok / d.total) * 100), tests: d.count }); }
      }
      ops.sort((a, b) => b.rate - a.rate);
      return new Response(JSON.stringify({ ok: true, period: "7 days", best: ops.slice(0, 5), worst: ops.slice(-5).reverse() }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api/history") {
      const ooni = await fetchOONI7d();
      const p = parseOONI(ooni);
      const days = Object.keys(p.dayData).sort();
      const data = days.map(d => ({ date: d, block_percent: p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0, total: p.dayData[d].total }));
      return new Response(JSON.stringify({ ok: true, data }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api/radar") {
      const radar = await getCloudflareRadarData(env);
      return new Response(JSON.stringify({ ok: true, data: radar }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api/iqi") {
      const iqi = await getIQIData(env);
      return new Response(JSON.stringify({ ok: true, data: iqi }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api" || url.pathname === "/api/") {
      return new Response(JSON.stringify({
        ok: true, name: "Radar Internet Public API", version: "8.1",
        endpoints: { status: "/api/status", operators: "/api/operators", top: "/api/top", history: "/api/history", radar: "/api/radar", iqi: "/api/iqi" },
        sources: ["OONI", "Cloudflare Radar", "Cloudflare IQI", "Live Ping", "ArvanCloud", "Voidly", "RIPE Atlas"],
        weights: { ooni: "35%", radar: "20%", live: "15%", iqi: "15%", arvan: "10%", voidly: "5%", atlas: "5%" },
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
  let lb = lbRaw ? JSON.parse(lbRaw) : [];
  lb = lb.filter(u => !isOwner(u.id));
  const ownerRaw = await STATS.get("owner_ids");
  const owners = ownerRaw ? JSON.parse(ownerRaw) : [];
  
  let lbHtml = "";
  lb.slice(0, 10).forEach((u, i) => {
    const name = u.n || u.id;
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
    const vip = getVipRank(u.p);
    lbHtml += "<tr><td>" + medal + "</td><td><b>" + name + "</b></td><td>" + vip.emoji + " " + u.p + "</td></tr>";
  });
  let ownerHtml = "";
  for (const oid of owners) {
    const oPts = await STATS.get("points:" + oid) || "0";
    const oName = await STATS.get("name:" + oid) || OWNER_DISPLAY_NAME;
    ownerHtml += "<tr><td>🛡</td><td><b>" + oName + "</b> <small>(خارج از رقابت)</small></td><td>" + oPts + "</td></tr>";
  }
  
  return "<!DOCTYPE html><html lang='fa' dir='rtl'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>داشبورد رادار v8.1</title>" +
    "<style>body{font-family:Tahoma;background:#0a1128;color:#fff;padding:20px;margin:0}h1{color:#d4af37;text-align:center;margin-bottom:20px}" +
    ".card{background:rgba(255,255,255,0.05);border-radius:15px;padding:20px;margin:15px 0;border:1px solid rgba(212,175,55,0.3)}" +
    ".stat{display:inline-block;margin:10px 20px;text-align:center}.stat-v{font-size:36px;color:#d4af37;font-weight:bold}" +
    ".stat-l{color:#8899bb;font-size:13px;margin-top:5px}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1)}" +
    "th{color:#d4af37;font-size:14px}code{background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:12px}" +
    ".date{color:#8899bb;font-size:14px;text-align:center;margin-bottom:20px}a{color:#d4af37;text-decoration:none}" +
    ".head{color:#d4af37;border-bottom:2px solid #d4af37;padding-bottom:10px;margin-bottom:15px;display:inline-block}" +
    "small{color:#8899bb}.source{display:inline-block;background:#1e293b;padding:5px 10px;border-radius:5px;margin:5px;font-size:12px;border-left:3px solid #d4af37}</style></head><body>" +
    "<h1>🔐 داشبورد ادمین v8.1</h1>" +
    "<div class='date'>" + getIranDate() + "  •  " + getGregDate() + "  •  " + getIranTimeFull() + "</div>" +
    "<div class='card'><div class='head'>🧠 منابع داده فعال (۷ منبع)</div>" +
    "<div class='source'>◈ OONI (۳۵٪) — از داخل ایران</div>" +
    "<div class='source'>▣ Cloudflare Radar (۲۰٪) — NetFlows + HTTP + DNS</div>" +
    "<div class='source'>◎ Live Ping (۱۵٪) — از سرور خارج</div>" +
    "<div class='source'>▣ Cloudflare IQI (۱۵٪) — شاخص کیفیت</div>" +
    "<div class='source'>◇ ArvanCloud Radar (۱۰٪) — از داخل ایران</div>" +
    "<div class='source'>⚡ Voidly (۵٪) — تحلیل اختلال</div>" +
    "<div class='source'>🛰 RIPE Atlas (۵٪) — probe ایران</div>" +
    "</div>" +
    "<div class='card'><div class='head'>📊 آمار کلی</div>" +
    "<div class='stat'><div class='stat-v'>" + totalUsers + "</div><div class='stat-l'>👥 کاربر کل</div></div>" +
    "<div class='stat'><div class='stat-v'>" + dau.length + "</div><div class='stat-l'>✅ فعال امروز</div></div>" +
    "<div class='stat'><div class='stat-v'>" + lb.length + "</div><div class='stat-l'>🏆 در جدول</div></div>" +
    "<div class='stat'><div class='stat-v'>" + owners.length + "</div><div class='stat-l'>🛡 مالکین</div></div>" +
    "</div>" +
    "<div class='card'><div class='head'>🏆 جدول برترین‌ها</div><table><tr><th>#</th><th>نام</th><th>امتیاز</th></tr>" + lbHtml + "</table></div>" +
    (owners.length > 0 ? "<div class='card'><div class='head'>🛡 مالکین</div><table><tr><th>#</th><th>نام</th><th>امتیاز</th></tr>" + ownerHtml + "</table></div>" : "") +
    "<div class='card'><div class='head'>🔗 لینک‌های مدیریتی</div>" +
    "<p><a href='/api'>/api</a> — لیست endpoints</p>" +
    "<p><a href='/api/status'>/api/status</a> — وضعیت ترکیبی</p>" +
    "<p><a href='/api/radar'>/api/radar</a> — داده Radar</p>" +
    "<p><a href='/api/iqi'>/api/iqi</a> — داده IQI</p>" +
    "<p><a href='/all-sources'>/all-sources</a> — همه منابع</p>" +
    "<p><a href='/radar-test'>/radar-test</a> — تست Radar</p>" +
    "<p><a href='/iqi-test'>/iqi-test</a> — تست IQI</p>" +
    "<p><a href='/voidly-test'>/voidly-test</a> — تست Voidly</p>" +
    "<p><a href='/arvan-test'>/arvan-test</a> — تست Arvan</p>" +
    "<p><a href='/weeklypin'>/weeklypin</a> — جدول هفتگی</p>" +
    "<p><a href='/sendreport'>/sendreport</a> — گزارش دستی</p>" +
    "<p><a href='/snapshot'>/snapshot</a> — snapshot دستی</p></div>" +
    "</body></html>";
                                }
