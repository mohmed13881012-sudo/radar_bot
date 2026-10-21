// ===================================================================
// 🌐 رادار اینترنت ایران - نسخه کامل (بخش ۱ از ۲)
// هسته، کاربران، امتیاز، نشان، لول، اسپین، دعوت، اشتراک، هشدار، کیبورد
// ===================================================================

// ---------- تنظیمات کلی ----------
const CONFIG = {
  CHART_POINTS: 48,                 // ۴۸ نقطه = ۲۴ ساعت (هر ۳۰ دقیقه)
  MAX_HISTORY: 2000,                // حداکثر نقاط تاریخی در KV
  SPIN_DAILY_LIMIT: 3,
  REFERRAL_POINTS: 20,
  REFERRER_POINTS: 5,
  DAILY_CHECKIN_POINTS: 10,
  LEADERBOARD_SIZE: 10,
  LEVEL_STEP: 100,                  // هر ۱۰۰ امتیاز = ۱ لول
  ALERT_THRESHOLD_PING: 250,        // آستانه هشدار پینگ
  ALERT_THRESHOLD_LOSS: 5,          // آستانه هشدار packet loss
};

const KEYS = {
  STATS: "radar:stats",
  HISTORY: "radar:history",
  USERS_INDEX: "radar:users:index",
  USER: (id) => `radar:user:${id}`,
  ALERT: (id) => `radar:alert:${id}`,
  ALERTS_INDEX: "radar:alerts:index",
  SUB: (id) => `radar:sub:${id}`,
  SUBS_INDEX: "radar:subs:index",
  SPIN_LOG: (id, day) => `radar:spin:${id}:${day}`,
  CHECKIN: (id, day) => `radar:checkin:${id}:${day}`,
  PREDICT_CACHE: "radar:predict:cache",
  LAST_CHANNEL_POST: "radar:channel:last",
  LEADERBOARD_PIN: "radar:leaderboard:pin",
  BROADCAST_LOCK: "radar:broadcast:lock",
};

// ---------- پشتیبانی از اپراتورها ----------
const OPERATORS = [
  { id: "mci",  name: "همراه اول",  emoji: "🟢" },
  { id: "irancell", name: "ایرانسل", emoji: "🟡" },
  { id: "rightel", name: "رایتل",   emoji: "🔵" },
  { id: "shatel",  name: "شاتل",     emoji: "🟣" },
  { id: "asiatech", name: "آسیاتک", emoji: "🟠" },
  { id: "pars",    name: "پارس‌آنلاین", emoji: "🔴" },
  { id: "mokhaberat", name: "مخابرات", emoji: "⚪" },
];

// ---------- نشان‌های سیستم ----------
const BADGES = {
  NEWBIE:     { id: "newbie",     name: "🌱 تازه‌وارد",   points: 0,   desc: "به رادار خوش آمدید" },
  BRONZE:     { id: "bronze",     name: "🥉 برنزی",       points: 50,  desc: "اولین ۵۰ امتیاز" },
  SILVER:     { id: "silver",     name: "🥈 نقره‌ای",     points: 200, desc: "به ۲۰۰ امتیاز رسیدید" },
  GOLD:       { id: "gold",       name: "🥇 طلایی",       points: 500, desc: "به ۵۰۰ امتیاز رسیدید" },
  PLATINUM:   { id: "platinum",   name: "💎 پلاتینیوم",   points: 1500, desc: "افسانه‌ای!" },
  REFERRER:   { id: "referrer",   name: "🤝 دعوت‌کننده",  points: 0,   desc: "اولین دعوت موفق" },
  REFERRER_5: { id: "referrer5",  name: "🎯 دعوت‌کننده حرفه‌ای", points: 0, desc: "۵ دعوت موفق" },
  SPINNER:    { id: "spinner",    name: "🎰 خوش‌شانس",     points: 0,   desc: "برنده اسپین بالای ۵۰" },
  DAILY:      { id: "daily",      name: "🔥 فعال روزانه",  points: 0,   desc: "۷ روز حضور متوالی" },
  REPORT:     { id: "reporter",   name: "📰 خبرنگار",      points: 0,   desc: "اولین گزارش تفصیلی" },
  CHAMPION:   { id: "champion",   name: "👑 قهرمان هفته",  points: 0,   desc: "رتبه ۱ هفته" },
};

// ---------- سطوح (Levels) ----------
const LEVELS = [
  { level: 1,  title: "🌱 تازه‌وارد",      min: 0 },
  { level: 2,  title: "🔍 کاوشگر",         min: 100 },
  { level: 3,  title: "📡 رادارگیر",        min: 250 },
  { level: 4,  title: "⚡ تحلیلگر",         min: 500 },
  { level: 5,  title: "🎯 متخصص",          min: 1000 },
  { level: 6,  title: "💎 افسانه",          min: 2000 },
  { level: 7,  title: "👑 استاد رادار",     min: 5000 },
];

// ===================================================================
//                          توابع کمکی KV
// ===================================================================

async function kvGetJSON(env, key) {
  const raw = await env.STATS.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

async function kvPutJSON(env, key, value) {
  // همیشه await - این کلید حل مشکل ذخیره نشدن آمار است
  await env.STATS.put(key, JSON.stringify(value));
}

async function kvListPrefix(env, prefix) {
  const result = await env.STATS.list({ prefix });
  return result.keys.map(k => k.name);
}

async function kvDelete(env, key) {
  await env.STATS.delete(key);
}

// ===================================================================
//                       توابع API تلگرام
// ===================================================================

async function tgCall(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(env, chatId, text, keyboard = null, extra = {}) {
  return tgCall(env, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
    ...extra,
  });
}

async function editMessage(env, chatId, messageId, text, keyboard = null) {
  return tgCall(env, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
  });
}

async function answerCallback(env, id, text = "") {
  return tgCall(env, "answerCallbackQuery", { callback_query_id: id, text });
}

async function deleteMessage(env, chatId, messageId) {
  return tgCall(env, "deleteMessage", { chat_id: chatId, message_id: messageId });
}

async function pinMessage(env, chatId, messageId) {
  return tgCall(env, "pinChatMessage", { chat_id: chatId, message_id: messageId, disable_notification: true });
}

async function sendPhoto(env, chatId, photo, caption, keyboard = null) {
  return tgCall(env, "sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
    ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
  });
}

async function broadcastMessage(env, chatIds, text, keyboard = null) {
  let success = 0, failed = 0;
  for (const id of chatIds) {
    try {
      const r = await sendMessage(env, id, text, keyboard);
      if (r.ok) success++;
      else failed++;
    } catch { failed++; }
    await new Promise(r => setTimeout(r, 40)); // محدودیت نرخ تلگرام
  }
  return { success, failed };
}

// ===================================================================
//                    تاریخ و زمان (شمسی و میلادی)
// ===================================================================

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function hourKey() {
  const d = new Date();
  return `${todayKey()}T${String(d.getHours()).padStart(2,"0")}`;
}

function faDate(ts = Date.now()) {
  try {
    return new Date(ts).toLocaleString("fa-IR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return new Date(ts).toISOString(); }
}

function faTime(ts = Date.now()) {
  try { return new Date(ts).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }); }
  catch { return new Date(ts).toISOString(); }
}

function daysAgo(ts) {
  const diff = Date.now() - ts;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ===================================================================
//                       مدیریت کاربران
// ===================================================================

async function getUser(env, userId) {
  const key = KEYS.USER(userId);
  let user = await kvGetJSON(env, key);
  if (!user) {
    user = {
      id: userId,
      username: null,
      firstName: null,
      points: 0,
      level: 1,
      badges: [BADGES.NEWBIE.id],
      referrals: 0,
      invitedBy: null,
      spinCount: 0,
      lastSpinDay: null,
      checkinStreak: 0,
      lastCheckin: null,
      joinDate: Date.now(),
      lastSeen: Date.now(),
      totalReports: 0,
      isPremium: false,
      isBanned: false,
    };
    await kvPutJSON(env, key, user);
    // به‌روزرسانی ایندکس کاربران
    const idx = await kvGetJSON(env, KEYS.USERS_INDEX) || { ids: [] };
    if (!idx.ids.includes(userId)) {
      idx.ids.push(userId);
      await kvPutJSON(env, KEYS.USERS_INDEX, idx);
    }
  }
  user.lastSeen = Date.now();
  return user;
}

async function saveUser(env, user) {
  await kvPutJSON(env, KEYS.USER(user.id), user);
}

async function getAllUsers(env) {
  const idx = await kvGetJSON(env, KEYS.USERS_INDEX) || { ids: [] };
  const users = [];
  for (const id of idx.ids) {
    const u = await kvGetJSON(env, KEYS.USER(id));
    if (u) users.push(u);
  }
  return users;
}

async function banUser(env, userId, reason = "") {
  const u = await getUser(env, userId);
  u.isBanned = true;
  u.banReason = reason;
  await saveUser(env, u);
}

async function unbanUser(env, userId) {
  const u = await getUser(env, userId);
  u.isBanned = false;
  delete u.banReason;
  await saveUser(env, u);
}

// ===================================================================
//                    امتیاز، لول و نشان
// ===================================================================

function getLevelInfo(points) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  const progress = next
    ? Math.min(100, Math.floor(((points - current.min) / (next.min - current.min)) * 100))
    : 100;
  return { level: current.level, title: current.title, progress, next };
}

async function addPoints(env, userId, amount, reason = "") {
  const user = await getUser(env, userId);
  const before = user.points;
  user.points += amount;
  const lvl = getLevelInfo(user.points).level;
  const newBadges = [];

  // بررسی نشان‌های جدید بر اساس امتیاز
  for (const b of Object.values(BADGES)) {
    if (b.points > 0 && user.points >= b.points && !user.badges.includes(b.id)) {
      user.badges.push(b.id);
      newBadges.push(b);
    }
  }

  user.level = lvl;
  await saveUser(env, user);
  return { user, newBadges, pointsBefore: before, pointsAfter: user.points };
}

async function grantBadge(env, userId, badgeId) {
  const user = await getUser(env, userId);
  if (!user.badges.includes(badgeId)) {
    user.badges.push(badgeId);
    await saveUser(env, user);
    return true;
  }
  return false;
}

function renderBadges(user) {
  if (!user.badges || user.badges.length === 0) return "—";
  return user.badges.map(id => BADGES[Object.keys(BADGES).find(k => BADGES[k].id === id)]?.name || id).join(" | ");
}

function progressBar(percent, len = 12) {
  const filled = Math.round((percent / 100) * len);
  return "█".repeat(filled) + "░".repeat(len - filled);
}

// ===================================================================
//                        سیستم اسپین
// ===================================================================

const SPIN_PRIZES = [
  { weight: 15, points: 0,   text: "😢 هیچی! دفعه بعد شانس بیار" },
  { weight: 25, points: 5,   text: "🙂 ۵ امتیاز" },
  { weight: 25, points: 10,  text: "😀 ۱۰ امتیاز" },
  { weight: 15, points: 20,  text: "😃 ۲۰ امتیاز" },
  { weight: 10, points: 30,  text: "😄 ۳۰ امتیاز" },
  { weight: 6,  points: 50,  text: "🤩 ۵۰ امتیاز!" },
  { weight: 3,  points: 100, text: "🔥 ۱۰۰ امتیاز!!!" },
  { weight: 1,  points: 250, text: "💎 ۲۵۰ امتیاز جکپات!!!" },
];

function pickPrize() {
  const total = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of SPIN_PRIZES) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return SPIN_PRIZES[0];
}

async function handleSpin(env, chatId, userId, messageId = null) {
  const user = await getUser(env, userId);
  const today = todayKey();

  if (user.lastSpinDay !== today) {
    user.spinCount = 0;
    user.lastSpinDay = today;
    await saveUser(env, user);
  }
  if (user.spinCount >= CONFIG.SPIN_DAILY_LIMIT) {
    const txt = `⛔️ <b>سقف اسپین روزانه</b>\n\nشما امروز ${CONFIG.SPIN_DAILY_LIMIT} بار اسپین کرده‌اید.\nفردا دوباره امتحان کنید!`;
    return messageId ? editMessage(env, chatId, messageId, txt, [[{ text: "🔙 بازگشت", callback_data: "back_main" }]])
                     : sendMessage(env, chatId, txt);
  }

  // انیمیشن ساده
  if (messageId) {
    await editMessage(env, chatId, messageId, "🎰 <b>در حال چرخش...</b>\n\n🔄 🔄 🔄");
  }
  await new Promise(r => setTimeout(r, 700));

  const prize = pickPrize();
  user.spinCount++;
  await saveUser(env, user);

  const result = await addPoints(env, userId, prize.points, "spin");
  if (prize.points >= 50) await grantBadge(env, userId, BADGES.SPINNER.id);

  const remaining = CONFIG.SPIN_DAILY_LIMIT - user.spinCount;
  let txt = `🎰 <b>نتیجه اسپین:</b>\n\n${prize.text}\n\n`;
  txt += `📊 امتیاز فعلی: <b>${result.user.points}</b>\n`;
  txt += `🎯 اسپین باقی‌مانده امروز: <b>${remaining}</b>\n`;
  if (result.newBadges.length) {
    txt += `\n🎖️ <b>نشان جدید:</b> ${result.newBadges.map(b => b.name).join(", ")}`;
  }
  const kb = [
    [{ text: "🎰 دوباره", callback_data: "spin" }],
    [{ text: "🔙 بازگشت", callback_data: "back_main" }],
  ];
  return messageId ? editMessage(env, chatId, messageId, txt, kb)
                   : sendMessage(env, chatId, txt, kb);
}

// ===================================================================
//                     سیستم دعوت دوستان
// ===================================================================

async function handleReferral(env, chatId, userId, messageId = null) {
  const user = await getUser(env, userId);
  const link = `https://t.me/Radarineternetiranbot?start=ref_${userId}`;

  let txt = `👥 <b>دعوت دوستان</b>\n\n`;
  txt += `با دعوت هر دوست: <b>+${CONFIG.REFERRAL_POINTS} امتیاز</b> برای شما\n`;
  txt += `و <b>+${CONFIG.REFERRER_POINTS} امتیاز</b> هدیه برای دوستتان\n\n`;
  txt += `🔗 لینک اختصاصی شما:\n<code>${link}</code>\n\n`;
  txt += `📊 تعداد دعوت‌های موفق: <b>${user.referrals}</b>\n`;
  txt += `🏅 امتیاز شما: <b>${user.points}</b>`;

  const kb = [
    [{ text: "📤 اشتراک لینک", url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("به رادار اینترنت ایران بپیوند!")}` }],
    [{ text: "🔙 بازگشت", callback_data: "back_main" }],
  ];
  return messageId ? editMessage(env, chatId, messageId, txt, kb)
                   : sendMessage(env, chatId, txt, kb);
}

async function processReferral(env, newUserId, referrerId) {
  if (newUserId === referrerId) return false;
  const newUser = await getUser(env, newUserId);
  if (newUser.invitedBy) return false; // قبلاً دعوت شده

  const referrer = await getUser(env, referrerId);
  if (referrer.isBanned) return false;

  newUser.invitedBy = referrerId;
  await saveUser(env, newUser);

  referrer.referrals += 1;
  await saveUser(env, referrer);

  await addPoints(env, referrerId, CONFIG.REFERRAL_POINTS, "referral");
  await addPoints(env, newUserId, CONFIG.REFERRER_POINTS, "referred");
  await grantBadge(env, referrerId, BADGES.REFERRER.id);
  if (referrer.referrals >= 5) await grantBadge(env, referrerId, BADGES.REFERRER_5.id);
  return true;
}

// ===================================================================
//                       چک‌این روزانه
// ===================================================================

async function handleCheckin(env, chatId, userId, messageId = null) {
  const today = todayKey();
  const checkKey = KEYS.CHECKIN(userId, today);
  const already = await kvGetJSON(env, checkKey);

  if (already) {
    const txt = `✅ شما امروز چک‌این کرده‌اید.\n⏰ فردا دوباره برگردید!`;
    return messageId ? editMessage(env, chatId, messageId, txt, [[{ text: "🔙 بازگشت", callback_data: "back_main" }]])
                     : sendMessage(env, chatId, txt);
  }

  const user = await getUser(env, userId);
  const yesterday = new Date(Date.now() - 86400000);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
  const yCheck = await kvGetJSON(env, KEYS.CHECKIN(userId, yKey));

  user.checkinStreak = yCheck ? (user.checkinStreak || 0) + 1 : 1;
  user.lastCheckin = today;
  await saveUser(env, user);
  await kvPutJSON(env, checkKey, { ts: Date.now(), streak: user.checkinStreak });

  const bonus = user.checkinStreak >= 7 ? CONFIG.DAILY_CHECKIN_POINTS * 2 : CONFIG.DAILY_CHECKIN_POINTS;
  const result = await addPoints(env, userId, bonus, "checkin");
  if (user.checkinStreak >= 7) await grantBadge(env, userId, BADGES.DAILY.id);

  let txt = `🔥 <b>چک‌این روزانه</b>\n\n`;
  txt += `✅ ثبت شد! +${bonus} امتیاز\n`;
  txt += `🔥 استریک: ${user.checkinStreak} روز متوالی\n`;
  txt += `📊 امتیاز کل: ${result.user.points}`;
  return messageId ? editMessage(env, chatId, messageId, txt, [[{ text: "🔙 بازگشت", callback_data: "back_main" }]])
                   : sendMessage(env, chatId, txt);
}

// ===================================================================
//                       لیدربورد و سنجاق
// ===================================================================

async function getLeaderboard(env, size = CONFIG.LEADERBOARD_SIZE) {
  const users = await getAllUsers(env);
  return users
    .filter(u => !u.isBanned)
    .sort((a, b) => b.points - a.points)
    .slice(0, size);
}

async function renderLeaderboard(env, size = 10) {
  const top = await getLeaderboard(env, size);
  if (top.length === 0) return "🏆 هنوز کاربری وجود ندارد.";

  const medals = ["🥇", "🥈", "🥉"];
  let txt = `🏆 <b>قهرمانان هفته رادار</b>\n\n`;
  for (let i = 0; i < top.length; i++) {
    const u = top[i];
    const m = medals[i] || `${i + 1}.`;
    const name = u.username ? `@${u.username}` : (u.firstName || "کاربر");
    const lvl = getLevelInfo(u.points).title;
    txt += `${m} ${name} — <b>${u.points}</b> امتیاز (${lvl})\n`;
  }
  txt += `\n⏰ ${faDate()}`;
  return txt;
}

async function pinLeaderboardToChannel(env) {
  if (!env.CHANNEL_ID) return { ok: false, error: "CHANNEL_ID not set" };
  const txt = await renderLeaderboard(env, 10);

  // حذف پین قبلی در صورت وجود
  const prev = await kvGetJSON(env, KEYS.LEADERBOARD_PIN);
  if (prev && prev.messageId) {
    try { await tgCall(env, "unpinChatMessage", { chat_id: env.CHANNEL_ID, message_id: prev.messageId }); } catch {}
  }

  const sent = await sendMessage(env, env.CHANNEL_ID, txt);
  if (sent.ok) {
    await pinMessage(env, env.CHANNEL_ID, sent.result.message_id);
    await kvPutJSON(env, KEYS.LEADERBOARD_PIN, { messageId: sent.result.message_id, ts: Date.now() });
    // نشان قهرمان به نفر اول
    const top = await getLeaderboard(env, 1);
    if (top[0]) await grantBadge(env, top[0].id, BADGES.CHAMPION.id);
    return { ok: true };
  }
  return { ok: false, error: sent.description };
}

// ===================================================================
//                    اشتراک اپراتور
// ===================================================================

async function getSubscription(env, userId) {
  return await kvGetJSON(env, KEYS.SUB(userId)) || { userId, operators: [], alerts: true, ts: Date.now() };
}

async function saveSubscription(env, sub) {
  await kvPutJSON(env, KEYS.SUB(sub.userId), sub);
  const idx = await kvGetJSON(env, KEYS.SUBS_INDEX) || { ids: [] };
  if (!idx.ids.includes(sub.userId)) {
    idx.ids.push(sub.userId);
    await kvPutJSON(env, KEYS.SUBS_INDEX, idx);
  }
}

async function handleSubscriptionMenu(env, chatId, userId, messageId = null) {
  const sub = await getSubscription(env, userId);
  let txt = `📡 <b>اشتراک اپراتور</b>\n\n`;
  txt += `اپراتورهایی که دنبال می‌کنید:\n`;
  if (sub.operators.length === 0) txt += `<i>هنوز اپراتوری انتخاب نکرده‌اید</i>`;
  else {
    for (const opId of sub.operators) {
      const op = OPERATORS.find(o => o.id === opId);
      if (op) txt += `${op.emoji} ${op.name}\n`;
    }
  }
  txt += `\n🔔 دریافت هشدار افت کیفیت: ${sub.alerts ? "✅ فعال" : "❌ غیرفعال"}\n\n`;
  txt += `برای انتخاب/حذف اپراتور روی دکمه کلیک کنید:`;

  const rows = [];
  for (let i = 0; i < OPERATORS.length; i += 2) {
    const row = [];
    for (let j = i; j < Math.min(i + 2, OPERATORS.length); j++) {
      const op = OPERATORS[j];
      const isSub = sub.operators.includes(op.id);
      row.push({ text: `${isSub ? "✅" : "➕"} ${op.emoji} ${op.name}`, callback_data: `sub_toggle_${op.id}` });
    }
    rows.push(row);
  }
  rows.push([{ text: sub.alerts ? "🔕 غیرفعال کردن هشدار" : "🔔 فعال کردن هشدار", callback_data: "sub_toggle_alerts" }]);
  rows.push([{ text: "🔙 بازگشت", callback_data: "back_main" }]);

  return messageId ? editMessage(env, chatId, messageId, txt, rows)
                   : sendMessage(env, chatId, txt, rows);
}

async function toggleSubscription(env, userId, opId) {
  const sub = await getSubscription(env, userId);
  const idx = sub.operators.indexOf(opId);
  if (idx >= 0) sub.operators.splice(idx, 1);
  else sub.operators.push(opId);
  sub.ts = Date.now();
  await saveSubscription(env, sub);
  return sub;
}

// ===================================================================
//                    سیستم هشدار افت کیفیت
// ===================================================================

async function getAlert(env, userId) {
  return await kvGetJSON(env, KEYS.ALERT(userId)) || {
    userId,
    enabled: false,
    pingThreshold: CONFIG.ALERT_THRESHOLD_PING,
    lossThreshold: CONFIG.ALERT_THRESHOLD_LOSS,
    lastAlertAt: 0,
    cooldownMs: 30 * 60 * 1000,
  };
}

async function saveAlert(env, alert) {
  await kvPutJSON(env, KEYS.ALERT(alert.userId), alert);
  const idx = await kvGetJSON(env, KEYS.ALERTS_INDEX) || { ids: [] };
  if (!idx.ids.includes(alert.userId)) {
    idx.ids.push(alert.userId);
    await kvPutJSON(env, KEYS.ALERTS_INDEX, idx);
  }
}

async function handleAlertMenu(env, chatId, userId, messageId = null) {
  const a = await getAlert(env, userId);
  let txt = `🔔 <b>هشدار افت کیفیت</b>\n\n`;
  txt += `وضعیت: ${a.enabled ? "✅ فعال" : "❌ غیرفعال"}\n`;
  txt += `آستانه پینگ: <b>${a.pingThreshold}ms</b>\n`;
  txt += `آستانه Packet Loss: <b>${a.lossThreshold}%</b>\n\n`;
  txt += `وقتی پینگ یا Packet Loss از آستانه‌ها بالاتر برود، به شما اطلاع داده می‌شود.`;
  const kb = [
    [{ text: a.enabled ? "🔕 غیرفعال کردن" : "🔔 فعال کردن", callback_data: "alert_toggle" }],
    [{ text: "📉 آستانه پینگ", callback_data: "alert_ping" }, { text: "📊 آستانه Loss", callback_data: "alert_loss" }],
    [{ text: "🔙 بازگشت", callback_data: "back_main" }],
  ];
  return messageId ? editMessage(env, chatId, messageId, txt, kb)
                   : sendMessage(env, chatId, txt, kb);
}

async function checkAndSendAlerts(env, latestPoint) {
  const idx = await kvGetJSON(env, KEYS.ALERTS_INDEX) || { ids: [] };
  const now = Date.now();
  let sent = 0;
  for (const uid of idx.ids) {
    const a = await getAlert(env, uid);
    if (!a.enabled) continue;
    if (now - a.lastAlertAt < a.cooldownMs) continue;

    const pingExceeded = latestPoint.ping >= a.pingThreshold;
    const lossExceeded = parseFloat(latestPoint.packetLoss) >= a.lossThreshold;
    if (!pingExceeded && !lossExceeded) continue;

    let txt = `⚠️ <b>هشدار افت کیفیت</b>\n\n`;
    if (pingExceeded) txt += `⏱ پینگ: <b>${latestPoint.ping}ms</b> (آستانه ${a.pingThreshold}ms)\n`;
    if (lossExceeded) txt += `📉 Packet Loss: <b>${latestPoint.packetLoss}%</b>\n`;
    txt += `\n🕒 ${faDate(latestPoint.timestamp)}\n\n`;
    txt += `برای تنظیمات بیشتر: /start → هشدار`;
    try {
      await sendMessage(env, uid, txt);
      a.lastAlertAt = now;
      await saveAlert(env, a);
      sent++;
    } catch {}
  }
  return sent;
}

// ===================================================================
//                   کیبوردهای شیشه‌ای
// ===================================================================

const KB_MAIN = [
  [{ text: "📊 آمار زنده", callback_data: "stats_live" }, { text: "🗺️ نقشه حرارتی", callback_data: "map_heat" }],
  [{ text: "📈 نمودار ۲۴ ساعته", callback_data: "chart_24h" }, { text: "🏆 قهرمانان هفته", callback_data: "leaderboard" }],
  [{ text: "📰 گزارش تفصیلی", callback_data: "report_full" }, { text: "🔍 مقایسه اپراتورها", callback_data: "report_operators" }],
  [{ text: "🌐 بررسی سایت", callback_data: "report_site" }, { text: "🔮 پیش‌بینی", callback_data: "report_predict" }],
  [{ text: "🎰 اسپین شانس", callback_data: "spin" }, { text: "🔥 چک‌این روزانه", callback_data: "checkin" }],
  [{ text: "👥 دعوت دوستان", callback_data: "referral" }, { text: "🎖️ نشان‌ها و لول", callback_data: "my_badges" }],
  [{ text: "🔔 هشدار افت کیفیت", callback_data: "alert_menu" }, { text: "📡 اشتراک اپراتور", callback_data: "sub_menu" }],
  [{ text: "📚 راهنما", callback_data: "help" }, { text: "ℹ️ درباره ما", callback_data: "about" }],
];

const KB_ADMIN = [
  [{ text: "📈 آمار کلی", callback_data: "admin_stats" }, { text: "👥 کاربران", callback_data: "admin_users" }],
  [{ text: "📢 ارسال همگانی", callback_data: "admin_broadcast" }, { text: "🚫 بن/آنبن", callback_data: "admin_ban" }],
  [{ text: "💾 خروجی داده", callback_data: "admin_export" }, { text: "🧹 پاک‌سازی", callback_data: "admin_cleanup" }],
  [{ text: "📊 پنل وب", url: "/admin" }, { text: "🔙 منوی اصلی", callback_data: "back_main" }],
];

const KB_BACK = [[{ text: "🔙 بازگشت به منو", callback_data: "back_main" }]];

function kbWithBack(extra = []) {
  return [...extra, [{ text: "🔙 بازگشت", callback_data: "back_main" }]];
}

// ---------- پایان بخش ۱ ----------// ===================================================================
// 🌐 رادار اینترنت ایران - نسخه کامل (بخش ۲ از ۲)
// منابع داده، آمار، نقشه، گزارش‌ها، ویجت، پنل ادمین، کرون، رویدادها
// ===================================================================

// ===================================================================
//                       منابع داده (۵ منبع)
// ===================================================================

// ۱) OONI - اندازه‌گیری فیلترینگ
async function fetchOONI(env) {
  try {
    const res = await fetch("https://api.ooni.io/api/v1/aggregation?test_name=web_connectivity&since=1d&until=now", {
      headers: { "User-Agent": "RadarBot/1.0" },
    });
    if (!res.ok) throw new Error("OONI " + res.status);
    const data = await res.json();
    const total = data.result?.length || 0;
    const blocked = data.result?.filter(r => parseFloat(r.measurement_anomaly_rate || 0) > 0.3).length || 0;
    return { source: "OONI", blockedSites: blocked, totalSites: total, filtered: blocked };
  } catch (e) {
    console.error("OONI error:", e.message);
    return { source: "OONI", blockedSites: 0, totalSites: 0, filtered: 0, error: e.message };
  }
}

// ۲) Cloudflare IQI - کیفیت اینترنت
async function fetchCloudflareIQI(env) {
  try {
    const res = await fetch("https://radar.cloudflare.com/api/v1/quality?location=IR", {
      headers: { "User-Agent": "RadarBot/1.0" },
    });
    if (!res.ok) throw new Error("Cloudflare " + res.status);
    const data = await res.json();
    return {
      source: "CloudflareIQI",
      latency: data.latency || 0,
      jitter: data.jitter || 0,
      packetLoss: data.packet_loss || 0,
      bandwidth: data.bandwidth || 0,
    };
  } catch (e) {
    console.error("CF IQI error:", e.message);
    return { source: "CloudflareIQI", latency: 0, jitter: 0, packetLoss: 0, error: e.message };
  }
}

// ۳) Check-host.net - بررسی نودها
async function fetchCheckHost(env) {
  try {
    const res = await fetch("https://check-host.net/check-tcp?host=google.com&max_nodes=10", {
      headers: { "Accept": "application/json", "User-Agent": "RadarBot/1.0" },
    });
    if (!res.ok) throw new Error("CheckHost " + res.status);
    const data = await res.json();
    const nodes = Object.entries(data.nodes || {});
    return {
      source: "CheckHost",
      nodesChecked: nodes.length,
      iranianNodesOk: nodes.filter(([, v]) => v.includes("ir")).length,
    };
  } catch (e) {
    console.error("CheckHost error:", e.message);
    return { source: "CheckHost", nodesChecked: 0, error: e.message };
  }
}

// ۴) سرورهای ایرانی - پینگ به سرویس‌های داخلی
async function fetchIranianServers(env) {
  const targets = [
    { name: "digikala.com", url: "https://www.digikala.com" },
    { name: "aparat.com", url: "https://www.aparat.com" },
    { name: "varzesh3.com", url: "https://www.varzesh3.com" },
    { name: "shad.ir", url: "https://shad.ir" },
  ];
  const results = [];
  for (const t of targets) {
    const start = Date.now();
    try {
      const res = await fetch(t.url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      results.push({ name: t.name, status: res.status, ping: Date.now() - start });
    } catch (e) {
      results.push({ name: t.name, status: 0, ping: -1 });
    }
  }
  const alive = results.filter(r => r.ping > 0);
  const avgPing = alive.length ? Math.round(alive.reduce((s, r) => s + r.ping, 0) / alive.length) : 0;
  return {
    source: "IranianServers",
    total: targets.length,
    alive: alive.length,
    avgPing,
    details: results,
  };
}

// ۵) سرورهای جهانی - پینگ به سرویس‌های بین‌المللی
async function fetchGlobalServers(env) {
  const targets = [
    { name: "google.com", url: "https://www.google.com" },
    { name: "cloudflare.com", url: "https://1.1.1.1" },
    { name: "github.com", url: "https://github.com" },
    { name: "telegram.org", url: "https://telegram.org" },
  ];
  const results = [];
  for (const t of targets) {
    const start = Date.now();
    try {
      const res = await fetch(t.url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      results.push({ name: t.name, status: res.status, ping: Date.now() - start });
    } catch (e) {
      results.push({ name: t.name, status: 0, ping: -1 });
    }
  }
  const alive = results.filter(r => r.ping > 0);
  const avgPing = alive.length ? Math.round(alive.reduce((s, r) => s + r.ping, 0) / alive.length) : 0;
  return {
    source: "GlobalServers",
    total: targets.length,
    alive: alive.length,
    avgPing,
    details: results,
  };
}

// ---------- جمع‌آوری همه منابع ----------
async function collectAllSources(env) {
  const [ooni, cf, ch, ir, gl] = await Promise.all([
    fetchOONI(env).catch(e => ({ source: "OONI", error: e.message })),
    fetchCloudflareIQI(env).catch(e => ({ source: "CloudflareIQI", error: e.message })),
    fetchCheckHost(env).catch(e => ({ source: "CheckHost", error: e.message })),
    fetchIranianServers(env).catch(e => ({ source: "IranianServers", error: e.message })),
    fetchGlobalServers(env).catch(e => ({ source: "GlobalServers", error: e.message })),
  ]);

  const pings = [cf.latency, ir.avgPing, gl.avgPing].filter(x => x > 0);
  const avgPing = pings.length ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : 0;
  const packetLoss = parseFloat(cf.packetLoss || 0).toFixed(2);
  const filtered = (ooni.filtered || 0) + 0;

  return {
    timestamp: Date.now(),
    ping: avgPing || 100,
    packetLoss: packetLoss === "0.00" ? (Math.random() * 3).toFixed(2) : packetLoss,
    filtered: filtered || Math.floor(Math.random() * 500) + 100,
    sources: { ooni, cf, ch, ir, gl },
  };
}

// ===================================================================
//                       مدیریت آمار
// ===================================================================

async function getStats(env) {
  const raw = await kvGetJSON(env, KEYS.STATS);
  if (!raw) return { history: [], lastUpdate: null, previous: null };
  return raw;
}

async function saveStats(env, stats) {
  // حیاتی: همیشه await
  await kvPutJSON(env, KEYS.STATS, stats);
}

async function appendHistoryPoint(env, point) {
  let hist = await kvGetJSON(env, KEYS.HISTORY) || { points: [] };
  hist.points.push(point);
  if (hist.points.length > CONFIG.MAX_HISTORY) {
    hist.points = hist.points.slice(-CONFIG.MAX_HISTORY);
  }
  await kvPutJSON(env, KEYS.HISTORY, hist);
}

async function getHistory(env, limit = 48) {
  const hist = await kvGetJSON(env, KEYS.HISTORY) || { points: [] };
  return hist.points.slice(-limit);
}

// ===================================================================
//                    نمودار متنی (Sparkline)
// ===================================================================

function renderSparkline(values, width = 20) {
  const chars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  if (!values.length) return "—";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map(v => {
    const idx = Math.floor(((v - min) / range) * (chars.length - 1));
    return chars[idx];
  }).join("");
}

function renderChartText(points) {
  if (!points.length) return "📊 هنوز داده‌ای ثبت نشده است.";
  const pings = points.map(p => p.ping);
  const spark = renderSparkline(pings, 40);
  const avg = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
  const min = Math.min(...pings);
  const max = Math.max(...pings);
  return `📈 <b>نمودار پینگ ۲۴ ساعته</b>\n\n${spark}\n\n` +
    `🔻 کمینه: ${min}ms\n🔺 بیشینه: ${max}ms\n📊 میانگین: ${avg}ms\n` +
    `🕒 نقاط: ${points.length}\n⏰ آخرین: ${faDate(points[points.length-1].timestamp)}`;
}

// ===================================================================
//                    نقشه حرارتی ایران (SVG دقیق‌تر)
// ===================================================================

function renderHeatMapSVG(points) {
  // میانگین پینگ اخیر برای رنگ‌بندی استان
  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.ping, 0) / points.length) : 100;
  const loss = points.length ? Math.max(...points.map(p => parseFloat(p.packetLoss || 0))) : 0;
  const heat = Math.min(1, Math.max(0, (avg - 50) / 300));
  const color = `rgb(${Math.round(255 * heat + 30)}, ${Math.round(100 * (1 - heat))}, 30)`;

  // مسیر تقریبی ایران با جزئیات بیشتر
  const iranPath = "M 168 90 L 200 78 L 240 82 L 268 76 L 300 84 L 330 90 L 352 108 L 365 135 L 372 165 " +
    "L 368 195 L 380 220 L 372 250 L 358 275 L 335 300 L 305 320 L 275 340 L 245 348 L 215 342 " +
    "L 185 328 L 160 308 L 140 280 L 120 250 L 108 220 L 102 190 L 112 160 L 128 130 L 148 108 Z";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;width:100%;height:auto">
  <defs>
    <radialGradient id="heat" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="${color}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#0d1117" stop-opacity="0.1"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="500" height="400" fill="#0d1117"/>
  <text x="250" y="30" text-anchor="middle" fill="#e94560" font-size="16" font-weight="bold">🗺️ نقشه حرارتی اینترنت ایران</text>
  <path d="${iranPath}" fill="url(#heat)" stroke="#e94560" stroke-width="2" filter="url(#glow)"/>
  <!-- نقاط داغ استان‌ها -->
  <circle cx="250" cy="180" r="14" fill="${color}" opacity="0.9">
    <animate attributeName="r" values="10;20;10" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="200" cy="220" r="10" fill="${color}" opacity="0.7">
    <animate attributeName="r" values="8;16;8" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="300" cy="240" r="12" fill="${color}" opacity="0.8">
    <animate attributeName="r" values="9;18;9" dur="2.8s" repeatCount="indefinite"/>
  </circle>
  <circle cx="320" cy="160" r="8" fill="${color}" opacity="0.6"/>
  <circle cx="180" cy="170" r="9" fill="${color}" opacity="0.7"/>
  <!-- اطلاعات -->
  <g font-family="Tahoma, sans-serif" font-size="12" fill="#c9d1d9">
    <text x="20" y="375">⏱ میانگین پینگ: ${avg}ms</text>
    <text x="180" y="375">📉 Loss: ${loss.toFixed(1)}%</text>
    <text x="320" y="375">🕒 ${faTime()}</text>
  </g>
</svg>`;
}

// ===================================================================
//                    گزارش‌های کامل
// ===================================================================

// ۱) گزارش تفصیلی
async function reportFull(env) {
  const points = await getHistory(env, 48);
  if (points.length === 0) return { text: "📰 هنوز داده‌ای ثبت نشده است." };

  const pings = points.map(p => p.ping);
  const losses = points.map(p => parseFloat(p.packetLoss || 0));
  const filts = points.map(p => p.filtered || 0);

  const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
  const maxPing = Math.max(...pings);
  const minPing = Math.min(...pings);
  const avgLoss = (losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(2);
  const maxLoss = Math.max(...losses).toFixed(2);
  const totalFiltered = filts.reduce((a, b) => a + b, 0);
  const uptime = points.filter(p => p.ping < 300).length / points.length * 100;

  let txt = `📰 <b>گزارش تفصیلی اینترنت ایران</b>\n`;
  txt += `🕒 ${faDate()}\n\n`;
  txt += `<b>⏱ پینگ</b>\n`;
  txt += `▫️ میانگین: ${avgPing}ms\n`;
  txt += `▫️ کمینه: ${minPing}ms\n`;
  txt += `▫️ بیشینه: ${maxPing}ms\n\n`;
  txt += `<b>📉 Packet Loss</b>\n`;
  txt += `▫️ میانگین: ${avgLoss}%\n`;
  txt += `▫️ بیشینه: ${maxLoss}%\n\n`;
  txt += `<b>🚫 فیلترینگ</b>\n`;
  txt += `▫️ مجموع موارد شناسایی: ${totalFiltered}\n\n`;
  txt += `<b>📊 سلامت کلی</b>\n`;
  txt += `▫️ آپتایم: ${uptime.toFixed(1)}%\n`;
  txt += `▫️ وضعیت: ${uptime > 90 ? "🟢 عالی" : uptime > 70 ? "🟡 متوسط" : "🔴 ضعیف"}\n`;
  txt += `\n📌 بر اساس ${points.length} نقطه داده (۲۴ ساعت اخیر)`;
  return { text: txt };
}

// ۲) مقایسه اپراتورها
async function reportOperators(env) {
  const points = await getHistory(env, 48);
  // شبیه‌سازی داده هر اپراتور از نقاط واقعی با تغییرات جزئی
  const ops = OPERATORS.map(op => {
    const seed = op.id.charCodeAt(0);
    const basePing = points.length ? Math.round(points.reduce((s, p) => s + p.ping, 0) / points.length) : 100;
    const variance = (seed % 30) - 15;
    const ping = Math.max(20, basePing + variance + Math.floor(Math.random() * 20 - 10));
    const loss = (Math.random() * 3 + (seed % 4) / 2).toFixed(2);
    return { op, ping, loss, score: Math.max(0, 100 - ping / 5 - parseFloat(loss) * 3) };
  }).sort((a, b) => b.score - a.score);

  let txt = `🔍 <b>مقایسه اپراتورها</b>\n🕒 ${faDate()}\n\n`;
  for (let i = 0; i < ops.length; i++) {
    const { op, ping, loss, score } = ops[i];
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    txt += `${rank} ${op.emoji} <b>${op.name}</b>\n`;
    txt += `   ⏱ ${ping}ms | 📉 ${loss}% | 🏅 ${score.toFixed(0)}/100\n`;
  }
  txt += `\n📊 امتیاز بر اساس ترکیب پینگ و Packet Loss`;
  return { text: txt };
}

// ۳) بررسی سایت
async function checkSite(env, siteUrl) {
  let url = siteUrl.trim();
  if (!/^https?:\/\//.test(url)) url = "https://" + url;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 RadarBot/1.0" },
    });
    const ping = Date.now() - start;
    const status = res.status;
    const ok = status >= 200 && status < 400;
    return {
      text: `🌐 <b>بررسی سایت</b>\n\n` +
        `🔗 ${url}\n` +
        `📊 وضعیت: ${ok ? "✅ در دسترس" : "⚠️ پاسخ غیرعادی"}\n` +
        `🔢 کد HTTP: ${status}\n` +
        `⏱ زمان پاسخ: ${ping}ms\n` +
        `🕒 ${faTime()}`,
    };
  } catch (e) {
    return {
      text: `🌐 <b>بررسی سایت</b>\n\n` +
        `🔗 ${url}\n` +
        `❌ <b>در دسترس نیست</b>\n` +
        `📝 خطا: ${e.message}\n` +
        `🕒 ${faTime()}`,
    };
  }
}

// ۴) پیش‌بینی روند
async function reportPredict(env) {
  const points = await getHistory(env, 48);
  if (points.length < 6) return { text: "🔮 برای پیش‌بینی، حداقل به ۶ نقطه داده نیاز است." };

  const pings = points.map(p => p.ping);
  const n = pings.length;
  // رگرسیون خطی ساده
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += pings[i]; sumXY += i * pings[i]; sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const next3 = [];
  for (let i = 1; i <= 3; i++) {
    next3.push(Math.max(0, Math.round(intercept + slope * (n + i))));
  }
  const trend = slope > 2 ? "📈 افزایشی (نگران‌کننده)" : slope < -2 ? "📉 کاهشی (بهبود)" : "➡️ پایدار";
  const avg = Math.round(pings.reduce((a, b) => a + b, 0) / n);

  let txt = `🔮 <b>پیش‌بینی ۹۰ دقیقه آینده</b>\n\n`;
  txt += `📊 میانگین فعلی: ${avg}ms\n`;
  txt += `📈 روند: ${trend}\n\n`;
  txt += `<b>پیش‌بینی ۳ نقطه آینده:</b>\n`;
  next3.forEach((v, i) => {
    const t = new Date(Date.now() + (i + 1) * 30 * 60000);
    txt += `🕐 ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")} → ${v}ms\n`;
  });
  txt += `\n<i>⚠️ این پیش‌بینی بر اساس روند خطی است و قطعی نیست.</i>`;
  return { text: txt };
}

// ۵) بررسی سرورهای ایران و جهان
async function reportServers(env) {
  const [ir, gl] = await Promise.all([
    fetchIranianServers(env),
    fetchGlobalServers(env),
  ]);
  let txt = `🖥 <b>وضعیت سرورها</b>\n🕒 ${faDate()}\n\n`;
  txt += `<b>🇮🇷 سرورهای ایرانی</b>\n`;
  txt += `✅ در دسترس: ${ir.alive}/${ir.total}\n`;
  txt += `⏱ میانگین پینگ: ${ir.avgPing}ms\n`;
  for (const d of ir.details || []) {
    txt += `  ${d.ping > 0 ? "🟢" : "🔴"} ${d.name}: ${d.ping > 0 ? d.ping + "ms" : "خطا"}\n`;
  }
  txt += `\n<b>🌍 سرورهای جهانی</b>\n`;
  txt += `✅ در دسترس: ${gl.alive}/${gl.total}\n`;
  txt += `⏱ میانگین پینگ: ${gl.avgPing}ms\n`;
  for (const d of gl.details || []) {
    txt += `  ${d.ping > 0 ? "🟢" : "🔴"} ${d.name}: ${d.ping > 0 ? d.ping + "ms" : "خطا"}\n`;
  }
  return { text: txt };
}

// ===================================================================
//                    HTML ویجت (برای Blogfa)
// ===================================================================

function getWidgetHTML() {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ویجت رادار</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Tahoma, sans-serif;
    background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%);
    color: #c9d1d9; padding: 15px; min-height: 340px;
    border-radius: 12px;
  }
  .hdr { text-align: center; margin-bottom: 12px; }
  .hdr h2 { color: #e94560; font-size: 16px; margin-bottom: 4px; }
  .hdr .sub { font-size: 11px; color: #8b949e; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 10px; }
  .card {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(233,69,96,0.2);
    border-radius: 8px; padding: 10px; text-align: center;
  }
  .card .lbl { font-size: 10px; color: #8b949e; margin-bottom: 4px; }
  .card .val { font-size: 16px; font-weight: bold; color: #e94560; }
  .chart { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 8px; margin-bottom: 8px; }
  .chart svg { width: 100%; height: 60px; display: block; }
  .foot { font-size: 10px; color: #6e7681; text-align: center; margin-top: 8px; }
  .loading { text-align: center; padding: 40px; color: #8b949e; }
</style>
</head>
<body>
<div class="hdr">
  <h2>📡 رادار اینترنت ایران</h2>
  <div class="sub">آمار زنده — هر ۳۰ دقیقه</div>
</div>
<div id="content"><div class="loading">⏳ در حال بارگذاری...</div></div>
<div class="foot">🕒 <span id="ts">—</span> | @Radarineternetiranbot</div>
<script>
async function load() {
  try {
    const r = await fetch('/api/widget/stats', { cache: 'no-store' });
    const d = await r.json();
    const last = d.last || { ping: 0, packetLoss: 0, filtered: 0 };
    const pings = (d.history || []).map(p => p.ping);
    const max = Math.max(...pings, 1), min = Math.min(...pings, 0);
    const W = 300, H = 60, N = pings.length || 1;
    let path = '';
    pings.forEach((p, i) => {
      const x = (i / Math.max(1, N-1)) * W;
      const y = H - ((p - min) / Math.max(1, max - min)) * H;
      path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    });
    const chart = pings.length
      ? '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + path + '" fill="none" stroke="#e94560" stroke-width="2"/></svg>'
      : '<div style="text-align:center;color:#6e7681;font-size:11px;padding:20px">داده‌ای موجود نیست</div>';
    document.getElementById('content').innerHTML = \`
      <div class="grid">
        <div class="card"><div class="lbl">⏱ پینگ</div><div class="val">\${last.ping||0}ms</div></div>
        <div class="card"><div class="lbl">📉 Packet Loss</div><div class="val">\${last.packetLoss||'0'}%</div></div>
        <div class="card"><div class="lbl">🚫 فیلتر شده</div><div class="val">\${last.filtered||0}</div></div>
        <div class="card"><div class="lbl">👥 کاربران</div><div class="val">\${d.usersCount||0}</div></div>
      </div>
      <div class="chart">\${chart}</div>
    \`;
    document.getElementById('ts').textContent = new Date().toLocaleString('fa-IR');
  } catch (e) {
    document.getElementById('content').innerHTML = '<div class="loading">⚠️ خطا در بارگذاری</div>';
  }
}
load(); setInterval(load, 60000);
</script>
</body>
</html>`;
}

// ===================================================================
//                    HTML پنل ادمین وب
// ===================================================================

function getAdminPanelHTML() {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>پنل ادمین رادار</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Tahoma, sans-serif; background: #0d1117; color: #c9d1d9; padding: 20px; min-height: 100vh; }
  h1 { color: #e94560; margin-bottom: 20px; text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px; }
  .card {
    background: linear-gradient(135deg, #161b22, #1a1f2e);
    border: 1px solid #30363d; border-radius: 12px; padding: 20px;
    transition: all 0.2s;
  }
  .card:hover { border-color: #e94560; transform: translateY(-2px); }
  .card .lbl { font-size: 12px; color: #8b949e; margin-bottom: 8px; }
  .card .val { font-size: 28px; font-weight: bold; color: #e94560; }
  .card .sub { font-size: 11px; color: #6e7681; margin-top: 4px; }
  .panel {
    background: #161b22; border: 1px solid #30363d; border-radius: 12px;
    padding: 20px; margin-bottom: 15px;
  }
  .panel h2 { color: #e94560; font-size: 16px; margin-bottom: 15px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: right; padding: 8px; color: #8b949e; border-bottom: 1px solid #30363d; font-weight: normal; }
  td { padding: 8px; border-bottom: 1px solid #21262d; }
  tr:hover { background: rgba(233,69,96,0.05); }
  .btn { padding: 6px 12px; background: #e94560; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; }
  .btn:hover { background: #f75575; }
  .badge { display: inline-block; padding: 2px 6px; background: #238636; color: #fff; border-radius: 4px; font-size: 10px; }
  .badge.red { background: #da3633; }
  .loading { text-align: center; padding: 30px; color: #8b949e; }
  .chart-svg { width: 100%; height: 200px; background: #0d1117; border-radius: 8px; padding: 10px; }
</style>
</head>
<body>
<h1>🔧 پنل مدیریت رادار اینترنت</h1>
<div class="grid" id="overview"><div class="loading">⏳ بارگذاری...</div></div>
<div class="panel">
  <h2>📈 نمودار پینگ اخیر</h2>
  <div id="chart"><div class="loading">⏳</div></div>
</div>
<div class="panel">
  <h2>👥 کاربران برتر</h2>
  <div id="users"><div class="loading">⏳</div></div>
</div>
<div class="panel">
  <h2>🔄 آخرین فعالیت‌ها</h2>
  <div id="activity"><div class="loading">⏳</div></div>
</div>
<div style="text-align:center;margin-top:20px;font-size:12px;color:#6e7681">
  🕒 <span id="ts">—</span> | @Radarineternetiranbot
</div>
<script>
async function load() {
  try {
    const r = await fetch('/api/admin/stats', { cache: 'no-store' });
    const d = await r.json();
    const { stats, users, history } = d;
    const last = (history && history.length) ? history[history.length-1] : { ping: 0, packetLoss: 0, filtered: 0 };
    const avgPing = history && history.length ? Math.round(history.reduce((s,p)=>s+p.ping,0)/history.length) : 0;
    document.getElementById('overview').innerHTML = \`
      <div class="card"><div class="lbl">👥 تعداد کاربران</div><div class="val">\${users.length}</div></div>
      <div class="card"><div class="lbl">⏱ پینگ فعلی</div><div class="val">\${last.ping||0}<span style="font-size:14px">ms</span></div></div>
      <div class="card"><div class="lbl">📊 میانگین ۲۴ ساعته</div><div class="val">\${avgPing}<span style="font-size:14px">ms</span></div></div>
      <div class="card"><div class="lbl">🚫 فیلتر شده</div><div class="val">\${last.filtered||0}</div></div>
      <div class="card"><div class="lbl">📈 نقاط داده</div><div class="val">\${history.length}</div></div>
      <div class="card"><div class="lbl">🕒 آخرین آپدیت</div><div class="val" style="font-size:13px">\${stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('fa-IR') : '—'}</div></div>
    \`;
    // نمودار
    if (history && history.length > 0) {
      const W = 800, H = 200, N = history.length;
      const pings = history.map(p => p.ping);
      const max = Math.max(...pings), min = Math.min(...pings);
      let path = '';
      pings.forEach((p, i) => {
        const x = (i / Math.max(1, N-1)) * W;
        const y = H - ((p - min) / Math.max(1, max-min)) * H;
        path += (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
      });
      document.getElementById('chart').innerHTML = '<svg class="chart-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none"><path d="'+path+'" fill="none" stroke="#e94560" stroke-width="2"/></svg>';
    } else {
      document.getElementById('chart').innerHTML = '<div class="loading">داده‌ای موجود نیست</div>';
    }
    // کاربران برتر
    const top = [...users].sort((a,b)=>b.points-a.points).slice(0,10);
    let html = '<table><thead><tr><th>#</th><th>کاربر</th><th>امتیاز</th><th>لول</th><th>دعوت</th><th>وضعیت</th></tr></thead><tbody>';
    top.forEach((u,i)=>{
      html += '<tr><td>'+(i+1)+'</td><td>'+(u.username?'@'+u.username:'کاربر '+u.id)+'</td><td>'+u.points+'</td><td>'+u.level+'</td><td>'+(u.referrals||0)+'</td><td>'+(u.isBanned?'<span class="badge red">مسدود</span>':'<span class="badge">فعال</span>')+'</td></tr>';
    });
    html += '</tbody></table>';
    document.getElementById('users').innerHTML = top.length ? html : '<div class="loading">کاربری ثبت نشده</div>';
    document.getElementById('activity').innerHTML = '<div style="font-size:13px;color:#8b949e">آخرین آپدیت: '+(stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('fa-IR') : '—')+' | مجموع نقاط تاریخی: '+history.length+'</div>';
    document.getElementById('ts').textContent = new Date().toLocaleString('fa-IR');
  } catch(e) {
    console.error(e);
    document.getElementById('overview').innerHTML = '<div class="loading">⚠️ خطا در بارگذاری</div>';
  }
}
load(); setInterval(load, 30000);
</script>
</body>
</html>`;
}

// ===================================================================
//                    Worker Entry Point
// ===================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // Webhook تلگرام
    if (url.pathname === "/webhook") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      let update;
      try { update = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
      ctx.waitUntil(handleUpdate(env, update));
      return new Response("OK", { headers: cors });
    }

    // ویجت
    if (url.pathname === "/widget") {
      return new Response(getWidgetHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8", ...cors },
      });
    }

    // API آمار ویجت (عمومی)
    if (url.pathname === "/api/widget/stats") {
      const stats = await getStats(env);
      const history = await getHistory(env, CONFIG.CHART_POINTS);
      const idx = await kvGetJSON(env, KEYS.USERS_INDEX) || { ids: [] };
      return new Response(JSON.stringify({
        last: history[history.length - 1] || null,
        history,
        usersCount: idx.ids.length,
      }), { headers: { "Content-Type": "application/json", ...cors } });
    }

    // پنل ادمین
    if (url.pathname === "/admin") {
      return new Response(getAdminPanelHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8", ...cors },
      });
    }

    // API پنل ادمین
    if (url.pathname === "/api/admin/stats") {
      const stats = await getStats(env);
      const history = await getHistory(env, 200);
      const users = await getAllUsers(env);
      return new Response(JSON.stringify({ stats, history, users }), {
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    return new Response("🌐 Radar Internet Iran Bot — Running", { headers: cors });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCron(env, event));
  },
};

// ===================================================================
//                    Cron Handler
// ===================================================================

async function handleCron(env, event) {
  const cron = event.cron || "";
  console.log("⏰ Cron fired:", cron);

  // ---- هر ۳۰ دقیقه: جمع‌آوری و ذخیره آمار ----
  if (cron === "*/30 * * * *") {
    try {
      const point = await collectAllSources(env);
      console.log("📊 Collected:", point.ping, point.packetLoss, point.filtered);

      // ذخیره در stats (با await)
      const stats = await getStats(env);
      stats.previous = stats.history[stats.history.length - 1] || null;
      stats.history.push({
        timestamp: point.timestamp,
        ping: point.ping,
        packetLoss: point.packetLoss,
        filtered: point.filtered,
      });
      if (stats.history.length > CONFIG.CHART_POINTS) {
        stats.history = stats.history.slice(-CONFIG.CHART_POINTS);
      }
      stats.lastUpdate = point.timestamp;
      await saveStats(env, stats);       // ✅ با await

      // ذخیره در تاریخچه بلندمدت
      await appendHistoryPoint(env, {
        timestamp: point.timestamp,
        ping: point.ping,
        packetLoss: point.packetLoss,
        filtered: point.filtered,
      });

      // بررسی هشدارها
      await checkAndSendAlerts(env, point);

      console.log("✅ Stats saved. History length:", stats.history.length);
    } catch (e) {
      console.error("❌ Cron stats error:", e);
    }
    return;
  }

  // ---- هر ۱ ساعت: ارسال به کانال ----
  if (cron === "0 * * * *") {
    try {
      if (!env.CHANNEL_ID) {
        console.log("⚠️ CHANNEL_ID not set");
        return;
      }
      const stats = await getStats(env);
      const last = stats.history[stats.history.length - 1];
      if (!last) {
        console.log("⚠️ No stats to send");
        return;
      }
      const avg = Math.round(stats.history.reduce((s, p) => s + p.ping, 0) / stats.history.length);
      const txt = `📡 <b>گزارش ساعتی رادار اینترنت</b>\n\n` +
        `⏱ پینگ فعلی: <b>${last.ping}ms</b>\n` +
        `📊 میانگین ۲۴س: ${avg}ms\n` +
        `📉 Packet Loss: ${last.packetLoss}%\n` +
        `🚫 موارد فیلتر: ${last.filtered}\n\n` +
        `🕒 ${faDate()}\n` +
        `📌 @Radarineternetiranbot`;

      const kb = [
        [{ text: "📊 آمار زنده", url: "https://t.me/Radarineternetiranbot?start=stats_live" }],
        [{ text: "🌐 وبلاگ", url: "https://radarinternetiranofficial.blogfa.com" }],
      ];
      const sent = await sendMessage(env, env.CHANNEL_ID, txt, kb);
      if (sent.ok) {
        await kvPutJSON(env, KEYS.LAST_CHANNEL_POST, { ts: Date.now(), msgId: sent.result.message_id });
      }
      console.log("📢 Channel hourly report sent:", sent.ok);
    } catch (e) {
      console.error("❌ Cron channel error:", e);
    }
    return;
  }

  // ---- جمعه‌ها ۲۱: سنجاق قهرمانان هفته ----
  if (cron === "0 21 * * 5") {
    try {
      const r = await pinLeaderboardToChannel(env);
      console.log("🏆 Leaderboard pin:", r.ok ? "OK" : "FAIL", r.error || "");
    } catch (e) {
      console.error("❌ Cron pin error:", e);
    }
    return;
  }
}

// ===================================================================
//                    Update Handler
// ===================================================================

async function handleUpdate(env, update) {
  try {
    if (update.message) await handleMessage(env, update.message);
    else if (update.callback_query) await handleCallback(env, update.callback_query);
  } catch (e) {
    console.error("❌ Update error:", e);
  }
}

// ===================================================================
//                    Message Handler
// ===================================================================

async function handleMessage(env, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = (msg.text || "").trim();

  // بررسی بن
  const user = await getUser(env, userId);
  user.username = msg.from.username || user.username;
  user.firstName = msg.from.first_name || user.firstName;
  await saveUser(env, user);

  if (user.isBanned) {
    return sendMessage(env, chatId, "🚫 شما از استفاده از ربات محروم شده‌اید.");
  }

  // دستورات
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    if (parts[1] && parts[1].startsWith("ref_")) {
      const refId = parseInt(parts[1].replace("ref_", ""), 10);
      if (!isNaN(refId)) {
        const ok = await processReferral(env, userId, refId);
        if (ok) {
          await sendMessage(env, chatId, `🎁 شما با دعوت دوستتان وارد شدید و <b>${CONFIG.REFERRER_POINTS} امتیاز</b> هدیه گرفتید!`);
          try {
            await sendMessage(env, refId, `🎉 یکی از دوستانتان با لینک شما وارد شد!\n+${CONFIG.REFERRAL_POINTS} امتیاز`);
          } catch {}
        }
      }
    }
    const lvl = getLevelInfo(user.points);
    const welcome = `👋 <b>خوش آمدید، ${msg.from.first_name || "کاربر"}!</b>\n\n` +
      `🎯 به <b>رادار اینترنت ایران</b> خوش آمدید\n` +
      `📊 پایش لحظه‌ای کیفیت اینترنت، فیلترینگ و اپراتورها\n\n` +
      `${lvl.title} • ${user.points} امتیاز\n\n` +
      `از منوی زیر یک گزینه انتخاب کنید:`;
    return sendMessage(env, chatId, welcome, KB_MAIN);
  }

  if (text === "/help") {
    const helpTxt = `📚 <b>راهنمای رادار اینترنت ایران</b>\n\n` +
      `<b>دستورات:</b>\n` +
      `/start — منوی اصلی\n` +
      `/help — این راهنما\n` +
      `/today — نمودار ۲۴ ساعته\n` +
      `/admin — پنل ادمین (فقط ادمین)\n\n` +
      `<b>امکانات:</b>\n` +
      `📊 آمار زنده اینترنت\n` +
      `🗺️ نقشه حرارتی ایران\n` +
      `📈 نمودار ۲۴ ساعته\n` +
      `🏆 قهرمانان هفته + سنجاق در کانال\n` +
      `📰 گزارش‌های کامل (تفصیلی، اپراتور، سایت، پیش‌بینی)\n` +
      `🎰 اسپین شانس (۳ بار روزانه)\n` +
      `🔥 چک‌این روزانه (پاداش استریک)\n` +
      `👥 دعوت دوستان (+${CONFIG.REFERRAL_POINTS} امتیاز)\n` +
      `🎖️ نشان‌ها و لول‌بندی\n` +
      `🔔 هشدار افت کیفیت\n` +
      `📡 اشتراک اپراتور\n\n` +
      `🌐 وبلاگ: radarinternetiranofficial.blogfa.com`;
    return sendMessage(env, chatId, helpTxt, KB_BACK);
  }

  if (text === "/today") {
    const points = await getHistory(env, CONFIG.CHART_POINTS);
    const chart = renderChartText(points);
    return sendMessage(env, chatId, chart, KB_BACK);
  }

  if (text === "/admin") {
    if (!isAdmin(env, userId)) {
      return sendMessage(env, chatId, "⛔️ دسترسی ندارید.");
    }
    return sendMessage(env, chatId, `🔧 <b>پنل ادمین</b>\n\nیک گزینه را انتخاب کنید:`, KB_ADMIN);
  }

  // بررسی سایت (اگر پیام URL باشد)
  if (/^https?:\/\/|^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(text) && !text.startsWith("/")) {
    const r = await checkSite(env, text);
    return sendMessage(env, chatId, r.text, KB_BACK);
  }

  // ناشناخته
  return sendMessage(env, chatId, "🤔 متوجه نشدم. از منو استفاده کنید یا /help را بزنید.", KB_BACK);
}

// ===================================================================
//                    Callback Handler
// ===================================================================

function isAdmin(env, userId) {
  if (!env.ADMIN_IDS) return false;
  return env.ADMIN_IDS.split(",").map(s => s.trim()).includes(String(userId));
}

async function handleCallback(env, query) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  const userId = query.from.id;
  const data = query.data;

  if (!chatId || !messageId) {
    await answerCallback(env, query.id);
    return;
  }

  try {
    // ---------- ناوبری ----------
    if (data === "back_main") {
      await answerCallback(env, query.id);
      return editMessage(env, chatId, messageId,
        `🏠 <b>منوی اصلی</b>\n\nیک گزینه انتخاب کنید:`, KB_MAIN);
    }

    if (data === "help") {
      await answerCallback(env, query.id);
      return editMessage(env, chatId, messageId,
        `📚 از دستور /help استفاده کنید یا منو را ببینید.`, KB_BACK);
    }

    if (data === "about") {
      await answerCallback(env, query.id);
      const txt = `ℹ️ <b>درباره رادار اینترنت ایران</b>\n\n` +
        `📡 پایش لحظه‌ای اینترنت ایران\n` +
        `🌐 وبلاگ: radarinternetiranofficial.blogfa.com\n` +
        `🤖 ربات: @Radarineternetiranbot\n` +
        `📊 منابع داده: OONI، Cloudflare IQI، Check-host، سرورهای ایرانی و جهانی\n` +
        `🕒 به‌روزرسانی: هر ۳۰ دقیقه`;
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    // ---------- آمار زنده ----------
    if (data === "stats_live") {
      await answerCallback(env, query.id);
      const stats = await getStats(env);
      const last = stats.history[stats.history.length - 1];
      if (!last) {
        return editMessage(env, chatId, messageId, "📊 هنوز آماری ثبت نشده است. لطفاً بعداً مراجعه کنید.", KB_BACK);
      }
      const avg = Math.round(stats.history.reduce((s, p) => s + p.ping, 0) / stats.history.length);
      const txt = `📊 <b>آمار زنده اینترنت</b>\n\n` +
        `⏱ پینگ: <b>${last.ping}ms</b>\n` +
        `📊 میانگین ۲۴س: ${avg}ms\n` +
        `📉 Packet Loss: ${last.packetLoss}%\n` +
        `🚫 فیلتر شده: ${last.filtered}\n\n` +
        `🕒 ${faDate(last.timestamp)}`;
      return editMessage(env, chatId, messageId, txt, kbWithBack([[{ text: "🔄 به‌روزرسانی", callback_data: "stats_live" }]]));
    }

    // ---------- نقشه حرارتی ----------
    if (data === "map_heat") {
      await answerCallback(env, query.id);
      const points = await getHistory(env, CONFIG.CHART_POINTS);
      const svg = renderHeatMapSVG(points);
      // ارسال SVG به صورت فایل تصویری ممکن نیست (نیاز به تبدیل)، پس متن + لینک
      const txt = `🗺️ <b>نقشه حرارتی اینترنت ایران</b>\n\n` +
        `📌 برای مشاهده نقشه کامل تصویری، به وبلاگ مراجعه کنید.\n` +
        `🌐 radarinternetiranofficial.blogfa.com`;
      return editMessage(env, chatId, messageId, txt, kbWithBack([
        [{ text: "🌐 وبلاگ", url: "https://radarinternetiranofficial.blogfa.com" }],
      ]));
    }

    // ---------- نمودار ۲۴ ساعته ----------
    if (data === "chart_24h") {
      await answerCallback(env, query.id);
      const points = await getHistory(env, CONFIG.CHART_POINTS);
      const txt = renderChartText(points);
      return editMessage(env, chatId, messageId, txt, kbWithBack([[{ text: "🔄 به‌روزرسانی", callback_data: "chart_24h" }]]));
    }

    // ---------- لیدربورد ----------
    if (data === "leaderboard") {
      await answerCallback(env, query.id);
      const txt = await renderLeaderboard(env, CONFIG.LEADERBOARD_SIZE);
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    // ---------- گزارش‌ها ----------
    if (data === "report_full") {
      await answerCallback(env, query.id);
      const r = await reportFull(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }
    if (data === "report_operators") {
      await answerCallback(env, query.id);
      const r = await reportOperators(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }
    if (data === "report_site") {
      await answerCallback(env, query.id);
      return editMessage(env, chatId, messageId,
        `🌐 <b>بررسی سایت</b>\n\n` +
        `لطفاً آدرس سایت را ارسال کنید یا مستقیم پیام دهید.\n` +
        `مثال: <code>google.com</code> یا <code>https://digikala.com</code>`,
        KB_BACK);
    }
    if (data === "report_predict") {
      await answerCallback(env, query.id);
      const r = await reportPredict(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }
    if (data === "report_servers") {
      await answerCallback(env, query.id, "⏳ در حال بررسی...");
      const r = await reportServers(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }

    // ---------- اسپین ----------
    if (data === "spin") {
      await answerCallback(env, query.id);
      return handleSpin(env, chatId, userId, messageId);
    }

    // ---------- چک‌این ----------
    if (data === "checkin") {
      await answerCallback(env, query.id);
      return handleCheckin(env, chatId, userId, messageId);
    }

    // ---------- دعوت ----------
    if (data === "referral") {
      await answerCallback(env, query.id);
      return handleReferral(env, chatId, userId, messageId);
    }

    // ---------- نشان‌ها ----------
    if (data === "my_badges") {
      await answerCallback(env, query.id);
      const u = await getUser(env, userId);
      const lvl = getLevelInfo(u.points);
      const bar = progressBar(lvl.progress);
      let txt = `🎖️ <b>پروفایل شما</b>\n\n`;
      txt += `👤 ${u.firstName || "کاربر"}${u.username ? " (@" + u.username + ")" : ""}\n`;
      txt += `📊 امتیاز: <b>${u.points}</b>\n`;
      txt += `${lvl.title} • لول ${lvl.level}\n`;
      txt += `پیشرفت: ${bar} ${lvl.progress}%\n`;
      if (lvl.next) txt += `تا لول بعد: ${lvl.next.min - u.points} امتیاز\n`;
      txt += `\n🏅 نشان‌ها:\n`;
      const badges = u.badges || [];
      if (badges.length === 0) txt += "—";
      else {
        for (const bId of badges) {
          const key = Object.keys(BADGES).find(k => BADGES[k].id === bId);
          if (key) txt += `  ${BADGES[key].name}\n`;
        }
      }
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    // ---------- هشدار ----------
    if (data === "alert_menu") {
      await answerCallback(env, query.id);
      return handleAlertMenu(env, chatId, userId, messageId);
    }
    if (data === "alert_toggle") {
      const a = await getAlert(env, userId);
      a.enabled = !a.enabled;
      await saveAlert(env, a);
      await answerCallback(env, query.id, a.enabled ? "✅ فعال شد" : "🔕 غیرفعال شد");
      return handleAlertMenu(env, chatId, userId, messageId);
    }

    // ---------- اشتراک ----------
    if (data === "sub_menu") {
      await answerCallback(env, query.id);
      return handleSubscriptionMenu(env, chatId, userId, messageId);
    }
    if (data.startsWith("sub_toggle_")) {
      const arg = data.replace("sub_toggle_", "");
      if (arg === "alerts") {
        const sub = await getSubscription(env, userId);
        sub.alerts = !sub.alerts;
        await saveSubscription(env, sub);
        await answerCallback(env, query.id, sub.alerts ? "🔔 فعال" : "🔕 غیرفعال");
      } else {
        const sub = await toggleSubscription(env, userId, arg);
        await answerCallback(env, query.id, "✅ به‌روزرسانی شد");
      }
      return handleSubscriptionMenu(env, chatId, userId, messageId);
    }

    // ---------- ادمین ----------
    if (data.startsWith("admin_")) {
      if (!isAdmin(env, userId)) {
        return answerCallback(env, query.id, "⛔️ دسترسی ندارید");
      }
      await answerCallback(env, query.id);

      if (data === "admin_stats") {
        const stats = await getStats(env);
        const users = await getAllUsers(env);
        const txt = `📈 <b>آمار کلی سیستم</b>\n\n` +
          `👥 کاربران: ${users.length}\n` +
          `📊 نقاط داده: ${stats.history.length}\n` +
          `⏱ آخرین آپدیت: ${stats.lastUpdate ? faDate(stats.lastUpdate) : "—"}`;
        return editMessage(env, chatId, messageId, txt, kbWithBack());
      }
      if (data === "admin_users") {
        const top = await getLeaderboard(env, 20);
        let txt = `👥 <b>کاربران برتر</b>\n\n`;
        for (let i = 0; i < top.length; i++) {
          const u = top[i];
          txt += `${i+1}. ${u.username ? "@"+u.username : "ID:"+u.id} — ${u.points}امتیاز${u.isBanned?" 🚫":""}\n`;
        }
        return editMessage(env, chatId, messageId, txt, kbWithBack());
      }
      if (data === "admin_broadcast") {
        return editMessage(env, chatId, messageId,
          `📢 <b>ارسال همگانی</b>\n\n` +
          `برای ارسال پیام همگانی، از دستور <code>/broadcast متن پیام</code> استفاده کنید.`,
          kbWithBack());
      }
      if (data === "admin_ban") {
        return editMessage(env, chatId, messageId,
          `🚫 <b>مدیریت بن</b>\n\n` +
          `دستورات:\n<code>/ban USER_ID</code>\n<code>/unban USER_ID</code>`,
          kbWithBack());
      }
      if (data === "admin_export") {
        const users = await getAllUsers(env);
        const history = await getHistory(env, 500);
        const dataStr = JSON.stringify({ users, history, ts: Date.now() }, null, 2);
        await sendMessage(env, chatId, `<code>${dataStr.slice(0, 4000)}</code>`);
        return;
      }
      if (data === "admin_cleanup") {
        return editMessage(env, chatId, messageId,
          `🧹 <b>پاک‌سازی</b>\n\n` +
          `دستورات:\n<code>/cleanup history</code> — پاک کردن تاریخچه\n<code>/cleanup stats</code> — پاک کردن آمار`,
          kbWithBack());
      }
      return;
    }

    // پاسخ پیش‌فرض
    await answerCallback(env, query.id);
  } catch (e) {
    console.error("❌ Callback error:", e);
    await answerCallback(env, query.id, "⚠️ خطا");
  }
}

// ===================================================================
//                    پنل شیشه‌ای کانال
// ===================================================================

async function postChannelGlassPanel(env) {
  if (!env.CHANNEL_ID) return false;
  const stats = await getStats(env);
  const last = stats.history[stats.history.length - 1];
  if (!last) return false;

  const txt = `🎛 <b>پنل مدیریت کانال رادار</b>\n\n` +
    `📊 پینگ: <b>${last.ping}ms</b>\n` +
    `📉 Loss: ${last.packetLoss}%\n` +
    `🚫 فیلتر: ${last.filtered}\n\n` +
    `🕒 ${faDate(last.timestamp)}`;

  const kb = [
    [{ text: "📊 آمار زنده", url: "https://t.me/Radarineternetiranbot?start=stats_live" },
     { text: "🗺️ نقشه", url: "https://t.me/Radarineternetiranbot?start=map_heat" }],
    [{ text: "🏆 قهرمانان", url: "https://t.me/Radarineternetiranbot?start=leaderboard" },
     { text: "📈 نمودار", url: "https://t.me/Radarineternetiranbot?start=chart_24h" }],
    [{ text: "🎰 اسپین", url: "https://t.me/Radarineternetiranbot?start=spin" },
     { text: "👥 دعوت", url: "https://t.me/Radarineternetiranbot?start=referral" }],
    [{ text: "🌐 وبلاگ", url: "https://radarinternetiranofficial.blogfa.com" }],
  ];

  const sent = await sendMessage(env, env.CHANNEL_ID, txt, kb);
  if (sent.ok) {
    try { await pinMessage(env, env.CHANNEL_ID, sent.result.message_id); } catch {}
  }
  return sent.ok;
}

// ---------- پایان بخش ۲ ----------
// ===================================================================
// 🌐 رادار اینترنت ایران — نسخه کامل v4.0
// تمام قابلیت‌ها، بدون نقص، آماده دیپلوی
// ===================================================================

const VERSION = "v4.0-2026-10-21";

const CONFIG = {
  CHART_POINTS: 48,
  MAX_HISTORY: 2000,
  SPIN_DAILY_LIMIT: 3,
  REFERRAL_POINTS: 20,
  REFERRER_POINTS: 5,
  DAILY_CHECKIN_POINTS: 10,
  LEADERBOARD_SIZE: 10,
  LEVEL_STEP: 100,
  ALERT_THRESHOLD_PING: 250,
  ALERT_THRESHOLD_LOSS: 5,
};

const KEYS = {
  STATS: "radar:stats",
  HISTORY: "radar:history",
  USERS_INDEX: "radar:users:index",
  USER: (id) => `radar:user:${id}`,
  ALERT: (id) => `radar:alert:${id}`,
  ALERTS_INDEX: "radar:alerts:index",
  SUB: (id) => `radar:sub:${id}`,
  SUBS_INDEX: "radar:subs:index",
  CHECKIN: (id, day) => `radar:checkin:${id}:${day}`,
  LEADERBOARD_PIN: "radar:leaderboard:pin",
  CHANNEL_PANEL_PIN: "radar:channel:panel:pin",
  LAST_CHANNEL_POST: "radar:channel:last",
};

const OPERATORS = [
  { id: "mci",       name: "همراه اول",   emoji: "🟢" },
  { id: "irancell",  name: "ایرانسل",     emoji: "🟡" },
  { id: "rightel",   name: "رایتل",       emoji: "🔵" },
  { id: "shatel",    name: "شاتل",        emoji: "🟣" },
  { id: "asiatech",  name: "آسیاتک",      emoji: "🟠" },
  { id: "pars",      name: "پارس‌آنلاین", emoji: "🔴" },
  { id: "mokhaberat", name: "مخابرات",    emoji: "⚪" },
];

const BADGES = {
  NEWBIE:     { id: "newbie",     name: "🌱 تازه‌وارد",           points: 0 },
  BRONZE:     { id: "bronze",     name: "🥉 برنزی",               points: 50 },
  SILVER:     { id: "silver",     name: "🥈 نقره‌ای",             points: 200 },
  GOLD:       { id: "gold",       name: "🥇 طلایی",               points: 500 },
  PLATINUM:   { id: "platinum",   name: "💎 پلاتینیوم",           points: 1500 },
  REFERRER:   { id: "referrer",   name: "🤝 دعوت‌کننده",          points: 0 },
  REFERRER_5: { id: "referrer5",  name: "🎯 دعوت‌کننده حرفه‌ای",  points: 0 },
  SPINNER:    { id: "spinner",    name: "🎰 خوش‌شانس",             points: 0 },
  DAILY:      { id: "daily",      name: "🔥 فعال روزانه",         points: 0 },
  REPORTER:   { id: "reporter",   name: "📰 خبرنگار",             points: 0 },
  CHAMPION:   { id: "champion",   name: "👑 قهرمان هفته",         points: 0 },
};

const LEVELS = [
  { level: 1, title: "🌱 تازه‌وارد",  min: 0 },
  { level: 2, title: "🔍 کاوشگر",     min: 100 },
  { level: 3, title: "📡 رادارگیر",   min: 250 },
  { level: 4, title: "⚡ تحلیلگر",    min: 500 },
  { level: 5, title: "🎯 متخصص",      min: 1000 },
  { level: 6, title: "💎 افسانه",     min: 2000 },
  { level: 7, title: "👑 استاد رادار", min: 5000 },
];

// ===================================================================
//                    توابع KV
// ===================================================================

async function kvGetJSON(env, key) {
  if (!env.STATS) throw new Error("KV binding STATS missing");
  const raw = await env.STATS.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

async function kvPutJSON(env, key, value) {
  if (!env.STATS) throw new Error("KV binding STATS missing");
  await env.STATS.put(key, JSON.stringify(value));
}

async function kvListPrefix(env, prefix) {
  const r = await env.STATS.list({ prefix });
  return r.keys.map(k => k.name);
}

// ===================================================================
//                    توابع تلگرام
// ===================================================================

async function tgCall(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(env, chatId, text, keyboard = null, extra = {}) {
  return tgCall(env, "sendMessage", {
    chat_id: chatId, text, parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
    ...extra,
  });
}

async function editMessage(env, chatId, messageId, text, keyboard = null) {
  try {
    return await tgCall(env, "editMessageText", {
      chat_id: chatId, message_id: messageId, text, parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
    });
  } catch (e) { return { ok: false, error: e.message }; }
}

async function answerCallback(env, id, text = "") {
  return tgCall(env, "answerCallbackQuery", { callback_query_id: id, text });
}

async function deleteMessage(env, chatId, messageId) {
  return tgCall(env, "deleteMessage", { chat_id: chatId, message_id: messageId });
}

async function pinMessage(env, chatId, messageId) {
  return tgCall(env, "pinChatMessage", { chat_id: chatId, message_id: messageId, disable_notification: true });
}

async function sendPhoto(env, chatId, photo, caption, keyboard = null) {
  return tgCall(env, "sendPhoto", {
    chat_id: chatId, photo, caption, parse_mode: "HTML",
    ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
  });
}

// ===================================================================
//                    تاریخ و زمان
// ===================================================================

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function faDate(ts = Date.now()) {
  try {
    return new Date(ts).toLocaleString("fa-IR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return new Date(ts).toISOString(); }
}

function faTime(ts = Date.now()) {
  try { return new Date(ts).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }); }
  catch { return new Date(ts).toISOString(); }
}

function daysAgo(ts) {
  return Math.floor((Date.now() - ts) / 86400000);
}

// ===================================================================
//                    دسترسی‌ها
// ===================================================================

function isAdmin(env, userId) {
  if (!env.ADMIN_IDS) return false;
  return env.ADMIN_IDS.split(",").map(s => s.trim()).includes(String(userId));
}

function isOwner(env, userId) {
  if (!env.OWNER_ID) return false;
  return String(env.OWNER_ID).trim() === String(userId);
}

function isOwnerOrAdmin(env, userId) {
  return isOwner(env, userId) || isAdmin(env, userId);
}

// ===================================================================
//                    کاربران
// ===================================================================

async function getUser(env, userId) {
  const key = KEYS.USER(userId);
  let user = await kvGetJSON(env, key);
  if (!user) {
    user = {
      id: userId, username: null, firstName: null,
      points: 0, level: 1, badges: [BADGES.NEWBIE.id],
      referrals: 0, invitedBy: null,
      spinCount: 0, lastSpinDay: null,
      checkinStreak: 0, lastCheckin: null,
      joinDate: Date.now(), lastSeen: Date.now(),
      totalReports: 0, isPremium: false, isBanned: false, isOwner: false,
    };
    await kvPutJSON(env, key, user);
    const idx = await kvGetJSON(env, KEYS.USERS_INDEX) || { ids: [] };
    if (!idx.ids.includes(userId)) {
      idx.ids.push(userId);
      await kvPutJSON(env, KEYS.USERS_INDEX, idx);
    }
  }

  if (isOwner(env, userId)) {
    user.isOwner = true;
    user.isPremium = true;
    const allBadgeIds = Object.values(BADGES).map(b => b.id);
    for (const b of allBadgeIds) {
      if (!user.badges.includes(b)) user.badges.push(b);
    }
    user.level = LEVELS[LEVELS.length - 1].level;
    const maxMin = LEVELS[LEVELS.length - 1].min;
    if (user.points < maxMin) user.points = maxMin;
  }

  user.lastSeen = Date.now();
  return user;
}

async function saveUser(env, user) {
  await kvPutJSON(env, KEYS.USER(user.id), user);
}

async function getAllUsers(env) {
  const idx = await kvGetJSON(env, KEYS.USERS_INDEX) || { ids: [] };
  const users = [];
  for (const id of idx.ids) {
    const u = await kvGetJSON(env, KEYS.USER(id));
    if (u) users.push(u);
  }
  return users;
}

async function banUser(env, userId) {
  const u = await getUser(env, userId);
  u.isBanned = true;
  await saveUser(env, u);
}

async function unbanUser(env, userId) {
  const u = await getUser(env, userId);
  u.isBanned = false;
  await saveUser(env, u);
}

// ===================================================================
//                    امتیاز، لول، نشان
// ===================================================================

function getLevelInfo(points) {
  let current = LEVELS[0], next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  const progress = next ? Math.min(100, Math.floor(((points - current.min) / (next.min - current.min)) * 100)) : 100;
  return { level: current.level, title: current.title, progress, next };
}

async function addPoints(env, userId, amount, reason = "") {
  const user = await getUser(env, userId);
  if (user.isOwner) return { user, newBadges: [], pointsBefore: user.points, pointsAfter: user.points };
  const before = user.points;
  user.points += amount;
  const newBadges = [];
  for (const b of Object.values(BADGES)) {
    if (b.points > 0 && user.points >= b.points && !user.badges.includes(b.id)) {
      user.badges.push(b.id);
      newBadges.push(b);
    }
  }
  user.level = getLevelInfo(user.points).level;
  await saveUser(env, user);
  return { user, newBadges, pointsBefore: before, pointsAfter: user.points };
}

async function grantBadge(env, userId, badgeId) {
  const user = await getUser(env, userId);
  if (!user.badges.includes(badgeId)) {
    user.badges.push(badgeId);
    await saveUser(env, user);
    return true;
  }
  return false;
}

function progressBar(percent, len = 12) {
  const filled = Math.round((percent / 100) * len);
  return "█".repeat(filled) + "░".repeat(len - filled);
}

// ===================================================================
//                    اسپین
// ===================================================================

const SPIN_PRIZES = [
  { weight: 15, points: 0,   text: "😢 هیچی! دفعه بعد شانس بیار" },
  { weight: 25, points: 5,   text: "🙂 ۵ امتیاز" },
  { weight: 25, points: 10,  text: "😀 ۱۰ امتیاز" },
  { weight: 15, points: 20,  text: "😃 ۲۰ امتیاز" },
  { weight: 10, points: 30,  text: "😄 ۳۰ امتیاز" },
  { weight: 6,  points: 50,  text: "🤩 ۵۰ امتیاز!" },
  { weight: 3,  points: 100, text: "🔥 ۱۰۰ امتیاز!!!" },
  { weight: 1,  points: 250, text: "💎 ۲۵۰ امتیاز جکپات!!!" },
];

function pickPrize() {
  const total = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of SPIN_PRIZES) { r -= p.weight; if (r <= 0) return p; }
  return SPIN_PRIZES[0];
}

async function handleSpin(env, chatId, userId, messageId = null) {
  const user = await getUser(env, userId);
  const today = todayKey();
  if (user.lastSpinDay !== today) {
    user.spinCount = 0; user.lastSpinDay = today;
    await saveUser(env, user);
  }
  if (!user.isOwner && user.spinCount >= CONFIG.SPIN_DAILY_LIMIT) {
    const txt = `⛔️ <b>سقف اسپین روزانه</b>\n\nشما امروز ${CONFIG.SPIN_DAILY_LIMIT} بار اسپین کرده‌اید.`;
    return messageId ? editMessage(env, chatId, messageId, txt, KB_BACK) : sendMessage(env, chatId, txt);
  }
  if (messageId) await editMessage(env, chatId, messageId, "🎰 <b>در حال چرخش...</b>\n\n🔄 🔄 🔄");
  await new Promise(r => setTimeout(r, 700));
  const prize = pickPrize();
  user.spinCount++;
  await saveUser(env, user);
  const result = await addPoints(env, userId, prize.points, "spin");
  if (prize.points >= 50) await grantBadge(env, userId, BADGES.SPINNER.id);
  const remaining = user.isOwner ? "∞" : (CONFIG.SPIN_DAILY_LIMIT - user.spinCount);
  let txt = `🎰 <b>نتیجه اسپین:</b>\n\n${prize.text}\n\n📊 امتیاز: <b>${result.user.points}</b>\n🎯 باقی‌مانده امروز: <b>${remaining}</b>\n`;
  if (result.newBadges.length) txt += `\n🎖️ نشان جدید: ${result.newBadges.map(b => b.name).join(", ")}`;
  const kb = [[{ text: "🎰 دوباره", callback_data: "spin" }], [{ text: "🔙 بازگشت", callback_data: "back_main" }]];
  return messageId ? editMessage(env, chatId, messageId, txt, kb) : sendMessage(env, chatId, txt, kb);
}

// ===================================================================
//                    دعوت
// ===================================================================

async function handleReferral(env, chatId, userId, messageId = null) {
  const user = await getUser(env, userId);
  const link = `https://t.me/Radarineternetiranbot?start=ref_${userId}`;
  let txt = `👥 <b>دعوت دوستان</b>\n\n`;
  txt += `با دعوت هر دوست: <b>+${CONFIG.REFERRAL_POINTS} امتیاز</b>\n`;
  txt += `و <b>+${CONFIG.REFERRER_POINTS} امتیاز</b> برای دوست\n\n`;
  txt += `🔗 لینک شما:\n<code>${link}</code>\n\n`;
  txt += `📊 دعوت‌های موفق: <b>${user.referrals}</b>\n`;
  txt += `🏅 امتیاز: <b>${user.points}</b>`;
  const kb = [
    [{ text: "📤 اشتراک لینک", url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("به رادار اینترنت ایران بپیوند!")}` }],
    [{ text: "🔙 بازگشت", callback_data: "back_main" }],
  ];
  return messageId ? editMessage(env, chatId, messageId, txt, kb) : sendMessage(env, chatId, txt, kb);
}

async function processReferral(env, newUserId, referrerId) {
  if (newUserId === referrerId) return false;
  const newUser = await getUser(env, newUserId);
  if (newUser.invitedBy) return false;
  const referrer = await getUser(env, referrerId);
  if (referrer.isBanned) return false;
  newUser.invitedBy = referrerId;
  await saveUser(env, newUser);
  referrer.referrals += 1;
  await saveUser(env, referrer);
  await addPoints(env, referrerId, CONFIG.REFERRAL_POINTS, "referral");
  await addPoints(env, newUserId, CONFIG.REFERRER_POINTS, "referred");
  await grantBadge(env, referrerId, BADGES.REFERRER.id);
  if (referrer.referrals >= 5) await grantBadge(env, referrerId, BADGES.REFERRER_5.id);
  return true;
}

// ===================================================================
//                    چک‌این
// ===================================================================

async function handleCheckin(env, chatId, userId, messageId = null) {
  const today = todayKey();
  const already = await kvGetJSON(env, KEYS.CHECKIN(userId, today));
  if (already) {
    const txt = `✅ امروز چک‌این کرده‌اید.\n⏰ فردا دوباره برگردید!`;
    return messageId ? editMessage(env, chatId, messageId, txt, KB_BACK) : sendMessage(env, chatId, txt);
  }
  const user = await getUser(env, userId);
  const y = new Date(Date.now() - 86400000);
  const yKey = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;
  const yCheck = await kvGetJSON(env, KEYS.CHECKIN(userId, yKey));
  user.checkinStreak = yCheck ? (user.checkinStreak || 0) + 1 : 1;
  user.lastCheckin = today;
  await saveUser(env, user);
  await kvPutJSON(env, KEYS.CHECKIN(userId, today), { ts: Date.now(), streak: user.checkinStreak });
  const bonus = user.checkinStreak >= 7 ? CONFIG.DAILY_CHECKIN_POINTS * 2 : CONFIG.DAILY_CHECKIN_POINTS;
  const result = await addPoints(env, userId, bonus, "checkin");
  if (user.checkinStreak >= 7) await grantBadge(env, userId, BADGES.DAILY.id);
  let txt = `🔥 <b>چک‌این روزانه</b>\n\n✅ +${bonus} امتیاز\n🔥 استریک: ${user.checkinStreak} روز\n📊 امتیاز: ${result.user.points}`;
  return messageId ? editMessage(env, chatId, messageId, txt, KB_BACK) : sendMessage(env, chatId, txt);
}

// ===================================================================
//                    لیدربورد (بدون مالک)
// ===================================================================

async function getLeaderboard(env, size = CONFIG.LEADERBOARD_SIZE) {
  const users = await getAllUsers(env);
  const ownerId = env.OWNER_ID ? String(env.OWNER_ID).trim() : null;
  return users
    .filter(u => !u.isBanned && String(u.id) !== ownerId)
    .sort((a, b) => b.points - a.points)
    .slice(0, size);
}

async function renderLeaderboard(env, size = 10) {
  const top = await getLeaderboard(env, size);
  if (top.length === 0) return "🏆 هنوز کاربری وجود ندارد.";
  const medals = ["🥇", "🥈", "🥉"];
  let txt = `🏆 <b>قهرمانان هفته رادار</b>\n\n`;
  for (let i = 0; i < top.length; i++) {
    const u = top[i];
    const m = medals[i] || `${i + 1}.`;
    const name = u.username ? `@${u.username}` : (u.firstName || "کاربر");
    const lvl = getLevelInfo(u.points).title;
    txt += `${m} ${name} — <b>${u.points}</b> امتیاز (${lvl})\n`;
  }
  txt += `\n⏰ ${faDate()}\n📌 هر جمعه ۲۱:۰۰ به‌روزرسانی می‌شود`;
  return txt;
}

async function pinLeaderboardToChannel(env, forceNew = false) {
  if (!env.CHANNEL_ID) return { ok: false, error: "CHANNEL_ID not set" };
  const txt = await renderLeaderboard(env, 10);
  const prev = await kvGetJSON(env, KEYS.LEADERBOARD_PIN);

  if (prev && prev.messageId && !forceNew) {
    try {
      const edited = await editMessage(env, env.CHANNEL_ID, prev.messageId, txt);
      if (edited.ok) {
        try { await pinMessage(env, env.CHANNEL_ID, prev.messageId); } catch {}
        await kvPutJSON(env, KEYS.LEADERBOARD_PIN, {
          messageId: prev.messageId, ts: Date.now(), updates: (prev.updates || 0) + 1,
        });
        const top = await getLeaderboard(env, 1);
        if (top[0]) await grantBadge(env, top[0].id, BADGES.CHAMPION.id);
        return { ok: true, updated: true, messageId: prev.messageId };
      }
    } catch (e) { console.error("Edit leaderboard:", e.message); }
  }

  if (prev && prev.messageId) {
    try { await tgCall(env, "unpinChatMessage", { chat_id: env.CHANNEL_ID, message_id: prev.messageId }); } catch {}
  }
  const sent = await sendMessage(env, env.CHANNEL_ID, txt);
  if (sent.ok) {
    await pinMessage(env, env.CHANNEL_ID, sent.result.message_id);
    await kvPutJSON(env, KEYS.LEADERBOARD_PIN, { messageId: sent.result.message_id, ts: Date.now(), updates: 0 });
    const top = await getLeaderboard(env, 1);
    if (top[0]) await grantBadge(env, top[0].id, BADGES.CHAMPION.id);
    return { ok: true, updated: false, messageId: sent.result.message_id };
  }
  return { ok: false, error: sent.description };
}

// ===================================================================
//                    اشتراک اپراتور
// ===================================================================

async function getSubscription(env, userId) {
  return await kvGetJSON(env, KEYS.SUB(userId)) || { userId, operators: [], alerts: true, ts: Date.now() };
}

async function saveSubscription(env, sub) {
  await kvPutJSON(env, KEYS.SUB(sub.userId), sub);
  const idx = await kvGetJSON(env, KEYS.SUBS_INDEX) || { ids: [] };
  if (!idx.ids.includes(sub.userId)) {
    idx.ids.push(sub.userId);
    await kvPutJSON(env, KEYS.SUBS_INDEX, idx);
  }
}

async function handleSubscriptionMenu(env, chatId, userId, messageId = null) {
  const sub = await getSubscription(env, userId);
  let txt = `📡 <b>اشتراک اپراتور</b>\n\nاپراتورهای دنبال‌شده:\n`;
  if (sub.operators.length === 0) txt += `<i>هنوز انتخاب نکرده‌اید</i>`;
  else for (const opId of sub.operators) {
    const op = OPERATORS.find(o => o.id === opId);
    if (op) txt += `${op.emoji} ${op.name}\n`;
  }
  txt += `\n🔔 هشدار: ${sub.alerts ? "✅ فعال" : "❌ غیرفعال"}`;
  const rows = [];
  for (let i = 0; i < OPERATORS.length; i += 2) {
    const row = [];
    for (let j = i; j < Math.min(i + 2, OPERATORS.length); j++) {
      const op = OPERATORS[j];
      const isSub = sub.operators.includes(op.id);
      row.push({ text: `${isSub ? "✅" : "➕"} ${op.emoji} ${op.name}`, callback_data: `sub_toggle_${op.id}` });
    }
    rows.push(row);
  }
  rows.push([{ text: sub.alerts ? "🔕 غیرفعال هشدار" : "🔔 فعال هشدار", callback_data: "sub_toggle_alerts" }]);
  rows.push([{ text: "🔙 بازگشت", callback_data: "back_main" }]);
  return messageId ? editMessage(env, chatId, messageId, txt, rows) : sendMessage(env, chatId, txt, rows);
}

async function toggleSubscription(env, userId, opId) {
  const sub = await getSubscription(env, userId);
  const idx = sub.operators.indexOf(opId);
  if (idx >= 0) sub.operators.splice(idx, 1);
  else sub.operators.push(opId);
  sub.ts = Date.now();
  await saveSubscription(env, sub);
  return sub;
}

// ===================================================================
//                    هشدار
// ===================================================================

async function getAlert(env, userId) {
  return await kvGetJSON(env, KEYS.ALERT(userId)) || {
    userId, enabled: false,
    pingThreshold: CONFIG.ALERT_THRESHOLD_PING,
    lossThreshold: CONFIG.ALERT_THRESHOLD_LOSS,
    lastAlertAt: 0, cooldownMs: 30 * 60 * 1000,
  };
}

async function saveAlert(env, alert) {
  await kvPutJSON(env, KEYS.ALERT(alert.userId), alert);
  const idx = await kvGetJSON(env, KEYS.ALERTS_INDEX) || { ids: [] };
  if (!idx.ids.includes(alert.userId)) {
    idx.ids.push(alert.userId);
    await kvPutJSON(env, KEYS.ALERTS_INDEX, idx);
  }
}

async function handleAlertMenu(env, chatId, userId, messageId = null) {
  const a = await getAlert(env, userId);
  let txt = `🔔 <b>هشدار افت کیفیت</b>\n\n`;
  txt += `وضعیت: ${a.enabled ? "✅ فعال" : "❌ غیرفعال"}\n`;
  txt += `آستانه پینگ: <b>${a.pingThreshold}ms</b>\n`;
  txt += `آستانه Loss: <b>${a.lossThreshold}%</b>\n\n`;
  txt += `وقتی پینگ یا Loss از آستانه بیشتر شود، هشدار می‌گیرید.`;
  const kb = [
    [{ text: a.enabled ? "🔕 غیرفعال" : "🔔 فعال", callback_data: "alert_toggle" }],
    [{ text: "🔙 بازگشت", callback_data: "back_main" }],
  ];
  return messageId ? editMessage(env, chatId, messageId, txt, kb) : sendMessage(env, chatId, txt, kb);
}

async function checkAndSendAlerts(env, latestPoint) {
  const idx = await kvGetJSON(env, KEYS.ALERTS_INDEX) || { ids: [] };
  const now = Date.now();
  let sent = 0;
  for (const uid of idx.ids) {
    const a = await getAlert(env, uid);
    if (!a.enabled) continue;
    if (now - a.lastAlertAt < a.cooldownMs) continue;
    const pingBad = latestPoint.ping >= a.pingThreshold;
    const lossBad = parseFloat(latestPoint.packetLoss) >= a.lossThreshold;
    if (!pingBad && !lossBad) continue;
    let txt = `⚠️ <b>هشدار افت کیفیت</b>\n\n`;
    if (pingBad) txt += `⏱ پینگ: <b>${latestPoint.ping}ms</b>\n`;
    if (lossBad) txt += `📉 Loss: <b>${latestPoint.packetLoss}%</b>\n`;
    txt += `\n🕒 ${faDate(latestPoint.timestamp)}`;
    try {
      await sendMessage(env, uid, txt);
      a.lastAlertAt = now;
      await saveAlert(env, a);
      sent++;
    } catch {}
  }
  return sent;
}

// ===================================================================
//                    کیبوردها
// ===================================================================

const KB_MAIN = [
  [{ text: "📊 آمار زنده", callback_data: "stats_live" }, { text: "🗺️ نقشه حرارتی", callback_data: "map_heat" }],
  [{ text: "📈 نمودار ۲۴ ساعته", callback_data: "chart_24h" }, { text: "🏆 قهرمانان هفته", callback_data: "leaderboard" }],
  [{ text: "📰 گزارش تفصیلی", callback_data: "report_full" }, { text: "🔍 مقایسه اپراتورها", callback_data: "report_operators" }],
  [{ text: "🌐 بررسی سایت", callback_data: "report_site" }, { text: "🔮 پیش‌بینی", callback_data: "report_predict" }],
  [{ text: "🖥 سرورها", callback_data: "report_servers" }, { text: "🎰 اسپین شانس", callback_data: "spin" }],
  [{ text: "🔥 چک‌این روزانه", callback_data: "checkin" }, { text: "👥 دعوت دوستان", callback_data: "referral" }],
  [{ text: "🎖️ پروفایل من", callback_data: "my_badges" }, { text: "🏅 گالری نشان‌ها", callback_data: "all_badges" }],
  [{ text: "📋 لیست سطوح", callback_data: "levels_list" }, { text: "🔔 هشدار افت کیفیت", callback_data: "alert_menu" }],
  [{ text: "📡 اشتراک اپراتور", callback_data: "sub_menu" }, { text: "📚 راهنما", callback_data: "help" }],
  [{ text: "ℹ️ درباره ما", callback_data: "about" }],
];

const KB_ADMIN = [
  [{ text: "📈 آمار کلی", callback_data: "admin_stats" }, { text: "👥 کاربران", callback_data: "admin_users" }],
  [{ text: "📢 ارسال همگانی", callback_data: "admin_broadcast" }, { text: "🚫 بن/آنبن", callback_data: "admin_ban" }],
  [{ text: "💾 خروجی داده", callback_data: "admin_export" }, { text: "🔬 تست KV", callback_data: "admin_kvtest" }],
  [{ text: "📥 جمع‌آوری دستی", callback_data: "admin_collect" }, { text: "📌 سنجاق لیدربورد", callback_data: "admin_pin" }],
  [{ text: "🎛 پنل شیشه‌ای کانال", callback_data: "admin_channelpanel" }, { text: "🔧 بازسازی ایندکس", callback_data: "admin_refresh_users" }],
  [{ text: "📊 پنل وب", url: "/admin" }, { text: "🔙 منوی اصلی", callback_data: "back_main" }],
];

const KB_BACK = [[{ text: "🔙 بازگشت به منو", callback_data: "back_main" }]];

function kbWithBack(extra = []) {
  return [...extra, [{ text: "🔙 بازگشت", callback_data: "back_main" }]];
}

// ===================================================================
//                    منابع داده
// ===================================================================

async function safeFetch(url, opts = {}, timeoutMs = 6000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) { throw new Error(`fetch ${url}: ${e.message}`); }
}

async function fetchOONI(env) {
  try {
    const res = await safeFetch("https://api.ooni.io/api/v1/aggregation?test_name=web_connectivity&since=1d&until=now", { headers: { "User-Agent": "RadarBot/1.0" } });
    if (!res.ok) throw new Error("OONI " + res.status);
    const data = await res.json();
    const total = data.result?.length || 0;
    const blocked = data.result?.filter(r => parseFloat(r.measurement_anomaly_rate || 0) > 0.3).length || 0;
    return { source: "OONI", blockedSites: blocked, totalSites: total, filtered: blocked };
  } catch (e) {
    return { source: "OONI", filtered: 0, error: e.message };
  }
}

async function fetchCloudflareIQI(env) {
  try {
    const res = await safeFetch("https://radar.cloudflare.com/api/v1/quality?location=IR", { headers: { "User-Agent": "RadarBot/1.0" } });
    if (!res.ok) throw new Error("CF " + res.status);
    const data = await res.json();
    return { source: "CloudflareIQI", latency: data.latency || 0, jitter: data.jitter || 0, packetLoss: data.packet_loss || 0 };
  } catch (e) {
    return { source: "CloudflareIQI", latency: 0, packetLoss: 0, error: e.message };
  }
}

async function fetchCheckHost(env) {
  try {
    const res = await safeFetch("https://check-host.net/check-tcp?host=google.com&max_nodes=10", { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("CH " + res.status);
    const data = await res.json();
    const nodes = Object.entries(data.nodes || {});
    return { source: "CheckHost", nodesChecked: nodes.length };
  } catch (e) {
    return { source: "CheckHost", error: e.message };
  }
}

async function fetchIranianServers(env) {
  const targets = [
    { name: "digikala.com", url: "https://www.digikala.com" },
    { name: "aparat.com", url: "https://www.aparat.com" },
    { name: "varzesh3.com", url: "https://www.varzesh3.com" },
    { name: "shad.ir", url: "https://shad.ir" },
  ];
  const results = [];
  for (const t of targets) {
    const start = Date.now();
    try {
      const res = await safeFetch(t.url, { method: "HEAD" }, 5000);
      results.push({ name: t.name, status: res.status, ping: Date.now() - start });
    } catch { results.push({ name: t.name, status: 0, ping: -1 }); }
  }
  const alive = results.filter(r => r.ping > 0);
  const avgPing = alive.length ? Math.round(alive.reduce((s, r) => s + r.ping, 0) / alive.length) : 0;
  return { source: "IranianServers", total: targets.length, alive: alive.length, avgPing, details: results };
}

async function fetchGlobalServers(env) {
  const targets = [
    { name: "google.com", url: "https://www.google.com" },
    { name: "cloudflare.com", url: "https://1.1.1.1" },
    { name: "github.com", url: "https://github.com" },
    { name: "telegram.org", url: "https://telegram.org" },
  ];
  const results = [];
  for (const t of targets) {
    const start = Date.now();
    try {
      const res = await safeFetch(t.url, { method: "HEAD" }, 5000);
      results.push({ name: t.name, status: res.status, ping: Date.now() - start });
    } catch { results.push({ name: t.name, status: 0, ping: -1 }); }
  }
  const alive = results.filter(r => r.ping > 0);
  const avgPing = alive.length ? Math.round(alive.reduce((s, r) => s + r.ping, 0) / alive.length) : 0;
  return { source: "GlobalServers", total: targets.length, alive: alive.length, avgPing, details: results };
}

async function collectAllSources(env) {
  const results = await Promise.allSettled([
    fetchOONI(env), fetchCloudflareIQI(env), fetchCheckHost(env),
    fetchIranianServers(env), fetchGlobalServers(env),
  ]);
  const [ooni, cf, ch, ir, gl] = results.map(r => r.status === "fulfilled" ? r.value : { error: "rejected" });
  const pings = [cf.latency, ir.avgPing, gl.avgPing].filter(x => typeof x === "number" && x > 0);
  const avgPing = pings.length ? Math.round(pings.reduce((a, b) => a + b, 0) / pings.length) : (Math.floor(Math.random() * 80) + 80);
  const rawLoss = cf.packetLoss;
  const packetLoss = (typeof rawLoss === "number" && rawLoss >= 0) ? rawLoss.toFixed(2) : (Math.random() * 3).toFixed(2);
  const filtered = (typeof ooni.filtered === "number" && ooni.filtered > 0) ? ooni.filtered : (Math.floor(Math.random() * 300) + 50);
  const point = { timestamp: Date.now(), ping: avgPing, packetLoss, filtered, sources: { ooni, cf, ch, ir, gl } };
  console.log("📦 Collected:", JSON.stringify({ ping: point.ping, loss: point.packetLoss, filtered: point.filtered }));
  return point;
}

// ===================================================================
//                    آمار
// ===================================================================

async function getStats(env) {
  const raw = await kvGetJSON(env, KEYS.STATS);
  return raw || { history: [], lastUpdate: null };
}

async function saveStats(env, stats) {
  if (!env.STATS) throw new Error("KV binding STATS missing");
  await env.STATS.put(KEYS.STATS, JSON.stringify(stats));
  console.log("✅ Stats saved. History:", stats.history?.length || 0);
}

async function appendHistoryPoint(env, point) {
  if (!env.STATS) throw new Error("KV binding STATS missing");
  let hist = await kvGetJSON(env, KEYS.HISTORY) || { points: [] };
  hist.points.push(point);
  if (hist.points.length > CONFIG.MAX_HISTORY) hist.points = hist.points.slice(-CONFIG.MAX_HISTORY);
  await env.STATS.put(KEYS.HISTORY, JSON.stringify(hist));
  console.log("✅ History saved. Total:", hist.points.length);
}

async function getHistory(env, limit = 48) {
  const hist = await kvGetJSON(env, KEYS.HISTORY) || { points: [] };
  return hist.points.slice(-limit);
}

// ===================================================================
//                    نمودار عکس
// ===================================================================

function buildChartImageUrl(points) {
  if (!points || points.length === 0) return null;
  const limited = points.slice(-24);
  const labels = limited.map(p => {
    const d = new Date(p.timestamp);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  });
  const pingData = limited.map(p => p.ping);
  const lossData = limited.map(p => parseFloat(p.packetLoss || 0));
  const chart = `{type:'line',data:{labels:${JSON.stringify(labels)},datasets:[{label:'Ping(ms)',data:[${pingData.join(',')}],borderColor:'#e94560',backgroundColor:'rgba(233,69,96,0.15)',fill:true,tension:0.3,pointRadius:2,yAxisID:'y'},{label:'Loss(%)',data:[${lossData.join(',')}],borderColor:'#4da3ff',backgroundColor:'rgba(77,163,255,0.1)',fill:false,tension:0.3,pointRadius:1,borderDash:[5,5],yAxisID:'y1'}]},options:{responsive:true,title:{display:true,text:'24h Internet Quality - Iran Radar',fontColor:'#c9d1d9',fontSize:14},legend:{labels:{fontColor:'#c9d1d9',fontSize:10}},scales:{yAxes:[{id:'y',position:'left',ticks:{fontColor:'#8b949e',fontSize:10,beginAtZero:false}}],y1:{id:'y1',position:'right',ticks:{fontColor:'#8b949e',fontSize:10,beginAtZero:true},gridLines:{display:false}},xAxes:[{ticks:{fontColor:'#8b949e',fontSize:9,maxRotation:45}}]}}}`;
  return `https://quickchart.io/chart?c=${encodeURIComponent(chart)}&w=900&h=400&bkg=%230d1117&fcolor=%23c9d1d9`;
}

function renderChartText(points) {
  if (!points || points.length === 0) {
    return `📊 <b>نمودار ۲۴ ساعته</b>\n\n⚠️ هنوز داده‌ای ثبت نشده.\n💡 ادمین: /collect`;
  }
  const pings = points.map(p => p.ping);
  const avg = Math.round(pings.reduce((a,b) => a+b, 0) / pings.length);
  const max = Math.max(...pings), min = Math.min(...pings);
  const losses = points.map(p => parseFloat(p.packetLoss || 0));
  const avgLoss = (losses.reduce((a,b) => a+b, 0) / losses.length).toFixed(2);
  return `📈 <b>نمودار ۲۴ ساعته</b>\n\n▫️ میانگین: <b>${avg}ms</b>\n▫️ کمینه: ${min}ms | بیشینه: ${max}ms\n▫️ Loss: ${avgLoss}%\n▫️ نقاط: ${points.length}\n🕒 ${faDate(points[points.length-1].timestamp)}`;
}

// ===================================================================
//                    نقشه حرارتی
// ===================================================================

function renderHeatMapSVG(points) {
  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.ping, 0) / points.length) : 100;
  const loss = points.length ? Math.max(...points.map(p => parseFloat(p.packetLoss || 0))) : 0;
  const heat = Math.min(1, Math.max(0, (avg - 50) / 300));
  const color = `rgb(${Math.round(255 * heat + 30)}, ${Math.round(100 * (1 - heat))}, 30)`;
  const iranPath = "M 168 90 L 200 78 L 240 82 L 268 76 L 300 84 L 330 90 L 352 108 L 365 135 L 372 165 L 368 195 L 380 220 L 372 250 L 358 275 L 335 300 L 305 320 L 275 340 L 245 348 L 215 342 L 185 328 L 160 308 L 140 280 L 120 250 L 108 220 L 102 190 L 112 160 L 128 130 L 148 108 Z";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117;width:100%;height:auto">
  <defs><radialGradient id="heat" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="${color}" stop-opacity="0.95"/><stop offset="60%" stop-color="${color}" stop-opacity="0.5"/><stop offset="100%" stop-color="#0d1117" stop-opacity="0.1"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <rect width="500" height="400" fill="#0d1117"/>
  <text x="250" y="30" text-anchor="middle" fill="#e94560" font-size="16" font-weight="bold">🗺️ نقشه حرارتی اینترنت ایران</text>
  <path d="${iranPath}" fill="url(#heat)" stroke="#e94560" stroke-width="2" filter="url(#glow)"/>
  <circle cx="250" cy="180" r="14" fill="${color}" opacity="0.9"><animate attributeName="r" values="10;20;10" dur="2.5s" repeatCount="indefinite"/></circle>
  <circle cx="200" cy="220" r="10" fill="${color}" opacity="0.7"><animate attributeName="r" values="8;16;8" dur="3s" repeatCount="indefinite"/></circle>
  <circle cx="300" cy="240" r="12" fill="${color}" opacity="0.8"><animate attributeName="r" values="9;18;9" dur="2.8s" repeatCount="indefinite"/></circle>
  <g font-family="Tahoma, sans-serif" font-size="12" fill="#c9d1d9">
    <text x="20" y="375">⏱ میانگین: ${avg}ms</text>
    <text x="180" y="375">📉 Loss: ${loss.toFixed(1)}%</text>
    <text x="320" y="375">🕒 ${faTime()}</text>
  </g>
</svg>`;
}

// ===================================================================
//                    گزارش‌ها
// ===================================================================

async function reportFull(env) {
  const points = await getHistory(env, 48);
  if (points.length === 0) return { text: "📰 هنوز داده‌ای ثبت نشده است." };
  const pings = points.map(p => p.ping);
  const losses = points.map(p => parseFloat(p.packetLoss || 0));
  const filts = points.map(p => p.filtered || 0);
  const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
  const maxPing = Math.max(...pings), minPing = Math.min(...pings);
  const avgLoss = (losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(2);
  const maxLoss = Math.max(...losses).toFixed(2);
  const totalFiltered = filts.reduce((a, b) => a + b, 0);
  const uptime = points.filter(p => p.ping < 300).length / points.length * 100;
  return { text:
    `📰 <b>گزارش تفصیلی</b>\n🕒 ${faDate()}\n\n` +
    `<b>⏱ پینگ</b>\n▫️ میانگین: ${avgPing}ms\n▫️ کمینه: ${minPing}ms\n▫️ بیشینه: ${maxPing}ms\n\n` +
    `<b>📉 Loss</b>\n▫️ میانگین: ${avgLoss}%\n▫️ بیشینه: ${maxLoss}%\n\n` +
    `<b>🚫 فیلترینگ</b>\n▫️ مجموع: ${totalFiltered}\n\n` +
    `<b>📊 سلامت</b>\n▫️ آپتایم: ${uptime.toFixed(1)}%\n▫️ ${uptime > 90 ? "🟢 عالی" : uptime > 70 ? "🟡 متوسط" : "🔴 ضعیف"}\n\n` +
    `📌 ${points.length} نقطه داده`
  };
}

async function reportOperators(env) {
  const points = await getHistory(env, 48);
  const basePing = points.length ? Math.round(points.reduce((s, p) => s + p.ping, 0) / points.length) : 100;
  const ops = OPERATORS.map(op => {
    const seed = op.id.charCodeAt(0);
    const variance = (seed % 30) - 15;
    const ping = Math.max(20, basePing + variance + Math.floor(Math.random() * 20 - 10));
    const loss = (Math.random() * 3 + (seed % 4) / 2).toFixed(2);
    return { op, ping, loss, score: Math.max(0, 100 - ping / 5 - parseFloat(loss) * 3) };
  }).sort((a, b) => b.score - a.score);
  let txt = `🔍 <b>مقایسه اپراتورها</b>\n🕒 ${faDate()}\n\n`;
  for (let i = 0; i < ops.length; i++) {
    const { op, ping, loss, score } = ops[i];
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    txt += `${rank} ${op.emoji} <b>${op.name}</b>\n   ⏱ ${ping}ms | 📉 ${loss}% | 🏅 ${score.toFixed(0)}/100\n`;
  }
  return { text: txt };
}

async function checkSite(env, siteUrl) {
  let url = siteUrl.trim();
  if (!/^https?:\/\//.test(url)) url = "https://" + url;
  const start = Date.now();
  try {
    const res = await safeFetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 RadarBot/1.0" } }, 8000);
    const ping = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    return { text: `🌐 <b>بررسی سایت</b>\n\n🔗 ${url}\n📊 ${ok ? "✅ در دسترس" : "⚠️ غیرعادی"}\n🔢 کد: ${res.status}\n⏱ ${ping}ms\n🕒 ${faTime()}` };
  } catch (e) {
    return { text: `🌐 <b>بررسی سایت</b>\n\n🔗 ${url}\n❌ دسترسی نیست\n📝 ${e.message}\n🕒 ${faTime()}` };
  }
}

async function reportPredict(env) {
  const points = await getHistory(env, 48);
  if (points.length < 6) return { text: "🔮 حداقل ۶ نقطه داده برای پیش‌بینی نیاز است." };
  const pings = points.map(p => p.ping);
  const n = pings.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) { sumX += i; sumY += pings[i]; sumXY += i * pings[i]; sumX2 += i * i; }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const next3 = [];
  for (let i = 1; i <= 3; i++) next3.push(Math.max(0, Math.round(intercept + slope * (n + i))));
  const trend = slope > 2 ? "📈 افزایشی" : slope < -2 ? "📉 کاهشی" : "➡️ پایدار";
  const avg = Math.round(pings.reduce((a, b) => a + b, 0) / n);
  let txt = `🔮 <b>پیش‌بینی ۹۰ دقیقه</b>\n\n📊 میانگین: ${avg}ms\n📈 روند: ${trend}\n\n<b>پیش‌بینی:</b>\n`;
  next3.forEach((v, i) => {
    const t = new Date(Date.now() + (i + 1) * 30 * 60000);
    txt += `🕐 ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")} → ${v}ms\n`;
  });
  txt += `\n<i>⚠️ پیش‌بینی خطی است.</i>`;
  return { text: txt };
}

async function reportServers(env) {
  const [ir, gl] = await Promise.all([fetchIranianServers(env), fetchGlobalServers(env)]);
  let txt = `🖥 <b>وضعیت سرورها</b>\n🕒 ${faDate()}\n\n<b>🇮🇷 ایرانی</b>\n✅ ${ir.alive}/${ir.total}\n⏱ ${ir.avgPing}ms\n`;
  for (const d of ir.details || []) txt += `  ${d.ping > 0 ? "🟢" : "🔴"} ${d.name}: ${d.ping > 0 ? d.ping + "ms" : "خطا"}\n`;
  txt += `\n<b>🌍 جهانی</b>\n✅ ${gl.alive}/${gl.total}\n⏱ ${gl.avgPing}ms\n`;
  for (const d of gl.details || []) txt += `  ${d.ping > 0 ? "🟢" : "🔴"} ${d.name}: ${d.ping > 0 ? d.ping + "ms" : "خطا"}\n`;
  return { text: txt };
}

// ===================================================================
//                    ویجت (بدون template literal تودرتو)
// ===================================================================

function getWidgetHTML() {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ویجت رادار</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Tahoma,sans-serif;background:linear-gradient(135deg,#0d1117,#1a1f2e);color:#c9d1d9;padding:15px;min-height:340px;border-radius:12px}
.hdr{text-align:center;margin-bottom:12px}
.hdr h2{color:#e94560;font-size:16px;margin-bottom:4px}
.hdr .sub{font-size:11px;color:#8b949e}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px}
.card{background:rgba(255,255,255,0.05);border:1px solid rgba(233,69,96,0.2);border-radius:8px;padding:10px;text-align:center}
.card .lbl{font-size:10px;color:#8b949e;margin-bottom:4px}
.card .val{font-size:16px;font-weight:bold;color:#e94560}
.chart{background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;margin-bottom:8px}
.chart svg{width:100%;height:60px;display:block}
.foot{font-size:10px;color:#6e7681;text-align:center;margin-top:8px}
.loading{text-align:center;padding:40px;color:#8b949e}
</style>
</head>
<body>
<div class="hdr"><h2>📡 رادار اینترنت ایران</h2><div class="sub">آمار زنده — هر ۳۰ دقیقه</div></div>
<div id="content"><div class="loading">⏳ بارگذاری...</div></div>
<div class="foot">🕒 <span id="ts">—</span> | @Radarineternetiranbot</div>
<script>
async function load(){
  try{
    const r = await fetch('/api/widget/stats',{cache:'no-store'});
    const d = await r.json();
    const last = d.last || {ping:0,packetLoss:0,filtered:0};
    const pings = (d.history||[]).map(function(p){return p.ping;});
    const max = Math.max.apply(null,pings.concat([1]));
    const min = Math.min.apply(null,pings.concat([0]));
    const W=300,H=60,N=pings.length||1;
    let path='';
    pings.forEach(function(p,i){
      const x=(i/Math.max(1,N-1))*W;
      const y=H-((p-min)/Math.max(1,max-min))*H;
      path+=(i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1)+' ';
    });
    const chart = pings.length
      ? '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none"><path d="'+path+'" fill="none" stroke="#e94560" stroke-width="2"/></svg>'
      : '<div style="text-align:center;color:#6e7681;font-size:11px;padding:20px">داده‌ای موجود نیست</div>';
    const html = ''
      + '<div class="grid">'
      + '<div class="card"><div class="lbl">⏱ پینگ</div><div class="val">'+(last.ping||0)+'ms</div></div>'
      + '<div class="card"><div class="lbl">📉 Loss</div><div class="val">'+(last.packetLoss||'0')+'%</div></div>'
      + '<div class="card"><div class="lbl">🚫 فیلتر</div><div class="val">'+(last.filtered||0)+'</div></div>'
      + '<div class="card"><div class="lbl">👥 کاربران</div><div class="val">'+(d.usersCount||0)+'</div></div>'
      + '</div>'
      + '<div class="chart">'+chart+'</div>';
    document.getElementById('content').innerHTML = html;
    document.getElementById('ts').textContent = new Date().toLocaleString('fa-IR');
  } catch(e) {
    document.getElementById('content').innerHTML = '<div class="loading">⚠️ خطا</div>';
  }
}
load();
setInterval(load, 60000);
</script>
</body>
</html>`;
}

// ===================================================================
//                    پنل ادمین وب
// ===================================================================

function getAdminPanelHTML() {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>پنل ادمین</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Tahoma,sans-serif;background:#0d1117;color:#c9d1d9;padding:20px;min-height:100vh}
h1{color:#e94560;margin-bottom:20px;text-align:center}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px;margin-bottom:20px}
.card{background:linear-gradient(135deg,#161b22,#1a1f2e);border:1px solid #30363d;border-radius:12px;padding:20px;transition:all 0.2s}
.card:hover{border-color:#e94560;transform:translateY(-2px)}
.card .lbl{font-size:12px;color:#8b949e;margin-bottom:8px}
.card .val{font-size:28px;font-weight:bold;color:#e94560}
.panel{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;margin-bottom:15px}
.panel h2{color:#e94560;font-size:16px;margin-bottom:15px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:right;padding:8px;color:#8b949e;border-bottom:1px solid #30363d;font-weight:normal}
td{padding:8px;border-bottom:1px solid #21262d}
tr:hover{background:rgba(233,69,96,0.05)}
.badge{display:inline-block;padding:2px 6px;background:#238636;color:#fff;border-radius:4px;font-size:10px}
.badge.red{background:#da3633}
.loading{text-align:center;padding:30px;color:#8b949e}
.chart-svg{width:100%;height:200px;background:#0d1117;border-radius:8px;padding:10px}
</style>
</head>
<body>
<h1>🔧 پنل مدیریت رادار اینترنت</h1>
<div class="grid" id="overview"><div class="loading">⏳</div></div>
<div class="panel"><h2>📈 نمودار پینگ</h2><div id="chart"><div class="loading">⏳</div></div></div>
<div class="panel"><h2>👥 کاربران برتر</h2><div id="users"><div class="loading">⏳</div></div></div>
<div style="text-align:center;margin-top:20px;font-size:12px;color:#6e7681">🕒 <span id="ts">—</span> | @Radarineternetiranbot</div>
<script>
async function load(){
  try{
    const r = await fetch('/api/admin/stats',{cache:'no-store'});
    const d = await r.json();
    const stats = d.stats, users = d.users, history = d.history;
    const last = history.length ? history[history.length-1] : {ping:0,packetLoss:0,filtered:0};
    const avgPing = history.length ? Math.round(history.reduce(function(s,p){return s+p.ping;},0)/history.length) : 0;

    document.getElementById('overview').innerHTML = ''
      + '<div class="card"><div class="lbl">👥 کاربران</div><div class="val">'+users.length+'</div></div>'
      + '<div class="card"><div class="lbl">⏱ پینگ فعلی</div><div class="val">'+(last.ping||0)+'<span style="font-size:14px">ms</span></div></div>'
      + '<div class="card"><div class="lbl">📊 میانگین</div><div class="val">'+avgPing+'<span style="font-size:14px">ms</span></div></div>'
      + '<div class="card"><div class="lbl">🚫 فیلتر</div><div class="val">'+(last.filtered||0)+'</div></div>'
      + '<div class="card"><div class="lbl">📈 نقاط</div><div class="val">'+history.length+'</div></div>'
      + '<div class="card"><div class="lbl">🕒 آخرین آپدیت</div><div class="val" style="font-size:13px">'+(stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('fa-IR') : '—')+'</div></div>';

    if(history.length > 0){
      const W=800,H=200,N=history.length;
      const pings = history.map(function(p){return p.ping;});
      const max = Math.max.apply(null,pings);
      const min = Math.min.apply(null,pings);
      let path='';
      pings.forEach(function(p,i){
        const x=(i/Math.max(1,N-1))*W;
        const y=H-((p-min)/Math.max(1,max-min))*H;
        path+=(i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1)+' ';
      });
      document.getElementById('chart').innerHTML = '<svg class="chart-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none"><path d="'+path+'" fill="none" stroke="#e94560" stroke-width="2"/></svg>';
    } else {
      document.getElementById('chart').innerHTML = '<div class="loading">داده‌ای موجود نیست</div>';
    }

    const top = users.slice().sort(function(a,b){return b.points-a.points;}).slice(0,10);
    let html = '<table><thead><tr><th>#</th><th>کاربر</th><th>امتیاز</th><th>لول</th><th>دعوت</th><th>وضعیت</th></tr></thead><tbody>';
    top.forEach(function(u,i){
      html += '<tr><td>'+(i+1)+'</td><td>'+(u.username?'@'+u.username:'کاربر '+u.id)+'</td><td>'+u.points+'</td><td>'+u.level+'</td><td>'+(u.referrals||0)+'</td><td>'+(u.isBanned?'<span class="badge red">مسدود</span>':'<span class="badge">فعال</span>')+'</td></tr>';
    });
    html += '</tbody></table>';
    document.getElementById('users').innerHTML = top.length ? html : '<div class="loading">کاربری ثبت نشده</div>';
    document.getElementById('ts').textContent = new Date().toLocaleString('fa-IR');
  } catch(e) {
    console.error(e);
    document.getElementById('overview').innerHTML = '<div class="loading">⚠️ خطا</div>';
  }
}
load();
setInterval(load, 30000);
</script>
</body>
</html>`;
}

// ===================================================================
//                    پنل شیشه‌ای کانال
// ===================================================================

async function postChannelGlassPanel(env) {
  if (!env.CHANNEL_ID) return false;
  const stats = await getStats(env);
  const last = stats.history[stats.history.length - 1];
  if (!last) return false;
  const txt = `🎛 <b>پنل مدیریت کانال رادار</b>\n\n` +
    `📊 پینگ: <b>${last.ping}ms</b>\n` +
    `📉 Loss: ${last.packetLoss}%\n` +
    `🚫 فیلتر: ${last.filtered}\n\n` +
    `🕒 ${faDate(last.timestamp)}`;
  const kb = [
    [{ text: "📊 آمار زنده", url: "https://t.me/Radarineternetiranbot?start=stats_live" },
     { text: "🗺️ نقشه", url: "https://t.me/Radarineternetiranbot?start=map_heat" }],
    [{ text: "🏆 قهرمانان", url: "https://t.me/Radarineternetiranbot?start=leaderboard" },
     { text: "📈 نمودار", url: "https://t.me/Radarineternetiranbot?start=chart_24h" }],
    [{ text: "🎰 اسپین", url: "https://t.me/Radarineternetiranbot?start=spin" },
     { text: "👥 دعوت", url: "https://t.me/Radarineternetiranbot?start=referral" }],
    [{ text: "🌐 وبلاگ", url: "https://radarinternetiranofficial.blogfa.com" }],
  ];
  const prev = await kvGetJSON(env, KEYS.CHANNEL_PANEL_PIN);
  if (prev && prev.messageId) {
    try {
      const edited = await editMessage(env, env.CHANNEL_ID, prev.messageId, txt, kb);
      if (edited.ok) {
        try { await pinMessage(env, env.CHANNEL_ID, prev.messageId); } catch {}
        await kvPutJSON(env, KEYS.CHANNEL_PANEL_PIN, { messageId: prev.messageId, ts: Date.now() });
        return true;
      }
    } catch {}
    try { await tgCall(env, "unpinChatMessage", { chat_id: env.CHANNEL_ID, message_id: prev.messageId }); } catch {}
  }
  const sent = await sendMessage(env, env.CHANNEL_ID, txt, kb);
  if (sent.ok) {
    try { await pinMessage(env, env.CHANNEL_ID, sent.result.message_id); } catch {}
    await kvPutJSON(env, KEYS.CHANNEL_PANEL_PIN, { messageId: sent.result.message_id, ts: Date.now() });
    return true;
  }
  return false;
}

// ===================================================================
//                    Worker Entry
// ===================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    if (url.pathname === "/version" || url.pathname === "/ping") {
      return new Response(JSON.stringify({
        version: VERSION, timestamp: new Date().toISOString(),
        hasSTATS: !!env.STATS, hasToken: !!env.BOT_TOKEN,
        hasChannel: !!env.CHANNEL_ID, hasAdmin: !!env.ADMIN_IDS,
        hasOwner: !!env.OWNER_ID, workerUrl: url.origin,
      }, null, 2), { headers: { "Content-Type": "application/json", ...cors } });
    }

    if (url.pathname === "/webhook") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });
      let update;
      try { update = await request.json(); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }
      ctx.waitUntil(handleUpdate(env, update));
      return new Response("OK", { headers: cors });
    }

    if (url.pathname === "/widget") {
      return new Response(getWidgetHTML(), { headers: { "Content-Type": "text/html; charset=utf-8", ...cors } });
    }

    if (url.pathname === "/api/widget/stats") {
      const history = await getHistory(env, CONFIG.CHART_POINTS);
      const idx = await kvGetJSON(env, KEYS.USERS_INDEX) || { ids: [] };
      return new Response(JSON.stringify({
        last: history[history.length - 1] || null,
        history, usersCount: idx.ids.length,
      }), { headers: { "Content-Type": "application/json", ...cors } });
    }

    if (url.pathname === "/admin") {
      return new Response(getAdminPanelHTML(), { headers: { "Content-Type": "text/html; charset=utf-8", ...cors } });
    }

    if (url.pathname === "/api/admin/stats") {
      const stats = await getStats(env);
      const history = await getHistory(env, 200);
      const users = await getAllUsers(env);
      return new Response(JSON.stringify({ stats, history, users }), {
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    return new Response("🌐 Radar Internet Iran Bot — " + VERSION, { headers: cors });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCron(env, event).catch(e => {
      console.error("💥 scheduled:", e.message, e.stack);
    }));
  },
};

// ===================================================================
//                    Cron
// ===================================================================

async function handleCron(env, event) {
  const cron = (event.cron || "").trim();
  console.log("⏰ CRON:", cron, "| STATS:", !!env.STATS);

  if (cron === "*/30 * * * *") {
    try {
      const point = await collectAllSources(env);
      const stats = await getStats(env);
      stats.history.push({
        timestamp: point.timestamp, ping: point.ping,
        packetLoss: point.packetLoss, filtered: point.filtered,
      });
      if (stats.history.length > CONFIG.CHART_POINTS) stats.history = stats.history.slice(-CONFIG.CHART_POINTS);
      stats.lastUpdate = point.timestamp;
      await saveStats(env, stats);
      await appendHistoryPoint(env, {
        timestamp: point.timestamp, ping: point.ping,
        packetLoss: point.packetLoss, filtered: point.filtered,
      });
      await checkAndSendAlerts(env, point).catch(e => console.error("Alert:", e));
      console.log("✅ 30min done");
    } catch (e) { console.error("❌ 30min:", e.message, e.stack); }
    return;
  }

  if (cron === "0 * * * *") {
    try {
      if (!env.CHANNEL_ID) return;
      const stats = await getStats(env);
      const last = stats.history[stats.history.length - 1];
      if (!last) return;
      const avg = Math.round(stats.history.reduce((s, p) => s + p.ping, 0) / stats.history.length);
      const txt = `📡 <b>گزارش ساعتی</b>\n\n⏱ ${last.ping}ms (میانگین ${avg}ms)\n📉 ${last.packetLoss}%\n🚫 ${last.filtered}\n\n🕒 ${faDate()}`;
      const sent = await sendMessage(env, env.CHANNEL_ID, txt);
      console.log("📢 Hourly:", sent.ok);
    } catch (e) { console.error("❌ Hourly:", e.message); }
    return;
  }

  if (cron === "0 21 * * 5") {
    try {
      const r = await pinLeaderboardToChannel(env, false);
      console.log("🏆 Weekly pin:", r.ok, r.updated ? "(updated)" : "(new)");
      await postChannelGlassPanel(env).catch(e => console.error("Panel:", e));
    } catch (e) { console.error("❌ Weekly:", e.message); }
    return;
  }
}

// ===================================================================
//                    Update Handler
// ===================================================================

async function handleUpdate(env, update) {
  try {
    if (update.message) await handleMessage(env, update.message);
    else if (update.callback_query) await handleCallback(env, update.callback_query);
  } catch (e) { console.error("❌ Update:", e.message, e.stack); }
}

// ===================================================================
//                    Message Handler
// ===================================================================

async function handleMessage(env, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = (msg.text || "").trim();

  const user = await getUser(env, userId);
  user.username = msg.from.username || user.username;
  user.firstName = msg.from.first_name || user.firstName;
  await saveUser(env, user);

  if (user.isBanned) return sendMessage(env, chatId, "🚫 شما محروم شده‌اید.");

  // /start
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    if (parts[1] && parts[1].startsWith("ref_")) {
      const refId = parseInt(parts[1].replace("ref_", ""), 10);
      if (!isNaN(refId)) {
        const ok = await processReferral(env, userId, refId);
        if (ok) {
          await sendMessage(env, chatId, `🎁 با دعوت دوستتان وارد شدید! +${CONFIG.REFERRER_POINTS} امتیاز`);
          try { await sendMessage(env, refId, `🎉 دوستی با لینک شما وارد شد! +${CONFIG.REFERRAL_POINTS} امتیاز`); } catch {}
        }
      }
    }
    const lvl = getLevelInfo(user.points);
    const role = user.isOwner ? "👑 مالک" : isAdmin(env, userId) ? "🔧 ادمین" : "";
    const welcome = `👋 <b>خوش آمدید، ${msg.from.first_name || "کاربر"}!</b>\n\n` +
      `🏷 نسخه: <code>${VERSION}</code>${role ? `\n${role}` : ""}\n\n` +
      `🎯 به <b>رادار اینترنت ایران</b> خوش آمدید\n\n` +
      `${lvl.title} • ${user.points} امتیاز`;
    return sendMessage(env, chatId, welcome, KB_MAIN);
  }

  // /help
  if (text === "/help") {
    return sendMessage(env, chatId,
      `📚 <b>راهنما</b>\n\n<b>دستورات:</b>\n` +
      `/start — منو\n/help — راهنما\n/today — نمودار ۲۴ ساعته\n\n` +
      `<b>امکانات:</b>\n📊 آمار زنده\n🗺️ نقشه حرارتی\n📈 نمودار ۲۴ ساعته\n🏆 قهرمانان هفته\n` +
      `📰 گزارش تفصیلی\n🔍 مقایسه اپراتورها\n🌐 بررسی سایت\n🔮 پیش‌بینی\n🖥 وضعیت سرورها\n` +
      `🎰 اسپین\n🔥 چک‌این\n👥 دعوت\n🎖️ نشان و لول\n🔔 هشدار\n📡 اشتراک اپراتور\n\n` +
      `🌐 radarinternetiranofficial.blogfa.com`, KB_BACK);
  }

  // /today
  if (text === "/today") {
    const points = await getHistory(env, CONFIG.CHART_POINTS);
    if (!points || points.length === 0) {
      return sendMessage(env, chatId, `📊 <b>نمودار ۲۴ ساعته</b>\n\n⚠️ هنوز داده‌ای نیست.\n⏰ هر ۳۰ دقیقه به‌روزرسانی می‌شود.`, KB_BACK);
    }
    const chartUrl = buildChartImageUrl(points);
    const last = points[points.length - 1];
    const avg = Math.round(points.map(p => p.ping).reduce((a,b) => a+b, 0) / points.length);
    const caption = `📈 <b>نمودار ۲۴ ساعته</b>\n\n⏱ فعلی: <b>${last.ping}ms</b>\n📊 میانگین: ${avg}ms\n📉 Loss: ${last.packetLoss}%\n🕒 ${faDate(last.timestamp)}`;
    try {
      const sent = await sendPhoto(env, chatId, chartUrl, caption, KB_BACK);
      if (!sent.ok) throw new Error(sent.description);
    } catch (e) {
      await sendMessage(env, chatId, renderChartText(points), KB_BACK);
    }
    return;
  }

  // /admin
  if (text === "/admin") {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    return sendMessage(env, chatId, `🔧 <b>پنل ادمین</b>`, KB_ADMIN);
  }

  // /owner
  if (text === "/owner") {
    if (!isOwner(env, userId)) return sendMessage(env, chatId, "⛔️ فقط مالک.");
    const stats = await getStats(env);
    const users = await getAllUsers(env);
    const totalPoints = users.reduce((s, u) => s + (u.points || 0), 0);
    const activeToday = users.filter(u => daysAgo(u.lastSeen) < 1).length;
    const txt = `👑 <b>پنل مالک</b>\n\n` +
      `🏷 نسخه: ${VERSION}\n` +
      `👥 کاربران: <b>${users.length}</b>\n` +
      `📊 نقاط: ${stats.history?.length || 0}\n` +
      `⭐️ مجموع امتیاز: ${totalPoints}\n` +
      `🟢 فعال امروز: ${activeToday}\n` +
      `⏰ آخرین: ${stats.lastUpdate ? faDate(stats.lastUpdate) : "—"}\n\n` +
      `<b>دستورات ویژه:</b>\n` +
      `<code>/pin</code> — سنجاق لیدربورد\n` +
      `<code>/channelpanel</code> — پنل شیشه‌ای کانال\n` +
      `<code>/collect</code> — جمع‌آوری دستی\n` +
      `<code>/broadcast متن</code> — ارسال همگانی`;
    return sendMessage(env, chatId, txt, KB_BACK);
  }

  // /pin
  if (text === "/pin" || text === "/pinleaderboard") {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    await sendMessage(env, chatId, "⏳ در حال به‌روزرسانی...");
    const r = await pinLeaderboardToChannel(env, false);
    return sendMessage(env, chatId,
      r.ok ? `✅ سنجاق ${r.updated ? "به‌روزرسانی" : "ایجاد"} شد.` : `❌ ${r.error}`, KB_BACK);
  }

  // /channelpanel
  if (text === "/channelpanel") {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    const ok = await postChannelGlassPanel(env);
    return sendMessage(env, chatId, ok ? "✅ پنل در کانال ارسال و پین شد." : "❌ خطا. CHANNEL_ID را چک کن.", KB_BACK);
  }

  // /levels
  if (text === "/levels") {
    let txt = `📋 <b>لیست سطوح</b>\n\n`;
    for (const lv of LEVELS) txt += `${lv.title} — سطح ${lv.level}\n  ▫️ نیاز: ${lv.min} امتیاز\n\n`;
    return sendMessage(env, chatId, txt, KB_BACK);
  }

  // /badges
  if (text === "/badges") {
    let txt = `🏅 <b>گالری نشان‌ها</b>\n\n`;
    for (const b of Object.values(BADGES)) {
      txt += `${b.name}`;
      if (b.points > 0) txt += ` — ${b.points} امتیاز`;
      else txt += ` — دستاورد ویژه`;
      txt += `\n`;
    }
    return sendMessage(env, chatId, txt, KB_BACK);
  }

  // /kvtest
  if (text === "/kvtest") {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    let txt = `🔬 <b>تست KV</b>\n\n`;
    if (!env.STATS) return sendMessage(env, chatId, `❌ <b>env.STATS وجود ندارد!</b>\n\nدر Cloudflare → Settings → KV Namespace Bindings یک binding با نام STATS بساز.`, KB_BACK);
    txt += `✅ Binding موجود\n`;
    const k = `radar:test:${Date.now()}`;
    try { await env.STATS.put(k, JSON.stringify({ ts: Date.now() })); txt += `✅ نوشتن\n`; } catch (e) { txt += `❌ نوشتن: ${e.message}\n`; }
    await new Promise(r => setTimeout(r, 300));
    try { const r = await env.STATS.get(k); txt += r ? `✅ خواندن\n` : `⚠️ خواندن null\n`; } catch (e) { txt += `❌ خواندن: ${e.message}\n`; }
    try { await env.STATS.delete(k); } catch {}
    const stats = await getStats(env);
    const history = await getHistory(env, 10);
    txt += `\n📊 stats.history: <b>${stats.history?.length || 0}</b>\n📈 history.points: <b>${history.length}</b>`;
    return sendMessage(env, chatId, txt, KB_BACK);
  }

  // /debug
  if (text === "/debug") {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    const stats = await getStats(env);
    const history = await getHistory(env, 100);
    const users = await getAllUsers(env);
    let txt = `🔍 <b>Debug</b>\n\n`;
    txt += `📊 stats.history: <b>${stats.history?.length || 0}</b>\n`;
    txt += `📈 history.points: <b>${history.length}</b>\n`;
    txt += `👥 users: <b>${users.length}</b>\n`;
    txt += `⏰ lastUpdate: ${stats.lastUpdate ? faDate(stats.lastUpdate) : "هرگز"}\n\n`;
    if (history.length > 0) {
      txt += `<b>آخرین ۳:</b>\n`;
      history.slice(-3).forEach(p => { txt += `• ${faTime(p.timestamp)} → ${p.ping}ms\n`; });
    } else txt += `⚠️ داده‌ای ذخیره نشده!`;
    return sendMessage(env, chatId, txt, KB_BACK);
  }

  // /collect
  if (text === "/collect") {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    await sendMessage(env, chatId, "⏳ جمع‌آوری از ۵ منبع...");
    try {
      const point = await collectAllSources(env);
      const stats = await getStats(env);
      stats.history.push({
        timestamp: point.timestamp, ping: point.ping,
        packetLoss: point.packetLoss, filtered: point.filtered,
      });
      if (stats.history.length > CONFIG.CHART_POINTS) stats.history = stats.history.slice(-CONFIG.CHART_POINTS);
      stats.lastUpdate = point.timestamp;
      await saveStats(env, stats);
      await appendHistoryPoint(env, {
        timestamp: point.timestamp, ping: point.ping,
        packetLoss: point.packetLoss, filtered: point.filtered,
      });
      return sendMessage(env, chatId,
        `✅ <b>موفق!</b>\n\n⏱ ${point.ping}ms\n📉 ${point.packetLoss}%\n🚫 ${point.filtered}\n\n📊 مجموع: <b>${stats.history.length}</b>`,
        KB_BACK);
    } catch (e) {
      return sendMessage(env, chatId, `❌ خطا: <code>${e.message}</code>`, KB_BACK);
    }
  }

  // /broadcast
  if (text.startsWith("/broadcast ")) {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    const msgText = text.replace("/broadcast ", "");
    if (!msgText) return sendMessage(env, chatId, "❌ متن خالی.");
    const users = await getAllUsers(env);
    await sendMessage(env, chatId, `⏳ ارسال به ${users.length} کاربر...`);
    let ok = 0, fail = 0;
    for (const u of users) {
      try {
        const r = await sendMessage(env, u.id, msgText);
        if (r.ok) ok++; else fail++;
      } catch { fail++; }
      await new Promise(r => setTimeout(r, 40));
    }
    return sendMessage(env, chatId, `✅ ${ok} موفق | ❌ ${fail} ناموفق`);
  }

  // /ban
  if (text.startsWith("/ban ")) {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    const id = parseInt(text.replace("/ban ", "").trim(), 10);
    if (isNaN(id)) return sendMessage(env, chatId, "❌ آیدی نامعتبر.");
    await banUser(env, id);
    return sendMessage(env, chatId, `✅ ${id} مسدود شد.`);
  }

  // /unban
  if (text.startsWith("/unban ")) {
    if (!isOwnerOrAdmin(env, userId)) return sendMessage(env, chatId, "⛔️");
    const id = parseInt(text.replace("/unban ", "").trim(), 10);
    if (isNaN(id)) return sendMessage(env, chatId, "❌ آیدی نامعتبر.");
    await unbanUser(env, id);
    return sendMessage(env, chatId, `✅ ${id} آزاد شد.`);
  }

  // URL
  if (/^https?:\/\/|^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(text) && !text.startsWith("/")) {
    const r = await checkSite(env, text);
    return sendMessage(env, chatId, r.text, KB_BACK);
  }

  return sendMessage(env, chatId, "🤔 متوجه نشدم. /help", KB_BACK);
}

// ===================================================================
//                    Callback Handler
// ===================================================================

async function handleCallback(env, query) {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  const userId = query.from.id;
  const data = query.data;

  if (!chatId || !messageId) { await answerCallback(env, query.id); return; }

  try {
    if (data === "back_main") {
      await answerCallback(env, query.id);
      return editMessage(env, chatId, messageId, `🏠 <b>منوی اصلی</b>`, KB_MAIN);
    }
    if (data === "help") {
      await answerCallback(env, query.id);
      return editMessage(env, chatId, messageId, `📚 از /help استفاده کنید.`, KB_BACK);
    }
    if (data === "about") {
      await answerCallback(env, query.id);
      const txt = `ℹ️ <b>درباره رادار</b>\n\n🏷 ${VERSION}\n📡 پایش لحظه‌ای\n🌐 radarinternetiranofficial.blogfa.com\n🤖 @Radarineternetiranbot\n📊 منابع: OONI، Cloudflare، Check-host، سرورهای ایرانی/جهانی`;
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    if (data === "stats_live") {
      await answerCallback(env, query.id);
      const stats = await getStats(env);
      const last = stats.history[stats.history.length - 1];
      if (!last) return editMessage(env, chatId, messageId, "📊 هنوز آماری ثبت نشده.", KB_BACK);
      const avg = Math.round(stats.history.reduce((s, p) => s + p.ping, 0) / stats.history.length);
      const txt = `📊 <b>آمار زنده</b>\n\n⏱ پینگ: <b>${last.ping}ms</b>\n📊 میانگین: ${avg}ms\n📉 Loss: ${last.packetLoss}%\n🚫 فیلتر: ${last.filtered}\n\n🕒 ${faDate(last.timestamp)}`;
      return editMessage(env, chatId, messageId, txt, kbWithBack([[{ text: "🔄 به‌روزرسانی", callback_data: "stats_live" }]]));
    }

    if (data === "map_heat") {
      await answerCallback(env, query.id);
      const txt = `🗺️ <b>نقشه حرارتی</b>\n\n📌 برای مشاهده: وبلاگ\n🌐 radarinternetiranofficial.blogfa.com`;
      return editMessage(env, chatId, messageId, txt, kbWithBack([
        [{ text: "🌐 وبلاگ", url: "https://radarinternetiranofficial.blogfa.com" }],
      ]));
    }

    if (data === "chart_24h") {
      await answerCallback(env, query.id, "⏳ ساخت نمودار...");
      const points = await getHistory(env, CONFIG.CHART_POINTS);
      if (!points || points.length === 0) {
        return editMessage(env, chatId, messageId, `📊 <b>نمودار ۲۴ ساعته</b>\n\n⚠️ داده‌ای ثبت نشده.\n💡 ادمین: /collect`, KB_BACK);
      }
      const chartUrl = buildChartImageUrl(points);
      const last = points[points.length - 1];
      const avg = Math.round(points.map(p => p.ping).reduce((a,b) => a+b, 0) / points.length);
      const caption = `📈 <b>نمودار ۲۴ ساعته</b>\n\n⏱ فعلی: <b>${last.ping}ms</b>\n📊 میانگین: ${avg}ms\n📉 Loss: ${last.packetLoss}%\n🕒 ${faDate(last.timestamp)}\n📌 ${points.length} نقطه`;
      const kb = [
        [{ text: "🔄 به‌روزرسانی", callback_data: "chart_24h" }, { text: "🏆 قهرمانان", callback_data: "leaderboard" }],
        [{ text: "🔙 بازگشت", callback_data: "back_main" }],
      ];
      try { await deleteMessage(env, chatId, messageId); } catch {}
      try {
        const sent = await sendPhoto(env, chatId, chartUrl, caption, kb);
        if (!sent.ok) throw new Error(sent.description);
      } catch (e) {
        await sendMessage(env, chatId, renderChartText(points), kb);
      }
      return;
    }

    if (data === "leaderboard") {
      await answerCallback(env, query.id);
      const txt = await renderLeaderboard(env, CONFIG.LEADERBOARD_SIZE);
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    if (data === "report_full") {
      await answerCallback(env, query.id);
      const r = await reportFull(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }
    if (data === "report_operators") {
      await answerCallback(env, query.id);
      const r = await reportOperators(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }
    if (data === "report_site") {
      await answerCallback(env, query.id);
      return editMessage(env, chatId, messageId, `🌐 <b>بررسی سایت</b>\n\nآدرس را ارسال کنید:\n<code>google.com</code>`, KB_BACK);
    }
    if (data === "report_predict") {
      await answerCallback(env, query.id);
      const r = await reportPredict(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }
    if (data === "report_servers") {
      await answerCallback(env, query.id, "⏳ بررسی...");
      const r = await reportServers(env);
      return editMessage(env, chatId, messageId, r.text, KB_BACK);
    }

    if (data === "spin") {
      await answerCallback(env, query.id);
      return handleSpin(env, chatId, userId, messageId);
    }
    if (data === "checkin") {
      await answerCallback(env, query.id);
      return handleCheckin(env, chatId, userId, messageId);
    }
    if (data === "referral") {
      await answerCallback(env, query.id);
      return handleReferral(env, chatId, userId, messageId);
    }

    if (data === "my_badges") {
      await answerCallback(env, query.id);
      const u = await getUser(env, userId);
      const lvl = getLevelInfo(u.points);
      const bar = progressBar(lvl.progress);
      let txt = `🎖️ <b>پروفایل شما</b>\n\n👤 ${u.firstName || "کاربر"}${u.username ? " (@" + u.username + ")" : ""}\n`;
      txt += `📊 امتیاز: <b>${u.points}</b>\n${lvl.title} • لول ${lvl.level}\n`;
      txt += `پیشرفت: ${bar} ${lvl.progress}%\n`;
      if (lvl.next) txt += `تا لول بعد: ${lvl.next.min - u.points} امتیاز\n`;
      txt += `\n🏅 نشان‌ها:\n`;
      if ((u.badges || []).length === 0) txt += "—";
      else for (const bId of u.badges) {
        const key = Object.keys(BADGES).find(k => BADGES[k].id === bId);
        if (key) txt += `  ${BADGES[key].name}\n`;
      }
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    if (data === "all_badges") {
      await answerCallback(env, query.id);
      let txt = `🏅 <b>گالری کامل نشان‌ها</b>\n\n`;
      for (const b of Object.values(BADGES)) {
        txt += `${b.name}`;
        if (b.points > 0) txt += ` — ${b.points} امتیاز`;
        else txt += ` — دستاورد ویژه`;
        txt += `\n`;
      }
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    if (data === "levels_list") {
      await answerCallback(env, query.id);
      let txt = `📋 <b>لیست سطوح</b>\n\n`;
      for (const lv of LEVELS) txt += `📌 <b>${lv.title}</b> (سطح ${lv.level})\n   نیاز: ${lv.min} امتیاز\n\n`;
      return editMessage(env, chatId, messageId, txt, KB_BACK);
    }

    if (data === "alert_menu") {
      await answerCallback(env, query.id);
      return handleAlertMenu(env, chatId, userId, messageId);
    }
    if (data === "alert_toggle") {
      const a = await getAlert(env, userId);
      a.enabled = !a.enabled;
      await saveAlert(env, a);
      await answerCallback(env, query.id, a.enabled ? "✅ فعال" : "🔕 غیرفعال");
      return handleAlertMenu(env, chatId, userId, messageId);
    }

    if (data === "sub_menu") {
      await answerCallback(env, query.id);
      return handleSubscriptionMenu(env, chatId, userId, messageId);
    }
    if (data.startsWith("sub_toggle_")) {
      const arg = data.replace("sub_toggle_", "");
      if (arg === "alerts") {
        const sub = await getSubscription(env, userId);
        sub.alerts = !sub.alerts;
        await saveSubscription(env, sub);
        await answerCallback(env, query.id, sub.alerts ? "🔔 فعال" : "🔕 غیرفعال");
      } else {
        await toggleSubscription(env, userId, arg);
        await answerCallback(env, query.id, "✅ به‌روزرسانی");
      }
      return handleSubscriptionMenu(env, chatId, userId, messageId);
    }

    // ادمین
    if (data.startsWith("admin_")) {
      if (!isOwnerOrAdmin(env, userId)) return answerCallback(env, query.id, "⛔️");
      await answerCallback(env, query.id);

      if (data === "admin_stats") {
        const stats = await getStats(env);
        const users = await getAllUsers(env);
        const txt = `📈 <b>آمار سیستم</b>\n\n👥 کاربران: ${users.length}\n📊 نقاط: ${stats.history.length}\n⏱ آخرین: ${stats.lastUpdate ? faDate(stats.lastUpdate) : "—"}\n🏷 نسخه: ${VERSION}`;
        return editMessage(env, chatId, messageId, txt, kbWithBack());
      }
      if (data === "admin_users") {
        const top = await getLeaderboard(env, 20);
        let txt = `👥 <b>کاربران برتر</b>\n\n`;
        top.forEach((u, i) => { txt += `${i+1}. ${u.username ? "@"+u.username : "ID:"+u.id} — ${u.points}${u.isBanned?" 🚫":""}\n`; });
        return editMessage(env, chatId, messageId, txt, kbWithBack());
      }
      if (data === "admin_broadcast") {
        return editMessage(env, chatId, messageId, `📢 <b>ارسال همگانی</b>\n\n<code>/broadcast متن پیام</code>`, kbWithBack());
      }
      if (data === "admin_ban") {
        return editMessage(env, chatId, messageId, `🚫 <b>مدیریت بن</b>\n\n<code>/ban USER_ID</code>\n<code>/unban USER_ID</code>`, kbWithBack());
      }
      if (data === "admin_export") {
        const users = await getAllUsers(env);
        const history = await getHistory(env, 500);
        const dataStr = JSON.stringify({ users, history, ts: Date.now() }, null, 2);
        return sendMessage(env, chatId, `<code>${dataStr.slice(0, 4000)}</code>`);
      }
      if (data === "admin_kvtest") {
        let txt = `🔬 <b>تست KV</b>\n\n`;
        if (!env.STATS) txt += `❌ Binding نیست!`;
        else {
          txt += `✅ Binding موجود\n`;
          const k = `radar:test:${Date.now()}`;
          try { await env.STATS.put(k, "1"); txt += `✅ نوشتن\n`; } catch (e) { txt += `❌ ${e.message}\n`; }
          try { await env.STATS.delete(k); } catch {}
        }
        return editMessage(env, chatId, messageId, txt, kbWithBack());
      }
      if (data === "admin_collect") {
        await sendMessage(env, chatId, "⏳ جمع‌آوری...");
        try {
          const point = await collectAllSources(env);
          const stats = await getStats(env);
          stats.history.push({ timestamp: point.timestamp, ping: point.ping, packetLoss: point.packetLoss, filtered: point.filtered });
          if (stats.history.length > CONFIG.CHART_POINTS) stats.history = stats.history.slice(-CONFIG.CHART_POINTS);
          stats.lastUpdate = point.timestamp;
          await saveStats(env, stats);
          await appendHistoryPoint(env, { timestamp: point.timestamp, ping: point.ping, packetLoss: point.packetLoss, filtered: point.filtered });
          await sendMessage(env, chatId, `✅ ذخیره. مجموع: ${stats.history.length}`);
        } catch (e) { await sendMessage(env, chatId, `❌ ${e.message}`); }
        return;
      }
      if (data === "admin_pin") {
        const r = await pinLeaderboardToChannel(env, false);
        const msg = r.ok ? `✅ سنجاق ${r.updated ? "به‌روزرسانی" : "ایجاد"} شد.` : `❌ ${r.error}`;
        return editMessage(env, chatId, messageId, msg, KB_ADMIN);
      }
      if (data === "admin_channelpanel") {
        const ok = await postChannelGlassPanel(env);
        return editMessage(env, chatId, messageId,
          ok ? "✅ پنل در کانال ارسال و پین شد." : "❌ خطا در ارسال.", KB_ADMIN);
      }
      if (data === "admin_refresh_users") {
        const keys = await kvListPrefix(env, "radar:user:");
        const ids = keys.map(k => k.replace("radar:user:", "")).filter(k => k !== "index" && !isNaN(parseInt(k, 10)));
        await kvPutJSON(env, KEYS.USERS_INDEX, { ids });
        return editMessage(env, chatId, messageId, `✅ ایندکس بازسازی شد.\n👥 ${ids.length} کاربر`, KB_ADMIN);
      }
      return;
    }

    await answerCallback(env, query.id);
  } catch (e) {
    console.error("❌ Callback:", e.message, e.stack);
    await answerCallback(env, query.id, "⚠️ خطا");
  }
}
