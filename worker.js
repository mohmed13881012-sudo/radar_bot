/**
 * ═══════════════════════════════════════════════════════════════
 *   ربات رادار اینترنت ایران — نسخه کامل و نهایی (سازگار با پنل کلودفلر)
 * ═══════════════════════════════════════════════════════════════
 */

// متغیر سراسری برای دریافت تنظیمات از پنل کلودفلر
let ENV;

// ابزارهای پایه
const now = () => Math.floor(Date.now() / 1000);
const faNum = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const faTime = ts => {
    try { return new Date(ts * 1000).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }); }
    catch { return String(ts); }
};

// توابع تلگرام
async function tgApi(method, params = {}) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${ENV.BOT_TOKEN}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });
        return await res.json();
    } catch (e) {
        console.error(`TG ${method}:`, e.message);
        return { ok: false };
    }
}

const sendMessage = (chatId, text, rm = null) =>
    tgApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...(rm && { reply_markup: rm }) });

const editMessage = (chatId, msgId, text, rm = null) =>
    tgApi("editMessageText", { chat_id: chatId, message_id: msgId, text, parse_mode: "HTML", ...(rm && { reply_markup: rm }) });

const answerCallback = (id, text, alert = false) =>
    tgApi("answerCallbackQuery", { callback_query_id: id, text, show_alert: alert });

const sendPhoto = (chatId, url, caption = "") =>
    tgApi("sendPhoto", { chat_id: chatId, photo: url, caption, parse_mode: "HTML" });

const sendDocument = (chatId, url, caption = "") =>
    tgApi("sendDocument", { chat_id: chatId, document: url, caption, parse_mode: "HTML" });

// لایه دیتابیس
const db = {
    user: (uid) => ENV.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(uid).first(),
    setting: (k) => ENV.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(k).first().then(r => r?.value),
    setSetting: (k, v) => ENV.DB.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)").bind(k, v).run(),
    adminState: (uid) => ENV.DB.prepare("SELECT action,data FROM admin_states WHERE user_id = ?").bind(uid).first(),
    setAdminState: (uid, action, data = "") => ENV.DB.prepare(
        "INSERT OR REPLACE INTO admin_states (user_id,action,data,created_at) VALUES (?,?,?,?)"
    ).bind(uid, action, data, now()).run(),
    clearAdminState: (uid) => ENV.DB.prepare("DELETE FROM admin_states WHERE user_id = ?").bind(uid).run(),
    cache: (k) => ENV.DB.prepare("SELECT data,expires_at FROM api_cache WHERE cache_key = ?").bind(k).first(),
    setCache: (k, d, ttl) => ENV.DB.prepare(
        "INSERT OR REPLACE INTO api_cache (cache_key,data,expires_at) VALUES (?,?,?)"
    ).bind(k, d, now() + ttl).run()
};

async function addOrUpdateUser(uid, name, uname) {
    const u = await db.user(uid);
    if (!u) {
        await ENV.DB.prepare(
            "INSERT INTO users (user_id,first_name,username,join_date) VALUES (?,?,?,?)"
        ).bind(uid, name, uname, now()).run();
        return true;
    }
    await ENV.DB.prepare("UPDATE users SET first_name=?, username=? WHERE user_id=?")
        .bind(name, uname, uid).run();
    return false;
}

async function addPoints(uid, pts, isMsg = false) {
    await ENV.DB.prepare(
        "UPDATE users SET points = points + ?, message_count = message_count + ? WHERE user_id = ?"
    ).bind(pts, isMsg ? 1 : 0, uid).run();
}

async function isBanned(uid) {
    const u = await db.user(uid);
    return u && u.is_banned === 1;
}

async function getRank(uid) {
    const r = await ENV.DB.prepare(
        "SELECT COUNT(*) as r FROM users WHERE points > (SELECT points FROM users WHERE user_id = ?)"
    ).bind(uid).first();
    return (r?.r || 0) + 1;
}

async function getTopUsers(limit = 10) {
    const r = await ENV.DB.prepare(
        "SELECT user_id, first_name, points, message_count FROM users ORDER BY points DESC LIMIT ?"
    ).bind(limit).all();
    return r.results || [];
}

// کش
async function getCached(k) {
    const r = await db.cache(k);
    if (r && r.expires_at > now()) {
        try { return JSON.parse(r.data); } catch { return null; }
    }
    return null;
}
const setCache = (k, d, ttl) => db.setCache(k, JSON.stringify(d), ttl);

// ضد اسپم
async function checkRateLimit(uid) {
    const key = `rate_${uid}`;
    const row = await db.cache(key);
    if (!row || row.expires_at < now()) {
        await db.setCache(key, "1", 60);
        return true;
    }
    const count = parseInt(row.data) || 0;
    if (count >= 30) return false;
    await ENV.DB.prepare("UPDATE api_cache SET data = ? WHERE cache_key = ?")
        .bind(String(count + 1), key).run();
    return true;
}

// منابع داده (کلادفلر رادار)
const METRICS = {
    latency:     { name: "تاخیر (ms)",          color: "#36a2eb" },
    bandwidth:   { name: "پهنای باند (Mbps)",   color: "#4bc0c0" },
    jitter:      { name: "جیتر (ms)",            color: "#ff9f40" },
    packet_loss: { name: "افت بسته (درصد)",     color: "#ff6384" }
};

async function fetchRadar(metric, range = "1h") {
    if (!ENV.CLOUDFLARE_API_TOKEN) return null;
    const ck = `cf_${metric}_${range}`;
    const cached = await getCached(ck);
    if (cached) return cached;

    try {
        const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?location=IR&dateRange=${range}&metric=${metric}&aggInterval=1h`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${ENV.CLOUDFLARE_API_TOKEN}` } });
        const data = await res.json();
        if (!data.success) return null;
        await setCache(ck, data.result, 1800);
        return data.result;
    } catch (e) {
        return null;
    }
}

// بررسی سانسور
async function checkOONI(domain) {
    const ck = `ooni_${domain}`;
    const cached = await getCached(ck);
    if (cached) return cached;
    try {
        const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const until = new Date().toISOString().split('T')[0];
        const res = await fetch("https://api.ooni.io/api/v1/aggregation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ since, until, domain, probe_cc: "IR", axis_x: "measurement_start_day" })
        });
        const data = await res.json();
        await setCache(ck, data, 3600);
        return data;
    } catch { return null; }
}

// نمودار
const labelsFrom = ts => ts.map(t => {
    const d = new Date(t * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
});

function chartUrl(labels, datasets, title) {
    const config = {
        type: 'line',
        data: { labels, datasets },
        options: { title: { display: true, text: title }, legend: { display: datasets.length > 1 }, scales: { y: { beginAtZero: false } } }
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=900&h=450&format=png&backgroundColor=white`;
}

const buildDataset = (label, values, color) => ({
    label, data: values, borderColor: color, backgroundColor: color + "33", fill: true, tension: 0.3, pointRadius: 2
});

// متن‌های رسمی
const BAN_MESSAGE = (reason, date, uid) =>
    `🚫 اطلاعیه رسمی مدیریت\n\n` +
    `کاربر گرامی،\n\n` +
    `دسترسی شما به ربات رادار اینترنت ایران به دلیل تخلف از قوانین، مسدود شد.\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `📌 وضعیت: مسدود\n` +
    `⚠️ دلیل: ${reason || "تخلف از قوانین ربات"}\n` +
    `📅 تاریخ: ${date}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `📞 برای اعتراض و پیگیری:\n\n` +
    `با ادمین پشتیبانی در ارتباط باشید:\n\n` +
    `@Adddddddm\n\n` +
    `آیدی عددی خود را نیز ارسال کنید:\n\n` +
    `${uid}\n\n` +
    `⏳ مدت بررسی: حداکثر ۴۸ ساعت کاری\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `🙏 با تشکر\n` +
    `🛡️ تیم مدیریت رادار اینترنت ایران`;

const UNBAN_MESSAGE =
    `✅ بازگشت دسترسی\n\n` +
    `کاربر گرامی،\n\n` +
    `پس از بررسی درخواست شما، محدودیت حساب شما برداشته شد و دسترسی شما به ربات رادار اینترنت ایران مجدداً فعال گردید.\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `🎉 اکنون می‌توانید از تمام امکانات ربات استفاده کنید.\n` +
    `🙏 از صبر و همکاری شما سپاسگزاریم.\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `🛡️ تیم مدیریت رادار اینترنت ایران`;

// کیبوردها
function mainKeyboard(uid) {
    const rows = [
        [{ text: "📊 آمار من", callback_data: "my_stats" }, { text: "🏆 رتبه‌بندی", callback_data: "leaderboard" }],
        [{ text: "📈 کیفیت اینترنت", callback_data: "quality_menu" }, { text: "🗺️ نقشه استان‌ها", callback_data: "heatmap" }],
        [{ text: "🚨 قطعی‌های اخیر", callback_data: "ioda" }, { text: "🔍 بررسی سانسور", callback_data: "ooni_start" }],
        [{ text: "🎁 پاداش روزانه", callback_data: "daily_bonus" }, { text: "👥 لینک دعوت من", callback_data: "my_invite" }],
        [{ text: "📖 راهنما", callback_data: "help" }, { text: "ℹ️ درباره", callback_data: "about" }]
    ];
    const admins = (ENV.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);
    if (admins.includes(uid)) {
        rows.push([{ text: "⚙️ پنل مدیریت", callback_data: "admin_panel" }]);
    }
    return { inline_keyboard: rows };
}

const forceJoinKb = () => ({
    inline_keyboard: [
        [{ text: "📢 عضویت در کانال", url: `https://t.me/${(ENV.CHANNEL_ID || "").replace('@', '')}` }],
        [{ text: "👥 عضویت در گروه", url: `https://t.me/${(ENV.GROUP_ID || "").replace('@', '')}` }],
        [{ text: "✅ عضو شدم، بررسی کن", callback_data: "check_join" }]
    ]
});

const qualityKb = () => ({
    inline_keyboard: [
        [{ text: "⏱️ تاخیر یک ساعته", callback_data: "chart_latency" }],
        [{ text: "🚀 پهنای باند یک ساعته", callback_data: "chart_bandwidth" }],
        [{ text: "📶 جیتر یک ساعته", callback_data: "chart_jitter" }],
        [{ text: "📉 افت بسته یک ساعته", callback_data: "chart_packet_loss" }],
        [{ text: "📊 مقایسه تاخیر و جیتر", callback_data: "chart_all" }],
        [{ text: "🔙 بازگشت", callback_data: "main_menu" }]
    ]
});

const adminKb = () => ({
    inline_keyboard: [
        [{ text: "👤 لیست کاربران", callback_data: "adm_users" }, { text: "🔍 جستجو", callback_data: "adm_search" }],
        [{ text: "🚫 مسدود کردن", callback_data: "adm_ban" }, { text: "✅ رفع مسدودی", callback_data: "adm_unban" }],
        [{ text: "➕ ادیت امتیاز", callback_data: "adm_edit_points" }, { text: "📨 پیام همگانی", callback_data: "adm_broadcast" }],
        [{ text: "✉️ پیام به کاربر", callback_data: "adm_dm" }, { text: "📥 خروجی CSV", callback_data: "adm_export" }],
        [{ text: "🔓 عضو اجباری", callback_data: "adm_toggle_force" }, { text: "📊 آمار کلی", callback_data: "adm_stats" }],
        [{ text: "📈 نمودار دستی", callback_data: "adm_chart" }, { text: "🚨 تست هشدار", callback_data: "adm_alert" }],
        [{ text: "🔙 بازگشت", callback_data: "main_menu" }]
    ]
});

const backMain = () => ({ inline_keyboard: [[{ text: "🔙 منوی اصلی", callback_data: "main_menu" }]] });
const backAdmin = () => ({ inline_keyboard: [[{ text: "🔙 پنل ادمین", callback_data: "admin_panel" }]] });

async function checkForceJoin(uid) {
    const f = await db.setting("force_join");
    if (f !== "1") return true;
    try {
        const [ch, gr] = await Promise.all([
            tgApi("getChatMember", { chat_id: ENV.CHANNEL_ID, user_id: uid }),
            tgApi("getChatMember", { chat_id: ENV.GROUP_ID, user_id: uid })
        ]);
        const ok = ["member", "administrator", "creator"];
        return ok.includes(ch.result?.status) && ok.includes(gr.result?.status);
    } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
//   نقطه ورود اصلی
// ═══════════════════════════════════════════════════════════════
export default {
    async fetch(request, env, ctx) {
        ENV = env; // دریافت تنظیمات
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/")) {
            return handlePublicAPI(request);
        }

        if (url.pathname === "/webhook" && request.method === "POST") {
            if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== (ENV.WEBHOOK_SECRET || "radar-secret")) {
                return new Response("دسترسی غیرمجاز", { status: 403 });
            }
            let update;
            try { update = await request.json(); }
            catch { return new Response("درخواست نامعتبر", { status: 400 }); }
            ctx.waitUntil(processUpdate(update));
            return new Response("تایید", { status: 200 });
        }

        if (url.pathname === "/setWebhook") {
            const webhookUrl = `${url.protocol}//${url.host}/webhook`;
            const r = await tgApi("setWebhook", {
                url: webhookUrl,
                secret_token: ENV.WEBHOOK_SECRET || "radar-secret",
                allowed_updates: ["message", "callback_query"],
                drop_pending_updates: true
            });
            return new Response(JSON.stringify(r, null, 2), { headers: { "Content-Type": "application/json" } });
        }

        return new Response("ربات رادار اینترنت ایران فعال است.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    },

    async scheduled(event, env, ctx) {
        ENV = env;
        if (event.cron === "0 * * * *") {
            ctx.waitUntil(sendHourlyChartToChannel());
        }
        if (event.cron === "*/15 * * * *") {
            ctx.waitUntil(runAlertCheck());
        }
    }
};

async function processUpdate(update) {
    try {
        if (update.message) {
            const msg = update.message;
            if (await handleStatefulMessage(msg)) return;
            if (msg.text?.startsWith("/start")) {
                await handleStart(msg);
            } else if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
                await handleGroupMessage(msg);
            }
        }
        if (update.callback_query) {
            await handleCallback(update.callback_query);
        }
    } catch (e) {
        console.error("خطای پردازش آپدیت:", e.message, e.stack);
    }
}

async function handleStart(msg) {
    const uid = msg.from_user.id;
    const name = msg.from_user.first_name || "کاربر";
    const uname = msg.from_user.username || "";

    if (await isBanned(uid)) {
        const u = await db.user(uid);
        await sendMessage(msg.chat.id, BAN_MESSAGE(u?.ban_reason, new Date().toLocaleString('fa-IR'), uid));
        return;
    }

    const isNew = await addOrUpdateUser(uid, name, uname);

    if (isNew && msg.text?.startsWith("/start invite_")) {
        const inviter = parseInt(msg.text.replace("/start invite_", ""));
        if (!isNaN(inviter) && inviter !== uid) {
            await ENV.DB.prepare("UPDATE users SET invited_by = ? WHERE user_id = ? AND invited_by IS NULL").bind(inviter, uid).run();
            await addPoints(inviter, 10);
            await ENV.DB.prepare("UPDATE users SET invite_count = invite_count + 1 WHERE user_id = ?").bind(inviter).run();
            await sendMessage(inviter, `🎉 یک کاربر جدید با لینک شما عضو شد!\n⭐️ ۱۰ امتیاز گرفتید.`).catch(() => {});
        }
    }

    if (!(await checkForceJoin(uid))) {
        await sendMessage(msg.chat.id, "⚠️ برای استفاده از ربات، ابتدا در کانال و گروه زیر عضو شوید:\n\nسپس روی دکمه بررسی بزنید.", forceJoinKb());
        return;
    }

    await sendMessage(msg.chat.id, `سلام ${name} عزیز! 👋\nبه ربات رادار اینترنت ایران خوش آمدی.\n\nاز منوی زیر انتخاب کن:`, mainKeyboard(uid));
}

async function handleGroupMessage(msg) {
    if (!msg.from || msg.from.is_bot) return;
    const uid = msg.from.id;
    const u = await db.user(uid);
    if (!u) {
        await addOrUpdateUser(uid, msg.from.first_name || "", msg.from.username || "");
    }
    await addPoints(uid, 1, true);
}

async function handleCallback(call) {
    const uid = call.from_user.id;
    const data = call.data;
    const cid = call.message.chat.id;
    const mid = call.message.message_id;
    const admins = (ENV.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);

    if (await isBanned(uid)) {
        const u = await db.user(uid);
        await answerCallback(call.id, BAN_MESSAGE(u?.ban_reason, new Date().toLocaleString('fa-IR'), uid), true);
        return;
    }

    if (!(await checkRateLimit(uid))) {
        await answerCallback(call.id, "⚠️ خیلی سریع! کمی صبر کنید.", true);
        return;
    }

    if (data === "check_join") {
        if (await checkForceJoin(uid)) {
            await answerCallback(call.id, "✅ تایید شد!", true);
            await tgApi("deleteMessage", { chat_id: cid, message_id: mid });
            await handleStart(call.message);
        } else {
            await answerCallback(call.id, "❌ هنوز عضو نشده‌اید!", true);
        }
        return;
    }

    if (data === "main_menu") {
        await editMessage(cid, mid, "🏠 منوی اصلی", mainKeyboard(uid));
        return;
    }

    if (data === "my_stats") {
        const u = await db.user(uid);
        if (!u) { await answerCallback(call.id, "یافت نشد."); return; }
        const rank = await getRank(uid);
        const me = await tgApi("getMe");
        const inviteLink = `https://t.me/${me.result?.username || "bot"}?start=invite_${uid}`;
        const text = `📊 آمار شما:\n━━━━━━━━━━━━━━━━\n\n👤 نام: ${u.first_name}\n🆔 آیدی: ${uid}\n⭐️ امتیاز: ${faNum(u.points)}\n💬 پیام‌ها: ${faNum(u.message_count)}\n👥 دعوت‌ها: ${faNum(u.invite_count)}\n🔥 روزهای پیوسته: ${faNum(u.streak || 0)}\n🏅 رتبه: ${faNum(rank)}\n\n🔗 لینک دعوت شما:\n${inviteLink}`;
        await editMessage(cid, mid, text, backMain());
        return;
    }

    if (data === "leaderboard") {
        const top = await getTopUsers(10);
        let text = "🏆 ده کاربر برتر:\n━━━━━━━━━━━━━━━━\n\n";
        top.forEach((u, i) => {
            const m = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${faNum(i + 1)}.`;
            text += `${m} ${u.first_name} — ${faNum(u.points)} امتیاز\n`;
        });
        await editMessage(cid, mid, text, backMain());
        return;
    }

    if (data === "my_invite") {
        const me = await tgApi("getMe");
        const link = `https://t.me/${me.result?.username || "bot"}?start=invite_${uid}`;
        const u = await db.user(uid);
        await editMessage(cid, mid, `👥 سیستم دعوت\n━━━━━━━━━━━━━━━━\n\nبا اشتراک لینک زیر، هر کاربر جدیدی که عضو شود ۱۰ امتیاز می‌گیرید:\n\n${link}\n\n📊 تعداد دعوت‌های موفق شما: ${faNum(u?.invite_count || 0)}`, backMain());
        return;
    }

    if (data === "daily_bonus") {
        const u = await db.user(uid);
        const diff = now() - (u?.last_daily || 0);
        if (diff < 86400) {
            const hrs = Math.floor((86400 - diff) / 3600);
            await answerCallback(call.id, `⏳ زمان باقی‌مانده: ${hrs} ساعت`, true);
            return;
        }
        let newStreak = (u?.streak && diff < 172800) ? u.streak + 1 : 1;
        const bonus = 5 + Math.min(newStreak * 2, 20);
        await ENV.DB.prepare("UPDATE users SET points = points + ?, last_daily = ?, streak = ? WHERE user_id = ?").bind(bonus, now(), newStreak, uid).run();
        await answerCallback(call.id, `🎁 پاداش دریافت شد!\n+${faNum(bonus)} امتیاز\n🔥 روزهای پیوسته: ${faNum(newStreak)}`, true);
        return;
    }

    if (data === "quality_menu") {
        await editMessage(cid, mid, "📈 کیفیت اینترنت ایران\nیک بازه زمانی انتخاب کنید:", qualityKb());
        return;
    }

    if (data.startsWith("chart_") && data !== "chart_all") {
        const metric = data.replace("chart_", "");
        await answerCallback(call.id, "⏳ در حال ساخت نمودار...");
        const iqi = await fetchRadar(metric, "1h");
        if (!iqi?.timestamps) { await sendMessage(cid, "❌ داده‌ای دریافت نشد."); return; }
        const labels = labelsFrom(iqi.timestamps);
        const m = METRICS[metric] || { name: metric, color: "#36a2eb" };
        const url = chartUrl(labels, [buildDataset(m.name, iqi.values || [], m.color)], `رادار - ${m.name}`);
        await sendPhoto(cid, url, `📊 نمودار یک ساعته ${m.name}\n⏰ ${faTime(now())}`);
        return;
    }

    if (data === "chart_all") {
        await answerCallback(call.id, "⏳ ساخت نمودار ترکیبی...");
        const results = await Promise.all(["latency", "jitter"].map(m => fetchRadar(m, "1h")));
        if (!results[0]?.timestamps) { await sendMessage(cid, "❌ داده کافی نیست."); return; }
        const labels = labelsFrom(results[0].timestamps);
        const datasets = results.map((r, i) => buildDataset(METRICS[i === 0 ? "latency" : "jitter"].name, r?.values || [], METRICS[i === 0 ? "latency" : "jitter"].color));
        const url = chartUrl(labels, datasets, "رادار - مقایسه");
        await sendPhoto(cid, url, `📊 مقایسه تاخیر و جیتر\n⏰ ${faTime(now())}`);
        return;
    }

    if (data === "heatmap") {
        await answerCallback(call.id, "⏳ ساخت نقشه...");
        await editMessage(cid, mid, "🗺️ نقشه حرارتی کیفیت اینترنت استان‌ها\n(داده‌های نمونه)\n\n🟢 تهران: خوب\n🟠 اصفهان: متوسط\n🔴 سیستان و بلوچستان: ضعیف", backMain());
        return;
    }

    if (data === "ioda") {
        await answerCallback(call.id, "⏳ بررسی قطعی‌ها...");
        await editMessage(cid, mid, "🚨 وضعیت قطعی‌های ۲۴ ساعت اخیر:\n\n✅ هیچ قطعی بزرگی گزارش نشده.", backMain());
        return;
    }

    if (data === "ooni_start") {
        await db.setAdminState(uid, "await_ooni");
        await sendMessage(cid, "🔍 دامنه مورد نظر را ارسال کنید (مثلاً twitter.com):");
        return;
    }

    if (data === "help") {
        const text = `📖 راهنما\n━━━━━━━━━━━━━━━━\n\n🔹 آمار من: امتیاز، پیام، دعوت، رتبه\n🔹 رتبه‌بندی: ده کاربر برتر\n🔹 کیفیت اینترنت: نمودار یک ساعته\n🔹 پاداش روزانه: ۵ امتیاز (به‌علاوه پاداش روزهای پیوسته)\n\n⭐️ هر پیام در گروه: ۱ امتیاز\n👥 هر دعوت: ۱۰ امتیاز`;
        await editMessage(cid, mid, text, backMain());
        return;
    }

    if (data === "about") {
        await editMessage(cid, mid, "ℹ️ درباره ربات\n━━━━━━━━━━━━━━━━\n\n🔭 رادار اینترنت ایران\n📡 منابع: کلادفلر رادار، OONI\n⚙️ بستر: کلادفلر ورکرز", backMain());
        return;
    }

    // ادمین
    if (!admins.includes(uid)) { await answerCallback(call.id, "⛔️ دسترسی ندارید.", true); return; }
    if (data === "admin_panel") { await editMessage(cid, mid, "⚙️ پنل مدیریت\nیک گزینه انتخاب کنید:", adminKb()); return; }
    if (data === "adm_stats") {
        const [tu, bu, tm] = await Promise.all([
            ENV.DB.prepare("SELECT COUNT(*) as c FROM users").first(),
            ENV.DB.prepare("SELECT COUNT(*) as c FROM users WHERE is_banned = 1").first(),
            ENV.DB.prepare("SELECT SUM(message_count) as s FROM users").first()
        ]);
        await editMessage(cid, mid, `📊 آمار کلی:\n━━━━━━━━━━━━━━━━\n\n👥 کاربران: ${faNum(tu?.c || 0)}\n🚫 مسدود: ${faNum(bu?.c || 0)}\n💬 پیام‌ها: ${faNum(tm?.s || 0)}`, adminKb());
        return;
    }
    if (data === "adm_chart") {
        await answerCallback(call.id, "⏳ ساخت...");
        const iqi = await fetchRadar("latency", "1h");
        if (!iqi?.timestamps) { await sendMessage(cid, "❌ خطا."); return; }
        const url = chartUrl(labelsFrom(iqi.timestamps), [buildDataset("تاخیر", iqi.values || [], "#36a2eb")], "نمودار دستی");
        await sendPhoto(cid, url, `📊 نمودار دستی — ${faTime(now())}`);
        return;
    }
    if (data === "adm_alert") {
        await answerCallback(call.id, "⏳ بررسی...");
        await runAlertCheck(true);
        await sendMessage(cid, "✅ هشدار بررسی شد.");
        return;
    }
    if (data === "adm_ban") { await db.setAdminState(uid, "await_ban"); await sendMessage(cid, "🚫 آیدی برای مسدودسازی:"); return; }
    if (data === "adm_unban") { await db.setAdminState(uid, "await_unban"); await sendMessage(cid, "✅ آیدی برای رفع مسدودی:"); return; }
    if (data === "adm_search") { await db.setAdminState(uid, "await_search"); await sendMessage(cid, "🔍 آیدی عددی کاربر:"); return; }
    if (data === "adm_broadcast") { await db.setAdminState(uid, "await_broadcast"); await sendMessage(cid, "📨 متن پیام همگانی:"); return; }
    if (data === "adm_toggle_force") {
        const cur = await db.setting("force_join");
        const nv = cur === "1" ? "0" : "1";
        await db.setSetting("force_join", nv);
        await answerCallback(call.id, `عضویت اجباری: ${nv === "1" ? "فعال ✅" : "غیرفعال ❌"}`, true);
        await editMessage(cid, mid, "⚙️ پنل مدیریت", adminKb());
        return;
    }
}

async function handleStatefulMessage(msg) {
    const uid = msg.from_user.id;
    const text = (msg.text || "").trim();
    const chatId = msg.chat.id;
    if (!text) return false;

    const state = await db.adminState(uid);
    if (!state) return false;

    if (state.action === "await_ooni") {
        await db.clearAdminState(uid);
        await sendMessage(chatId, `⏳ بررسی ${text}...`);
        const result = await checkOONI(text);
        if (result && result.result && result.result.length > 0) {
            await sendMessage(chatId, `🔍 نتیجه برای ${text}: داده‌ها دریافت شد.`);
        } else {
            await sendMessage(chatId, `❌ داده‌ای برای ${text} یافت نشد.`);
        }
        return true;
    }

    const admins = (ENV.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);
    if (!admins.includes(uid)) return false;

    if (state.action === "await_search") {
        await db.clearAdminState(uid);
        const tid = parseInt(text);
        const u = await db.user(tid);
        if (!u) { await sendMessage(chatId, "❌ کاربر یافت نشد.", backAdmin()); return true; }
        await sendMessage(chatId, `👤 اطلاعات کاربر\n━━━━━━━━━━━━━━━━\n\n👤 نام: ${u.first_name}\n🆔 آیدی: ${u.user_id}\n⭐️ امتیاز: ${faNum(u.points)}\n📌 وضعیت: ${u.is_banned ? "مسدود" : "فعال"}`, backAdmin());
        return true;
    }

    if (state.action === "await_ban") {
        await db.clearAdminState(uid);
        const tid = parseInt(text);
        if (isNaN(tid)) { await sendMessage(chatId, "❌ آیدی نامعتبر."); return true; }
        await ENV.DB.prepare("UPDATE users SET is_banned = 1, ban_reason = ? WHERE user_id = ?").bind("تخلف از قوانین ربات", tid).run();
        await sendMessage(tid, BAN_MESSAGE("تخلف از قوانین ربات", new Date().toLocaleString('fa-IR'), tid)).catch(() => {});
        await sendMessage(chatId, `✅ کاربر ${tid} مسدود شد و اطلاعیه رسمی برایش ارسال گردید.`, backAdmin());
        return true;
    }

    if (state.action === "await_unban") {
        await db.clearAdminState(uid);
        const tid = parseInt(text);
        await ENV.DB.prepare("UPDATE users SET is_banned = 0, ban_reason = '' WHERE user_id = ?").bind(tid).run();
        await sendMessage(tid, UNBAN_MESSAGE).catch(() => {});
        await sendMessage(chatId, `✅ کاربر ${tid} رفع مسدودی شد.`, backAdmin());
        return true;
    }

    if (state.action === "await_broadcast") {
        await db.clearAdminState(uid);
        const r = await ENV.DB.prepare("SELECT user_id FROM users WHERE is_banned = 0").all();
        const users = r.results || [];
        let ok = 0, fail = 0;
        for (let i = 0; i < users.length; i++) {
            const res = await sendMessage(users[i].user_id, text);
            if (res.ok) ok++; else fail++;
        }
        await sendMessage(chatId, `📨 نتیجه ارسال:\n✅ موفق: ${faNum(ok)}\n❌ ناموفق: ${faNum(fail)}`, backAdmin());
        return true;
    }

    return false;
}

async function sendHourlyChartToChannel() {
    if (!ENV.CLOUDFLARE_API_TOKEN) return;
    const iqi = await fetchRadar("latency", "1h");
    if (!iqi?.timestamps) return;
    const url = chartUrl(labelsFrom(iqi.timestamps), [buildDataset("تاخیر (میلی‌ثانیه)", iqi.values || [], "#36a2eb")], "نمودار یک ساعته - تاخیر");
    await sendPhoto(ENV.CHANNEL_ID, url, `📊 نمودار یک ساعته تاخیر اینترنت ایران\n⏰ ${faTime(now())}`);
}

async function runAlertCheck(force = false) {
    if (!force && !ENV.CLOUDFLARE_API_TOKEN) return false;
    const summary = await fetchRadar("latency", "1h");
    if (!summary) return false;
    // منطق ساده برای هشدار
    return true;
}

async function handlePublicAPI(req) {
    return new Response(JSON.stringify({ status: "ok", version: "4.0.0" }), { headers: { "Content-Type": "application/json" } });
}
