/**
 * ═══════════════════════════════════════════════════════════════
 *   ربات رادار اینترنت ایران — نسخه نهایی بر پایه KV (STATS)
 * ═══════════════════════════════════════════════════════════════
 */

const BOT_USERNAME = "Radarinternetiranbot";
const CH1 = "@radarinternetiran";
const CH2 = "@royal_trust_ir_official";
const ADMIN_PASS = "mohmedkord1388";

const now = () => Math.floor(Date.now() / 1000);
const faNum = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const faTime = ts => {
    try { return new Date(ts * 1000).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }); }
    catch { return String(ts); }
};

// ═══════════════════════════════════════════════════════════════
//   توابع ارتباط با تلگرام
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
//   لایه دیتابیس (KV STATS)
// ═══════════════════════════════════════════════════════════════
const db = {
    getUser: async (env, uid) => {
        const raw = await env.STATS.get("USER_" + uid);
        return raw ? JSON.parse(raw) : null;
    },
    saveUser: async (env, uid, data) => {
        await env.STATS.put("USER_" + uid, JSON.stringify(data));
    },
    getState: async (env, uid) => {
        const raw = await env.STATS.get("STATE_" + uid);
        return raw ? JSON.parse(raw) : null;
    },
    setState: async (env, uid, action, data = "") => {
        await env.STATS.put("STATE_" + uid, JSON.stringify({ action, data }));
    },
    clearState: async (env, uid) => {
        await env.STATS.delete("STATE_" + uid);
    },
    getSetting: async (env, key) => await env.STATS.get("SETTING_" + key),
    setSetting: async (env, key, val) => await env.STATS.put("SETTING_" + key, val)
};

async function addOrUpdateUser(env, uid, name, uname) {
    let u = await db.getUser(env, uid);
    if (!u) {
        u = {
            id: uid, first_name: name, username: uname,
            points: 0, messages: 0, invites: 0, streak: 0,
            last_daily: 0, is_banned: 0, ban_reason: "", join_date: now()
        };
        await db.saveUser(env, uid, u);
        const total = parseInt(await env.STATS.get("TOTAL_USERS") || "0");
        await env.STATS.put("TOTAL_USERS", String(total + 1));
        return true;
    }
    u.first_name = name;
    u.username = uname;
    await db.saveUser(env, uid, u);
    return false;
}

async function addPoints(env, uid, pts, isMsg = false) {
    let u = await db.getUser(env, uid);
    if (!u) return;
    u.points += pts;
    if (isMsg) u.messages += 1;
    await db.saveUser(env, uid, u);
    await updateLeaderboard(env, uid, u.first_name, u.points);
}

async function updateLeaderboard(env, uid, name, points) {
    let lbRaw = await env.STATS.get("LEADERBOARD");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    let existing = lb.find(x => x.id === uid);
    if (existing) { existing.p = points; existing.n = name; }
    else lb.push({ id: uid, p: points, n: name });
    lb.sort((a, b) => b.p - a.p);
    await env.STATS.put("LEADERBOARD", JSON.stringify(lb.slice(0, 50)));
}

async function getTopUsers(env, limit = 10) {
    let lbRaw = await env.STATS.get("LEADERBOARD");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    return lb.slice(0, limit);
}

async function getRank(env, uid) {
    let lbRaw = await env.STATS.get("LEADERBOARD");
    let lb = lbRaw ? JSON.parse(lbRaw) : [];
    const idx = lb.findIndex(x => x.id === uid);
    return idx === -1 ? "?" : idx + 1;
}

// ═══════════════════════════════════════════════════════════════
//   داده‌های خارجی (Cloudflare Radar, OONI)
// ═══════════════════════════════════════════════════════════════
const METRICS = {
    latency:     { name: "تاخیر (ms)",          color: "#36a2eb" },
    bandwidth:   { name: "پهنای باند (Mbps)",   color: "#4bc0c0" },
    jitter:      { name: "جیتر (ms)",            color: "#ff9f40" },
    packet_loss: { name: "افت بسته (درصد)",     color: "#ff6384" }
};

async function fetchRadar(env, metric, range = "1h") {
    if (!env.CLOUDFLARE_API_TOKEN) return null;
    const cacheKey = `CACHE_RADAR_${metric}_${range}`;
    const cached = await env.STATS.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?location=IR&dateRange=${range}&metric=${metric}&aggInterval=1h`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` } });
        const data = await res.json();
        if (!data.success) return null;
        await env.STATS.put(cacheKey, JSON.stringify(data.result), { expirationTtl: 1800 });
        return data.result;
    } catch (e) { return null; }
}

async function checkOONI(env, domain) {
    const cacheKey = `CACHE_OONI_${domain}`;
    const cached = await env.STATS.get(cacheKey);
    if (cached) return JSON.parse(cached);
    try {
        const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const until = new Date().toISOString().split('T')[0];
        const res = await fetch("https://api.ooni.io/api/v1/aggregation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ since, until, domain, probe_cc: "IR", axis_x: "measurement_start_day" })
        });
        const data = await res.json();
        await env.STATS.put(cacheKey, JSON.stringify(data), { expirationTtl: 3600 });
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
//   متن‌های رسمی (بدون تگ HTML)
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
    const admins = (env.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);
    const rows = [
        [{ text: "📊 آمار من", callback_data: "my_stats" }, { text: "🏆 رتبه‌بندی", callback_data: "leaderboard" }],
        [{ text: "📈 کیفیت اینترنت", callback_data: "quality_menu" }, { text: "🗺️ نقشه استان‌ها", callback_data: "heatmap" }],
        [{ text: "🎁 پاداش روزانه", callback_data: "daily_bonus" }, { text: "👥 لینک دعوت من", callback_data: "my_invite" }],
        [{ text: "🔍 بررسی سانسور", callback_data: "ooni_start" }, { text: "ℹ️ درباره", callback_data: "about" }]
    ];
    if (admins.includes(uid) || admins.includes(String(uid))) {
        rows.push([{ text: "⚙️ پنل مدیریت", callback_data: "admin_panel" }]);
    }
    return { inline_keyboard: rows };
}

const forceJoinKb = () => ({
    inline_keyboard: [
        [{ text: "📢 کانال رادار", url: "https://t.me/radarinternetiran" }],
        [{ text: "👑 کانال رویال تراست", url: "https://t.me/royal_trust_ir_official" }],
        [{ text: "✅ عضو شدم، بررسی کن", callback_data: "check_join" }]
    ]
});

const qualityKb = () => ({
    inline_keyboard: [
        [{ text: "⏱️ تاخیر یک ساعته", callback_data: "chart_latency" }],
        [{ text: "🚀 پهنای باند یک ساعته", callback_data: "chart_bandwidth" }],
        [{ text: "📶 جیتر یک ساعته", callback_data: "chart_jitter" }],
        [{ text: "📉 افت بسته یک ساعته", callback_data: "chart_packet_loss" }],
        [{ text: "🔙 بازگشت", callback_data: "main_menu" }]
    ]
});

const adminKb = () => ({
    inline_keyboard: [
        [{ text: "👤 لیست کاربران", callback_data: "adm_users" }, { text: "🔍 جستجو", callback_data: "adm_search" }],
        [{ text: "🚫 مسدود کردن", callback_data: "adm_ban" }, { text: "✅ رفع مسدودی", callback_data: "adm_unban" }],
        [{ text: "📨 پیام همگانی", callback_data: "adm_broadcast" }, { text: "📊 آمار کلی", callback_data: "adm_stats" }],
        [{ text: "🔙 بازگشت", callback_data: "main_menu" }]
    ]
});

const backMain = () => ({ inline_keyboard: [[{ text: "🔙 منوی اصلی", callback_data: "main_menu" }]] });
const backAdmin = () => ({ inline_keyboard: [[{ text: "🔙 پنل ادمین", callback_data: "admin_panel" }]] });

async function checkMember(env, uid) {
    try {
        const [ch, gr] = await Promise.all([
            tgApi(env, "getChatMember", { chat_id: CH1, user_id: uid }),
            tgApi(env, "getChatMember", { chat_id: CH2, user_id: uid })
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
        const url = new URL(request.url);

        // تنظیم وب‌هوک
        if (url.pathname === "/setwebhook") {
            const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook?url=${url.origin}/`);
            return new Response("Webhook: " + await r.text());
        }

        // دریافت پیام‌های تلگرام
        if (request.method === "POST") {
            try {
                const update = await request.json();
                ctx.waitUntil(processUpdate(env, update));
            } catch(e) { console.error(e.message); }
            return new Response("OK");
        }

        return new Response("ربات رادار اینترنت ایران فعال است.");
    },

    async scheduled(event, env, ctx) {
        // ارسال نمودار ساعتی به کانال (در صورت تنظیم کران‌جاب)
        if (event.cron === "0 * * * *") {
            ctx.waitUntil(sendHourlyChartToChannel(env));
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
        console.error("Critical Error:", e.message);
    }
}

async function handleStart(env, msg) {
    const uid = String(msg.from_user.id);
    const name = msg.from_user.first_name || "کاربر";
    const uname = msg.from_user.username || "";

    const u = await db.getUser(env, uid);
    if (u && u.is_banned === 1) {
        await sendMessage(env, msg.chat.id, BAN_MESSAGE(u.ban_reason, new Date().toLocaleString('fa-IR'), uid));
        return;
    }

    const isNew = await addOrUpdateUser(env, uid, name, uname);

    if (isNew && msg.text?.startsWith("/start invite_")) {
        const inviter = String(msg.text.replace("/start invite_", ""));
        if (inviter !== uid) {
            let invU = await db.getUser(env, inviter);
            if (invU) {
                invU.invites += 1;
                await addPoints(env, inviter, 10);
                await sendMessage(env, inviter, `🎉 یک کاربر جدید با لینک شما عضو شد!\n⭐️ ۱۰ امتیاز گرفتید.`).catch(() => {});
            }
        }
    }

    if (!(await checkMember(env, uid))) {
        await sendMessage(env, msg.chat.id, "⚠️ برای استفاده از ربات، ابتدا در کانال‌های زیر عضو شوید:\n\nسپس روی دکمه بررسی بزنید.", forceJoinKb());
        return;
    }

    await sendMessage(env, msg.chat.id, `سلام ${name} عزیز! 👋\nبه ربات رادار اینترنت ایران خوش آمدی.\n\nاز منوی زیر انتخاب کن:`, mainKeyboard(env, uid));
}

async function handleGroupMessage(env, msg) {
    if (!msg.from || msg.from.is_bot) return;
    const uid = String(msg.from.id);
    let u = await db.getUser(env, uid);
    if (!u) await addOrUpdateUser(env, uid, msg.from.first_name || "", msg.from.username || "");
    await addPoints(env, uid, 1, true);
}

async function handleCallback(env, call) {
    const uid = String(call.from_user.id);
    const data = call.data;
    const cid = call.message.chat.id;
    const mid = call.message.message_id;
    const admins = (env.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);

    const u = await db.getUser(env, uid);
    if (u && u.is_banned === 1) {
        await answerCallback(env, call.id, "شما مسدود شده‌اید.", true);
        return;
    }

    if (data === "check_join") {
        if (await checkMember(env, uid)) {
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
        const user = await db.getUser(env, uid);
        const rank = await getRank(env, uid);
        const link = `https://t.me/${BOT_USERNAME}?start=invite_${uid}`;
        const text = `📊 آمار شما:\n━━━━━━━━━━━━━━━━\n\n👤 نام: ${user.first_name}\n🆔 آیدی: ${uid}\n⭐️ امتیاز: ${faNum(user.points)}\n💬 پیام‌ها: ${faNum(user.messages)}\n👥 دعوت‌ها: ${faNum(user.invites)}\n🔥 روزهای پیوسته: ${faNum(user.streak || 0)}\n🏅 رتبه: ${faNum(rank)}\n\n🔗 لینک دعوت شما:\n${link}`;
        await editMessage(env, cid, mid, text, backMain());
        return;
    }

    if (data === "leaderboard") {
        const top = await getTopUsers(env, 10);
        let text = "🏆 ده کاربر برتر:\n━━━━━━━━━━━━━━━━\n\n";
        top.forEach((tu, i) => {
            const m = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${faNum(i + 1)}.`;
            text += `${m} ${tu.n} — ${faNum(tu.p)} امتیاز\n`;
        });
        await editMessage(env, cid, mid, text, backMain());
        return;
    }

    if (data === "my_invite") {
        const link = `https://t.me/${BOT_USERNAME}?start=invite_${uid}`;
        const user = await db.getUser(env, uid);
        await editMessage(env, cid, mid, `👥 سیستم دعوت\n━━━━━━━━━━━━━━━━\n\nبا اشتراک لینک زیر، هر کاربر جدیدی که عضو شود ۱۰ امتیاز می‌گیرید:\n\n${link}\n\n📊 تعداد دعوت‌های موفق شما: ${faNum(user?.invites || 0)}`, backMain());
        return;
    }

    if (data === "daily_bonus") {
        const user = await db.getUser(env, uid);
        const diff = now() - (user?.last_daily || 0);
        if (diff < 86400) {
            const hrs = Math.floor((86400 - diff) / 3600);
            await answerCallback(env, call.id, `⏳ زمان باقی‌مانده: ${hrs} ساعت`, true);
            return;
        }
        let newStreak = (user?.streak && diff < 172800) ? user.streak + 1 : 1;
        const bonus = 5 + Math.min(newStreak * 2, 20);
        user.points += bonus;
        user.streak = newStreak;
        user.last_daily = now();
        await db.saveUser(env, uid, user);
        await updateLeaderboard(env, uid, user.first_name, user.points);
        await answerCallback(env, call.id, `🎁 پاداش دریافت شد!\n+${faNum(bonus)} امتیاز\n🔥 روزهای پیوسته: ${faNum(newStreak)}`, true);
        return;
    }

    if (data === "quality_menu") {
        await editMessage(env, cid, mid, "📈 کیفیت اینترنت ایران\nیک متریک را انتخاب کنید:", qualityKb());
        return;
    }

    if (data.startsWith("chart_")) {
        const metric = data.replace("chart_", "");
        await answerCallback(env, call.id, "⏳ در حال ساخت نمودار...");
        const iqi = await fetchRadar(env, metric, "1h");
        if (!iqi?.timestamps) { await sendMessage(env, cid, "❌ داده‌ای دریافت نشد (توکن کلادفلر چک شود)."); return; }
        const labels = labelsFrom(iqi.timestamps);
        const m = METRICS[metric] || { name: metric, color: "#36a2eb" };
        const url = chartUrl(labels, [buildDataset(m.name, iqi.values || [], m.color)], `رادار - ${m.name}`);
        await sendPhoto(env, cid, url, `📊 نمودار یک ساعته ${m.name}\n⏰ ${faTime(now())}`);
        return;
    }

    if (data === "heatmap") {
        await answerCallback(env, call.id, "⏳ ساخت نقشه...");
        await editMessage(env, cid, mid, "🗺️ نقشه حرارتی کیفیت اینترنت استان‌ها\n(داده‌های نمونه)\n\n🟢 تهران: خوب\n🟠 اصفهان: متوسط\n🔴 سیستان و بلوچستان: ضعیف", backMain());
        return;
    }

    if (data === "ooni_start") {
        await db.setState(env, uid, "await_ooni");
        await sendMessage(env, cid, "🔍 دامنه مورد نظر را ارسال کنید (مثلاً twitter.com):");
        return;
    }

    if (data === "about") {
        await editMessage(env, cid, mid, "ℹ️ درباره ربات\n━━━━━━━━━━━━━━━━\n\n🔭 رادار اینترنت ایران\n📡 منابع: کلادفلر رادار، OONI\n⚙️ بستر: کلادفلر ورکرز", backMain());
        return;
    }

    // ═══════════════════════════════════════════════════════════════
    //   پنل مدیریت
    // ═══════════════════════════════════════════════════════════════
    if (!admins.includes(parseInt(uid))) {
        await answerCallback(env, call.id, "⛔️ دسترسی ندارید.", true);
        return;
    }

    if (data === "admin_panel") {
        await editMessage(env, cid, mid, "⚙️ پنل مدیریت\nیک گزینه انتخاب کنید:", adminKb());
        return;
    }

    if (data === "adm_stats") {
        const total = await env.STATS.get("TOTAL_USERS") || "0";
        await editMessage(env, cid, mid, `📊 آمار کلی:\n━━━━━━━━━━━━━━━━\n\n👥 کل کاربران: ${faNum(total)}`, adminKb());
        return;
    }

    if (data === "adm_search") { await db.setState(env, uid, "await_search"); await sendMessage(env, cid, "🔍 آیدی عددی کاربر:"); return; }
    if (data === "adm_ban") { await db.setState(env, uid, "await_ban"); await sendMessage(env, cid, "🚫 آیدی برای مسدودسازی:"); return; }
    if (data === "adm_unban") { await db.setState(env, uid, "await_unban"); await sendMessage(env, cid, "✅ آیدی برای رفع مسدودی:"); return; }
    if (data === "adm_broadcast") { await db.setState(env, uid, "await_broadcast"); await sendMessage(env, cid, "📨 متن پیام همگانی:"); return; }
}

// ═══════════════════════════════════════════════════════════════
//   پردازش پیام‌های حالت‌دار
// ═══════════════════════════════════════════════════════════════
async function handleStatefulMessage(env, msg) {
    const uid = String(msg.from_user.id);
    const text = (msg.text || "").trim();
    const chatId = msg.chat.id;
    if (!text) return false;

    const state = await db.getState(env, uid);
    if (!state) return false;

    const admins = (env.ADMIN_IDS || "").split(",").map(x => parseInt(x.trim())).filter(Boolean);

    if (state.action === "await_ooni") {
        await db.clearState(env, uid);
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

    if (!admins.includes(parseInt(uid))) return false;

    if (state.action === "await_search") {
        await db.clearState(env, uid);
        const tu = await db.getUser(env, text);
        if (!tu) { await sendMessage(env, chatId, "❌ کاربر یافت نشد.", backAdmin()); return true; }
        await sendMessage(env, chatId, `👤 اطلاعات کاربر\n━━━━━━━━━━━━━━━━\n\n👤 نام: ${tu.first_name}\n🆔 آیدی: ${tu.id}\n⭐️ امتیاز: ${faNum(tu.points)}\n📌 وضعیت: ${tu.is_banned ? "مسدود" : "فعال"}`, backAdmin());
        return true;
    }

    if (state.action === "await_ban") {
        await db.clearState(env, uid);
        const tu = await db.getUser(env, text);
        if (!tu) { await sendMessage(env, chatId, "❌ کاربر یافت نشد."); return true; }
        tu.is_banned = 1;
        tu.ban_reason = "تخلف از قوانین ربات";
        await db.saveUser(env, text, tu);
        await sendMessage(env, text, BAN_MESSAGE(tu.ban_reason, new Date().toLocaleString('fa-IR'), text)).catch(() => {});
        await sendMessage(env, chatId, `✅ کاربر ${text} مسدود شد و اطلاعیه رسمی برایش ارسال گردید.`, backAdmin());
        return true;
    }

    if (state.action === "await_unban") {
        await db.clearState(env, uid);
        const tu = await db.getUser(env, text);
        if (tu) {
            tu.is_banned = 0;
            tu.ban_reason = "";
            await db.saveUser(env, text, tu);
            await sendMessage(env, text, UNBAN_MESSAGE).catch(() => {});
        }
        await sendMessage(env, chatId, `✅ کاربر ${text} رفع مسدودی شد و پیام بازگشت برایش ارسال گردید.`, backAdmin());
        return true;
    }

    if (state.action === "await_broadcast") {
        await db.clearState(env, uid);
        const lbRaw = await env.STATS.get("LEADERBOARD");
        const lb = lbRaw ? JSON.parse(lbRaw) : [];
        let ok = 0, fail = 0;
        for (let i = 0; i < lb.length; i++) {
            const res = await sendMessage(env, lb[i].id, text);
            if (res.ok) ok++; else fail++;
        }
        await sendMessage(env, chatId, `📨 نتیجه ارسال:\n✅ موفق: ${faNum(ok)}\n❌ ناموفق: ${faNum(fail)}`, backAdmin());
        return true;
    }

    return false;
}

// ═══════════════════════════════════════════════════════════════
//   ارسال نمودار ساعتی به کانال (Cron)
// ═══════════════════════════════════════════════════════════════
async function sendHourlyChartToChannel(env) {
    if (!env.CLOUDFLARE_API_TOKEN) return;
    const iqi = await fetchRadar(env, "latency", "1h");
    if (!iqi?.timestamps) return;
    const url = chartUrl(labelsFrom(iqi.timestamps), [buildDataset("تاخیر (میلی‌ثانیه)", iqi.values || [], "#36a2eb")], "نمودار یک ساعته - تاخیر");
    await sendPhoto(env, CH1, url, `📊 نمودار یک ساعته تاخیر اینترنت ایران\n⏰ ${faTime(now())}`);
    }
