const BOT_TOKEN = "8579994081:AAFPiuiMPgANy7ARI9QiE7dWWwlnFrwY8gs";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const RADAR_TOKEN = "cfat_NBfqhl13ZTbTlMnA2c7wc32GwKCL3UmWb3qaPEhv1a3e1133";
const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

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
    
    if (request.method !== "POST") return new Response("Radar Bot is running!");
    
    try {
      const update = await request.json();
      await handleUpdate(update);
    } catch(e) {
      console.log("Error: " + e.message);
    }
    
    return new Response("OK");
  }
};

async function handleUpdate(update) {
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const userId = msg.from.id;
  
  const inCh1 = await checkMember(userId, CH1);
  const inCh2 = await checkMember(userId, CH2);
  
  if (!inCh1 || !inCh2) {
    await sendMessage(chatId, "🔒 برای استفاده از ربات، ابتدا در <b>هر دو کانال</b> زیر عضو شوید:\n\n📡 رادار اینترنت\n👑 رویال تراست\n\nپس از عضویت، دوباره /start را بزنید.", {
      parse_mode: "HTML",
      inline_keyboard: [
        [{ text: "📡 عضویت در رادار اینترنت", url: "https://t.me/radarinternetiran" }],
        [{ text: "👑 عضویت در رویال تراست", url: "https://t.me/royal_trust_ir_official" }]
      ]
    });
    return;
  }
  
  if (text === "/start") {
    await sendMessage(chatId, "سلام! 👋\n\nبه ربات <b>رادار اینترنت</b> خوش آمدید.\n\n📊 برای دریافت گزارش لحظه‌ای اینترنت ایران، دستور /status را بزنید.\n\n📌 دستورات:\n/start - شروع\n/status - گزارش لحظه‌ای\n/help - راهنما", { parse_mode: "HTML" });
  } else if (text === "/status") {
    await sendMessage(chatId, "🔍 در حال دریافت اطلاعات...");
    const report = await makeReport();
    await sendMessage(chatId, report, { parse_mode: "HTML" });
  } else if (text === "/help") {
    await sendMessage(chatId, "📚 <b>راهنمای ربات رادار اینترنت</b>\n\n/start - شروع کار با ربات\n/status - دریافت گزارش لحظه‌ای اینترنت ایران\n/help - نمایش همین راهنما\n\n📡 کانال‌ها:\n@radarinternetiran\n@royal_trust_ir_official", { parse_mode: "HTML" });
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
  } catch(e) {
    console.log("Check error: " + e.message);
  }
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
  } catch(e) {
    console.log("Send error: " + e.message);
  }
}

async function makeReport() {
  let iqi = 50;
  let latency = 15;
  try {
    const r = await fetch(
      "https://api.cloudflare.com/client/v4/radar/quality/iqi/summary?location=IR&dateRange=1d",
      { headers: { "Authorization": "Bearer " + RADAR_TOKEN } }
    );
    const d = await r.json();
    if (d.success && d.result) {
      if (d.result.iqi && d.result.iqi.score) iqi = Math.round(d.result.iqi.score);
      if (d.result.latency && d.result.latency.value) latency = Math.round(d.result.latency.value);
    }
  } catch(e) {}
  
  let emoji = "🔴";
  let status = "بحرانی";
  if (iqi >= 80) { emoji = "🟢"; status = "پایدار"; }
  else if (iqi >= 60) { emoji = "🟡"; status = "نسبتا پایدار"; }
  else if (iqi >= 40) { emoji = "🟠"; status = "ناپایدار"; }
  
  const drop = 100 - iqi;
  const time = new Date().toLocaleTimeString("fa-IR");
  
  return "📊 <b>گزارش وضعیت شبکه</b>\n\n" +
    "وضعیت: " + emoji + " <b>" + status + "</b>\n" +
    "🛡️ سلامت شبکه: %" + iqi + "\n" +
    "📉 افت: %" + drop + "\n\n" +
    "🌐 <b>کیفیت اتصال</b>\n" +
    "⭐ QoE: %" + iqi + "\n" +
    "⏱️ تاخیر: " + latency + " ms\n\n" +
    "🕒 " + time + "\n" +
    "🤖 رادار اینترنت";
}
