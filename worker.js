// ============================================
// 🛰 Radar Internet Bot v9.0
// پایشگر چندمنبعی اینترنت ایران
// ============================================

const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const CH3 = "@radarinternetirangruop";
const ADMIN_PASS = "mohmedkord1388";
const BOT_USERNAME = "Radarinternetiranbot";
const CURRENT_VERSION = "9.0";
const WEEKLY_PIN_MSG_KEY = "weekly_pin_msg_id";

// ====== تنظیمات ======
const SNAPSHOT_INTERVAL_MIN = 15; // هر ۱۵ دقیقه
const CHART_POINTS = 16;          // ۱۶ نقطه اخیر = ۴ ساعت
const ALERT_THRESHOLD = 70;       // آستانه هشدار فیلترینگ
const QUALITY_DROP_THRESHOLD = 30; // افت شدید

// ====== توکن‌ها (در Private Repo یا Cloudflare Secret) ======
const BOT_TOKEN_FALLBACK = "";
const RADAR_TOKEN_FALLBACK = "";

// ====== مالکین ======
const OWNER_USERNAMES = ["Havsharim"];
const OWNER_IDS_MANUAL = [];
let CACHED_OWNER_IDS = [];
const OWNER_DISPLAY_NAME = "مدیر ربات";
const PREMIUM_USERS = [];

let GLOBAL_STATS = null;
let TG_GLOBAL = null;

// ====== نقشه ASN ======
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

// ====== نشان‌ها ======
const BADGES = {
  first_leader: { emoji: "🥇", name: "صدرنشین", desc: "یک بار اول جدول شدن" },
  streak_7: { emoji: "🔥", name: "شعله", desc: "۷ روز متوالی فعال" },
  streak_30: { emoji: "💎", name: "الماس", desc: "۳۰ روز متوالی فعال" },
  points_100: { emoji: "⭐", name: "ستاره", desc: "۱۰۰ امتیاز" },
  points_500: { emoji: "🌟", name: "ستاره درخشان", desc: "۵۰۰ امتیاز" },
  points_1000: { emoji: "💫", name: "کهکشان", desc: "۱۰۰۰ امتیاز" },
  inviter_5: { emoji: "🎁", name: "سخاوتمند", desc: "دعوت ۵ دوست" },
  inviter_10: { emoji: "👑", name: "پادشاه دعوت", desc: "دعوت ۱۰ دوست" },
  spin_lucky: { emoji: "🎰", name: "خوش‌شانس", desc: "بردن ۵۰ امتیاز در اسپین" }
};

// ====== سایت‌های تست ======
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

// ============================================
// 🚀 Worker Entry Point
// ============================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const BOT_TOKEN = env.BOT_TOKEN || BOT_TOKEN_FALLBACK;
    const STATS = env.STATS;
    GLOBAL_STATS = STATS;
    if (BOT_TOKEN) TG_GLOBAL = "https://api.telegram.org/bot" + BOT_TOKEN;

    if (url.pathname === "/test") return new Response("Radar v9.0 OK");
    if (!BOT_TOKEN) return new Response("ERROR: BOT_TOKEN not set!", { status: 500 });
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;
    await loadOwnerIds(STATS);

    if (url.pathname.startsWith("/api")) return await handleAPI(url, STATS, env);

    // ====== Admin Dashboard ======
    if (url.pathname === "/admin") {
      const pass = url.searchParams.get("pass");
      if (pass !== ADMIN_PASS) return new Response("⛔ دسترسی غیرمجاز", { status: 401 });
      const html = await makeAdminDashboard(STATS);
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // ====== Webhook Management ======
    if (url.pathname === "/setwebhook") {
      const r = await fetch(TG + "/setWebhook?url=" + url.origin + "/");
      return new Response("Result: " + await r.text());
    }
    if (url.pathname === "/webhookinfo") {
      const r = await fetch(TG + "/getWebhookInfo");
      return new Response(await r.text());
    }

    // ====== Manual Triggers ======
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

    // ====== Diagnostic Endpoints ======
    if (url.pathname === "/snapshot") {
      await saveSnapshot(STATS, new Date(), env);
      const combined = await getCombinedData(env);
      return new Response(JSON.stringify({
        quality: combined.quality,
        ooniQuality: combined.ooniQuality,
        liveQuality: combined.liveQuality,
        radarQuality: combined.radarQuality,
        iqi: combined.iqi,
        trafficPercent: combined.trafficPercent,
        activeSources: combined.activeSources
      }, null, 2));
    }
    if (url.pathname === "/sources-status") {
      const combined = await getCombinedData(env);
      return new Response(JSON.stringify({
        active: combined.activeSources,
        sources: combined.sources,
        weights: combined.weights,
        timestamp: combined.timestamp
      }, null, 2));
    }
    if (url.pathname === "/radar-test") {
      const data = await fetchCloudflareRadar(env);
      return new Response(JSON.stringify(data, null, 2));
    }
    if (url.pathname === "/iqi-test") {
      const data = await fetchCloudflareIQI(env);
      return new Response(JSON.stringify(data, null, 2));
    }

    if (request.method !== "POST") return new Response("Radar Bot v9.0 running!");
    try {
      const update = await request.json();
      await handleUpdate(update, TG, STATS, env);
    } catch(e) { console.log("Update error: " + e.message); }
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

    // هر ۱۵ دقیقه: ذخیره snapshot
    await saveSnapshot(env.STATS, scheduledTime, env);

    // هر ساعت: کارهای دوره‌ای
    if (iranMinute === 0) {
      await checkAndAlertQuality(TG, env.STATS);
      await checkISPSubscriptions(TG, env.STATS);
      await saveDailySnapshot(env.STATS, env);
      await sendOrUpdateChannelStatus(TG, env.STATS, env);
    }
  }
};

// ============================================
// 📅 تاریخ و زمان
// ============================================
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
function getIranMinute() {
  return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', minute: '2-digit' }).format(new Date()));
}
function getIranHourFrom(date) {
  return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false }).format(date));
}
function getIranMinuteFrom(date) {
  return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', minute: '2-digit' }).format(date));
}
function getIranTimeFull() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
}

// ============================================
// 🕐 Snapshot Key Management
// ============================================
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
    keys.push({
      key: getSnapshotKey(t),
      label: getSnapshotLabel(t),
      timestamp: t.getTime()
    });
  }
  return keys;
}

// ============================================
// 🔤 ASN Helper
// ============================================
function asnName(asn) {
  const c = String(asn).replace(/^AS/i, "");
  return ASN_NAMES[c] || ("AS" + c);
}
async function asnNameAuto(asn) {
  const clean = String(asn).replace(/^AS/i, "");
  if (ASN_NAMES[clean]) return ASN_NAMES[clean];
  if (GLOBAL_STATS) {
    try {
      const cached = await GLOBAL_STATS.get("asnname:" + clean);
      if (cached) return cached;
    } catch(e) {}
  }
  try {
    const r = await fetch("https://api.bgpview.io/asn/" + clean);
    if (r.ok) {
      const d = await r.json();
      if (d.status === "ok" && d.data && d.data.name) {
        let name = d.data.name.trim();
        if (name.length > 22) name = name.substring(0, 22) + "…";
        if (name.length >= 2 && !/^\d+$/.test(name)) {
          if (GLOBAL_STATS) {
            try { await GLOBAL_STATS.put("asnname:" + clean, name, { expirationTtl: 2592000 }); } catch(e) {}
          }
          return name;
        }
      }
    }
  } catch(e) {}
  return "AS" + clean;
}

// ============================================
// 🎨 Progress Bar
// ============================================
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

// ============================================
// 📡 Network Helpers
// ============================================
async function pingSite(url, timeoutMs) {
  const t = timeoutMs || 8000;
  const s = Date.now();
  try {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), t);
    await fetch(url, { method: "HEAD", signal: c.signal, redirect: "follow" });
    clearTimeout(timer);
    return Date.now() - s;
  } catch(e) { return null; }
}

async function checkAccessible(url, timeoutMs) {
  const t = timeoutMs || 8000;
  try {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), t);
    const r = await fetch(url, { method: "HEAD", signal: c.signal, redirect: "follow" });
    clearTimeout(timer);
    return r.ok || r.status < 400;
  } catch(e) { return false; }
}

async function getChartImage(config) {
  try {
    const r = await fetch("https://quickchart.io/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart: config, width: 900, height: 500, backgroundColor: "#ffffff", format: "png" })
    });
    if (r.ok) return new Uint8Array(await r.arrayBuffer());
  } catch(e) { console.log("getChartImage error: " + e.message); }
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
  } catch(e) { console.log("getChartImageDark error: " + e.message); }
  return null;
}

// ============================================
// 🌐 منبع ۱: Cloudflare Radar (NetFlows + HTTP + DNS)
// ============================================
async function fetchCloudflareRadar(env) {
  const token = (env && env.RADAR_TOKEN) || RADAR_TOKEN_FALLBACK;
  if (!token) {
    console.log("Radar: No token provided");
    return null;
  }

  try {
    const headers = { "Authorization": "Bearer " + token };

    const [netflowsRes, httpRes, dnsRes] = await Promise.all([
      fetch("https://api.cloudflare.com/client/v4/radar/netflows/timeseries?name=ir_nf&location=IR&dateRange=1d&aggInterval=15m", { headers }).catch(() => null),
      fetch("https://api.cloudflare.com/client/v4/radar/http/timeseries?name=ir_http&location=IR&dateRange=1d&aggInterval=1h", { headers }).catch(() => null),
      fetch("https://api.cloudflare.com/client/v4/radar/dns/timeseries?name=ir_dns&location=IR&dateRange=1d&aggInterval=15m", { headers }).catch(() => null)
    ]);

    const result = { netflows: null, http: null, dns: null, trafficPercent: null, hasData: false };

    if (netflowsRes && netflowsRes.ok) {
      const d = await netflowsRes.json();
      if (d.success && d.result && d.result.ir_nf && d.result.ir_nf.values && d.result.ir_nf.values.length > 0) {
        const v = d.result.ir_nf.values;
        const lastVal = parseFloat(v[v.length - 1]);
        if (!isNaN(lastVal)) {
          result.netflows = Math.round(lastVal * 100);
          result.trafficPercent = result.netflows;
          result.hasData = true;
        }
      }
    }

    if (httpRes && httpRes.ok) {
      const d = await httpRes.json();
      if (d.success && d.result && d.result.ir_http && d.result.ir_http.values && d.result.ir_http.values.length > 0) {
        const v = d.result.ir_http.values;
        const lastVal = parseFloat(v[v.length - 1]);
        if (!isNaN(lastVal)) result.http = Math.round(lastVal * 100);
      }
    }

    if (dnsRes && dnsRes.ok) {
      const d = await dnsRes.json();
      if (d.success && d.result && d.result.ir_dns && d.result.ir_dns.values && d.result.ir_dns.values.length > 0) {
        const v = d.result.ir_dns.values;
        const lastVal = parseFloat(v[v.length - 1]);
        if (!isNaN(lastVal)) result.dns = Math.round(lastVal * 100);
      }
    }

    return result.hasData ? result : null;
  } catch(e) {
    console.log("Cloudflare Radar error: " + e.message);
    return null;
  }
}

// ============================================
// 📊 منبع ۲: Cloudflare IQI (Internet Quality Index)
// ============================================
async function fetchCloudflareIQI(env) {
  const token = (env && env.RADAR_TOKEN) || RADAR_TOKEN_FALLBACK;
  if (!token) return null;

  try {
    const r = await fetch(
      "https://api.cloudflare.com/client/v4/radar/quality/iqi?location=IR&dateRange=1d&format=json",
      { headers: { "Authorization": "Bearer " + token } }
    );

    if (!r.ok) {
      console.log("IQI HTTP error: " + r.status);
      return null;
    }

    const d = await r.json();

    // ساختار پاسخ IQI می‌تواند مختلف باشد، هر دو حالت رو چک می‌کنیم
    let iqiRaw = null;
    if (d.success && d.result) {
      if (typeof d.result.iqi === "number") {
        iqiRaw = d.result.iqi;
      } else if (d.result.summary && typeof d.result.summary.iqi === "number") {
        iqiRaw = d.result.summary.iqi;
      } else if (d.result.values && d.result.values.length > 0) {
        const lastVal = parseFloat(d.result.values[d.result.values.length - 1]);
        if (!isNaN(lastVal)) iqiRaw = lastVal;
      }
    }

    if (iqiRaw === null) {
      console.log("IQI: Could not parse response: " + JSON.stringify(d).substring(0, 200));
      return null;
    }

    // IQI معمولاً بین ۰ تا ۵ هست، تبدیل به ۰-۱۰۰
    const iqiScore = Math.round(Math.min(100, (iqiRaw / 5) * 100));

    return {
      iqi: iqiRaw,
      iqiScore: iqiScore,
      source: "Cloudflare IQI"
    };
  } catch(e) {
    console.log("Cloudflare IQI error: " + e.message);
    return null;
  }
}

// ============================================
// 📊 منبع ۳: OONI (فیلترینگ از داخل ایران)
// ============================================
async function fetchOONI() {
  try {
    const until = getToday();
    const since = getYesterday();
    const r = await fetch(
      "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day",
      { headers: { "Accept": "application/json" } }
    );
    if (r.ok) return await r.json();
  } catch(e) { console.log("OONI error: " + e.message); }
  return null;
}

async function fetchOONI7d() {
  try {
    const until = getToday();
    const since = new Date(Date.now() - 604800000).toISOString().split("T")[0];
    const r = await fetch(
      "https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day",
      { headers: { "Accept": "application/json" } }
    );
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
      if (r.ok) {
        const d = await r.json();
        if (d && d.data) return d;
      }
    } catch(e) {}
  }
  return null;
}

function parseOONI(ooni) {
  let totalMs = 0, blockedMs = 0;
  let asnData = {}, dayData = {};

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
  return {
    blockPercent: blockPercent,
    accessPercent: 100 - blockPercent,
    totalMs: totalMs,
    blockedMs: blockedMs,
    hasData: hasData,
    asnData: asnData,
    dayData: dayData
  };
}

async function getOONIData() {
  let ooni = await fetchOONI();
  let p = parseOONI(ooni);
  if (p.hasData) return p;
  ooni = await fetchOONI7d();
  p = parseOONI(ooni);
  return p;
}

// ============================================
// 📡 منبع ۴: Live Ping (از سرور خارج)
// ============================================
async function measureLivePing() {
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

  const results = await Promise.all(targets.map(async (t) => {
    const start = Date.now();
    try {
      const c = new AbortController();
      const timer = setTimeout(() => c.abort(), 5000);
      const r = await fetch(t.url, { method: "HEAD", signal: c.signal, redirect: "follow" });
      clearTimeout(timer);
      const ping = Date.now() - start;
      if (r.ok || r.status < 400) return { name: t.name, ping: ping, ok: true };
      return { name: t.name, ping: null, ok: false };
    } catch(e) {
      return { name: t.name, ping: null, ok: false };
    }
  }));

  for (const r of results) {
    if (r.ok && r.ping !== null) { successCount++; totalPing += r.ping; }
    else { failCount++; }
  }

  const totalCount = targets.length;
  const avgPing = successCount > 0 ? Math.round(totalPing / successCount) : 999;
  const successRate = Math.round((successCount / totalCount) * 100);
  const pingScore = Math.max(0, 100 - (avgPing / 5));
  const lossScore = Math.max(0, 100 - (failCount * 15));
  const liveQuality = Math.round((pingScore * 0.6) + (lossScore * 0.4));

  return {
    quality: Math.max(0, Math.min(100, liveQuality)),
    avgPing: avgPing,
    successCount: successCount,
    failCount: failCount,
    totalCount: totalCount,
    successRate: successRate
  };
}

// ============================================
// 🧠 شاخص ترکیبی (Smart Weighted Average)
// ============================================
async function getCombinedData(env) {
  // دریافت همه منابع به صورت موازی
  const [ooniData, radarData, iqiData, liveData] = await Promise.all([
    getOONIData(),
    fetchCloudflareRadar(env),
    fetchCloudflareIQI(env),
    measureLivePing()
  ]);

  const ooniQuality = ooniData.hasData ? ooniData.accessPercent : null;

  // ====== تعیین وزن‌ها فقط برای منابع فعال ======
  const weights = { ooni: 0, radar: 0, iqi: 0, live: 0 };
  const values = { ooni: 0, radar: 0, iqi: 0, live: 0 };

  // وزن‌های پایه
  const BASE_WEIGHTS = { ooni: 40, radar: 25, iqi: 15, live: 20 };

  if (ooniQuality !== null) {
    weights.ooni = BASE_WEIGHTS.ooni;
    values.ooni = ooniQuality;
  }
  if (radarData && radarData.trafficPercent !== null) {
    weights.radar = BASE_WEIGHTS.radar;
    values.radar = radarData.trafficPercent;
  }
  if (iqiData && iqiData.iqiScore !== undefined) {
    weights.iqi = BASE_WEIGHTS.iqi;
    values.iqi = iqiData.iqiScore;
  }
  // Live Ping همیشه فعاله
  weights.live = BASE_WEIGHTS.live;
  values.live = liveData.quality;

  // ====== محاسبه شاخص نهایی ======
  const totalWeight = weights.ooni + weights.radar + weights.iqi + weights.live;
  let quality = 0;
  if (totalWeight > 0) {
    quality = Math.round(
      (values.ooni * weights.ooni +
       values.radar * weights.radar +
       values.iqi * weights.iqi +
       values.live * weights.live) / totalWeight
    );
  }
  const safeQuality = Math.max(0, Math.min(100, quality));

  // ====== تعیین ترافیک ======
  let trafficPercent;
  if (radarData && radarData.trafficPercent !== null) {
    trafficPercent = radarData.trafficPercent;
  } else {
    // فرمول جایگزین بر اساس پینگ
    const pingTraffic = Math.max(0, Math.min(100, 100 - (liveData.avgPing / 3)));
    const lossTraffic = Math.max(0, 100 - (liveData.failCount * 10));
    trafficPercent = Math.round((pingTraffic * 0.6) + (lossTraffic * 0.4));
  }

  // ====== لیست منابع فعال ======
  const activeSources = [];
  if (weights.ooni > 0) activeSources.push("ooni");
  if (weights.radar > 0) activeSources.push("radar");
  if (weights.iqi > 0) activeSources.push("iqi");
  if (weights.live > 0) activeSources.push("live");

  return {
    // شاخص‌ها
    quality: safeQuality,
    blockPercent: 100 - safeQuality,
    accessPercent: safeQuality,
    trafficPercent: trafficPercent,

    // مقادیر خام منابع
    ooniQuality: ooniQuality,
    radarQuality: radarData ? radarData.trafficPercent : null,
    iqi: iqiData ? iqiData.iqiScore : null,
    liveQuality: liveData.quality,
    avgPing: liveData.avgPing,
    successRate: liveData.successRate,
    successCount: liveData.successCount,
    failCount: liveData.failCount,
    totalCount: liveData.totalCount,

    // جزئیات
    radarDetails: radarData,
    iqiDetails: iqiData,

    // فرا داده
    totalMs: ooniData.totalMs,
    asnData: ooniData.asnData || {},
    weights: weights,
    activeSources: activeSources,
    sources: {
      ooni: weights.ooni > 0,
      radar: weights.radar > 0,
      iqi: weights.iqi > 0,
      live: weights.live > 0
    },
    hasData: true,
    timestamp: Date.now()
  };
}

// ============================================
// 💾 Snapshot Management
// ============================================
async function saveSnapshot(STATS, captureDate, env) {
  if (!STATS) return;
  try {
    const key = getSnapshotKey(captureDate);
    const existing = await STATS.get(key);
    if (existing) {
      console.log("Snapshot exists: " + key);
      return;
    }

    const combined = await getCombinedData(env);

    const snapshot = {
      timestamp: captureDate.getTime(),
      time: getSnapshotLabel(captureDate),
      quality: combined.quality,
      ooniQuality: combined.ooniQuality,
      liveQuality: combined.liveQuality,
      radarQuality: combined.radarQuality,
      iqi: combined.iqi,
      blockPercent: combined.blockPercent,
      accessPercent: combined.accessPercent,
      avgPing: combined.avgPing,
      successRate: combined.successRate,
      trafficPercent: combined.trafficPercent,
      activeSources: combined.activeSources,
      saved: new Date().toISOString()
    };

    await STATS.put(key, JSON.stringify(snapshot), { expirationTtl: 604800 });
    console.log("Snapshot saved: " + key + " | Q=" + combined.quality + "% | Sources: " + combined.activeSources.join(","));
  } catch(e) {
    console.log("saveSnapshot error: " + e.message);
  }
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
    else result.push({
      label: keys[i].label,
      key: keys[i].key,
      quality: null,
      blockPercent: null,
      avgPing: null,
      trafficPercent: null
    });
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
      avgPing: combined.avgPing,
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
    const exists = await STATS.get("snap:" + today);
    if (!exists) {
      const combined = await getCombinedData(env);
      await STATS.put("snap:" + today, JSON.stringify({
        blockPercent: combined.blockPercent,
        accessPercent: combined.accessPercent,
        quality: combined.quality,
        totalMs: 0,
        hasData: true,
        saved: new Date().toISOString()
      }), { expirationTtl: 2592000 });
    }
  } catch(e) {}
}

async function getDailySnapshot(STATS, date) {
  try {
    const d = await STATS.get("snap:" + date);
    return d ? JSON.parse(d) : null;
  } catch(e) { return null; }
}

// ============================================
// 👑 Owner Detection
// ============================================
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
    console.log("Owner saved: " + uid);
  } catch(e) {}
}

function getUserTier(userId) {
  const uid = String(userId);
  if (isOwner(uid)) return { emoji: "🛡", name: "مالک", color: "#d4af37", isOwner: true };
  if (PREMIUM_USERS.includes(uid)) return { emoji: "💎", name: "Premium", color: "#a855f7", isOwner: false };
  return null;
}

// ============================================
// 😊 Status Mood
// ============================================
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

// ============================================
// 📤 Send Functions
// ============================================
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
  } catch(e) {
    return { ok: false, error: e.message };
  }
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

// ============================================
// 💬 Chat Tracking
// ============================================
async function trackChat(STATS, chatId) {
  if (!STATS || chatId >= 0) return;
  try {
    const key = "bot_chats";
    const raw = await STATS.get(key);
    let list = raw ? JSON.parse(raw) : [];
    if (!list.includes(chatId)) {
      list.push(chatId);
      await STATS.put(key, JSON.stringify(list));
      console.log("New chat tracked: " + chatId);
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

// ============================================
// 🎮 Gamification
// ============================================
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
    return { count: streak.count, isNew: true, bonus: bonus, msg: msg };
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
        b.emoji + " <b>" + b.name + "</b>\n<i>" + b.desc + "</i>\n\n📊 /badges",
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
  try {
    const r = await STATS.get("ref:" + userId);
    return r || null;
  } catch(e) { return null; }
               }
// ============================================
// 🎨 نمودار اصلی (داده واقعی بدون نویز)
// ============================================
async function makeTodayChart(STATS, env, combinedInput) {
  const combined = combinedInput || await getCombinedData(env);
  const snapshots = await getSnapshots(STATS, CHART_POINTS);

  const labels = [];
  const healthData = [];
  const disruptionData = [];
  const trafficData = [];
  const ooniData = [];
  const liveData = [];

  for (const s of snapshots) {
    labels.push(s.label);
    if (s.quality !== null && s.quality !== undefined) {
      healthData.push(s.quality);
      disruptionData.push(s.blockPercent !== null && s.blockPercent !== undefined ? s.blockPercent : (100 - s.quality));
      trafficData.push(s.trafficPercent !== null && s.trafficPercent !== undefined ? s.trafficPercent : null);
      ooniData.push(s.ooniQuality !== null && s.ooniQuality !== undefined ? s.ooniQuality : null);
      liveData.push(s.liveQuality !== null && s.liveQuality !== undefined ? s.liveQuality : null);
    } else {
      healthData.push(null);
      disruptionData.push(null);
      trafficData.push(null);
      ooniData.push(null);
      liveData.push(null);
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

  const sourceIcons = {
    ooni: "◈ OONI",
    radar: "▣ Radar",
    iqi: "▣ IQI",
    live: "◎ Live"
  };
  let activeSources = combined.activeSources.map(s => sourceIcons[s] || s);

  let captionText = "📊 <b>تحلیل ترکیبی اینترنت</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🕒 <b>بازه:</b> " + startTime + " تا " + endTime + "\n" +
    "📡 <b>وضعیت:</b> " + mood.emoji + " <b>" + mood.label + "</b>\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "◆ <b>شاخص نهایی:</b> <code>" + combined.quality + "%</code>\n" +
    (combined.ooniQuality !== null ? "◈ <b>OONI (ایران):</b> <code>" + combined.ooniQuality + "%</code>\n" : "") +
    (combined.radarQuality !== null ? "▣ <b>Radar (ترافیک):</b> <code>" + combined.radarQuality + "%</code>\n" : "") +
    (combined.iqi !== null ? "▣ <b>IQI:</b> <code>" + combined.iqi + "%</code>\n" : "") +
    "◎ <b>Live Ping:</b> <code>" + combined.liveQuality + "%</code>\n" +
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

// ============================================
// 📊 نمودار میله‌ای (اپراتورها)
// ============================================
async function makeBarChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image: null, caption: "❌ داده کافی نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 8);
  const img = await getChartImage({
    type: "horizontalBar",
    data: { labels: ops.map(o => o.name), datasets: [{ label: "دسترسی آزاد %", data: ops.map(o => o.rate), backgroundColor: ops.map(o => o.rate >= 80 ? "#22c55e" : o.rate >= 60 ? "#eab308" : o.rate >= 40 ? "#f97316" : "#ef4444") }] },
    options: { title: { display: true, text: "دسترسی آزاد اپراتورها", fontSize: 18 }, legend: { display: false }, scales: { xAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
  });
  return { image: img, caption: "📊 <b>کیفیت اپراتورها</b>\n\n" + getDateBoth() };
}

// ============================================
// 🥧 نمودار دایره‌ای
// ============================================
async function makePieChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image: null, caption: "❌ داده کافی نیست." };
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name: name, count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);
  ops = ops.slice(0, 6);
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#f97316"];
  const img = await getChartImage({
    type: "pie",
    data: { labels: ops.map(o => o.name), datasets: [{ data: ops.map(o => o.count), backgroundColor: colors }] },
    options: { title: { display: true, text: "سهم اپراتورها", fontSize: 18 } }
  });
  return { image: img, caption: "🥧 <b>سهم اپراتورها</b>\n\n" + getDateBoth() };
}

// ============================================
// 📈 نمودار روند ۷ روز
// ============================================
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
  if (values.length === 0) return { image: null, caption: "❌ داده کافی نیست." };
  const img = await getChartImage({
    type: "line",
    data: { labels: labels, datasets: [{ label: "مسدودسازی %", data: values, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] },
    options: { title: { display: true, text: "روند فیلترینگ ۷ روز", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
  });
  return { image: img, caption: "📈 <b>روند فیلترینگ ۷ روز</b>\n\n📅 " + getDateBoth() };
}

// ============================================
// 📅 نمودار تاریخچه
// ============================================
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
  if (values.length === 0) return { image: null, caption: "❌ داده کافی نیست." };
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const img = await getChartImage({
    type: "line",
    data: { labels: labels, datasets: [{ label: "مسدودسازی %", data: values, borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.15)", fill: true, tension: 0.3, borderWidth: 3 }] },
    options: { title: { display: true, text: "تاریخچه ۷ روز اخیر", fontSize: 18 }, scales: { yAxes: [{ ticks: { beginAtZero: true, max: 100 } }] } }
  });
  return { image: img, caption: "📅 <b>تاریخچه ۷ روز</b>\n\nمیانگین: <b>%" + avg + "</b>" };
}

// ============================================
// 🗺 نقشه حرارتی
// ============================================
async function makeMapChart() {
  const p = await getOONIData();
  if (!p.hasData) return { image: null, caption: "❌ داده کافی نیست." };
  const mood = getStatusMood(p.blockPercent);
  const img = await getChartImage({
    type: "doughnut",
    data: { labels: ["مسدود", "آزاد"], datasets: [{ data: [p.blockPercent, p.accessPercent], backgroundColor: ["#ef4444", mood.color], borderColor: "#fff", borderWidth: 3 }] },
    options: { title: { display: true, text: "نقشه حرارتی فیلترینگ", fontSize: 22, fontColor: "#0f172a" }, legend: { position: "bottom", labels: { fontSize: 14 } } }
  });
  return { image: img, caption: "🗺 <b>نقشه حرارتی</b>\n\n" + mood.emoji + " <b>" + mood.label + "</b>\n\n🚫 مسدود: <code>" + p.blockPercent + "%</code>\n✅ آزاد: <code>" + p.accessPercent + "%</code>" };
}

// ============================================
// 📊 گزارش کامل (نسخه ۹.۰ - با شفافیت کامل)
// ============================================
async function makeReport(mode, env, combinedInput) {
  if (mode === undefined) mode = "full";
  const combined = combinedInput || await getCombinedData(env);
  const p = await getOONIData();

  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100) });
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
    else { irList += "  ❌ " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  ✅ " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { globalList += "  ❌ " + s.name + "\n"; }
  }

  const ripe = await fetchRIPE();

  const activeCount = combined.activeSources.length;
  const totalSources = 4;

  let out = "📊 <b>گزارش کامل اینترنت ایران</b>\n<i>" + getIranTimeFull() + "</i>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    mood.emoji + " <b>" + mood.label + "</b>\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";

  out += "🧠 <b>شاخص نهایی</b> (" + activeCount + " از " + totalSources + " منبع فعال)\n\n";
  out += "  ◆ <b>پایداری:</b> <code>" + combined.quality + "%</code>\n";
  out += "  " + makeBar(combined.quality / 10) + "\n\n";

  out += "┣━ 📡 <b>منابع داده</b>\n\n";

  if (combined.sources.ooni) {
    out += "  ◈ <b>OONI (" + combined.weights.ooni + "٪):</b> <code>" + combined.ooniQuality + "%</code>\n";
  } else {
    out += "  ◈ <b>OONI:</b> <i>غیرفعال</i>\n";
  }

  if (combined.sources.radar) {
    out += "  ▣ <b>Radar (" + combined.weights.radar + "٪):</b> <code>" + combined.radarQuality + "%</code>\n";
    if (combined.radarDetails) {
      if (combined.radarDetails.netflows !== null) out += "     └ NetFlows: <code>" + combined.radarDetails.netflows + "%</code>\n";
      if (combined.radarDetails.http !== null) out += "     └ HTTP: <code>" + combined.radarDetails.http + "%</code>\n";
      if (combined.radarDetails.dns !== null) out += "     └ DNS: <code>" + combined.radarDetails.dns + "%</code>\n";
    }
  } else {
    out += "  ▣ <b>Radar:</b> <i>غیرفعال (RADAR_TOKEN)</i>\n";
  }

  if (combined.sources.iqi) {
    out += "  ▣ <b>IQI (" + combined.weights.iqi + "٪):</b> <code>" + combined.iqi + "%</code>\n";
  } else {
    out += "  ▣ <b>IQI:</b> <i>غیرفعال (RADAR_TOKEN)</i>\n";
  }

  if (combined.sources.live) {
    out += "  ◎ <b>Live Ping (" + combined.weights.live + "٪):</b> <code>" + combined.liveQuality + "%</code>\n";
  }

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
  if (ripe && ripe.data && ripe.data.visibility !== undefined) {
    out += "<code>" + ripe.data.visibility + "%</code>\n";
  } else {
    out += "در دسترس نیست\n";
  }

  // راهنمای فعال‌سازی منابع غیرفعال
  if (activeCount < totalSources) {
    out += "\n┣━ 💡 <b>راهنمای فعال‌سازی</b>\n\n";
    if (!combined.sources.radar || !combined.sources.iqi) {
      out += "  ▣ <b>Radar + IQI:</b>\n";
      out += "     <code>RADAR_TOKEN</code> رو در Cloudflare Secret اضافه کن\n\n";
    }
    out += "  📌 <b>توجه:</b> شاخص نهایی فقط بر اساس منابع فعال محاسبه می‌شه.\n";
  }

  out += "\n🕒 " + getIranTimeFull() + "  •  📅 " + getIranDate() + "\n\n" +
    "🔗 @radarinternetiran\n👑 @royal_trust_ir_official\n💬 @radarinternetirangruop";

  return out;
}

// ============================================
// 📊 گزارش‌های فرعی
// ============================================
async function makeWorkReport(env) {
  const combined = await getCombinedData(env);
  const mood = getStatusMood(combined.blockPercent);
  return "⚡ <b>خلاصه وضعیت</b>\n\n" +
    mood.emoji + " <b>" + mood.label + "</b>\n\n" +
    "✅ پایداری: <code>" + combined.quality + "%</code>\n" +
    (combined.ooniQuality !== null ? "◈ OONI: <code>" + combined.ooniQuality + "%</code>\n" : "") +
    "◎ Live: <code>" + combined.liveQuality + "%</code>\n" +
    "📶 پینگ: <code>" + combined.avgPing + "ms</code>\n\n" +
    makeBar(combined.quality / 10) + "\n\n" +
    "🕒 " + getIranTimeFull();
}

async function makeScoreReport(env) {
  const combined = await getCombinedData(env);
  let irOk = 0;
  for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
  const irScore = (irOk / IR_SITES.length) * 100;

  let globalPing = 0, globalCount = 0;
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalPing += t; globalCount++; }
  }
  const avgPing = globalCount > 0 ? globalPing / globalCount : 500;
  const pingScore = Math.max(0, 100 - (avgPing / 5));
  const score = Math.round(combined.quality * 0.5 + irScore * 0.25 + pingScore * 0.25);

  let emoji = "🔴", status = "بحرانی";
  if (score >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (score >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (score >= 40) { emoji = "🟠"; status = "متوسط"; }

  return "🎖️ <b>امتیاز کیفیت</b>\n\n" + emoji + " <b>" + status + "</b>\n\n" +
    "⭐ <b>امتیاز:</b> <code>" + score + "/100</code>\n" +
    makeBar(score / 10) + "\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
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
    else { irList += "  🔴 " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "  🟢 " + s.name + "  <code>" + t + "ms</code>\n"; }
    else { globalList += "  🔴 " + s.name + "\n"; }
  }
  return "📡 <b>پینگ سرورها</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🇮🇷 <b>ایرانی</b>  (" + irOk + "/" + IR_SITES.length + ")\n\n" + irList + "\n" +
    "🌍 <b>جهانی</b>  (" + globalOk + "/" + GLOBAL_SITES.length + ")\n\n" + globalList +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime();
}

async function makeFilteringReport(env) {
  const combined = await getCombinedData(env);
  const p = await getOONIData();
  const mood = getStatusMood(combined.blockPercent);

  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a, b) => b.count - a.count);

  let out = "🚫 <b>وضعیت فیلترینگ ایران</b>\n\n" +
    mood.emoji + " <b>" + mood.label + "</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🎯 دسترسی آزاد: <code>" + combined.accessPercent + "%</code>\n" +
    "🚫 نرخ اختلال: <code>" + combined.blockPercent + "%</code>\n\n" +
    makeBar(combined.accessPercent / 10) + "\n\n" +
    "📊 OONI: <code>" + (combined.ooniQuality || "—") + "%</code>\n" +
    "📶 Live: <code>" + combined.liveQuality + "%</code>\n" +
    "📡 پینگ: <code>" + combined.avgPing + "ms</code>\n" +
    "🔬 تست: <code>" + combined.totalMs.toLocaleString("fa-IR") + "</code>\n\n";

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
  out += "📊 نتیجه: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n" + makeBar((acc / FILTER_CHECK.length) * 10) + "\n\n";
  out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" + list;
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime() + "\n📡 @Radarinternetiran";
  return out;
}

async function makeCompareReport() {
  const p = await getOONIData();
  if (!p.hasData) return "❌ داده کافی نیست.";
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 50) {
      const name = await asnNameAuto(asn);
      ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
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
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📊 تعداد: <b>" + ops.length + "</b>\n";
  out += "📈 میانگین: <b>%" + avg + "</b>\n" + makeBar(avg / 10);
  return out;
}

async function makeVsOperatorReport(op1, op2) {
  const p = await getOONIData();
  if (!p.hasData) return "❌ داده کافی نیست.";
  const ISP_MAP = {
    "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244",
    "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549",
    "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754",
    "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322"
  };
  function findASN(q) {
    const s = q.toLowerCase();
    for (const [n, code] of Object.entries(ISP_MAP)) {
      if (s.includes(n) || n.includes(s)) return code;
    }
    return null;
  }
  const asn1 = findASN(op1), asn2 = findASN(op2);
  if (!asn1 || !asn2) return "❌ یکی از اپراتورها پیدا نشد.";
  const d1 = p.asnData[asn1], d2 = p.asnData[asn2];
  if (!d1 || !d2) return "❌ داده کافی نیست.";
  const rate1 = Math.round((d1.ok / d1.total) * 100);
  const rate2 = Math.round((d2.ok / d2.total) * 100);
  const winner = rate1 > rate2 ? 1 : 2;

  return "🆚 <b>مقایسه دو اپراتور</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
    (winner === 1 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn1) + "</b>\n" +
    "   ✅ دسترسی آزاد: <code>" + rate1 + "%</code>\n   " + makeBar(rate1 / 10) + "\n\n" +
    (winner === 2 ? "🥇 " : "🥈 ") + "<b>" + asnName(asn2) + "</b>\n" +
    "   ✅ دسترسی آزاد: <code>" + rate2 + "%</code>\n   " + makeBar(rate2 / 10) + "\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "🏆 <b>برنده:</b> " + asnName(winner === 1 ? asn1 : asn2) + "\n" +
    "📊 اختلاف: <code>" + Math.abs(rate1 - rate2) + "%</code>";
}

async function makeTopReport() {
  const ooni = await fetchOONI7d();
  const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 500) {
      const name = await asnNameAuto(asn);
      ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست.";
  ops.sort((a, b) => b.rate - a.rate);

  let out = "🏆 <b>رتبه‌بندی هفتگی اپراتورها</b>\n<i>بر اساس ۷ روز گذشته</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🥇 <b>بهترین‌ها:</b>\n\n";
  ops.slice(0, 7).forEach((o, i) => {
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i + 1) + ".";
    out += "  " + rank + " <b>" + o.name + "</b>  →  %" + o.rate + "\n";
  });

  out += "\n🔻 <b>پایین‌ترین‌ها:</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "  🔴 <b>" + o.name + "</b>  →  %" + o.rate + "\n";
  });

  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📊 تعداد: <b>" + ops.length + "</b>\n";
  out += "⭐ بهترین: <b>%" + ops[0].rate + "</b>\n⚠️ بدترین: <b>%" + ops[ops.length - 1].rate + "</b>";
  return out;
}

async function makeISPReport(query) {
  const q = query.toLowerCase();
  const ISP_MAP = {
    "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244",
    "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549",
    "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754",
    "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322"
  };
  let asn = null;
  for (const [name, code] of Object.entries(ISP_MAP)) {
    if (q.includes(name) || name.includes(q)) { asn = code; break; }
  }
  if (!asn) return "❌ ISP پیدا نشد: <b>" + query + "</b>\n\n💡 <code>/isp ایرانسل</code>";
  const p = await getOONIData();
  const d = p.asnData[asn];
  if (!d) return "❌ داده‌ای برای <b>" + asnName(asn) + "</b> یافت نشد.";
  const rate = Math.round((d.ok / d.total) * 100);
  let emoji = "🔴", status = "ضعیف";
  if (rate >= 80) { emoji = "🟢"; status = "عالی"; }
  else if (rate >= 60) { emoji = "🟡"; status = "خوب"; }
  else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "📡 <b>" + asnName(asn) + "</b>\n\n" + emoji + " <b>" + status + "</b>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
    "✅ دسترسی آزاد: <code>" + rate + "%</code>\n" +
    "🚫 مسدود: <code>" + (100 - rate) + "%</code>\n\n" +
    makeBar(rate / 10) + "\n\n" +
    "🔬 تعداد تست: <code>" + d.count.toLocaleString("fa-IR") + "</code>";
}

async function makeWorldReport() {
  const COUNTRIES = [
    { code: "IR", name: "🇮🇷 ایران" }, { code: "TR", name: "🇹🇷 ترکیه" },
    { code: "IQ", name: "🇮🇶 عراق" }, { code: "AE", name: "🇦🇪 امارات" },
    { code: "SA", name: "🇸🇦 عربستان" }
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
        if (d.result) {
          for (const row of d.result) {
            total += row.measurement_count || 0;
            blocked += (row.anomaly_count || 0) + (row.confirmed_count || 0);
          }
        }
        const percent = total > 0 ? Math.round((blocked / total) * 100) : 0;
        results.push({ name: c.name, percent: percent, count: total });
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
  out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📌 OONI  •  🕒 " + getIranTime();
  return out;
}

async function makeVsReport(STATS, env) {
  const yesterday = getYesterday();
  const combined = await getCombinedData(env);
  const todayPercent = combined.quality;
  let yPercent = null;
  if (STATS) {
    const ySnap = await getDailySnapshot(STATS, yesterday);
    if (ySnap && ySnap.hasData) yPercent = ySnap.accessPercent;
  }
  let out = "📊 <b>مقایسه دیروز و امروز</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n";
  if (yPercent !== null) {
    out += "📅 <b>دیروز:</b> <code>" + yPercent + "%</code>\n";
    out += "📅 <b>امروز:</b> <code>" + todayPercent + "%</code>\n\n";
    const diff = todayPercent - yPercent;
    let trend = "➖ بدون تغییر";
    if (diff > 5) trend = "🎉 خیلی بهتر (+" + diff + ")";
    else if (diff > 0) trend = "📈 کمی بهتر (+" + diff + ")";
    else if (diff < -5) trend = "😟 خیلی بدتر (" + diff + ")";
    else if (diff < 0) trend = "📉 کمی بدتر (" + diff + ")";
    out += "<b>" + trend + "</b>\n\n" + makeBar(todayPercent / 10);
  } else {
    out += "امروز: <code>" + todayPercent + "%</code>\n⚠️ داده دیروز در دسترس نیست.";
  }
  return out;
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
  let out = "⏰ <b>بهترین ساعات استفاده از اینترنت</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🏆 <b>پیشنهاد ویژه:</b>\nساعت <b>۲ بامداد تا ۶ صبح</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
  for (const h of hours) {
    out += h.emoji + " " + h.range + "\n   └ " + h.note + " • %" + h.quality + "\n\n";
  }
  out += "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💡 تخمینی بر اساس الگوی مصرف";
  return out;
}

async function makeSpeedReport() {
  return "⚡ <b>راهنمای تست سرعت</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n🔗 <b>لینک‌های معتبر:</b>\n\n" +
    "  🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n" +
    "  📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n" +
    "  ⚡ <a href='https://fast.com/'>Fast.com</a>\n" +
    "  🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💡 <b>نکات:</b>\n\n" +
    "  1️⃣ وای‌فای را قطع کن\n" +
    "  2️⃣ اپ‌های دیگر را ببند\n" +
    "  3️⃣ سه بار تست کن\n\n" +
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📡 @Radarinternetiran";
}

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
  let prediction = "➖ وضعیت نسبتاً پایداره.";
  if (trend > 5) prediction = "📈 روند افزایشی فیلترینگ. احتمالاً وضعیت بدتر می‌شه.";
  else if (trend < -5) prediction = "📉 روند کاهشی. امیدواریم بهتر بشه!";
  return "🔮 <b>پیش‌بینی اینترنت</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n📊 میانگین ۷ روز: <code>" + Math.round(avg) + "%</code>\n📈 روند فعلی: " + (trend > 0 ? "🔺" : "🔻") + " <code>" + Math.round(trend) + "%</code>\n\n" + prediction + "\n\n⚠️ <i>بر اساس داده‌های گذشته</i>";
}

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
    return "🕰 <b>یک سال پیش امروز</b>\n\n📅 " + dateStr + "\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      mood.emoji + " <b>" + mood.label + "</b>\n\n" +
      "✅ دسترسی آزاد: <code>" + p.accessPercent + "%</code>\n" +
      "🚫 مسدود: <code>" + p.blockPercent + "%</code>\n" +
      makeBar(p.accessPercent / 10);
  } catch(e) { return "❌ خطا در دریافت داده."; }
}

// ============================================
// 📢 ارسال گزارش به کانال‌ها
// ============================================
async function sendChannelReport(TG, STATS, env) {
  const report = await makeReport("full", env);
  const chats = await getTrackedChats(STATS);
  for (const ch of chats) {
    try {
      const r = await fetch(TG + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: ch, text: report, parse_mode: "HTML" })
      });
      const d = await r.json();
      if (!d.ok) console.log("Failed to send report to " + ch + ": " + JSON.stringify(d));
    } catch(e) { console.log("Channel report error for " + ch + ": " + e.message); }
  }
}

// ============================================
// 📡 وضعیت کانال (با نمودار)
// ============================================
async function sendOrUpdateChannelStatus(TG, STATS, env) {
  try {
    const combined = await getCombinedData(env);
    const snapshots = await getSnapshots(STATS, CHART_POINTS);

    const labels = [], healthData = [], disruptionData = [], trafficData = [], ooniData = [], liveData = [];

    for (const s of snapshots) {
      labels.push(s.label);
      if (s.quality !== null && s.quality !== undefined) {
        healthData.push(s.quality);
        disruptionData.push(s.blockPercent !== null && s.blockPercent !== undefined ? s.blockPercent : (100 - s.quality));
        trafficData.push(s.trafficPercent !== null && s.trafficPercent !== undefined ? s.trafficPercent : null);
        ooniData.push(s.ooniQuality !== null && s.ooniQuality !== undefined ? s.ooniQuality : null);
        liveData.push(s.liveQuality !== null && s.liveQuality !== undefined ? s.liveQuality : null);
      } else {
        healthData.push(null);
        disruptionData.push(null);
        trafficData.push(null);
        ooniData.push(null);
        liveData.push(null);
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

    if (hasAnyData) {
      const startTime = labels[0] || "—";
      const endTime = labels[labels.length - 1] || "—";

      const config = {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            { label: "◆ شاخص پایداری", data: healthData, borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.15)", borderWidth: 3.5, tension: 0.4, fill: true, yAxisID: "y-left", pointRadius: 4, pointBackgroundColor: "#a78bfa", pointBorderColor: "#0f172a", pointBorderWidth: 2, spanGaps: true },
            { label: "▲ اختلال", data: disruptionData, borderColor: "#fb7185", borderDash: [4, 4], borderWidth: 2.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 0, spanGaps: true },
            { label: "◈ OONI", data: ooniData, borderColor: "#10b981", borderDash: [2, 3], borderWidth: 2, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 3, pointBackgroundColor: "#10b981", spanGaps: true },
            { label: "◎ Live", data: liveData, borderColor: "#f59e0b", borderDash: [6, 3], borderWidth: 2.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 3, pointBackgroundColor: "#f59e0b", spanGaps: true },
            { label: "○ روند", data: trendData, borderColor: "#94a3b8", borderDash: [1, 3], borderWidth: 1.5, tension: 0.4, fill: false, yAxisID: "y-left", pointRadius: 0, spanGaps: true },
            { label: "■ ترافیک", data: trafficData, borderColor: "#22d3ee", backgroundColor: "rgba(34,211,238,0.18)", borderWidth: 3, tension: 0.4, fill: true, yAxisID: "y-right", pointRadius: 4, pointBackgroundColor: "#22d3ee", spanGaps: true }
          ]
        },
        options: {
          title: { display: true, text: "📡 پایش ترکیبی  •  " + startTime + " تا " + endTime, fontSize: 19, fontColor: "#f1f5f9", padding: 22, fontStyle: "bold" },
          legend: { position: "bottom", labels: { fontColor: "#cbd5e1", fontSize: 10, usePointStyle: true, padding: 12, boxWidth: 10 } },
          scales: {
            xAxes: [{ ticks: { fontColor: "#94a3b8", fontSize: 10, maxRotation: 60, minRotation: 30 } }],
            yAxes: [
              { id: "y-left", position: "left", ticks: { min: 0, max: 100, fontColor: "#a78bfa" }, scaleLabel: { display: true, labelString: "پایداری %", fontColor: "#a78bfa" } },
              { id: "y-right", position: "right", ticks: { min: 0, max: 100, fontColor: "#22d3ee" }, gridLines: { display: false }, scaleLabel: { display: true, labelString: "ترافیک %", fontColor: "#22d3ee" } }
            ]
          }
        }
      };
      chartImage = await getChartImageDark(config);
    } else {
      chartImage = await getChartImageDark({
        type: "line",
        data: { labels: ["در انتظار داده"], datasets: [{ data: [0], borderColor: "#64748b" }] },
        options: { title: { display: true, text: "⏳ در حال جمع‌آوری داده...", fontSize: 20, fontColor: "#e2e8f0" }, legend: { display: false } }
      });
    }

    const mood = getStatusMood(combined.blockPercent);
    const startTime = labels[0] || "—";
    const endTime = labels[labels.length - 1] || "—";
    const realCount = healthData.filter(v => v !== null).length;

    const sourceIcons = { ooni: "◈ OONI", radar: "▣ Radar", iqi: "▣ IQI", live: "◎ Live" };
    const activeSources = combined.activeSources.map(s => sourceIcons[s] || s);

    let caption = "<b>🛰 رادار اینترنت ایران</b>\n" +
      "<i>پایش ترکیبی " + combined.activeSources.length + " منبعی</i>\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "🕒 <b>بازه:</b> " + startTime + " تا " + endTime + "\n\n" +
      mood.emoji + " <b>" + mood.label + "</b>\n\n" +
      "◆ <b>شاخص نهایی:</b> <code>" + combined.quality + "%</code>\n";

    if (combined.ooniQuality !== null) caption += "◈ <b>OONI:</b> <code>" + combined.ooniQuality + "%</code>\n";
    if (combined.radarQuality !== null) caption += "▣ <b>Radar:</b> <code>" + combined.radarQuality + "%</code>\n";
    if (combined.iqi !== null) caption += "▣ <b>IQI:</b> <code>" + combined.iqi + "%</code>\n";
    caption += "◎ <b>Live:</b> <code>" + combined.liveQuality + "%</code>\n";

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
          await fetch(TG + "/deleteMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: ch, message_id: parseInt(lastMsgId) })
          }).catch(() => {});
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
            await fetch(TG + "/pinChatMessage", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: ch, message_id: d.result.message_id, disable_notification: true })
            }).catch(() => {});
            if (STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
          }
        }
        if (!success) {
          const r = await fetch(TG + "/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: ch, text: caption, parse_mode: "HTML" })
          });
          const d = await r.json();
          if (d.ok && d.result && STATS) await STATS.put("msg_id:" + ch, String(d.result.message_id));
        }
      } catch(e) { console.log("Channel status error for " + ch + ": " + e.message); }
    }
  } catch(e) { console.log("Channel status general error: " + e.message); }
}

// ============================================
// 🔔 هشدار کیفیت
// ============================================
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
          const alertMsg = "🚨 <b>هشدار افت شدید کیفیت!</b>\n\n" +
            "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
            mood.emoji + " <b>" + mood.label + "</b>\n\n" +
            "📉 افت: <b>+" + diff + "%</b> فیلترینگ\n" +
            "🚫 فیلترینگ فعلی: <code>" + p.blockPercent + "%</code>\n" +
            "✅ دسترسی آزاد: <code>" + p.accessPercent + "%</code>\n" +
            "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime();
          for (const ch of chats) {
            await sendMessage(TG, ch, alertMsg, { parse_mode: "HTML" }).catch(() => {});
          }
        }
      }
    }

    if (p.blockPercent >= ALERT_THRESHOLD) {
      const alertKey = "critical:" + today + ":" + Math.floor(hour / 3);
      const alreadySent = await STATS.get(alertKey);
      if (!alreadySent) {
        await STATS.put(alertKey, "1", { expirationTtl: 21600 });
        const chats = await getTrackedChats(STATS);
        const criticalMsg = "🚨🚨 <b>هشدار اضطراری</b> 🚨🚨\n\n" +
          "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n⚠️ <b>فیلترینگ در سطح بحرانی!</b>\n\n" +
          "🚫 <b>مسدود:</b> <code>" + p.blockPercent + "%</code>\n" +
          "✅ <b>دسترسی آزاد:</b> <code>" + p.accessPercent + "%</code>\n" +
          makeBar(p.accessPercent / 10) + "\n" +
          "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🕒 " + getIranTime();
        for (const ch of chats) {
          await sendMessage(TG, ch, criticalMsg, { parse_mode: "HTML" }).catch(() => {});
        }
      }
    }

    await STATS.put(lastKey, JSON.stringify({ blockPercent: p.blockPercent, ts: Date.now() }), { expirationTtl: 7200 });
  } catch(e) { console.log("checkAndAlertQuality error: " + e.message); }
}

// ============================================
// 📮 اشتراک ISP
// ============================================
async function handleSubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const ISP_MAP = {
      "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244",
      "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549",
      "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754",
      "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322"
    };
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
    await sendMessage(TG, chatId, "🔔 <b>اشتراک فعال شد!</b>\n\n📡 اپراتور: <b>" + name + "</b>\n\n🔕 لغو: <code>/unsubscribe " + name + "</code>", { parse_mode: "HTML" });
  } catch(e) {}
}

async function handleUnsubscribe(STATS, userId, ispQuery, TG, chatId) {
  try {
    const ISP_MAP = {
      "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244",
      "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549",
      "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754",
      "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322"
    };
    const q = ispQuery.toLowerCase();
    let asn = null, name = null;
    for (const [n, code] of Object.entries(ISP_MAP)) {
      if (q.includes(n) || q.includes(code)) { asn = code; name = n; break; }
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
              await sendMessage(TG, u.id,
                "🔔 <b>هشدار اپراتور شما</b>\n\n📡 <b>" + asnName(asn) + "</b>\n⚠️ کیفیت پایین: <code>" + rate + "%</code>\n" + makeBar(rate / 10),
                { parse_mode: "HTML" });
            }
          }
        }
      } catch(e) {}
    }
  } catch(e) {}
}

// ============================================
// 🏆 جدول هفتگی
// ============================================
async function postWeeklyLeaderboard(TG, STATS) {
  if (!STATS) return;
  try {
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    if (lb.length === 0) return;

    let out = "🏆 <b>قهرمانان هفته</b>\n<i>میدان رقابت کاربران رادار</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    lb.slice(0, 10).forEach((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i + 1) + ".";
      const name = (u.n || u.id).substring(0, 20);
      const rank = getVipRank(u.p);
      out += medal + " " + rank.emoji + " <b>" + name + "</b>  →  <code>" + u.p + "</code>\n";
    });
    out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🎁 جوایز هفته:\n🥇 +100  |  🥈 +50  |  🥉 +25\n\n🕒 " + getIranDate();

    const chats = await getTrackedChats(STATS);
    for (const ch of chats) {
      try {
        const r = await sendMessage(TG, ch, out, { parse_mode: "HTML" });
        if (r && r.ok && r.result) {
          await fetch(TG + "/pinChatMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: ch, message_id: r.result.message_id, disable_notification: false })
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: ch })
        }).catch(() => {});
      }
      await STATS.delete(WEEKLY_PIN_MSG_KEY);
    }
  } catch(e) {}
}

// ============================================
// 🎰 اسپین روزانه
// ============================================
async function handleSpin(STATS, userId, TG, chatId) {
  try {
    const today = getToday();
    const key = "spin:" + userId;
    const lastSpin = await STATS.get(key);
    if (lastSpin === today) {
      const hours = 24 - getIranHour();
      await sendMessage(TG, chatId, "🎰 <b>اسپین امروز استفاده شده!</b>\n\n⏰ فردا دوباره برگرد.\n🕒 <b>" + hours + " ساعت</b> دیگر.", { parse_mode: "HTML" });
      return;
    }
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
      "🎰 <b>نتیجه اسپین!</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      emoji + " <b>+ " + prize + " امتیاز</b>\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "🏆 امتیاز کل: <code>" + pts + "</code>\n\n🎁 فردا دوباره!",
      { parse_mode: "HTML" });
  } catch(e) { await sendMessage(TG, chatId, "❌ خطا در اسپین."); }
}

// ============================================
// 🆔 بررسی عضویت
// ============================================
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

// ============================================
// 🔔 بررسی نسخه
// ============================================
async function checkVersion(STATS, userId, TG, chatId) {
  if (!STATS) return;
  try {
    const userVer = await STATS.get("v:" + userId);
    if (userVer !== CURRENT_VERSION) {
      await sendMessage(TG, chatId,
        "🎉 <b>ربات آپدیت شد — نسخه ۹.۰</b>\n\n" +
        "✨ <b>تغییرات کلیدی:</b>\n\n" +
        "🧠 <b>معماری جدید:</b> فقط منابع کارآمد\n" +
        "📊 <b>شفافیت کامل:</b> نمایش دقیق منابع فعال\n" +
        "🚫 <b>حذف نویز فیک:</b> داده واقعی یا هیچی\n" +
        "🌐 <b>سه منبع کارآمد:</b> OONI + Radar + Live\n\n" +
        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🔹 راهنما: /help",
        { parse_mode: "HTML" });
      await STATS.put("v:" + userId, CURRENT_VERSION);
    }
  } catch(e) {}
}

// ============================================
// 🎯 Handle Update — پردازش دستورات
// ============================================
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
    if (!isOwner(userId)) await saveOwnerId(STATS, userId);
  }

  if (msg.chat.type !== "private") {
    await trackChat(STATS, chatId);
    if (text !== "/admin" && text !== ADMIN_PASS) return;
  }
  if (STATS) await STATS.put("name:" + userId, userName);

  if (text === "/admin") {
    await sendMessage(TG, chatId, "🔐 <b>ورود به پنل مدیریت</b>\n\nرمز ادمین را ارسال کنید:", { parse_mode: "HTML" });
    return;
  }
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
      "🔒 <b>دسترسی محدود</b>\n\nبرای استفاده از ربات، ابتدا در بخش‌های زیر عضو شوید:\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📡 <b>کانال رادار اینترنت</b>\n     <i>آمار زنده و گزارش‌های روزانه</i>\n\n" +
      "👑 <b>کانال رویال تراست</b>\n     <i>اخبار و اطلاع‌رسانی</i>\n\n" +
      "💬 <b>گروه رادار اینترنت</b>\n     <i>پرسش و پاسخ و تبادل نظر</i>\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n" +
      "پس از عضویت، دوباره <b>/start</b> را بزنید 👇",
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
      setTimeout(async () => {
        try { await sendMessage(TG, chatId, streak.msg + "\n\n🔥 زنجیره: " + streak.count + " روز", { parse_mode: "HTML" }); } catch(e) {}
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
        const invKey = "invites:" + refCode;
        const invCount = parseInt(await STATS.get(invKey) || "0") + 1;
        await STATS.put(invKey, String(invCount));
        if (invCount === 5) await awardBadge(STATS, refCode, "inviter_5", TG);
        if (invCount === 10) await awardBadge(STATS, refCode, "inviter_10", TG);
        await sendMessage(TG, chatId, "🎉 <b>خوش آمدی " + userName + "!</b>\n\n🎁 ۵ امتیاز هدیه گرفتی!\n✨ دوستت هم ۱۰ امتیاز گرفت.", { parse_mode: "HTML" });
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
      "به <b>🛰 رادار اینترنت</b> خوش اومدی\n" +
      "<i>پایشگر چندمنبعی اینترنت ایران</i>\n\n" +
      "🏆 امتیاز: <code>" + pts + "</code>" + tierLine + "\n" +
      "⭐ سطح: " + rank.emoji + " " + rank.name + "\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📊 <b>گزارش‌ها</b>\n├ /status · /work · /score · /vs\n\n" +
      "🆚 <b>مقایسه</b>\n├ /compare · /top · /isp · /world\n\n" +
      "📈 <b>نمودارها</b>\n├ /today · /history · /trend · /chart · /pie · /map\n\n" +
      "🎮 <b>سرگرمی</b>\n├ 🎰 /spin · 🏆 /leaderboard · 🎁 /invite\n├ 💎 /badges · 📊 /mystats\n\n" +
      "🔮 <b>ویژه</b>\n├ /predict · /yearago · /subscribe\n\n" +
      "⚡ <b>ابزارها</b>\n├ /ping · /speed · /best · /api · /live\n└ /check [سایت]\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💬 <b>گروه:</b> @radarinternetirangruop",
      { parse_mode: "HTML" });

  } else if (text === "/spin" || text === "🎰 اسپین") {
    await handleSpin(STATS, userId, TG, chatId);

  } else if (text === "/badges" || text === "💎 نشان‌ها") {
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
      "🏆 امتیاز: <code>" + pts + "</code>\n" +
      "⭐ سطح: " + rank.emoji + " " + rank.name + "\n" +
      "📊 رتبه: <code>#" + (pos || "?") + "</code> از " + lb.length + "\n" +
      "🔥 زنجیره: <code>" + (streak.count || 0) + " روز</code>\n" +
      "🎁 دعوت‌ها: <code>" + invCount + "</code>\n" +
      "💎 نشان‌ها: <code>" + badges.length + "/" + Object.keys(BADGES).length + "</code>",
      { parse_mode: "HTML" });

  } else if (text === "/subscribe" || text === "🔔 اشتراک") {
    await sendMessage(TG, chatId, "🔔 <b>اشتراک اپراتور</b>\n\n📌 مثال:\n<code>/subscribe ایرانسل</code>\n<code>/subscribe مخابرات</code>", { parse_mode: "HTML" });
  } else if (text.startsWith("/subscribe ")) {
    const q = text.replace("/subscribe ", "").trim();
    await handleSubscribe(STATS, userId, q, TG, chatId);
  } else if (text.startsWith("/unsubscribe ")) {
    const q = text.replace("/unsubscribe ", "").trim();
    await handleUnsubscribe(STATS, userId, q, TG, chatId);

  } else if (text.startsWith("/vs ")) {
    const parts = text.replace("/vs ", "").trim().split(/\s+/);
    if (parts.length >= 2) {
      await sendMessage(TG, chatId, "🔄 <i>در حال مقایسه...</i>");
      const report = await makeVsOperatorReport(parts[0], parts[1]);
      await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
    } else {
      await sendMessage(TG, chatId, "💡 مثال:\n<code>/vs ایرانسل مخابرات</code>", { parse_mode: "HTML" });
    }
  } else if (text === "/vs") {
    await sendMessage(TG, chatId, "🔄 <i>در حال مقایسه...</i>");
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
      if (ok) {
        await sendMessage(TG, chatId, "✅ <b>" + site + "</b>\n\n🟢 قابل دسترسی\n" + (t ? "📡 پینگ: <code>" + t + "ms</code>\n" : "") + "\n⚠️ تست از سرور خارج", { parse_mode: "HTML" });
      } else {
        await sendMessage(TG, chatId, "🚫 <b>" + site + "</b>\n\n🔴 از سرور قابل دسترسی نیست", { parse_mode: "HTML" });
      }
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }

  } else if (text === "/predict") {
    await addPoints(STATS, userId, 1);
    const report = await makePrediction();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/yearago") {
    await addPoints(STATS, userId, 1);
    const report = await makeYearAgoReport();
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });

  } else if (text === "/live") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🔴 <i>اندازه‌گیری زنده...</i>");
    const combined = await getCombinedData(env);
    const mood = getStatusMood(combined.blockPercent);

    let msg = "🔴 <b>وضعیت زنده</b>\n\n" +
      mood.emoji + " <b>" + mood.label + "</b>\n\n" +
      "◆ پایداری نهایی: <code>" + combined.quality + "%</code>\n";
    if (combined.ooniQuality !== null) msg += "◈ OONI: <code>" + combined.ooniQuality + "%</code>\n";
    if (combined.radarQuality !== null) msg += "▣ Radar: <code>" + combined.radarQuality + "%</code>\n";
    if (combined.iqi !== null) msg += "▣ IQI: <code>" + combined.iqi + "%</code>\n";
    msg += "◎ Live: <code>" + combined.liveQuality + "%</code>\n" +
      "📶 پینگ: <code>" + combined.avgPing + "ms</code>\n" +
      "✅ موفقیت: <code>" + combined.successRate + "%</code>\n\n" +
      makeBar(combined.quality / 10) + "\n\n🕒 " + getIranTimeFull();

    await sendMessage(TG, chatId, msg, { parse_mode: "HTML" });

  } else if (text === "/leaderboard" || text === "🏆 صدرنشین‌ها") {
    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));

    let out = "🏆 <b>میدان رقابت رادار</b>\n<i>برترین کاربران این هفته</i>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n\n";
    if (lb.length === 0) {
      out += "🥺 هنوز کسی امتیاز نگرفته!\n\n<b>اولین نفر باش!</b> 🚀";
    } else {
      lb.slice(0, 10).forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i + 1) + ".";
        const rank = getVipRank(u.p);
        const name = (u.n || u.id).substring(0, 20);
        out += medal + " " + rank.emoji + " <b>" + name + "</b>  →  <code>" + u.p + "</code>\n";
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

    out += "\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💪 با /invite دوستانت رو دعوت کن!";
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
        "🛡 <b>پنل مالک ربات</b>\n\n👤 " + userName + "\n👑 مالک و مدیر\n🔒 خارج از رقابت\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
        "🏆 امتیاز: <code>" + pts + "</code>\n" +
        "⭐ " + vip.emoji + " " + vip.name + "\n" +
        "💎 نشان‌ها: <code>" + badges.length + "/" + Object.keys(BADGES).length + "</code>\n" +
        "🎁 دعوت‌ها: <code>" + invCount + "</code>\n\n" +
        "🔗 <a href='https://radar-bot.royal-trust-ir-official.workers.dev/admin?pass=" + ADMIN_PASS + "'>ورود به داشبورد</a>",
        { parse_mode: "HTML" });
      return;
    }

    const lbRaw = await STATS.get("leaderboard");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    lb = lb.filter(u => !isOwner(u.id));
    const rank = lb.findIndex(x => x.id === userId) + 1;
    let medal = "🎖";
    if (rank === 1) medal = "🥇";
    else if (rank === 2) medal = "🥈";
    else if (rank === 3) medal = "🥉";
    let tierBadge = "";
    if (tier) tierBadge = " " + tier.emoji + " <b>" + tier.name + "</b>";

    await sendMessage(TG, chatId,
      "🎯 <b>کارت امتیاز شما</b>" + tierBadge + "\n\n" +
      "👤 " + userName + "\n" +
      "⭐ " + vip.emoji + " " + vip.name + "\n" +
      "🏆 امتیاز: <code>" + pts + "</code>\n" +
      "📊 رتبه: " + medal + " <b>#" + (rank || "?") + "</b>\n" +
      "👥 از " + lb.length + " کاربر",
      { parse_mode: "HTML" });

  } else if (text === "/invite") {
    const link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + userId;
    const pts = await getPoints(STATS, userId);
    const invRaw = await STATS.get("invites:" + userId);
    const invCount = parseInt(invRaw || "0");

    await sendMessage(TG, chatId,
      "🎁 <b>دعوت از دوستان</b>\n\n👤 " + userName + "\n🏆 امتیاز: <code>" + pts + "</code>\n👥 دعوت موفق: <code>" + invCount + "</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n🔗 <b>لینک اختصاصی شما:</b>\n\n<code>" + link + "</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n💰 <b>پاداش:</b>\n🎯 شما: <b>+10 امتیاز</b>\n🎯 دوستت: <b>+5 امتیاز</b>",
      { parse_mode: "HTML" });

  } else if (text === "/api") {
    const base = "https://radar-bot.royal-trust-ir-official.workers.dev/api";
    await sendMessage(TG, chatId,
      "🔌 <b>API عمومی رادار v9.0</b>\n\n" +
      "📊 <b>Endpoints:</b>\n\n" +
      "🔹 <code>" + base + "/status</code>\n" +
      "🔹 <code>" + base + "/operators</code>\n" +
      "🔹 <code>" + base + "/top</code>\n" +
      "🔹 <code>" + base + "/history</code>\n\n" +
      "💡 خروجی: JSON",
      { parse_mode: "HTML" });

  } else if (text === "/status" || text === "/status full") {
    await addPoints(STATS, userId, 1);
    try { await saveSnapshot(STATS, new Date(), env); } catch(e) {}
    await sendMessage(TG, chatId, "🔄 <i>در حال آماده‌سازی گزارش ترکیبی...</i>");
    try {
      const combined = await getCombinedData(env);
      const chart = await makeTodayChart(STATS, env, combined);
      const report = await makeReport("full", env, combined);

      if (chart.image) {
        const fullCaption = chart.caption + "\n\n━━━━━━━━━━━━━━━━━\n" + report;
        await sendPhoto(TG, chatId, chart.image, fullCaption);
      } else {
        await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
      }
    } catch(e) {
      console.log("status error: " + e.message);
      const report = await makeReport("full", env);
      await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
    }
  } else if (text === "/status simple" || text === "/work") {
    await addPoints(STATS, userId, 1);
    const report = await makeWorkReport(env);
    await sendMessage(TG, chatId, report, { parse_mode: "HTML" });
  } else if (text === "/score") {
    await addPoints(STATS, userId, 1);
    const report = await makeScoreReport(env);
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
    await sendMessage(TG, chatId, "🔍 <b>بررسی ISP</b>\n\n📱 <code>/isp ایرانسل</code>\n☎️ <code>/isp مخابرات</code>\n🌐 <code>/isp شاتل</code>", { parse_mode: "HTML" });
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
    try { await saveSnapshot(STATS, new Date(), env); } catch(e) {}
    await sendMessage(TG, chatId, "⏱ <i>در حال ساخت نمودار...</i>");
    try {
      const c = await makeTodayChart(STATS, env);
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) {
      await sendMessage(TG, chatId, "❌ خطا در ساخت نمودار.");
      console.log("today error: " + e.message);
    }
  } else if (text === "/history") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📅 <i>در حال ساخت...</i>");
    try {
      const c = await makeHistoryChart();
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
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
    const report = await makeFilteringReport(env);
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
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/pie") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🥧 <i>در حال ساخت...</i>");
    try {
      const c = await makePieChart();
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/trend") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "📈 <i>در حال ترسیم...</i>");
    try {
      const c = await makeTrendChart();
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/map") {
    await addPoints(STATS, userId, 1);
    await sendMessage(TG, chatId, "🗺 <i>در حال ترسیم...</i>");
    try {
      const c = await makeMapChart();
      if (c.image) await sendPhoto(TG, chatId, c.image, c.caption);
      else await sendMessage(TG, chatId, c.caption);
    } catch(e) { await sendMessage(TG, chatId, "❌ خطا."); }
  } else if (text === "/help") {
    await sendMessage(TG, chatId,
      "📚 <b>راهنمای کامل رادار v9.0</b>\n\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "📊 <b>گزارش‌ها:</b>\n" +
      "<code>/status · /work · /score · /vs</code>\n\n" +
      "🆚 <b>مقایسه:</b>\n" +
      "<code>/compare · /top · /isp · /world</code>\n\n" +
      "📈 <b>نمودارها:</b>\n" +
      "<code>/today · /history · /trend · /chart · /pie · /map</code>\n\n" +
      "🎮 <b>سرگرمی:</b>\n" +
      "<code>/spin · /leaderboard · /myrank · /invite · /badges · /mystats</code>\n\n" +
      "🔮 <b>ویژه:</b>\n" +
      "<code>/predict · /yearago · /subscribe · /check [سایت]</code>\n\n" +
      "⚡ <b>ابزارها:</b>\n" +
      "<code>/ping · /speed · /best · /api · /live</code>\n\n" +
      "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n" +
      "💬 گروه: @radarinternetirangruop\n" +
      "🤖 ربات: @Radarinternetiranbot",
      { parse_mode: "HTML" });
  }
}

// ============================================
// 🌐 API عمومی
// ============================================
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
          iqi_score: combined.iqi,
          live_quality: combined.liveQuality,
          block_percent: combined.blockPercent,
          access_percent: combined.accessPercent,
          traffic_percent: combined.trafficPercent,
          avg_ping_ms: combined.avgPing,
          success_rate: combined.successRate,
          radar_details: combined.radarDetails,
          active_sources: combined.activeSources,
          weights: combined.weights,
          total_measurements: combined.totalMs,
          ripe_visibility: ripe && ripe.data ? ripe.data.visibility : null,
          date_iran: getIranDate(),
          time_iran: getIranTimeFull(),
          version: CURRENT_VERSION
        }
      }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api/operators") {
      const p = await getOONIData();
      const ops = [];
      for (const [asn, d] of Object.entries(p.asnData)) {
        const name = await asnNameAuto(asn);
        ops.push({ asn: "AS" + asn, name: name, free_percent: Math.round((d.ok / d.total) * 100), tests: d.count });
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
          ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), tests: d.count });
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
      return new Response(JSON.stringify({ ok: true, data: data }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api/radar") {
      const radar = await fetchCloudflareRadar(env);
      return new Response(JSON.stringify({ ok: true, data: radar }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api/iqi") {
      const iqi = await fetchCloudflareIQI(env);
      return new Response(JSON.stringify({ ok: true, data: iqi }, null, 2), { headers: cors });
    }
    if (url.pathname === "/api" || url.pathname === "/api/") {
      return new Response(JSON.stringify({
        ok: true,
        name: "Radar Internet Public API",
        version: CURRENT_VERSION,
        endpoints: {
          status: "/api/status",
          operators: "/api/operators",
          top: "/api/top",
          history: "/api/history",
          radar: "/api/radar",
          iqi: "/api/iqi"
        },
        sources: ["OONI", "Cloudflare Radar", "Cloudflare IQI", "Live Ping"],
        weights: { ooni: "40%", radar: "25%", iqi: "15%", live: "20%" },
        free: true
      }, null, 2), { headers: cors });
    }
    return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: cors });
  } catch(e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: cors });
  }
}

// ============================================
// 🔐 Admin Dashboard
// ============================================
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

  return "<!DOCTYPE html><html lang='fa' dir='rtl'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>داشبورد رادار v9.0</title>" +
    "<style>body{font-family:Tahoma;background:#0a1128;color:#fff;padding:20px;margin:0}h1{color:#d4af37;text-align:center;margin-bottom:20px}" +
    ".card{background:rgba(255,255,255,0.05);border-radius:15px;padding:20px;margin:15px 0;border:1px solid rgba(212,175,55,0.3)}" +
    ".stat{display:inline-block;margin:10px 20px;text-align:center}.stat-v{font-size:36px;color:#d4af37;font-weight:bold}" +
    ".stat-l{color:#8899bb;font-size:13px;margin-top:5px}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.1)}" +
    "th{color:#d4af37;font-size:14px}code{background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:12px}" +
    ".date{color:#8899bb;font-size:14px;text-align:center;margin-bottom:20px}a{color:#d4af37;text-decoration:none}" +
    ".head{color:#d4af37;border-bottom:2px solid #d4af37;padding-bottom:10px;margin-bottom:15px;display:inline-block}" +
    "small{color:#8899bb}.source{display:inline-block;background:#1e293b;padding:5px 10px;border-radius:5px;margin:5px;font-size:12px;border-left:3px solid #d4af37}</style></head><body>" +
    "<h1>🔐 داشبورد ادمین v9.0</h1>" +
    "<div class='date'>" + getIranDate() + "  •  " + getGregDate() + "  •  " + getIranTimeFull() + "</div>" +
    "<div class='card'><div class='head'>🧠 منابع داده</div>" +
    "<div class='source'>◈ OONI (۴۰٪) — از داخل ایران</div>" +
    "<div class='source'>▣ Cloudflare Radar (۲۵٪) — نیاز به RADAR_TOKEN</div>" +
    "<div class='source'>▣ Cloudflare IQI (۱۵٪) — نیاز به RADAR_TOKEN</div>" +
    "<div class='source'>◎ Live Ping (۲۰٪) — از سرور خارج</div>" +
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
    "<p><a href='/sources-status'>/sources-status</a> — وضعیت منابع</p>" +
    "<p><a href='/radar-test'>/radar-test</a> — تست Radar</p>" +
    "<p><a href='/iqi-test'>/iqi-test</a> — تست IQI</p>" +
    "<p><a href='/weeklypin'>/weeklypin</a> — جدول هفتگی</p>" +
    "<p><a href='/sendreport'>/sendreport</a> — گزارش دستی</p>" +
    "<p><a href='/snapshot'>/snapshot</a> — snapshot دستی</p></div>" +
    "</body></html>";
                                                 }
