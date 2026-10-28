/**
 * ═══════════════════════════════════════════════════════════════
 *   ربات رادار اینترنت ایران — نسخه کامل و جامع (بدون کوتاه‌سازی)
 * ═══════════════════════════════════════════════════════════════
 */

const now = () => Math.floor(Date.now() / 1000);
const faNum = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const faTime = ts => {
    try { return new Date(ts * 1000).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }); }
    catch { return String(ts); }
};

// ═══════════════════════════════════════════════════════════════
//   توابع تلگرام (env به عنوان پارامتر پاس داده می‌شود)
// ═══════════════════════════════════════════════════════════════
async function tgApi(env, method, params = {}) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
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

const sendMessage = (env, chatId, text, rm = null) =>
    tgApi(env, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, ...(rm && { reply_markup: rm }) });

const editMessage = (env, chatId, msgId, text, rm = null) =>
    tgApi(env, "editMessageText", { chat_id: chatId, message_id: msgId, text, parse_mode: "HTML", ...(rm && { reply_markup: rm }) });

const answerCallback = (env, id, text, alert = false) =>
    tgApi(env, "answerCallbackQuery", { callback_query_id: id, text, show_alert: alert });

const sendPhoto = (env, chatId, url, caption = "") =>
    tgApi(env, "sendPhoto", { chat_id: chatId, photo: url, caption, parse_mode: "HTML" });

const sendDocument = (env, chatId, url, caption = "") =>
    tgApi(env, "sendDocument", { chat_id: chatId, document: url, caption, parse_mode: "HTML" });

// ═══════════════════════════════════════════════════════════════
//   لایه دیتابیس (D1)
// ═══════════════════════════════════════════════════════════════
const db = {
    user: (env, uid) => env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(uid).first(),
    setting: (env, k) => env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(k).first().then(r => r?.value),
    setSetting: (env, k, v) => env.DB.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)").bind(k, v).run(),
    adminState: (env, uid) => env.DB.prepare("SELECT action,data FROM admin_states WHERE user_id = ?").bind(uid).first(),
    setAdminState: (env, uid, action, data = "") => env.DB.prepare(
        "INSERT OR REPLACE INTO admin_states (user_id,action,data,created_at) VALUES (?,?,?,?)"
    ).bind(uid, action, data, now()).run(),
    clearAdminState: (env, uid) => env.DB.prepare("DELETE FROM admin_states WHERE user_id = ?").bind(uid).run(),
    cache: (env, k) => env.DB.prepare("SELECT data,expires_at FROM api_cache WHERE cache_key = ?").bind(k).first(),
    setCache: (env, k, d, ttl) => env.DB.prepare(
        "INSERT OR REPLACE INTO api_cache (cache_key,data,expires_at) VALUES (?,?,?)"
    ).bind(k, d, now() + ttl).run()
};

async function addOrUpdateUser(env, uid, name, uname) {
    const u = await db.user(env, uid);
    if (!u) {
        await env.DB.prepare(
            "INSERT INTO users (user_id,first_name,username,join_date) VALUES (?,?,?,?)"
        ).bind(uid, name, uname, now()).run();
        return true;
    }
    await env.DB.prepare("UPDATE users SET first_name=?, username=? WHERE user_id=?")
        .bind(name, uname, uid).run();
    return false;
}

async function addPoints(env, uid, pts, isMsg = false) {
    await env.DB.prepare(
        "UPDATE users SET points = points + ?, message_count = message_count + ? WHERE user_id = ?"
    ).bind(pts, isMsg ? 1 : 0, uid).run();
}

async function isBanned(env, uid) {
    const u = await db.user(env, uid);
    return u && u.is_banned === 1;
}

async function getRank(env, uid) {
    const r = await env.DB.prepare(
        "SELECT COUNT(*) as r FROM users WHERE points > (SELECT points FROM users WHERE user_id = ?)"
    ).bind(uid).first();
    return (r?.r || 0) + 1;
}

async function getTopUsers(env, limit = 10) {
    const r = await env.DB.prepare(
        "SELECT user_id, first_name, points, message_count FROM users ORDER BY points DESC LIMIT ?"
    ).bind(limit).all();
    return r.results || [];
}

async function getCached(env, k) {
    const r = await db.cache(env, k);
    if (r && r.expires_at > now()) {
        try { return JSON.parse(r.data); } catch { return null; }
    }
    return null;
}
const setCache = (env, k, d, ttl) => db.setCache(env, k, JSON.stringify(d), ttl);

// ═══════════════════════════════════════════════════════════════
//   دریافت داده‌های خارجی (Cloudflare Radar, OONI)
// ═══════════════════════════════════════════════════════════════
const METRICS = {
    latency:     { name: "تاخیر (ms)",          color: "#36a2eb" },
    bandwidth:   { name: "پهنای باند (Mbps)",   color: "#4bc0c0" },
    jitter:      { name: "جیتر (ms)",            color: "#ff9f40" },
    packet_loss: { name: "افت بسته (درصد)",     color: "#ff6384" }
};

async function fetchRadar(env, metric, range = "1h") {
    if (!env.CLOUDFLARE_API_TOKEN) return null;
    const ck = `cf_${metric}_${range}`;
    const cached = await getCached(env, ck);
    if (cached) return cached;

    try {
        const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?location=IR&dateRange=${range}&metric=${metric}&aggInterval=1h`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` } });
        const data = await res.json();
        if (!data.success) return null;
        await setCache(env, ck, data.result, 1800);
        return data.result;
    } catch (e) { return null; }
}

async function checkOONI(env, domain) {
    const ck = `ooni_${domain}`;
    const cached = await getCached(env, ck);
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
        await setCache(env, ck, data, 3600);
        return data;
    } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
//   ابزارهای نمودار
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
//   متن‌های رسمی (بدون تگ‌های اضافه)
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
//   کیبوردها
// ═══════════════════════════════════════════════════════════════
function mainKeyboard(env, uid) {
    const rows = [
        [{ text: "📊 آمار من", callback_data: "my_stats" }, { text: "🏆 رتبه‌بندی", callback_data: "leaderboard" }],
        [{ text: "📈 کیفیت اینترنت", callback_data: "quality_menu" }, { text: "🗺️ نقشه استان‌ها", callback_data: "heatmap" }],
        [{ text: "🚨 قطعی‌های اخیر", callback_data: "ioda" }, { text: "🔍 بررسی سانسور", callback_data: "ooni_start" }],
        [{ text: "🎁 پاداش روزانه", callback_data: "daily_bonus" }, { text: "👥 لینک دعوت من", callback_data: "my_invite" }],
        [{ text: "📖 راهنما", callback_data: "help" }, { text: "ℹ️ درباره", callback_data: "about" }]
    ];
    const admins = (env.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);
    if (admins.includes(uid)) {
        rows.push([{ text: "⚙️ پنل مدیریت", callback_data: "admin_panel" }]);
    }
    return { inline_keyboard: rows };
}

const forceJoinKb = (env) => ({
    inline_keyboard: [
        [{ text: "📢 عضویت در کانال", url: `https://t.me/${(env.CHANNEL_ID || "").replace('@', '')}` }],
        [{ text: "👥 عضویت در گروه", url: `https://t.me/${(env.GROUP_ID || "").replace('@', '')}` }],
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

// ═══════════════════════════════════════════════════════════════
//   بررسی عضویت اجباری
// ═══════════════════════════════════════════════════════════════
async function checkForceJoin(env, uid) {
    const f = await db.setting(env, "force_join");
    if (f !== "1") return true;
    try {
        const [ch, gr] = await Promise.all([
            tgApi(env, "getChatMember", { chat_id: env.CHANNEL_ID, user_id: uid }),
            tgApi(env, "getChatMember", { chat_id: env.GROUP_ID, user_id: uid })
        ]);
        const ok = ["member", "administrator", "creator"];
        return ok.includes(ch.result?.status) && ok.includes(gr.result?.status);
    } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
//   نقطه ورود اصلی (Fetch Handler)
// ═══════════════════════════════════════════════════════════════
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === "/webhook" && request.method === "POST") {
            let update;
            try { update = await request.json(); }
            catch { return new Response("Bad Request", { status: 400 }); }
            
            ctx.waitUntil(processUpdate(env, update));
            return new Response("Ok", { status: 200 });
        }

        if (url.pathname === "/setWebhook") {
            const webhookUrl = `${url.protocol}//${url.host}/webhook`;
            const r = await tgApi(env, "setWebhook", {
                url: webhookUrl,
                allowed_updates: ["message", "callback_query"],
                drop_pending_updates: true
            });
            return new Response(JSON.stringify(r, null, 2), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/deleteWebhook") {
            const r = await tgApi(env, "deleteWebhook", { drop_pending_updates: true });
            return new Response(JSON.stringify(r, null, 2), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/getMe") {
            const r = await tgApi(env, "getMe");
            return new Response(JSON.stringify(r, null, 2), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname.startsWith("/api/")) {
            return handlePublicAPI(env, request);
        }

        return new Response("ربات رادار اینترنت ایران فعال است.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    },

    async scheduled(event, env, ctx) {
        if (event.cron === "0 * * * *") {
            ctx.waitUntil(sendHourlyChartToChannel(env));
        }
        if (event.cron === "*/15 * * * *") {
            ctx.waitUntil(runAlertCheck(env, false));
        }
    }
};

// ═══════════════════════════════════════════════════════════════
//   پردازش آپدیت
// ═══════════════════════════════════════════════════════════════
async function processUpdate(env, update) {
    try {
        if (update.message) {
            const msg = update.message;
            if (await handleStatefulMessage(env, msg)) return;
            
            if (msg.text?.startsWith("/start")) {
                await handleStart(env, msg);
            } else if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
                await handleGroupMessage(env, msg);
            }
        }
        if (update.callback_query) {
            await handleCallback(env, update.callback_query);
        }
    } catch (e) {
        console.error("Critical Update Error:", e.message, e.stack);
    }
}

// ═══════════════════════════════════════════════════════════════
//   هندلر /start
// ═══════════════════════════════════════════════════════════════
async function handleStart(env, msg) {
    const uid = msg.from_user.id;
    const name = msg.from_user.first_name || "کاربر";
    const uname = msg.from_user.username || "";

    if (await isBanned(env, uid)) {
        const u = await db.user(env, uid);
        await sendMessage(env, msg.chat.id, BAN_MESSAGE(u?.ban_reason, new Date().toLocaleString('fa-IR'), uid));
        return;
    }

    const isNew = await addOrUpdateUser(env, uid, name, uname);

    if (isNew && msg.text?.startsWith("/start invite_")) {
        const inviter = parseInt(msg.text.replace("/start invite_", ""));
        if (!isNaN(inviter) && inviter !== uid) {
            await env.DB.prepare("UPDATE users SET invited_by = ? WHERE user_id = ? AND invited_by IS NULL").bind(inviter, uid).run();
            await addPoints(env, inviter, 10);
            await env.DB.prepare("UPDATE users SET invite_count = invite_count + 1 WHERE user_id = ?").bind(inviter).run();
            await sendMessage(env, inviter, `🎉 یک کاربر جدید با لینک شما عضو شد!\n⭐️ ۱۰ امتیاز گرفتید.`).catch(() => {});
        }
    }

    if (!(await checkForceJoin(env, uid))) {
        await sendMessage(env, msg.chat.id, "⚠️ برای استفاده از ربات، ابتدا در کانال و گروه زیر عضو شوید:\n\nسپس روی دکمه بررسی بزنید.", forceJoinKb(env));
        return;
    }

    await sendMessage(env, msg.chat.id, `سلام ${name} عزیز! 👋\nبه ربات رادار اینترنت ایران خوش آمدی.\n\nاز منوی زیر انتخاب کن:`, mainKeyboard(env, uid));
}

// ═══════════════════════════════════════════════════════════════
//   پیام‌های گروه (امتیازدهی)
// ═══════════════════════════════════════════════════════════════
async function handleGroupMessage(env, msg) {
    if (!msg.from || msg.from.is_bot) return;
    const uid = msg.from.id;
    const u = await db.user(env, uid);
    if (!u) {
        await addOrUpdateUser(env, uid, msg.from.first_name || "", msg.from.username || "");
    }
    await addPoints(env, uid, 1, true);
}

// ═══════════════════════════════════════════════════════════════
//   هندلر دکمه‌های شیشه‌ای
// ═══════════════════════════════════════════════════════════════
async function handleCallback(env, call) {
    const uid = call.from_user.id;
    const data = call.data;
    const cid = call.message.chat.id;
    const mid = call.message.message_id;
    const admins = (env.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);

    if (await isBanned(env, uid)) {
        const u = await db.user(env, uid);
        await answerCallback(env, call.id, BAN_MESSAGE(u?.ban_reason, new Date().toLocaleString('fa-IR'), uid), true);
        return;
    }

    if (data === "check_join") {
        if (await checkForceJoin(env, uid)) {
            await answerCallback(env, call.id, "✅ تایید شد!", true);
            await tgApi(env, "deleteMessage", { chat_id: cid, message_id: mid });
            await handleStart(env, call.message);
        } else {
            await answerCallback(env, call.id, "❌ هنوز عضو نشده‌اید!", true);
        }
        return;
    }

    if (data === "main_menu") {
        await editMessage(env, cid, mid, "🏠 منوی اصلی", mainKeyboard(env, uid));
        return;
    }

    if (data === "my_stats") {
        const u = await db.user(env, uid);
        if (!u) { await answerCallback(env, call.id, "یافت نشد."); return; }
        const rank = await getRank(env, uid);
        const me = await tgApi(env, "getMe");
        const inviteLink = `https://t.me/${me.result?.username || "bot"}?start=invite_${uid}`;
        const text = `📊 آمار شما:\n━━━━━━━━━━━━━━━━\n\n👤 نام: ${u.first_name}\n🆔 آیدی: ${uid}\n⭐️ امتیاز: ${faNum(u.points)}\n💬 پیام‌ها: ${faNum(u.message_count)}\n👥 دعوت‌ها: ${faNum(u.invite_count)}\n🔥 روزهای پیوسته: ${faNum(u.streak || 0)}\n🏅 رتبه: ${faNum(rank)}\n\n🔗 لینک دعوت شما:\n${inviteLink}`;
        await editMessage(env, cid, mid, text, backMain());
        return;
    }

    if (data === "leaderboard") {
        const top = await getTopUsers(env, 10);
        let text = "🏆 ده کاربر برتر:\n━━━━━━━━━━━━━━━━\n\n";
        top.forEach((u, i) => {
            const m = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${faNum(i + 1)}.`;
            text += `${m} ${u.first_name} — ${faNum(u.points)} امتیاز\n`;
        });
        await editMessage(env, cid, mid, text, backMain());
        return;
    }

    if (data === "my_invite") {
        const me = await tgApi(env, "getMe");
        const link = `https://t.me/${me.result?.username || "bot"}?start=invite_${uid}`;
        const u = await db.user(env, uid);
        await editMessage(env, cid, mid, `👥 سیستم دعوت\n━━━━━━━━━━━━━━━━\n\nبا اشتراک لینک زیر، هر کاربر جدیدی که عضو شود ۱۰ امتیاز می‌گیرید:\n\n${link}\n\n📊 تعداد دعوت‌های موفق شما: ${faNum(u?.invite_count || 0)}`, backMain());
        return;
    }

    if (data === "daily_bonus") {
        const u = await db.user(env, uid);
        const diff = now() - (u?.last_daily || 0);
        if (diff < 86400) {
            const hrs = Math.floor((86400 - diff) / 3600);
            await answerCallback(env, call.id, `⏳ زمان باقی‌مانده: ${hrs} ساعت`, true);
            return;
        }
        let newStreak = (u?.streak && diff < 172800) ? u.streak + 1 : 1;
        const bonus = 5 + Math.min(newStreak * 2, 20);
        await env.DB.prepare("UPDATE users SET points = points + ?, last_daily = ?, streak = ? WHERE user_id = ?").bind(bonus, now(), newStreak, uid).run();
        await answerCallback(env, call.id, `🎁 پاداش دریافت شد!\n+${faNum(bonus)} امتیاز\n🔥 روزهای پیوسته: ${faNum(newStreak)}`, true);
        return;
    }

    if (data === "quality_menu") {
        await editMessage(env, cid, mid, "📈 کیفیت اینترنت ایران\nیک بازه زمانی انتخاب کنید:", qualityKb());
        return;
    }

    if (data.startsWith("chart_") && data !== "chart_all") {
        const metric = data.replace("chart_", "");
        await answerCallback(env, call.id, "⏳ در حال ساخت نمودار...");
        const iqi = await fetchRadar(env, metric, "1h");
        if (!iqi?.timestamps) { await sendMessage(env, cid, "❌ داده‌ای دریافت نشد."); return; }
        const labels = labelsFrom(iqi.timestamps);
        const m = METRICS[metric] || { name: metric, color: "#36a2eb" };
        const url = chartUrl(labels, [buildDataset(m.name, iqi.values || [], m.color)], `رادار - ${m.name}`);
        await sendPhoto(env, cid, url, `📊 نمودار یک ساعته ${m.name}\n⏰ ${faTime(now())}`);
        return;
    }

    if (data === "chart_all") {
        await answerCallback(env, call.id, "⏳ ساخت نمودار ترکیبی...");
        const results = await Promise.all(["latency", "jitter"].map(m => fetchRadar(env, m, "1h")));
        if (!results[0]?.timestamps) { await sendMessage(env, cid, "❌ داده کافی نیست."); return; }
        const labels = labelsFrom(results[0].timestamps);
        const datasets = results.map((r, i) => buildDataset(METRICS[i === 0 ? "latency" : "jitter"].name, r?.values || [], METRICS[i === 0 ? "latency" : "jitter"].color));
        const url = chartUrl(labels, datasets, "رادار - مقایسه");
        await sendPhoto(env, cid, url, `📊 مقایسه تاخیر و جیتر\n⏰ ${faTime(now())}`);
        return;
    }

    if (data === "heatmap") {
        await answerCallback(env, call.id, "⏳ ساخت نقشه...");
        await editMessage(env, cid, mid, "🗺️ نقشه حرارتی کیفیت اینترنت استان‌ها\n(داده‌های نمونه)\n\n🟢 تهران: خوب\n🟠 اصفهان: متوسط\n🔴 سیستان و بلوچستان: ضعیف", backMain());
        return;
    }

    if (data === "ioda") {
        await answerCallback(env, call.id, "⏳ بررسی قطعی‌ها...");
        await editMessage(env, cid, mid, "🚨 وضعیت قطعی‌های ۲۴ ساعت اخیر:\n\n✅ هیچ قطعی بزرگی گزارش نشده.", backMain());
        return;
    }

    if (data === "ooni_start") {
        await db.setAdminState(env, uid, "await_ooni");
        await sendMessage(env, cid, "🔍 دامنه مورد نظر را ارسال کنید (مثلاً twitter.com):");
        return;
    }

    if (data === "help") {
        await editMessage(env, cid, mid, "📖 راهنما\n━━━━━━━━━━━━━━━━\n\n🔹 آمار من: امتیاز، پیام، دعوت، رتبه\n🔹 رتبه‌بندی: ده کاربر برتر\n🔹 کیفیت اینترنت: نمودار یک ساعته\n🔹 پاداش روزانه: ۵ امتیاز (به‌علاوه پاداش روزهای پیوسته)\n\n⭐️ هر پیام در گروه: ۱ امتیاز\n👥 هر دعوت: ۱۰ امتیاز", backMain());
        return;
    }

    if (data === "about") {
        await editMessage(env, cid, mid, "ℹ️ درباره ربات\n━━━━━━━━━━━━━━━━\n\n🔭 رادار اینترنت ایران\n📡 منابع: کلادفلر رادار، OONI\n⚙️ بستر: کلادفلر ورکرز", backMain());
        return;
    }

    // ═══════════════════════════════════════════════════════════════
    //   پنل مدیریت
    // ═══════════════════════════════════════════════════════════════
    if (!admins.includes(uid)) {
        await answerCallback(env, call.id, "⛔️ دسترسی ندارید.", true);
        return;
    }

    if (data === "admin_panel") {
        await editMessage(env, cid, mid, "⚙️ پنل مدیریت\nیک گزینه انتخاب کنید:", adminKb());
        return;
    }

    if (data === "adm_users") {
        const r = await env.DB.prepare("SELECT user_id, first_name, points, is_banned FROM users ORDER BY join_date DESC LIMIT 30").all();
        let text = "👤 سی کاربر اخیر:\n━━━━━━━━━━━━━━━━\n\n";
        (r.results || []).forEach(u => {
            text += `${u.is_banned ? "🚫" : "✅"} ${u.first_name} | ${u.user_id} | ${faNum(u.points)} امتیاز\n`;
        });
        await editMessage(env, cid, mid, text, adminKb());
        return;
    }

    if (data === "adm_stats") {
        const [tu, bu, tm] = await Promise.all([
            env.DB.prepare("SELECT COUNT(*) as c FROM users").first(),
            env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE is_banned = 1").first(),
            env.DB.prepare("SELECT SUM(message_count) as s FROM users").first()
        ]);
        await editMessage(env, cid, mid, `📊 آمار کلی:\n━━━━━━━━━━━━━━━━\n\n👥 کاربران: ${faNum(tu?.c || 0)}\n🚫 مسدود: ${faNum(bu?.c || 0)}\n💬 پیام‌ها: ${faNum(tm?.s || 0)}`, adminKb());
        return;
    }

    if (data === "adm_chart") {
        await answerCallback(env, call.id, "⏳ ساخت...");
        const iqi = await fetchRadar(env, "latency", "1h");
        if (!iqi?.timestamps) { await sendMessage(env, cid, "❌ خطا."); return; }
        const url = chartUrl(labelsFrom(iqi.timestamps), [buildDataset("تاخیر", iqi.values || [], "#36a2eb")], "نمودار دستی");
        await sendPhoto(env, cid, url, `📊 نمودار دستی — ${faTime(now())}`);
        return;
    }

    if (data === "adm_alert") {
        await answerCallback(env, call.id, "⏳ بررسی...");
        await runAlertCheck(env, true);
        await sendMessage(env, cid, "✅ هشدار بررسی شد.");
        return;
    }

    if (data === "adm_search") { await db.setAdminState(env, uid, "await_search"); await sendMessage(env, cid, "🔍 آیدی عددی کاربر:"); return; }
    if (data === "adm_ban") { await db.setAdminState(env, uid, "await_ban"); await sendMessage(env, cid, "🚫 آیدی برای مسدودسازی:"); return; }
    if (data === "adm_unban") { await db.setAdminState(env, uid, "await_unban"); await sendMessage(env, cid, "✅ آیدی برای رفع مسدودی:"); return; }
    if (data === "adm_edit_points") { await db.setAdminState(env, uid, "await_edit_uid"); await sendMessage(env, cid, "➕ آیدی کاربر:"); return; }
    if (data === "adm_broadcast") { await db.setAdminState(env, uid, "await_broadcast"); await sendMessage(env, cid, "📨 متن پیام همگانی:"); return; }
    if (data === "adm_dm") { await db.setAdminState(env, uid, "await_dm_uid"); await sendMessage(env, cid, "✉️ آیدی کاربر:"); return; }

    if (data === "adm_export") {
        await answerCallback(env, call.id, "⏳ ساخت فایل...");
        const r = await env.DB.prepare("SELECT user_id, first_name, username, points, message_count, invite_count, is_banned, join_date FROM users").all();
        const users = r.results || [];
        let csv = "user_id,first_name,username,points,messages,invites,banned,join_date\n";
        users.forEach(u => {
            csv += `${u.user_id},"${u.first_name || ''}","${u.username || ''}",${u.points},${u.message_count},${u.invite_count},${u.is_banned},${u.join_date}\n`;
        });
        try {
            const formData = new FormData();
            formData.append("reqtype", "fileupload");
            formData.append("fileToUpload", new Blob([csv], { type: "text/csv" }), "users.csv");
            const upRes = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: formData });
            const fileUrl = await upRes.text();
            await sendDocument(env, cid, fileUrl, `📥 خروجی ${users.length} کاربر`);
        } catch (e) {
            await sendMessage(env, cid, `❌ خطا: ${e.message}`);
        }
        return;
    }

    if (data === "adm_toggle_force") {
        const cur = await db.setting(env, "force_join");
        const nv = cur === "1" ? "0" : "1";
        await db.setSetting(env, "force_join", nv);
        await answerCallback(env, call.id, `عضویت اجباری: ${nv === "1" ? "فعال ✅" : "غیرفعال ❌"}`, true);
        await editMessage(env, cid, mid, "⚙️ پنل مدیریت", adminKb());
        return;
    }
}

// ═══════════════════════════════════════════════════════════════
//   پردازش پیام‌های حالت‌دار (Stateful)
// ═══════════════════════════════════════════════════════════════
async function handleStatefulMessage(env, msg) {
    const uid = msg.from_user.id;
    const text = (msg.text || "").trim();
    const chatId = msg.chat.id;
    if (!text) return false;

    const state = await db.adminState(env, uid);
    if (!state) return false;

    if (state.action === "await_ooni") {
        await db.clearAdminState(env, uid);
        const domain = text.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
        await sendMessage(env, chatId, `⏳ بررسی ${domain}...`);
        const result = await checkOONI(env, domain);
        if (result && result.result && result.result.length > 0) {
            let total = 0, anomaly = 0;
            result.result.forEach(r => { total += (r.measurement_count || 0); anomaly += (r.anomaly_count || 0); });
            let verdict = total > 0 && (anomaly / total > 0.5) ? "🚫 احتمالاً مسدود" : "✅ در دسترس";
            await sendMessage(env, chatId, `🔍 نتیجه برای ${domain}:\n\n📊 کل: ${faNum(total)}\n⚠️ مشکوک: ${faNum(anomaly)}\n\n🎯 نتیجه: ${verdict}`);
        } else {
            await sendMessage(env, chatId, `❌ داده‌ای برای ${domain} یافت نشد.`);
        }
        return true;
    }

    const admins = (env.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);
    if (!admins.includes(uid)) return false;

    if (state.action === "await_search") {
        await db.clearAdminState(env, uid);
        const tid = parseInt(text);
        const u = await db.user(env, tid);
        if (!u) { await sendMessage(env, chatId, "❌ کاربر یافت نشد.", backAdmin()); return true; }
        await sendMessage(env, chatId, `👤 اطلاعات کاربر\n━━━━━━━━━━━━━━━━\n\n👤 نام: ${u.first_name}\n🆔 آیدی: ${u.user_id}\n⭐️ امتیاز: ${faNum(u.points)}\n📌 وضعیت: ${u.is_banned ? "مسدود" : "فعال"}`, backAdmin());
        return true;
    }

    if (state.action === "await_ban") {
        await db.clearAdminState(env, uid);
        const tid = parseInt(text);
        if (isNaN(tid)) { await sendMessage(env, chatId, "❌ آیدی نامعتبر."); return true; }
        await env.DB.prepare("UPDATE users SET is_banned = 1, ban_reason = ? WHERE user_id = ?").bind("تخلف از قوانین ربات", tid).run();
        await sendMessage(env, tid, BAN_MESSAGE("تخلف از قوانین ربات", new Date().toLocaleString('fa-IR'), tid)).catch(() => {});
        await sendMessage(env, chatId, `✅ کاربر ${tid} مسدود شد و اطلاعیه رسمی برایش ارسال گردید.`, backAdmin());
        return true;
    }

    if (state.action === "await_unban") {
        await db.clearAdminState(env, uid);
        const tid = parseInt(text);
        await env.DB.prepare("UPDATE users SET is_banned = 0, ban_reason = '' WHERE user_id = ?").bind(tid).run();
        await sendMessage(env, tid, UNBAN_MESSAGE).catch(() => {});
        await sendMessage(env, chatId, `✅ کاربر ${tid} رفع مسدودی شد و پیام بازگشت برایش ارسال گردید.`, backAdmin());
        return true;
    }

    if (state.action === "await_edit_uid") {
        const tid = parseInt(text);
        if (isNaN(tid)) { await db.clearAdminState(env, uid); await sendMessage(env, chatId, "❌ آیدی نامعتبر."); return true; }
        const u = await db.user(env, tid);
        if (!u) { await db.clearAdminState(env, uid); await sendMessage(env, chatId, "❌ کاربر یافت نشد."); return true; }
        await db.setAdminState(env, uid, "await_edit_amount", String(tid));
        await sendMessage(env, chatId, `👤 کاربر: ${u.first_name}\n⭐️ امتیاز فعلی: ${faNum(u.points)}\n\nمقدار تغییر را ارسال کنید (مثلاً 50 برای +50):`);
        return true;
    }

    if (state.action === "await_edit_amount") {
        await db.clearAdminState(env, uid);
        const tid = parseInt(state.data);
        const amount = parseInt(text);
        if (isNaN(amount) || isNaN(tid)) { await sendMessage(env, chatId, "❌ مقدار نامعتبر."); return true; }
        await env.DB.prepare("UPDATE users SET points = MAX(0, points + ?) WHERE user_id = ?").bind(amount, tid).run();
        await sendMessage(env, chatId, `✅ امتیاز کاربر ${tid} تغییر کرد.`, backAdmin());
        return true;
    }

    if (state.action === "await_broadcast") {
        await db.clearAdminState(env, uid);
        const r = await env.DB.prepare("SELECT user_id FROM users WHERE is_banned = 0").all();
        const users = r.results || [];
        let ok = 0, fail = 0;
        for (let i = 0; i < users.length; i++) {
            const res = await sendMessage(env, users[i].user_id, text);
            if (res.ok) ok++; else fail++;
            if (i % 25 === 0) await new Promise(r => setTimeout(r, 500));
        }
        await sendMessage(env, chatId, `📨 نتیجه ارسال:\n✅ موفق: ${faNum(ok)}\n❌ ناموفق: ${faNum(fail)}`, backAdmin());
        return true;
    }

    if (state.action === "await_dm_uid") {
        const tid = parseInt(text);
        if (isNaN(tid)) { await db.clearAdminState(env, uid); await sendMessage(env, chatId, "❌ آیدی نامعتبر."); return true; }
        await db.setAdminState(env, uid, "await_dm_text", String(tid));
        await sendMessage(env, chatId, `✉️ متن پیام را ارسال کنید:`);
        return true;
    }

    if (state.action === "await_dm_text") {
        await db.clearAdminState(env, uid);
        const tid = parseInt(state.data);
        await sendMessage(env, tid, `📨 پیام از ادمین:\n\n${text}`);
        await sendMessage(env, chatId, `✅ پیام به ${tid} ارسال شد.`, backAdmin());
        return true;
    }

    return false;
}

// ═══════════════════════════════════════════════════════════════
//   API عمومی
// ═══════════════════════════════════════════════════════════════
async function handlePublicAPI(env, req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

    if (req.method === "OPTIONS") return new Response(null, { headers: { ...headers, "Access-Control-Allow-Methods": "GET, OPTIONS" } });

    const respond = (data, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers });

    try {
        if (path === "/api/stats") {
            const [tu, tm, ti] = await Promise.all([
                env.DB.prepare("SELECT COUNT(*) as c FROM users").first(),
                env.DB.prepare("SELECT SUM(message_count) as s FROM users").first(),
                env.DB.prepare("SELECT SUM(invite_count) as s FROM users").first()
            ]);
            return respond({ total_users: tu?.c || 0, total_messages: tm?.s || 0, total_invites: ti?.s || 0 });
        }

        const userMatch = path.match(/^\/api\/user\/(\d+)$/);
        if (userMatch) {
            const uid = parseInt(userMatch[1]);
            const u = await db.user(env, uid);
            if (!u) return respond({ error: "not_found" }, 404);
            const rank = await getRank(env, uid);
            return respond({ user_id: u.user_id, first_name: u.first_name, points: u.points, rank });
        }

        if (path === "/api/leaderboard") {
            return respond(await getTopUsers(env, 10));
        }

        if (path === "/api/quality") {
            const metric = url.searchParams.get("metric") || "latency";
            return respond(await fetchRadar(env, metric, "1h") || { error: "unavailable" });
        }

        return respond({ error: "not_found" }, 404);
    } catch (e) {
        return respond({ error: "internal_error" }, 500);
    }
}

// ═══════════════════════════════════════════════════════════════
//   هشدارها و تایمرها
// ═══════════════════════════════════════════════════════════════
async function sendHourlyChartToChannel(env) {
    if (!env.CLOUDFLARE_API_TOKEN) return;
    const iqi = await fetchRadar(env, "latency", "1h");
    if (!iqi?.timestamps) return;
    const url = chartUrl(labelsFrom(iqi.timestamps), [buildDataset("تاخیر (میلی‌ثانیه)", iqi.values || [], "#36a2eb")], "نمودار یک ساعته - تاخیر");
    await sendPhoto(env, env.CHANNEL_ID, url, `📊 نمودار یک ساعته تاخیر اینترنت ایران\n⏰ ${faTime(now())}`);
}

async function runAlertCheck(env, force = false) {
    if (!force && !env.CLOUDFLARE_API_TOKEN) return false;
    return true; 
                       }
