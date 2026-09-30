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
    
    // مسیر دستی برای فرستادن گزارش به کانال (برای تست)
    if (url.pathname === "/sendreport") {
      await sendChannelReport();
      return new Response("Report sent!");
    }
    
    if (request.method !== "POST") return new Response("Radar Bot is running!");
    
    try {
      const update = await request.json();
      await handleUpdate(update);
    } catch(e) {
      console.log("Error: " + e.message);
    }
    
    return new Response("OK");
  },
  
  // این بخش هر ۱ ساعت خودکار اجرا می‌شه
  async scheduled(event, env, ctx) {
    await sendChannelReport();
  }
};

// فرستادن گزارش به کانال رادار اینترنت
async function sendChannelReport() {
  const report = await makeReport();
  try {
    await fetch(TG + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CH1,
        text: report,
        parse_mode: "HTML"
      })
    });
  } catch(e) {
    console.log("Channel send error: " + e.message);
  }
}

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
  try {
    const iqiResponse = await fetch(
      "https://api.cloudflare.com/client/v4/radar/quality/iqi/summary?location=IR&dateRange=1d&metric=bandwidth",
      { headers: { "Authorization": "Bearer " + RADAR_TOKEN } }
    );
    const iqiData = await iqiResponse.json();

    const latencyResponse = await fetch(
      "https://api.cloudflare.com/client/v4/radar/quality/iqi/summary?location=IR&dateRange=1d&metric=latency",
      { headers: { "Authorization": "Bearer " + RADAR_TOKEN } }
    );
    const latencyData = await latencyResponse.json();

    let bandwidth = 0;
    let latency = 0;

    if (iqiData.success && iqiData.result && iqiData.result.summary_0) {
      bandwidth = Math.round(parseFloat(iqiData.result.summary_0.p50));
    }
    if (latencyData.success && latencyData.result && latencyData.result.summary_0) {
      latency = Math.round(parseFloat(latencyData.result.summary_0.p50));
    }

    let iqi = Math.min(100, Math.round(bandwidth / 5));
    if (iqi > 100) iqi = 100;
    if (iqi < 10) iqi = 10;

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
      "⏱️ تاخیر: " + latency + " ms\n" +
      "📶 پهنای باند: " + bandwidth + " Mbps\n\n" +
      "🕒 " + time + "\n" +
      "🤖 رادار اینترنت";
  } catch(e) {
    return "❌ <b>خطا در دریافت اطلاعات</b>\n\nمتاسفانه در حال حاضر امکان دریافت گزارش وجود ندارد.\n\n🕒 " + new Date().toLocaleTimeString("fa-IR");
  }
      }
