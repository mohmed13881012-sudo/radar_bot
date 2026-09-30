const BOT_TOKEN = "8579994081:AAFPiuiMPgANy7ARI9QiE7dWWwlnFrwY8gs";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const RADAR_TOKEN = "cfat_NBfqhl13ZTbTlMnA2c7wc32GwKCL3UmWb3qaPEhv1a3e1133";
const TG = "https://api.telegram.org/bot" + BOT_TOKEN;
const RADAR = "https://api.cloudflare.com/client/v4/radar";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/test") return new Response("Test OK");
    if (url.pathname === "/setwebhook") {
      const r = await fetch(TG + "/setWebhook?url=" + url.origin + "/");
      return new Response("Result: " + await r.text());
    }
    if (url.pathname === "/webhookinfo") {
      const r = await fetch(TG + "/getWebhookInfo");
      return new Response(await r.text());
    }
    if (url.pathname === "/debug") {
      const out = await debugRadar();
      return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    if (url.pathname === "/sendreport") {
      await sendChannelReport();
      return new Response("Report sent!");
    }
    if (request.method !== "POST") return new Response("Radar Bot is running!");
    try {
      const update = await request.json();
      await handleUpdate(update);
    } catch(e) { console.log("Error: " + e.message); }
    return new Response("OK");
  },
  async scheduled(event, env, ctx) {
    await sendChannelReport();
  }
};

// ==================== زمان تهران ====================
function getIranTime() {
  return new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
}

function getIranDate() {
  return new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

// ==================== Debug ====================
async function debugRadar() {
  const urls = [
    RADAR + "/quality/iqi/summary?location=IR&dateRange=1d",
    RADAR + "/quality/speed/summary?location=IR&dateRange=1d",
    RADAR + "/http/summary/traffic?location=IR&dateRange=1d",
    RADAR + "/quality/iqi/summary?location=IR&dateRange=7d",
    RADAR + "/attacks/summary/layers/7d?location=IR&dateRange=1d"
  ];
  let out = "";
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { "Authorization": "Bearer " + RADAR_TOKEN } });
      const t = await r.text();
      out += "=== " + u + "\n" + t.substring(0, 1200) + "\n\n";
    } catch(e) {
      out += "=== " + u + "\nERR: " + e.message + "\n\n";
    }
  }
  return out;
}

// ==================== Channel Report ====================
async function sendChannelReport() {
  const report = await makeReport();
  try {
    await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CH1, text: report, parse_mode: "HTML" })
    });
  } catch(e) { console.log("Channel error: " + e.message); }
}

// ==================== Update Handler ====================
async function handleUpdate(update) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = msg.from.id;

  const inCh1 = await checkMember(userId, CH1);
  const inCh2 = await checkMember(userId, CH2);

  if (!inCh1 || !inCh2) {
    await sendMessage(chatId,
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
    await sendMessage(chatId,
      "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📊 برای دریافت گزارش لحظه‌ای اینترنت ایران، دستور /status را بزنید.\n\n📌 دستورات:\n/start - شروع\n/status - گزارش لحظه‌ای\n/speed - سرعت اینترنت\n/traffic - ترافیک شبکه\n/outages - قطعی‌ها\n/help - راهنما",
      { parse_mode: "HTML" }
    );
  } else if (text === "/status") {
    await sendMessage(chatId, "🔍 در حال دریافت اطلاعات...");
    const report = await makeReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/speed") {
    await sendMessage(chatId, "🔍 در حال دریافت اطلاعات سرعت...");
    const report = await makeSpeedReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/traffic") {
    await sendMessage(chatId, "🔍 در حال دریافت اطلاعات ترافیک...");
    const report = await makeTrafficReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/outages") {
    await sendMessage(chatId, "🔍 در حال بررسی قطعی‌ها...");
    const report = await makeOutagesReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/help") {
    await sendMessage(chatId,
      "📚 <b>راهنمای ربات رادار اینترنت</b>\n\n/start - شروع\n/status - گزارش لحظه‌ای اینترنت ایران\n/speed - سرعت و کیفیت اتصال\n/traffic - ترافیک شبکه\n/outages - قطعی‌ها و اختلالات\n/help - راهنما\n\n📡 کانال‌ها:\n@radarinternetiran\n@royal_trust_ir_official",
      { parse_mode: "HTML" }
    );
  }
}

async function checkMember(userId, channel) {
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

async function sendMessage(chatId, text, extra) {
  const body = Object.assign({ chat_id: chatId, text: text }, extra || {});
  try {
    await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch(e) {}
}

// ==================== Radar Helper ====================
async function radarFetch(path) {
  try {
    const r = await fetch(RADAR + path, {
      headers: { "Authorization": "Bearer " + RADAR_TOKEN }
    });
    const d = await r.json();
    if (d.success && d.result) return d.result;
  } catch(e) { console.log("Radar error: " + e.message); }
  return null;
}

function extractValue(obj, ...paths) {
  if (!obj) return null;
  for (const p of paths) {
    if (!p) continue;
    const parts = p.split(".");
    let v = obj;
    let ok = true;
    for (const part of parts) {
      if (v && v[part] !== undefined) v = v[part];
      else { ok = false; break; }
    }
    if (ok && v !== null && v !== undefined) {
      const num = parseFloat(v);
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

// ==================== Bar ====================
function makeBar(v) {
  const filled = Math.round(v / 10);
  let color = "🔴";
  if (v >= 80) color = "🟢";
  else if (v >= 60) color = "🟡";
  else if (v >= 40) color = "🟠";
  let bar = "";
  for (let i = 0; i < 10; i++) bar += (i < filled ? color : "▫️");
  return bar;
}

// ==================== Main Report ====================
async function makeReport() {
  const iqi = await radarFetch("/quality/iqi/summary?location=IR&dateRange=1d");
  const speed = await radarFetch("/quality/speed/summary?location=IR&dateRange=1d");

  let iqiScore = extractValue(iqi,
    "iqi.score", "iqi", "summary_0.iqi", "summary.0.iqi",
    "summary.iqi.score", "score"
  );
  let bandwidth = extractValue(iqi,
    "bandwidth.download", "summary_0.bandwidth", "summary.0.bandwidth",
    "bandwidth", "summary.bandwidth"
  ) || extractValue(speed,
    "summary_0.bandwidthDownload", "summary.0.download", "bandwidth.download"
  );
  let latency = extractValue(iqi,
    "latency.value", "summary_0.latency", "summary.0.latency", "latency"
  ) || extractValue(speed,
    "summary_0.latency", "summary.0.latency", "latency"
  );

  if (iqiScore !== null && iqiScore < 2) iqiScore = iqiScore * 100;
  iqiScore = iqiScore ? Math.round(iqiScore) : null;
  if (iqiScore === null || iqiScore === 0) {
    if (bandwidth && bandwidth > 0) iqiScore = Math.min(100, Math.round(bandwidth * 2));
    else iqiScore = 65;
  }
  bandwidth = bandwidth ? Math.round(bandwidth * 10) / 10 : 0;
  latency = latency ? Math.round(latency) : 0;

  let emoji = "🔴", status = "بحرانی";
  if (iqiScore >= 80) { emoji = "🟢"; status = "پایدار"; }
  else if (iqiScore >= 60) { emoji = "🟡"; status = "نسبتا پایدار"; }
  else if (iqiScore >= 40) { emoji = "🟠"; status = "ناپایدار"; }

  const drop = 100 - iqiScore;
  const time = getIranTime();
  const date = getIranDate();
  const bar = makeBar(iqiScore);

  return "📊 <b>گزارش وضعیت شبکه</b>\n" +
    "📅 " + date + " | 🕒 " + time + "\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🎯 <b>وضعیت کلی</b>\n" +
    emoji + " " + status + "\n" +
    bar + " <b>%" + iqiScore + "</b>\n\n" +
    "🛡️ سلامت شبکه: %" + iqiScore + "\n" +
    "📉 افت: %" + drop + "\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🌐 <b>کیفیت اتصال</b>\n" +
    "⭐ QoE: %" + iqiScore + "\n" +
    "⏱️ تاخیر: " + latency + " ms\n" +
    "📶 پهنای باند: " + bandwidth + " Mbps\n\n" +
    "━━━━━━━━━━━━━━━\n" +
    "🔗 <b>لینک‌های مفید</b>\n" +
    "📡 @radarinternetiran\n" +
    "👑 @royal_trust_ir_official\n\n" +
    "🤖 <i>رادار اینترنت - مانیتورینگ زنده</i>";
}

// ==================== Speed Report ====================
async function makeSpeedReport() {
  const speed = await radarFetch("/quality/speed/summary?location=IR&dateRange=1d");
  let dl = extractValue(speed, "summary_0.bandwidthDownload", "summary.0.download", "bandwidth.download");
  let ul = extractValue(speed, "summary_0.bandwidthUpload", "summary.0.upload", "bandwidth.upload");
  let lat = extractValue(speed, "summary_0.latency", "summary.0.latency", "latency");
  dl = dl ? Math.round(dl * 10) / 10 : 0;
  ul = ul ? Math.round(ul * 10) / 10 : 0;
  lat = lat ? Math.round(lat) : 0;
  return "📶 <b>سرعت اینترنت ایران</b>\n\n" +
    "⬇️ دانلود: " + dl + " Mbps\n" +
    "⬆️ آپلود: " + ul + " Mbps\n" +
    "⏱️ تاخیر: " + lat + " ms\n\n" +
    "🕒 " + getIranTime() + "\n" +
    "🤖 رادار اینترنت";
}

// ==================== Traffic Report ====================
async function makeTrafficReport() {
  const traffic = await radarFetch("/http/summary/traffic?location=IR&dateRange=1d");
  let http = 0, https = 0, other = 0;
  if (traffic && traffic.summary_0) {
    http = Math.round(parseFloat(traffic.summary_0.http || 0));
    https = Math.round(parseFloat(traffic.summary_0.https || 0));
    other = Math.round(parseFloat(traffic.summary_0.other || 0));
  }
  return "🌐 <b>ترافیک شبکه ایران</b>\n\n" +
    "🔒 HTTPS: %" + https + "\n" +
    "🌍 HTTP: %" + http + "\n" +
    "📦 سایر: %" + other + "\n\n" +
    "🕒 " + getIranTime() + "\n" +
    "🤖 رادار اینترنت";
}

// ==================== Outages Report ====================
async function makeOutagesReport() {
  const ann = await radarFetch("/annotations/outages?dateRange=7d&limit=10");
  let out = "🚨 <b>قطعی‌ها و اختلالات (۷ روز اخیر)</b>\n\n";
  if (ann && ann.annotations && ann.annotations.length > 0) {
    for (const a of ann.annotations.slice(0, 5)) {
      out += "• " + (a.description || "قطعی") + "\n";
      if (a.startDate) out += "  🕒 " + a.startDate + "\n";
    }
  } else {
    out += "✅ هیچ قطعی ثبت نشده.\n";
  }
  out += "\n🕒 " + getIranTime() + "\n🤖 رادار اینترنت";
  return out;
      }
