/**
 * ═══════════════════════════════════════════════════════════════
 *   ربات رادار اینترنت ایران — نسخه نهایی ۴.۰
 * ═══════════════════════════════════════════════════════════════
 */

import { env } from "cloudflare:workers";

// ═══════════════════════════════════════════════════════════════
//   تنظیمات
// ═══════════════════════════════════════════════════════════════
const TOKEN = env.BOT_TOKEN;
const CHANNEL_ID = env.CHANNEL_ID || "@radarinternetiran";
const GROUP_ID = env.GROUP_ID || "@radarinternetirangruop";
const SUPPORT_ADMIN = "@Adddddddm";
const ADMIN_IDS = (env.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);
const WEBHOOK_SECRET = env.WEBHOOK_SECRET || "radar-secret";
const CF_TOKEN = env.CLOUDFLARE_API_TOKEN;

const POINTS_PER_MESSAGE = parseInt(env.POINTS_PER_MESSAGE || "1");
const POINTS_PER_INVITE = parseInt(env.POINTS_PER_INVITE || "10");
const DAILY_BONUS = parseInt(env.DAILY_BONUS || "5");
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60;
const ALERT_THRESHOLD = 150;

// ═══════════════════════════════════════════════════════════════
//   ابزارهای پایه
// ═══════════════════════════════════════════════════════════════
const now = () => Math.floor(Date.now() / 1000);
const faNum = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const faTime = ts => {
    try { return new Date(ts * 1000).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }); }
    catch { return String(ts); }
};

// ═══════════════════════════════════════════════════════════════
//   توابع تلگرام
// ═══════════════════════════════════════════════════════════════
async function tgApi(method, params = {}) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });
        return await res.json();
    } catch (e) {
        console.error(`خطای تلگرام (${method}):`, e.message);
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

// ═══════════════════════════════════════════════════════════════
//   لایه دیتابیس
// ═══════════════════════════════════════════════════════════════
const db = {
    user: (uid) => env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(uid).first(),
    setting: (k) => env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(k).first().then(r => r?.value),
    setSetting: (k, v) => env.DB.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)").bind(k, v).run(),
    adminState: (uid) => env.DB.prepare("SELECT action,data FROM admin_states WHERE user_id = ?").bind(uid).first(),
    setAdminState: (uid, action, data = "") => env.DB.prepare(
        "INSERT OR REPLACE INTO admin_states (user_id,action,data,created_at) VALUES (?,?,?,?)"
    ).bind(uid, action, data, now()).run(),
    clearAdminState: (uid) => env.DB.prepare("DELETE FROM admin_states WHERE user_id = ?").bind(uid).run(),
    cache: (k) => env.DB.prepare("SELECT data,expires_at FROM api_cache WHERE cache_key = ?").bind(k).first(),
    setCache: (k, d, ttl) => env.DB.prepare(
        "INSERT OR REPLACE INTO api_cache (cache_key,data,expires_at) VALUES (?,?,?)"
    ).bind(k, d, now() + ttl).run()
};

async function addOrUpdateUser(uid, name, uname) {
    const u = await db.user(uid);
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

async function addPoints(uid, pts, isMsg = false) {
    await env.DB.prepare(
        "UPDATE users SET points = points + ?, message_count = message_count + ? WHERE user_id = ?"
    ).bind(pts, isMsg ? 1 : 0, uid).run();
}

async function isBanned(uid) {
    const u = await db.user(uid);
    return u && u.is_banned === 1;
}

async function getRank(uid) {
    const r = await env.DB.prepare(
        "SELECT COUNT(*) as r FROM users WHERE points > (SELECT points FROM users WHERE user_id = ?)"
    ).bind(uid).first();
    return (r?.r || 0) + 1;
}

async function getTopUsers(limit = 10) {
    const r = await env.DB.prepare(
        "SELECT user_id, first_name, points, message_count FROM users ORDER BY points DESC LIMIT ?"
    ).bind(limit).all();
    return r.results || [];
}

// ═══════════════════════════════════════════════════════════════
//   ضد اسپم
// ═══════════════════════════════════════════════════════════════
async function checkRateLimit(uid) {
    const key = `rate_${uid}`;
    const row = await db.cache(key);
    if (!row || row.expires_at < now()) {
        await db.setCache(key, "1", RATE_LIMIT_WINDOW);
        return true;
    }
    const count = parseInt(row.data) || 0;
    if (count >= RATE_LIMIT_MAX) return false;
    await env.DB.prepare("UPDATE api_cache SET data = ? WHERE cache_key = ?")
        .bind(String(count + 1), key).run();
    return true;
}

// ═══════════════════════════════════════════════════════════════
//   حافظه نهان
// ═══════════════════════════════════════════════════════════════
async function getCached(k) {
    const r = await db.cache(k);
    if (r && r.expires_at > now()) {
        try { return JSON.parse(r.data); } catch { return null; }
    }
    return null;
}
const setCache = (k, d, ttl) => db.setCache(k, JSON.stringify(d), ttl);

// ═══════════════════════════════════════════════════════════════
//   کلادفلر رادار
// ═══════════════════════════════════════════════════════════════
const METRICS = {
    latency:     { name: "تاخیر (ms)",          color: "#36a2eb" },
    bandwidth:   { name: "پهنای باند (Mbps)",   color: "#4bc0c0" },
    jitter:      { name: "جیتر (ms)",            color: "#ff9f40" },
    packet_loss: { name: "افت بسته (درصد)",     color: "#ff6384" }
};

async function fetchRadar(metric, range = "24h") {
    if (!CF_TOKEN) return null;
    const ck = `cf_${metric}_${range}`;
    const cached = await getCached(ck);
    if (cached) return cached;

    try {
        const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?location=IR&dateRange=${range}&metric=${metric}&aggInterval=1h`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${CF_TOKEN}` } });
        const data = await res.json();
        if (!data.success) return null;
        await setCache(ck, data.result, 1800);
        return data.result;
    } catch (e) {
        console.error("خطای رادار:", e.message);
        return null;
    }
}

async function radarSummary(metric) {
    if (!CF_TOKEN) return null;
    const ck = `cf_sum_${metric}`;
    const cached = await getCached(ck);
    if (cached) return cached;

    try {
        const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/summary?location=IR&metric=${metric}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${CF_TOKEN}` } });
        const data = await res.json();
        if (!data.success) return null;
        await setCache(ck, data.result, 900);
        return data.result;
    } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
//   بررسی سانسور
// ═══════════════════════════════════════════════════════════════
async function checkOONI(domain, days = 7) {
    const ck = `ooni_${domain}_${days}`;
    const cached = await getCached(ck);
    if (cached) return cached;

    try {
        const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        const until = new Date().toISOString().split('T')[0];
        const res = await fetch("https://api.ooni.io/api/v1/aggregation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ since, until, domain, probe_cc: "IR", axis_x: "measurement_start_day" })
        });
        if (!res.ok) throw new Error(`خطای ${res.status}`);
        const data = await res.json();
        await setCache(ck, data, 3600);
        return data;
    } catch (e) {
        console.error("خطای OONI:", e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
//   تشخیص قطعی
// ═══════════════════════════════════════════════════════════════
async function checkIODA() {
    const ck = "ioda_IR";
    const cached = await getCached(ck);
    if (cached) return cached;

    try {
        const from = now() - 24 * 3600;
        const url = `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events?from=${from}&until=${now()}&entityType=country&limit=20`;
        const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "RadarBot/4.0" } });
        if (!res.ok) throw new Error(`خطای ${res.status}`);
        const json = await res.json();
        const events = (json.data || []).filter(e => (e.location || "").includes("country/IR"));
        await setCache(ck, events, 900);
        return events;
    } catch (e) {
        console.error("خطای IODA:", e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
//   نمودار
// ═══════════════════════════════════════════════════════════════
const labelsFrom = ts => ts.map(t => {
    const d = new Date(t * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
});

function chartUrl(labels, datasets, title) {
    const config = {
        type: 'line',
        data: { labels, datasets },
        options: {
            title: { display: true, text: title, font: { size: 16 } },
            legend: { display: datasets.length > 1 },
            scales: { y: { beginAtZero: false } }
        }
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=900&h=450&format=png&backgroundColor=white`;
}

const buildDataset = (label, values, color) => ({
    label, data: values, borderColor: color, backgroundColor: color + "33",
    fill: true, tension: 0.3, pointRadius: 2
});

// ═══════════════════════════════════════════════════════════════
//   نقشه استان‌ها
// ═══════════════════════════════════════════════════════════════
const PROVINCES = [
    "تهران", "البرز", "اصفهان", "فارس", "خراسان رضوی", "خوزستان",
    "سیستان و بلوچستان", "کردستان", "آذربایجان شرقی", "آذربایجان غربی",
    "گیلان", "مازندران", "کرمان", "لرستان", "همدان", "کرمانشاه",
    "مرکزی", "قزوین", "قم", "سمنان", "گلستان", "اردبیل", "بوشهر",
    "چهارمحال و بختیاری", "خراسان شمالی", "خراسان جنوبی", "زنجان",
    "یزد", "هرمزگان", "ایلام", "کهگیلویه و بویراحمد"
];

async function buildHeatmap() {
    const data = PROVINCES.map((p, i) => ({
        name: p,
        q: Math.max(0.2, Math.min(0.95, 0.6 + Math.sin(i * 1.3) * 0.3))
    })).sort((a, b) => b.q - a.q);

    let text = "🗺️ نقشه حرارتی کیفیت اینترنت استان‌ها\n";
    text += "🟢 خوب | 🟠 متوسط | 🔴 ضعیف\n";
    text += "━━━━━━━━━━━━━━━━\n\n";

    data.forEach(p => {
        const e = p.q > 0.7 ? "🟢" : p.q > 0.4 ? "🟠" : "🔴";
        const filled = Math.round(p.q * 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        text += `${e} ${p.name}: ${bar} ${(p.q * 100).toFixed(0)}%\n`;
    });

    text += "\n⚠️ داده‌های نمونه (قابل ارتقا)";
    return text;
}

// ═══════════════════════════════════════════════════════════════
//   پیام رسمی
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
    `${SUPPORT_ADMIN}\n\n` +
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
function mainKeyboard(uid) {
    const rows = [
        [
            { text: "📊 آمار من", callback_data: "my_stats" },
            { text: "🏆 رتبه‌بندی", callback_data: "leaderboard" }
        ],
        [
            { text: "📈 کیفیت اینترنت", callback_data: "quality_menu" },
            { text: "🗺️ نقشه استان‌ها", callback_data: "heatmap" }
        ],
        [
            { text: "🚨 قطعی‌های اخیر", callback_data: "ioda" },
            { text: "🔍 بررسی سانسور", callback_data: "ooni_start" }
        ],
        [
            { text: "🎁 پاداش روزانه", callback_data: "daily_bonus" },
            { text: "👥 لینک دعوت من", callback_data: "my_invite" }
        ],
        [
            { text: "📖 راهنما", callback_data: "help" },
            { text: "ℹ️ درباره", callback_data: "about" }
        ]
    ];
    if (ADMIN_IDS.includes(uid)) {
        rows.push([{ text: "⚙️ پنل مدیریت", callback_data: "admin_panel" }]);
    }
    return { inline_keyboard: rows };
}

const forceJoinKb = () => ({
    inline_keyboard: [
        [{ text: "📢 عضویت در کانال", url: `https://t.me/${CHANNEL_ID.replace('@', '')}` }],
        [{ text: "👥 عضویت در گروه", url: `https://t.me/${GROUP_ID.replace('@', '')}` }],
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
        [
            { text: "👤 لیست کاربران", callback_data: "adm_users" },
            { text: "🔍 جستجو", callback_data: "adm_search" }
        ],
        [
            { text: "🚫 مسدود کردن", callback_data: "adm_ban" },
            { text: "✅ رفع مسدودی", callback_data: "adm_unban" }
        ],
        [
            { text: "➕ ادیت امتیاز", callback_data: "adm_edit_points" },
            { text: "📨 پیام همگانی", callback_data: "adm_broadcast" }
        ],
        [
            { text: "✉️ پیام به کاربر", callback_data: "adm_dm" },
            { text: "📥 خروجی CSV", callback_data: "adm_export" }
        ],
        [
            { text: "🔓 عضو اجباری", callback_data: "adm_toggle_force" },
            { text: "📊 آمار کلی", callback_data: "adm_stats" }
        ],
        [
            { text: "📈 نمودار دستی", callback_data: "adm_chart" },
            { text: "🚨 تست هشدار", callback_data: "adm_alert" }
        ],
        [{ text: "🔙 بازگشت", callback_data: "main_menu" }]
    ]
});

const backMain = () => ({ inline_keyboard: [[{ text: "🔙 منوی اصلی", callback_data: "main_menu" }]] });
const backAdmin = () => ({ inline_keyboard: [[{ text: "🔙 پنل ادمین", callback_data: "admin_panel" }]] });

// ═══════════════════════════════════════════════════════════════
//   عضویت اجباری
// ═══════════════════════════════════════════════════════════════
async function checkForceJoin(uid) {
    const f = await db.setting("force_join");
    if (f !== "1") return true;
    try {
        const [ch, gr] = await Promise.all([
            tgApi("getChatMember", { chat_id: CHANNEL_ID, user_id: uid }),
            tgApi("getChatMember", { chat_id: GROUP_ID, user_id: uid })
        ]);
        const ok = ["member", "administrator", "creator"];
        return ok.includes(ch.result?.status) && ok.includes(gr.result?.status);
    } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
//   نقطه ورود
// ═══════════════════════════════════════════════════════════════
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname.startsWith("/api/")) {
            return handlePublicAPI(request);
        }

        if (url.pathname === "/webhook" && request.method === "POST") {
            if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== WEBHOOK_SECRET) {
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
                secret_token: WEBHOOK_SECRET,
                allowed_updates: ["message", "callback_query"],
                drop_pending_updates: true
            });
            return new Response(JSON.stringify(r, null, 2), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/deleteWebhook") {
            const r = await tgApi("deleteWebhook", { drop_pending_updates: true });
            return new Response(JSON.stringify(r, null, 2), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/getMe") {
            const r = await tgApi("getMe");
            return new Response(JSON.stringify(r, null, 2), { headers: { "Content-Type": "application/json" } });
        }

        return new Response("🤖 ربات رادار اینترنت ایران فعال است.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    },

    async scheduled(event, env, ctx) {
        if (event.cron === "0 * * * *") {
            ctx.waitUntil(sendHourlyChartToChannel());
        }
        if (event.cron === "*/15 * * * *") {
            ctx.waitUntil(runAlertCheck());
        }
    }
};

// ═══════════════════════════════════════════════════════════════
//   پردازش آپدیت
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
//   شروع
// ═══════════════════════════════════════════════════════════════
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
            await env.DB.prepare("UPDATE users SET invited_by = ? WHERE user_id = ? AND invited_by IS NULL").bind(inviter, uid).run();
            await addPoints(inviter, POINTS_PER_INVITE);
            await env.DB.prepare("UPDATE users SET invite_count = invite_count + 1 WHERE user_id = ?").bind(inviter).run();
            await sendMessage(inviter, `🎉 یک کاربر جدید با لینک شما عضو شد!\n⭐️ ${faNum(POINTS_PER_INVITE)} امتیاز گرفتید.`).catch(() => {});
        }
    }

    if (!(await checkForceJoin(uid))) {
        await sendMessage(msg.chat.id, "⚠️ برای استفاده از ربات، ابتدا در کانال و گروه زیر عضو شوید:\n\nسپس روی دکمه بررسی بزنید.", forceJoinKb());
        return;
    }

    await sendMessage(msg.chat.id, `سلام ${name} عزیز! 👋\nبه ربات رادار اینترنت ایران خوش آمدی.\n\nاز منوی زیر انتخاب کن:`, mainKeyboard(uid));
}

// ═══════════════════════════════════════════════════════════════
//   پیام گروه
// ═══════════════════════════════════════════════════════════════
async function handleGroupMessage(msg) {
    if (!msg.from || msg.from.is_bot) return;
    const uid = msg.from.id;
    const u = await db.user(uid);
    if (!u) {
        await addOrUpdateUser(uid, msg.from.first_name || "", msg.from.username || "");
    }
    await addPoints(uid, POINTS_PER_MESSAGE, true);
}

// ═══════════════════════════════════════════════════════════════
//   دکمه‌ها
// ═══════════════════════════════════════════════════════════════
async function handleCallback(call) {
    const uid = call.from_user.id;
    const data = call.data;
    const cid = call.message.chat.id;
    const mid = call.message.message_id;

    if (await isBanned(uid)) {
        const u = await db.user(uid);
        await answerCallback(call.id, "شما مسدود شده‌اید. برای پیگیری با پشتیبانی تماس بگیرید.", true);
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
        const botUname = me.result?.username || "bot";
        const inviteLink = `https://t.me/${botUname}?start=invite_${uid}`;
        const text =
            `📊 آمار شما:\n` +
            `━━━━━━━━━━━━━━━━\n\n` +
            `👤 نام: ${u.first_name}\n` +
            `🆔 آیدی: ${uid}\n` +
            `⭐️ امتیاز: ${faNum(u.points)}\n` +
            `💬 پیام‌ها: ${faNum(u.message_count)}\n` +
            `👥 دعوت‌ها: ${faNum(u.invite_count)}\n` +
            `🔥 روزهای پیوسته: ${faNum(u.streak || 0)}\n` +
            `🏅 رتبه: ${faNum(rank)}\n\n` +
            `🔗 لینک دعوت شما:\n` +
            `${inviteLink}`;
        await editMessage(cid, mid, text, backMain());
        return;
    }

    if (data === "leaderboard") {
        const top = await getTopUsers(10);
        if (!top.length) { await answerCallback(call.id, "هنوز کاربری نیست."); return; }
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
        const botUname = me.result?.username || "bot";
        const link = `https://t.me/${botUname}?start=invite_${uid}`;
        const u = await db.user(uid);
        await editMessage(cid, mid,
            `👥 سیستم دعوت\n━━━━━━━━━━━━━━━━\n\n` +
            `با اشتراک لینک زیر، هر کاربر جدیدی که عضو شود ${faNum(POINTS_PER_INVITE)} امتیاز می‌گیرید:\n\n` +
            `${link}\n\n` +
            `📊 تعداد دعوت‌های موفق شما: ${faNum(u?.invite_count || 0)}`,
            backMain());
        return;
    }

    if (data === "daily_bonus") {
        await handleDailyBonus(uid, call.id);
        return;
    }

    if (data === "quality_menu") {
        await editMessage(cid, mid, "📈 کیفیت اینترنت ایران\nیک بازه زمانی انتخاب کنید:", qualityKb());
        return;
    }

    if (data.startsWith("chart_") && data !== "chart_all") {
        const metric = data.replace("chart_", "");
        await answerCallback(call.id, "⏳ در حال ساخت نمودار...");

        const iqi = await fetchRadar(metric, "24h");
        if (!iqi?.timestamps) {
            await sendMessage(cid, "❌ داده‌ای دریافت نشد.");
            return;
        }

        const labels = labelsFrom(iqi.timestamps);
        const values = iqi.values || [];
        const m = METRICS[metric] || { name: metric, color: "#36a2eb" };
        const url = chartUrl(labels, [buildDataset(m.name, values, m.color)], `رادار اینترنت — ${m.name}`);

        await sendPhoto(cid, url, `📊 نمودار ${m.name}\n📡 منبع: کلادفلر رادار\n⏰ ${faTime(now())}`);
        return;
    }

    if (data === "chart_all") {
        await answerCallback(call.id, "⏳ ساخت نمودار ترکیبی...");
        const metrics = ["latency", "jitter"];
        const results = await Promise.all(metrics.map(m => fetchRadar(m, "24h")));

        if (!results[0]?.timestamps) {
            await sendMessage(cid, "❌ داده کافی نیست.");
            return;
        }

        const labels = labelsFrom(results[0].timestamps);
        const datasets = results.map((r, i) => {
            const key = metrics[i];
            return buildDataset(METRICS[key].name, r?.values || [], METRICS[key].color);
        });

        const url = chartUrl(labels, datasets, "رادار — مقایسه");
        await sendPhoto(cid, url, `📊 مقایسه تاخیر و جیتر\n⏰ ${faTime(now())}`);
        return;
    }

    if (data === "heatmap") {
        await answerCallback(call.id, "⏳ ساخت نقشه...");
        const text = await buildHeatmap();
        await editMessage(cid, mid, text, backMain());
        return;
    }

    if (data === "ioda") {
        await answerCallback(call.id, "⏳ بررسی قطعی‌ها...");
        const events = await checkIODA();
        if (!events) {
            await sendMessage(cid, "❌ خطا در دریافت داده.");
            return;
        }
        let text = "🚨 وضعیت قطعی‌های ۲۴ ساعت اخیر\n━━━━━━━━━━━━━━━━\n\n";
        if (events.length === 0) {
            text += "✅ هیچ قطعی بزرگی گزارش نشده.";
        } else {
            events.slice(0, 10).forEach(e => {
                text += `⚠️ نوع: ${e.type || "نامشخص"}\n`;
                text += `📊 سطح: ${e.score?.toFixed(2) || "نامشخص"}\n`;
                text += `⏰ شروع: ${faTime(e.start)}\n\n`;
            });
        }
        await editMessage(cid, mid, text, backMain());
        return;
    }

    if (data === "ooni_start") {
        await db.setAdminState(uid, "await_ooni");
        await sendMessage(cid, "🔍 دامنه مورد نظر را ارسال کنید (مثلاً twitter.com):");
        return;
    }

    if (data === "help") {
        const text =
            `📖 راهنما\n━━━━━━━━━━━━━━━━\n\n` +
            `🔹 آمار من: امتیاز، پیام، دعوت، رتبه\n` +
            `🔹 رتبه‌بندی: ده کاربر برتر\n` +
            `🔹 کیفیت اینترنت: نمودار یک ساعته\n` +
            `🔹 نقشه استان‌ها: وضعیت استان‌ها\n` +
            `🔹 قطعی‌های اخیر: قطعی‌های بزرگ\n` +
            `🔹 بررسی سانسور: بررسی دسترسی دامنه\n` +
            `🔹 پاداش روزانه: ${faNum(DAILY_BONUS)} امتیاز (به‌علاوه پاداش روزهای پیوسته)\n\n` +
            `⭐️ هر پیام در گروه: ${faNum(POINTS_PER_MESSAGE)} امتیاز\n` +
            `👥 هر دعوت: ${faNum(POINTS_PER_INVITE)} امتیاز`;
        await editMessage(cid, mid, text, backMain());
        return;
    }

    if (data === "about") {
        await editMessage(cid, mid,
            "ℹ️ درباره ربات\n━━━━━━━━━━━━━━━━\n\n" +
            "🔭 رادار اینترنت ایران\n" +
            "📡 منابع: کلادفلر رادار، OONI، IODA\n" +
            "⚙️ بستر: کلادفلر ورکرز\n" +
            "🔐 امنیت: ضد اسپم، توکن محرمانه",
            backMain());
        return;
    }

    if (!ADMIN_IDS.includes(uid)) {
        await answerCallback(call.id, "⛔️ دسترسی ندارید.", true);
        return;
    }

    if (data === "admin_panel") {
        await editMessage(cid, mid, "⚙️ پنل مدیریت\nیک گزینه انتخاب کنید:", adminKb());
        return;
    }

    if (data === "adm_users") {
        const r = await env.DB.prepare(
            "SELECT user_id, first_name, points, is_banned FROM users ORDER BY join_date DESC LIMIT 30"
        ).all();
        const users = r.results || [];
        let text = users.length === 0 ? "هیچ کاربری نیست." :
            `👤 سی کاربر اخیر:\n━━━━━━━━━━━━━━━━\n\n`;
        users.forEach(u => {
            const s = u.is_banned ? "🚫" : "✅";
            text += `${s} ${u.first_name} | ${u.user_id} | ${faNum(u.points)} امتیاز\n`;
        });
        await editMessage(cid, mid, text, adminKb());
        return;
    }

    if (data === "adm_stats") {
        const [tu, bu, tm, ti, tp] = await Promise.all([
            env.DB.prepare("SELECT COUNT(*) as c FROM users").first(),
            env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE is_banned = 1").first(),
            env.DB.prepare("SELECT SUM(message_count) as s FROM users").first(),
            env.DB.prepare("SELECT SUM(invite_count) as s FROM users").first(),
            env.DB.prepare("SELECT SUM(points) as s FROM users").first()
        ]);
        const text =
            `📊 آمار کلی:\n━━━━━━━━━━━━━━━━\n\n` +
            `👥 کاربران: ${faNum(tu?.c || 0)}\n` +
            `🚫 مسدود: ${faNum(bu?.c || 0)}\n` +
            `💬 پیام‌ها: ${faNum(tm?.s || 0)}\n` +
            `👥 دعوت‌ها: ${faNum(ti?.s || 0)}\n` +
            `⭐️ مجموع امتیاز: ${faNum(tp?.s || 0)}`;
        await editMessage(cid, mid, text, adminKb());
        return;
    }

    if (data === "adm_chart") {
        await answerCallback(call.id, "⏳ ساخت...");
        const iqi = await fetchRadar("latency", "1h");
        if (!iqi?.timestamps) { await sendMessage(cid, "❌ خطا."); return; }
        const url = chartUrl(
            labelsFrom(iqi.timestamps),
            [buildDataset("تاخیر", iqi.values || [], "#36a2eb")],
            "نمودار دستی"
        );
        await sendPhoto(cid, url, `📊 نمودار دستی — ${faTime(now())}`);
        return;
    }

    if (data === "adm_alert") {
        await answerCallback(call.id, "⏳ بررسی و ارسال هشدار...");
        const sent = await runAlertCheck(true);
        await sendMessage(cid, sent ? "✅ هشدار ارسال شد." : "ℹ️ وضعیت نرمال است.");
        return;
    }

    if (data === "adm_search") {
        await db.setAdminState(uid, "await_search");
        await sendMessage(cid, "🔍 آیدی عددی کاربر:");
        return;
    }

    if (data === "adm_ban") {
        await db.setAdminState(uid, "await_ban");
        await sendMessage(cid, "🚫 آیدی برای مسدودسازی:");
        return;
    }

    if (data === "adm_unban") {
        await db.setAdminState(uid, "await_unban");
        await sendMessage(cid, "✅ آیدی برای رفع مسدودی:");
        return;
    }

    if (data === "adm_edit_points") {
        await db.setAdminState(uid, "await_edit_uid");
        await sendMessage(cid, "➕ آیدی کاربر:");
        return;
    }

    if (data === "adm_broadcast") {
        await db.setAdminState(uid, "await_broadcast");
        await sendMessage(cid, "📨 متن پیام همگانی:");
        return;
    }

    if (data === "adm_dm") {
        await db.setAdminState(uid, "await_dm_uid");
        await sendMessage(cid, "✉️ آیدی کاربر:");
        return;
    }

    if (data === "adm_export") {
        await answerCallback(call.id, "⏳ ساخت فایل...");
        const r = await env.DB.prepare(
            "SELECT user_id, first_name, username, points, message_count, invite_count, is_banned, join_date FROM users"
        ).all();
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
            await sendDocument(cid, fileUrl, `📥 خروجی ${users.length} کاربر`);
        } catch (e) {
            await sendMessage(cid, `❌ خطا: ${e.message}`);
        }
        return;
    }

    if (data === "adm_toggle_force") {
        const cur = await db.setting("force_join");
        const nv = cur === "1" ? "0" : "1";
        await db.setSetting("force_join", nv);
        await answerCallback(call.id,
            `عضویت اجباری: ${nv === "1" ? "فعال ✅" : "غیرفعال ❌"}`, true);
        await editMessage(cid, mid, "⚙️ پنل مدیریت", adminKb());
        return;
    }
}

// ═══════════════════════════════════════════════════════════════
//   پاداش روزانه
// ═══════════════════════════════════════════════════════════════
async function handleDailyBonus(uid, callbackId) {
    const u = await db.user(uid);
    if (!u) {
        await answerCallback(callbackId, "اطلاعات یافت نشد.");
        return;
    }

    const lastDaily = u.last_daily || 0;
    const diff = now() - lastDaily;

    if (diff < 86400) {
        const remaining = 86400 - diff;
        const hours = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        await answerCallback(callbackId,
            `⏳ هنوز آماده نیست!\nزمان باقی‌مانده: ${hours} ساعت و ${mins} دقیقه`, true);
        return;
    }

    let newStreak = 1;
    if (u.streak && diff < 172800) {
        newStreak = (u.streak || 0) + 1;
    }

    const bonus = DAILY_BONUS + Math.min(newStreak * 2, 20);

    await env.DB.prepare(
        "UPDATE users SET points = points + ?, last_daily = ?, streak = ? WHERE user_id = ?"
    ).bind(bonus, now(), newStreak, uid).run();

    await answerCallback(callbackId,
        `🎁 پاداش روزانه دریافت شد!\n+${faNum(bonus)} امتیاز\n🔥 روزهای پیوسته: ${faNum(newStreak)}`,
        true);
}

// ═══════════════════════════════════════════════════════════════
//   پردازش پیام حالت‌دار
// ═══════════════════════════════════════════════════════════════
async function handleStatefulMessage(msg) {
    const uid = msg.from_user.id;
    const text = (msg.text || "").trim();
    const chatId = msg.chat.id;
    if (!text) return false;

    const state = await db.adminState(uid);
    if (!state) return false;

    if (state.action === "await_ooni") {
        await db.clearAdminState(uid);
        const domain = text.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();

        if (!domain.match(/^[a-z0-9.-]+\.[a-z]{2,}$/)) {
            await sendMessage(chatId, "❌ دامنه نامعتبر.");
            return true;
        }

        await sendMessage(chatId, `⏳ بررسی ${domain}...`);
        const result = await checkOONI(domain);
        if (!result?.result) {
            await sendMessage(chatId, "❌ خطا در دریافت داده.");
            return true;
        }

        const rows = result.result || [];
        if (!rows.length) {
            await sendMessage(chatId, `❌ داده‌ای برای ${domain} در ایران یافت نشد.`);
            return true;
        }

        let total = 0, ok = 0, anomaly = 0;
        rows.forEach(r => {
            const mc = r.measurement_count || 0;
            const ac = r.anomaly_count || 0;
            total += mc;
            anomaly += ac;
            ok += (mc - ac);
        });

        let verdict = "نامشخص";
        if (total > 0) {
            const ratio = anomaly / total;
            if (ratio > 0.5) verdict = "🚫 احتمالاً مسدود";
            else if (ratio > 0.2) verdict = "⚠️ نیمه‌مسدود";
            else verdict = "✅ در دسترس";
        }

        await sendMessage(chatId,
            `🔍 نتیجه بررسی برای ${domain}\n━━━━━━━━━━━━━━━━\n\n` +
            `📊 کل: ${faNum(total)}\n` +
            `✅ نرمال: ${faNum(ok)}\n` +
            `⚠️ مشکوک: ${faNum(anomaly)}\n\n` +
            `🎯 نتیجه: ${verdict}`);
        return true;
    }

    if (!ADMIN_IDS.includes(uid)) return false;

    if (state.action === "await_search") {
        await db.clearAdminState(uid);
        const tid = parseInt(text);
        if (isNaN(tid)) { await sendMessage(chatId, "❌ آیدی نامعتبر."); return true; }
        const u = await db.user(tid);
        if (!u) {
            await sendMessage(chatId, "❌ کاربر یافت نشد.", backAdmin());
            return true;
        }
        const rank = await getRank(tid);
        const inv = await env.DB.prepare("SELECT first_name, user_id FROM users WHERE invited_by = ? LIMIT 10")
            .bind(tid).all();
        const invitees = inv.results || [];
        let inviteesList = "";
        if (invitees.length) {
            inviteesList = "\n\nدعوت‌شدگان اخیر:\n";
            invitees.forEach((invitee, i) => {
                inviteesList += `${i + 1}. ${invitee.first_name} | ${invitee.user_id}\n`;
            });
        }
        await sendMessage(chatId,
            `👤 اطلاعات کاربر\n━━━━━━━━━━━━━━━━\n\n` +
            `👤 نام: ${u.first_name}\n` +
            `🔗 یوزرنیم: ${u.username ? "@" + u.username : "ندارد"}\n` +
            `🆔 آیدی: ${u.user_id}\n` +
            `⭐️ امتیاز: ${faNum(u.points)}\n` +
            `💬 پیام: ${faNum(u.message_count)}\n` +
            `👥 دعوت: ${faNum(u.invite_count)}\n` +
            `🔥 روزهای پیوسته: ${faNum(u.streak || 0)}\n` +
            `🏅 رتبه: ${faNum(rank)}\n` +
            `📅 عضویت: ${faTime(u.join_date)}\n` +
            `📌 وضعیت: ${u.is_banned ? "مسدود" : "فعال"}` +
            inviteesList,
            backAdmin());
        return true;
    }

    if (state.action === "await_ban") {
        await db.clearAdminState(uid);
        const tid = parseInt(text);
        if (isNaN(tid) || ADMIN_IDS.includes(tid)) {
            await sendMessage(chatId, "❌ آیدی نامعتبر یا ادمین است.");
            return true;
        }
        await env.DB.prepare("UPDATE users SET is_banned = 1, ban_reason = ? WHERE user_id = ?")
            .bind("تخلف از قوانین ربات", tid).run();

        await sendMessage(tid, BAN_MESSAGE(
            "تخلف از قوانین ربات",
            new Date().toLocaleString('fa-IR'),
            tid
        )).catch(() => {});

        await sendMessage(chatId, `✅ کاربر ${tid} مسدود شد و اطلاعیه رسمی برایش ارسال گردید.`, backAdmin());
        return true;
    }

    if (state.action === "await_unban") {
        await db.clearAdminState(uid);
        const tid = parseInt(text);
        if (isNaN(tid)) { await sendMessage(chatId, "❌ آیدی نامعتبر."); return true; }
        await env.DB.prepare("UPDATE users SET is_banned = 0, ban_reason = '' WHERE user_id = ?").bind(tid).run();

        await sendMessage(tid, UNBAN_MESSAGE).catch(() => {});

        await sendMessage(chatId, `✅ کاربر ${tid} رفع مسدودی شد و پیام بازگشت برایش ارسال گردید.`, backAdmin());
        return true;
    }

    if (state.action === "await_edit_uid") {
        const tid = parseInt(text);
        if (isNaN(tid)) { await db.clearAdminState(uid); await sendMessage(chatId, "❌ آیدی نامعتبر."); return true; }
        const u = await db.user(tid);
        if (!u) { await db.clearAdminState(uid); await sendMessage(chatId, "❌ کاربر یافت نشد."); return true; }
        await db.setAdminState(uid, "await_edit_amount", String(tid));
        await sendMessage(chatId,
            `👤 کاربر: ${u.first_name}\n⭐️ امتیاز فعلی: ${faNum(u.points)}\n\n` +
            `مقدار تغییر را ارسال کنید (مثلاً 50 برای +50 یا 20- برای -20):`);
        return true;
    }

    if (state.action === "await_edit_amount") {
        await db.clearAdminState(uid);
        const tid = parseInt(state.data);
        const amount = parseInt(text);
        if (isNaN(amount) || isNaN(tid)) {
            await sendMessage(chatId, "❌ مقدار نامعتبر.");
            return true;
        }
        await env.DB.prepare("UPDATE users SET points = MAX(0, points + ?) WHERE user_id = ?")
            .bind(amount, tid).run();
        const u = await db.user(tid);
        await sendMessage(chatId,
            `✅ امتیاز ${u.first_name} تغییر کرد.\n⭐️ امتیاز جدید: ${faNum(u.points)}`,
            backAdmin());
        await sendMessage(tid,
            `🎁 امتیاز شما توسط ادمین تغییر کرد: ${amount >= 0 ? "+" : ""}${faNum(amount)} امتیاز`
        ).catch(() => {});
        return true;
    }

    if (state.action === "await_broadcast") {
        await db.clearAdminState(uid);
        const r = await env.DB.prepare("SELECT user_id FROM users WHERE is_banned = 0").all();
        const users = r.results || [];
        let ok = 0, fail = 0;

        for (let i = 0; i < users.length; i++) {
            const res = await sendMessage(users[i].user_id, text);
            if (res.ok) ok++; else fail++;
            if (i % 25 === 0) await new Promise(r => setTimeout(r, 500));
        }

        await sendMessage(chatId,
            `📨 نتیجه ارسال:\n✅ موفق: ${faNum(ok)}\n❌ ناموفق: ${faNum(fail)}`,
            backAdmin());
        return true;
    }

    if (state.action === "await_dm_uid") {
        const tid = parseInt(text);
        if (isNaN(tid)) { await db.clearAdminState(uid); await sendMessage(chatId, "❌ آیدی نامعتبر."); return true; }
        const u = await db.user(tid);
        if (!u) { await db.clearAdminState(uid); await sendMessage(chatId, "❌ کاربر یافت نشد."); return true; }
        await db.setAdminState(uid, "await_dm_text", String(tid));
        await sendMessage(chatId, `✉️ متن پیام برای ${u.first_name}:`);
        return true;
    }

    if (state.action === "await_dm_text") {
        await db.clearAdminState(uid);
        const tid = parseInt(state.data);
        const res = await sendMessage(tid, `📨 پیام از ادمین:\n\n${text}`);
        await sendMessage(chatId,
            res.ok ? `✅ پیام ارسال شد به ${tid}` : `❌ خطا در ارسال.`,
            backAdmin());
        return true;
    }

    return false;
}

// ═══════════════════════════════════════════════════════════════
//   رابط برنامه‌نویسی عمومی
// ═══════════════════════════════════════════════════════════════
async function handlePublicAPI(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
    };

    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                ...headers,
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*"
            }
        });
    }

    const respond = (data, status = 200, ttl = 60) => new Response(
        JSON.stringify(data, null, 2),
        { status, headers: { ...headers, "Cache-Control": `public, max-age=${ttl}` } }
    );

    try {
        if (path === "/api/health") {
            return respond({ status: "ok", time: now(), version: "4.0.0" }, 200, 5);
        }

        if (path === "/api/stats") {
            const [tu, tm, ti, tp, top] = await Promise.all([
                env.DB.prepare("SELECT COUNT(*) as c FROM users").first(),
                env.DB.prepare("SELECT SUM(message_count) as s FROM users").first(),
                env.DB.prepare("SELECT SUM(invite_count) as s FROM users").first(),
                env.DB.prepare("SELECT SUM(points) as s FROM users").first(),
                getTopUsers(5)
            ]);
            return respond({
                total_users: tu?.c || 0,
                total_messages: tm?.s || 0,
                total_invites: ti?.s || 0,
                total_points: tp?.s || 0,
                top_users: top
            }, 200, 60);
        }

        const userMatch = path.match(/^\/api\/user\/(\d+)$/);
        if (userMatch) {
            const uid = parseInt(userMatch[1]);
            const u = await db.user(uid);
            if (!u) return respond({ error: "not_found" }, 404);
            const rank = await getRank(uid);
            return respond({
                user_id: u.user_id,
                first_name: u.first_name,
                username: u.username,
                points: u.points,
                message_count: u.message_count,
                invite_count: u.invite_count,
                streak: u.streak || 0,
                rank,
                is_banned: u.is_banned === 1,
                join_date: u.join_date
            }, 200, 120);
        }

        if (path === "/api/leaderboard") {
            const limit = parseInt(url.searchParams.get("limit") || "10");
            const top = await getTopUsers(Math.min(limit, 100));
            return respond(top, 200, 60);
        }

        if (path === "/api/quality") {
            const metric = url.searchParams.get("metric") || "latency";
            const range = url.searchParams.get("range") || "1h";
            if (!METRICS[metric]) return respond({ error: "invalid_metric", valid: Object.keys(METRICS) }, 400);
            const data = await fetchRadar(metric, range);
            return respond(data || { error: "unavailable" }, data ? 200 : 503, 300);
        }

        if (path === "/api/quality/all") {
            const results = {};
            await Promise.all(Object.keys(METRICS).map(async m => {
                results[m] = await radarSummary(m);
            }));
            return respond({ metrics: results, time: now() }, 200, 300);
        }

        const ooniMatch = path.match(/^\/api\/ooni\/([a-z0-9.-]+\.[a-z]{2,})$/);
        if (ooniMatch) {
            const data = await checkOONI(ooniMatch[1]);
            return respond(data || { error: "unavailable" }, data ? 200 : 503, 600);
        }

        if (path === "/api/ioda") {
            const events = await checkIODA();
            return respond({ outages: events || [], time: now() }, 200, 300);
        }

        if (path === "/api/provinces") {
            return respond({
                note: "داده‌های نمونه",
                provinces: PROVINCES.map((p, i) => ({
                    name: p,
                    quality: Math.max(0.2, Math.min(0.95, 0.6 + Math.sin(i * 1.3) * 0.3))
                }))
            }, 200, 600);
        }

        return respond({ error: "not_found", endpoints: [
            "/api/health", "/api/stats", "/api/user/{id}",
            "/api/leaderboard", "/api/quality", "/api/quality/all",
            "/api/ooni/{domain}", "/api/ioda", "/api/provinces"
        ] }, 404);
    } catch (e) {
        console.error("خطای رابط برنامه‌نویسی:", e);
        return respond({ error: "internal_error", message: e.message }, 500);
    }
}

// ═══════════════════════════════════════════════════════════════
//   ارسال نمودار ساعتی
// ═══════════════════════════════════════════════════════════════
async function sendHourlyChartToChannel() {
    if ((await db.setting("auto_chart_enabled")) !== "1") return;

    const iqi = await fetchRadar("latency", "1h");
    if (!iqi?.timestamps) return;

    const url = chartUrl(
        labelsFrom(iqi.timestamps),
        [buildDataset("تاخیر (میلی‌ثانیه)", iqi.values || [], "#36a2eb")],
        "نمودار یک ساعته — تاخیر"
    );

    await sendPhoto(CHANNEL_ID, url,
        `📊 نمودار یک ساعته تاخیر اینترنت ایران\n` +
        `⏰ ${faTime(now())}\n📡 منبع: کلادفلر رادار`);
}

// ═══════════════════════════════════════════════════════════════
//   هشدار
// ═══════════════════════════════════════════════════════════════
async function runAlertCheck(force = false) {
    if (!force && (await db.setting("auto_alert_enabled")) !== "1") return false;

    const summary = await radarSummary("latency");
    if (!summary) return false;

    const p50 = summary.latency?.p50 ?? summary.p50 ?? null;
    if (p50 === null) return false;

    if (p50 < ALERT_THRESHOLD && !force) return false;

    const lastAlert = await db.cache("last_alert");
    if (lastAlert && lastAlert.expires_at > now() && !force) return false;

    const alertMsg =
        `🚨 هشدار کیفیت اینترنت\n━━━━━━━━━━━━━━━━\n\n` +
        `⏱️ تاخیر (میانه): ${p50} میلی‌ثانیه\n` +
        `📊 آستانه: ${ALERT_THRESHOLD} میلی‌ثانیه\n` +
        `⏰ ${faTime(now())}\n\n` +
        `📡 منبع: کلادفلر رادار`;

    for (const aid of ADMIN_IDS) {
        await sendMessage(aid, alertMsg).catch(() => {});
    }

    await db.setCache("last_alert", "1", 1800);
    return true;
    }
