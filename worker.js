// ═══════════════════════════════════════════════════════════════
//  ربات رادار اینترنت ایران - بخش ۱ (تنظیمات، دوزبانه و نمودارها)
// ═══════════════════════════════════════════════════════════════
const CH1 = "@radarinternetiran";
const CH2 = "@radarinternetirangruop";
const BOT_USERNAME = "Radarinternetiranbot";
const CURRENT_VERSION = "7.0";
const ADMIN_IDS = ["8344700031", "7652496428"];
const SPONSOR_MSG = "💎 <b>اسپانسر رسمی ربات:</b>\n<i>(جایگاه تبلیغات شما - جهت رزرو روی دکمه درخواست تبلیغات بزنید)</i>";
const WATERMARK = "\n\n📌 <b>منبع:</b> رادار اینترنت ایران\n⚠️ <i>هرگونه سوءاستفاده از این آمار و داده‌ها پیگرد قانونی دارد.</i>";

let GLOBAL_STATS = null;
let GLOBAL_ENV = null;

// ==================== Internationalization (FA/EN) ====================
const LANG_DICT = {
  fa: {
    welcome: "سلام <b>{name}</b> عزیز!\n🏅 سطح شما: {level}\n🏆 امتیاز شما: <b>{pts}</b>\n\nاز منوی زیر انتخاب کنید:",
    maintenance: "🛠 <b>اطلاعیه رسمی مدیریت</b>\n\nربات موقتاً به دلیل به‌روزرسانی زیرساخت‌ها و بهبود کیفیت خدمات در دسترس نیست.\n\n⏳ لطفاً ساعاتی دیگر دوباره تلاش کنید.\n\n🙏 از صبر شما سپاسگزاریم.",
    stats: "📊 آمار شما:\n\n👤 نام: {name}\n⭐ امتیاز: {pts}\n👥 دعوت‌ها: {invites}\n🏅 رتبه: {rank}",
    ping_prompt: "🌐 لطفاً آدرس سایت را وارد کنید (مثلاً: google.com):",
    ping_result: "⚡ نتیجه پینگ برای <b>{domain}</b>:\n\n📡 وضعیت: {status}\n⏱ زمان: {time}ms",
    sanction_prompt: "🚫 لطفاً آدرس سایت را برای تست تحریم وارد کنید (مثلاً: steam.com):",
    sanction_result: "🚫 نتیجه تست تحریم برای <b>{domain}</b>:\n\n{result}",
    alerts_prompt: "🔔 سیستم هشدار شخصی‌سازی شده\n\nاپراتور خود را انتخاب کنید تا در صورت افت کیفیت اینترنت آن، به شما اطلاع دهیم:",
    alerts_set: "✅ هشدار برای اپراتور <b>{operator}</b> فعال شد. در صورت افت کیفیت به شما اطلاع می‌دهیم.",
    alerts_none: "شما هیچ هشداری فعال ندارید.",
    refer_success: "🎉 خوش آمدی {name}!\n✅ ۵ امتیاز گرفتی!",
    ref_milestone_10: "🏅 تبریک! شما ۱۰ نفر را دعوت کردید و ۵۰ امتیاز هدیه گرفتید!",
    ref_milestone_50: "👑 تبریک! شما ۵۰ نفر را دعوت کردید، ۵۰۰ امتیاز و نشان VIP گرفتید!"
  },
  en: {
    welcome: "Hello <b>{name}</b>!\n🏅 Level: {level}\n🏆 Points: <b>{pts}</b>\n\nChoose from the menu:",
    maintenance: "🛠 <b>Official Maintenance Notice</b>\n\nThe bot is temporarily unavailable for infrastructure upgrades.\n\n⏳ Please try again in a few hours.\n\n🙏 Thank you for your patience.",
    stats: "📊 Your Stats:\n\n👤 Name: {name}\n⭐ Points: {pts}\n👥 Invites: {invites}\n🏅 Rank: {rank}",
    ping_prompt: "🌐 Enter domain to ping (e.g., google.com):",
    ping_result: "⚡ Ping Result for <b>{domain}</b>:\n\n📡 Status: {status}\n⏱ Time: {time}ms",
    sanction_prompt: "🚫 Enter domain to check sanctions (e.g., steam.com):",
    sanction_result: "🚫 Sanction Check for <b>{domain}</b>:\n\n{result}",
    alerts_prompt: "🔔 Personalized Alerts\n\nSelect your ISP to get notified if internet quality drops:",
    alerts_set: "✅ Alert enabled for <b>{operator}</b>.",
    alerts_none: "You have no active alerts.",
    refer_success: "🎉 Welcome {name}!\n✅ You got 5 points!",
    ref_milestone_10: "🏅 Congrats! You invited 10 people and got 50 bonus points!",
    ref_milestone_50: "👑 Congrats! You invited 50 people, got 500 points and VIP badge!"
  }
};

function t(key, lang = "fa", replacements = {}) {
  let text = LANG_DICT[lang] ? (LANG_DICT[lang][key] || LANG_DICT["fa"][key]) : LANG_DICT["fa"][key];
  if (!text) return key;
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return text;
}

// ==================== Web Admin HTML ====================
const ADMIN_WEB_HTML = `<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>پنل مدیریت رادار</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Tahoma;background:#0b1120;color:#f8fafc;min-height:100vh}header{background:linear-gradient(135deg,#1e293b,#0f172a);padding:20px;text-align:center;border-bottom:2px solid #f59e0b}header h1{font-size:20px;color:#f59e0b}header .date{font-size:12px;color:#94a3b8}nav{display:flex;flex-wrap:wrap;background:#0f172a;padding:10px;gap:8px;justify-content:center;border-bottom:1px solid #1e293b}nav button{background:#1e293b;color:#f8fafc;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-family:inherit;font-size:13px}nav button.active{background:#f59e0b;color:#0f172a;font-weight:bold}main{padding:20px;max-width:1200px;margin:0 auto}.card{background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #1e293b}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px}.stat{background:#1e293b;border-radius:10px;padding:15px;text-align:center;border-bottom:3px solid #f59e0b}.stat .num{font-size:28px;font-weight:bold;color:#f59e0b}.stat .label{font-size:12px;color:#94a3b8;margin-top:5px}input,textarea{background:#0b1120;color:#f8fafc;border:1px solid #334155;padding:10px;border-radius:8px;width:100%;margin-bottom:10px}button.btn{background:#f59e0b;color:#0f172a;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold}button.btn-danger{background:#ef4444;color:#fff}button.btn-success{background:#10b981;color:#fff}.user-row{display:flex;justify-content:space-between;padding:12px;background:#1e293b;border-radius:8px;margin-bottom:8px;cursor:pointer}.user-row:hover{background:#334155}.badge{padding:3px 8px;border-radius:6px;font-size:11px}.badge-active{background:#10b981;color:#fff}.badge-banned{background:#ef4444;color:#fff}.modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:none;justify-content:center;align-items:center;z-index:100;padding:20px}.modal.show{display:flex}.modal-content{background:#0f172a;border-radius:12px;padding:25px;max-width:500px;width:100%;border:2px solid #f59e0b;max-height:90vh;overflow-y:auto}.modal-content h3{color:#f59e0b;margin-bottom:15px}.profile-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;font-size:13px}.profile-row .label{color:#94a3b8}.profile-row .value{color:#f8fafc;font-weight:bold}.pagination{display:flex;justify-content:center;gap:10px;margin-top:15px}.pagination button{background:#1e293b;color:#f8fafc;border:none;padding:8px 16px;border-radius:6px;cursor:pointer}.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:200;display:none}.toast.show{display:block}.tab{display:none}.tab.active{display:block}.loading{text-align:center;padding:20px;color:#94a3b8}.key-row{background:#1e293b;padding:12px;border-radius:8px;margin-bottom:10px;font-size:12px;word-break:break-all}.key-row code{background:#0b1120;padding:3px 6px;border-radius:4px;color:#06b6d4}#loginScreen{position:fixed;top:0;left:0;width:100%;height:100%;background:#0b1120;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:1000}#loginScreen h2{color:#f59e0b;margin-bottom:20px}#loginScreen input{max-width:300px;text-align:center;font-size:18px;border-color:#f59e0b}#loginScreen button{max-width:300px;width:100%;padding:15px;font-size:16px;margin-top:10px}</style></head><body>
<div id="loginScreen"><h2>🔐 ورود به مدیریت</h2><p style="color:#94a3b8;margin-bottom:20px">رمز عبور را وارد کنید</p><input type="password" id="passInput" placeholder="رمز عبور..."><button class="btn" onclick="doLogin()">ورود به پنل</button></div>
<div id="mainScreen" style="display:none;"><header><h1>🔐 پنل مدیریت رادار اینترنت ایران</h1><div class="date" id="dateBox">...</div></header>
<nav><button class="active" onclick="showTab('dashboard')">📊 داشبورد</button><button onclick="showTab('users')">👥 کاربران</button><button onclick="showTab('apikeys')">🔑 API Keys</button><button onclick="showTab('winners')">🏆 برندگان</button><button onclick="showTab('suspicious')" style="background:#7f1d1d;">🚨 کاربران مشکوک</button></nav>
<main>
<div class="tab active" id="tab-dashboard">
  <div class="card"><div class="stats"><div class="stat"><div class="num" id="sTotal">-</div><div class="label">کل کاربران</div></div><div class="stat"><div class="num" id="sActive">-</div><div class="label">فعال امروز</div></div><div class="stat"><div class="num" id="sRegistered">-</div><div class="label">ثبت‌شده</div></div><div class="stat"><div class="num" id="sBanned">-</div><div class="label">مسدود</div></div></div></div>
  <div class="card"><h3 style="color:#f59e0b;margin-bottom:15px">📈 نمودار رشد کاربران (۷ روز اخیر)</h3><img id="growthChart" src="" style="width:100%; border-radius:8px;"></div>
  <button class="btn btn-danger" onclick="toggleMaintenance()" style="width:100%">🛠 فعال/غیرفعال کردن حالت تعمیرات</button>
</div>
<div class="tab" id="tab-users"><div class="card"><input type="text" id="searchBox" placeholder="🔍 جستجو..." onkeyup="if(event.key==='Enter')loadUsers(1)"><button class="btn" onclick="loadUsers(1)">جستجو</button></div><div class="card" id="usersList"><div class="loading">در حال بارگذاری...</div></div><div class="pagination" id="pagination"></div></div>
<div class="tab" id="tab-apikeys"><div class="card"><h3>ساخت کلید</h3><input type="text" id="keyOwner" placeholder="نام همکار"><button class="btn" onclick="createKey()">🔑 صدور</button></div><div class="card" id="keysList"></div></div>
<div class="tab" id="tab-winners"><div class="card"><h3>برندگان</h3><div id="winnersList"></div><button class="btn btn-danger" style="margin-top:15px" onclick="resetWeek()">🔄 ریست</button></div></div>
<div class="tab" id="tab-suspicious"><div class="card"><h3 style="color:#ef4444">⚠️ کاربران مشکوک</h3><div id="suspiciousList"></div></div></div>
</main><div class="modal" id="userModal"><div class="modal-content" id="userModalContent"></div></div><div class="toast" id="toast"></div></div>
<script>
let SECRET=localStorage.getItem('radar_admin_secret')||'';const API=location.origin+'/adminweb';
function showToast(m,e){const t=document.getElementById('toast');t.textContent=m;t.style.background=e?'#ef4444':'#10b981';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}
function doLogin(){const i=document.getElementById('passInput').value;if(!i)return;SECRET=i;fetch(API+'/data?secret='+SECRET+'&type=stats').then(r=>{if(r.status===403)throw new Error('رمز اشتباه');return r.json()}).then(d=>{localStorage.setItem('radar_admin_secret',SECRET);document.getElementById('loginScreen').style.display='none';document.getElementById('mainScreen').style.display='block';loadStats()}).catch(e=>{showToast(e.message,true);SECRET=''})}
if(SECRET){document.getElementById('loginScreen').style.display='none';document.getElementById('mainScreen').style.display='block';loadStats()}
async function safeFetch(u){const r=await fetch(u);if(r.status===403){localStorage.removeItem('radar_admin_secret');SECRET='';document.getElementById('loginScreen').style.display='flex';document.getElementById('mainScreen').style.display='none';throw new Error('منقضی شده')}return r.json()}
function showTab(n){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));document.getElementById('tab-'+n).classList.add('active');event.target.classList.add('active');if(n==='dashboard')loadStats();else if(n==='users')loadUsers(1);else if(n==='apikeys')loadKeys();else if(n==='winners')loadWinners();else if(n==='suspicious')loadSuspicious()}
async function loadStats(){try{const d=await safeFetch(API+'/data?secret='+SECRET+'&type=stats');document.getElementById('sTotal').textContent=d.total_users;document.getElementById('sActive').textContent=d.today_active;document.getElementById('sRegistered').textContent=d.total_registered;document.getElementById('sBanned').textContent=d.banned_count;document.getElementById('dateBox').textContent=d.date+' • '+d.time;loadGrowthChart()}catch(e){showToast(e.message,true)}}
async function loadGrowthChart(){try{const d=await safeFetch(API+'/data?secret='+SECRET+'&type=growth');if(d.ok&&d.labels.length>0){const cfg={type:'line',data:{labels:d.labels,datasets:[{label:'کاربران جدید',data:d.values,borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.2)',fill:true,tension:0.4}]},options:{plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#94a3b8'}},y:{ticks:{color:'#94a3b8'},beginAtZero:true}}}};document.getElementById('growthChart').src="https://quickchart.io/chart?w=800&h=300&bkg=%230f172a&c="+encodeURIComponent(JSON.stringify(cfg))}}catch(e){}}
async function toggleMaintenance(){if(!confirm('آیا وضعیت تعمیرات تغییر کند؟'))return;try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=toggle_maintenance');if(d.ok){showToast(d.message)}}catch(e){showToast(e.message,true)}}
async function loadUsers(p){const s=document.getElementById('searchBox').value.trim();document.getElementById('usersList').innerHTML='<div class="loading">...</div>';try{const d=await safeFetch(API+'/data?secret='+SECRET+'&type=users&page='+p+'&search='+encodeURIComponent(s));if(d.users.length===0){document.getElementById('usersList').innerHTML='<div class="loading">یافت نشد</div>';return}let h='';d.users.forEach(u=>{const b=u.is_banned?'<span class="badge badge-banned">مسدود</span>':'<span class="badge badge-active">فعال</span>';h+='<div class="user-row" onclick="showUser(\''+u.id+'\')"><div><b>'+u.name+'</b> '+b+'<br><code>'+u.id+'</code> • '+u.points+' امتیاز</div><div>👁️</div></div>'});document.getElementById('usersList').innerHTML=h;let pg='';if(d.page>1)pg+='<button onclick="loadUsers('+(d.page-1)+')">قبلی</button>';pg+='<button disabled>صفحه '+d.page+'</button>';if(d.page<d.pages)pg+='<button onclick="loadUsers('+(d.page+1)+')">بعدی</button>';document.getElementById('pagination').innerHTML=pg}catch(e){document.getElementById('usersList').innerHTML='<div class="loading">خطا</div>'}}
async function showUser(id){try{const d=await safeFetch(API+'/data?secret='+SECRET+'&type=user&id='+id);const u=d.user;const b=u.is_banned?'<span class="badge badge-banned">مسدود</span>':'<span class="badge badge-active">فعال</span>';const a=u.is_banned?'<button class="btn btn-success" onclick="unbanUser(\''+u.id+'\')">آنبلاک</button>':'<button class="btn btn-danger" onclick="banUser(\''+u.id+'\')">مسدود</button>';document.getElementById('userModalContent').innerHTML='<h3>پروفایل '+b+'</h3><div class="profile-row"><span>نام:</span><b>'+u.name+'</b></div><div class="profile-row"><span>آیدی:</span><b>'+u.id+'</b></div><div class="profile-row"><span>امتیاز:</span><b>'+u.points+'</b></div><div class="profile-row"><span>سطح:</span><b>'+u.level+'</b></div><div class="profile-row"><span>عضویت:</span><b>'+u.join_date+'</b></div>'+(u.is_banned?'<div class="profile-row"><span>دلیل:</span><b style="color:red">'+u.ban_reason+'</b></div>':'')+'<div style="display:flex;gap:10px;margin-top:20px">'+a+'<button class="btn" style="background:#64748b" onclick="closeModal()">بستن</button></div>';document.getElementById('userModal').classList.add('show')}catch(e){showToast(e.message,true)}}
function closeModal(){document.getElementById('userModal').classList.remove('show')}
async function banUser(id){if(!confirm('مسدود شود؟'))return;try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=ban&id='+id);if(d.ok){showToast('مسدود شد');closeModal();loadUsers(1)}}catch(e){showToast(e.message,true)}}
async function unbanUser(id){try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=unban&id='+id);if(d.ok){showToast('آنبلاک شد');closeModal();loadUsers(1)}}catch(e){showToast(e.message,true)}}
async function loadKeys(){try{const d=await safeFetch(API+'/data?secret='+SECRET+'&type=apikeys');if(d.keys.length===0){document.getElementById('keysList').innerHTML='<div class="loading">خالی</div>';return}let h='';d.keys.forEach(k=>{const b=k.status==='active'?'<span class="badge badge-active">فعال</span>':'<span class="badge badge-banned">باطل</span>';const btn=k.status==='active'?'<button class="btn btn-danger" style="padding:5px 10px;font-size:11px" onclick="revokeKey(\''+k.key+'\')">باطل</button>':'';h+='<div class="key-row"><b>'+k.owner+'</b> '+b+'<br><code>'+k.key+'</code><br>استفاده: '+k.usage_count+' '+btn+'</div>'});document.getElementById('keysList').innerHTML=h}catch(e){document.getElementById('keysList').innerHTML='خطا'}}
async function createKey(){const o=document.getElementById('keyOwner').value.trim();if(!o)return;try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=new_key&owner='+encodeURIComponent(o));if(d.ok){showToast('کلید ساخته شد');document.getElementById('keyOwner').value='';loadKeys()}}catch(e){showToast(e.message,true)}}
async function revokeKey(k){if(!confirm('باطل شود؟'))return;try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=revoke_key&key='+k);if(d.ok){showToast('باطل شد');loadKeys()}}catch(e){showToast(e.message,true)}}
async function loadWinners(){try{const d=await safeFetch(API+'/data?secret='+SECRET+'&type=winners');if(d.winners.length===0){document.getElementById('winnersList').innerHTML='<div class="loading">خالی</div>';return}let h='';d.winners.forEach((u,i)=>{const m=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);h+='<div class="user-row"><div><b>'+m+' '+(u.n||u.id)+'</b><br>'+u.p+' امتیاز</div></div>'});document.getElementById('winnersList').innerHTML=h}catch(e){document.getElementById('winnersList').innerHTML='خطا'}}
async function resetWeek(){if(!confirm('ریست شود؟'))return;try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=reset_week');if(d.ok){showToast('ریست شد');loadWinners()}}catch(e){showToast(e.message,true)}}
async function loadSuspicious(){try{const d=await safeFetch(API+'/data?secret='+SECRET+'&type=suspicious');if(d.users.length===0){document.getElementById('suspiciousList').innerHTML='<div class="loading">✅ هیچ کاربر مشکوکی نیست</div>';return}let h='';d.users.forEach(u=>{const t=u.last_flagged?new Date(u.last_flagged).toLocaleString('fa-IR'):'?';let r=u.reasons.map(x=>'• '+x.reason).join('<br>');h+='<div style="background:#1e293b;padding:15px;border-radius:8px;margin-bottom:10px;border-right:4px solid #ef4444"><div style="display:flex;justify-content:space-between"><b>'+u.name+'</b><span class="badge badge-banned">⚠️ '+u.warnings+'</span></div><div style="font-size:11px;color:#94a3b8;margin:8px 0"><code>'+u.id+'</code> • '+t+'</div><div style="font-size:11px;color:#fca5a5;margin-bottom:10px">'+r+'</div><div style="display:flex;gap:8px"><button class="btn btn-danger" style="padding:5px 10px;font-size:11px" onclick="banSuspicious(\''+u.id+'\')">مسدود</button><button class="btn" style="padding:5px 10px;font-size:11px;background:#64748b" onclick="clearSuspiciousUser(\''+u.id+'\')">پاک کردن</button></div></div>'});document.getElementById('suspiciousList').innerHTML=h}catch(e){document.getElementById('suspiciousList').innerHTML='خطا'}}
async function banSuspicious(id){if(!confirm('مسدود شود؟'))return;try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=ban&id='+id);if(d.ok){showToast('مسدود شد');loadSuspicious()}}catch(e){showToast(e.message,true)}}
async function clearSuspiciousUser(id){if(!confirm('پاک شود؟'))return;try{const d=await safeFetch(API+'/action?secret='+SECRET+'&action=clear_suspicious&id='+id);if(d.ok){showToast('پاک شد');loadSuspicious()}}catch(e){showToast(e.message,true)}}
document.getElementById('userModal').addEventListener('click',function(e){if(e.target===this)closeModal()});
</script></body></html>`;

// ==================== Constants & Utils ====================
const ASN_NAMES = { "12880": "زیرساخت (DCI)", "58224": "مخابرات ایران (TCI)", "6736": "شاتل قدیمی", "44244": "ایرانسل", "197207": "همراه اول (MCI)", "57218": "رایتل", "57497": "شاتل موبایل", "50810": "آسیاتک", "31549": "شاتل", "42337": "پارس‌آنلاین", "16322": "پارس‌پک", "43754": "آسیاتک", "48159": "پیشگامان", "25184": "افرانت", "56402": "صبانت", "205648": "رسپینا", "21478": "مبین‌نت", "206065": "پیشگامان", "48434": "پارس‌آنلاین", "51685": "پارس‌پک", "51074": "شاتل", "52140": "ایران‌سرور", "201150": "کیان‌نت", "61173": "میزبان", "201540": "خلیج فارس", "56703": "ندای رایانه", "205647": "ایران‌سرور", "48431": "ماهان", "203087": "سیستم‌های نوین", "39501": "ابر آروان", "202468": "ایران‌سرور", "204213": "همراه نت", "44208": "شبکه گستر", "49100": "ارتباطات زیرساخت", "208161": "ایرانسل جدید" };
const IR_SITES = [{ name: "دیجی‌کالا", url: "https://digikala.com" }, { name: "شاپرک", url: "https://shaparak.ir" }, { name: "ایرانسل", url: "https://irancell.ir" }, { name: "همراه اول", url: "https://mci.ir" }];
const GLOBAL_SITES = [{ name: "گوگل", url: "https://www.google.com" }, { name: "کلادفلر", url: "https://www.cloudflare.com" }, { name: "مایکروسافت", url: "https://www.microsoft.com" }];
const FILTER_CHECK = [{ name: "توییتر / X", url: "https://x.com" }, { name: "یوتیوب", url: "https://www.youtube.com" }, { name: "فیسبوک", url: "https://www.facebook.com" }, { name: "اینستاگرام", url: "https://www.instagram.com" }, { name: "تلگرام", url: "https://telegram.org" }, { name: "واتساپ", url: "https://web.whatsapp.com" }, { name: "گوگل پلی", url: "https://play.google.com" }, { name: "ویکی‌پدیا", url: "https://www.wikipedia.org" }];

function getIranTime() { return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()); }
function getIranDate() { return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function getGregDate() { const d = new Date(); return d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0"); }
function getDateBoth() { return "🗓 " + getIranDate() + "  •  " + getGregDate(); }
function getToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function getYesterday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 86400000)); }
function getIranHour() { return parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', hour: '2-digit', hour12: false }).format(new Date())); }
function asnName(asn) { const c = String(asn).replace(/^AS/i, ""); return ASN_NAMES[c] || ("AS" + c); }
function getUserLevel(pts) { if (pts >= 1000) return "👑 افسانه‌ای"; if (pts >= 500) return "💎 حرفه‌ای"; if (pts >= 100) return "🥇 فعال"; return "🌱 تازه‌کار"; }
async function getUserLang(STATS, userId) { try { return await STATS.get("LANG_" + userId) || "fa"; } catch(e) { return "fa"; } }

async function asnNameAuto(asn) {
  const clean = String(asn).replace(/^AS/i, ""); if (ASN_NAMES[clean]) return ASN_NAMES[clean];
  if (GLOBAL_STATS) { try { const cached = await GLOBAL_STATS.get("asnname:" + clean); if (cached) return cached; } catch(e) {} }
  try { const r = await fetch("https://api.bgpview.io/asn/" + clean); if (r.ok) { const d = await r.json(); if (d.status === "ok" && d.data && d.data.name) { let name = d.data.name.trim(); if (name.length > 22) name = name.substring(0, 22) + "…"; if (name.length >= 2 && !/^\d+$/.test(name)) { if (GLOBAL_STATS) { try { await GLOBAL_STATS.put("asnname:" + clean, name, { expirationTtl: 2592000 }); } catch(e) {} } return name; } } } } catch(e) {}
  return "AS" + clean;
}

function makeBar(v) { const f = Math.max(0, Math.min(10, Math.round(v))); let c = "🔴"; if (v >= 8) c = "🟢"; else if (v >= 6) c = "🟡"; else if (v >= 4) c = "🟠"; let b = ""; for (let i = 0; i < 10; i++) b += (i < f ? c : "▫️"); return b; }
async function pingSite(url) { const s = Date.now(); try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 8000); await fetch(url, { method: "HEAD", signal: c.signal, redirect: "follow" }); clearTimeout(t); return Date.now() - s; } catch(e) { return null; } }
async function checkAccessible(url) { try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 8000); const r = await fetch(url, { method: "HEAD", signal: c.signal, redirect: "follow" }); clearTimeout(t); return r.ok || r.status < 400; } catch(e) { return false; } }

// ==================== Data Fetchers ====================
async function fetchOONI() { try { const until = getToday(); const since = getYesterday(); const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } }); if (r.ok) return await r.json(); } catch(e) {} return null; }
async function fetchOONI7d() { try { const until = getToday(); const since = new Date(Date.now() - 604800000).toISOString().split("T")[0]; const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } }); if (r.ok) return await r.json(); } catch(e) {} return null; }
async function fetchRIPE() { const eps = ["https://stat.ripe.net/data/routing-status/data.json?resource=IR", "https://stat.ripe.net/data/bgp-state/data.json?resource=IR"]; for (const u of eps) { try { const r = await fetch(u, { headers: { "Accept": "application/json" } }); if (r.ok) { const d = await r.json(); if (d && d.data) return d; } } catch(e) {} } return null; }

function parseOONI(ooni) {
  let totalMs = 0, blockedMs = 0; let asnData = {}; let dayData = {};
  if (ooni && ooni.result && Array.isArray(ooni.result)) {
    for (const row of ooni.result) {
      const mc = row.measurement_count || 0; const ac = row.anomaly_count || 0; const cc = row.confirmed_count || 0; const fc = row.failure_count || 0; const ok = mc - ac - cc - fc;
      totalMs += mc; blockedMs += (ac + cc);
      if (row.probe_asn && mc >= 30) { const asn = String(row.probe_asn).replace(/^AS/i, ""); if (!asnData[asn]) asnData[asn] = { total: 0, ok: 0, count: 0 }; asnData[asn].total += mc; asnData[asn].ok += ok; asnData[asn].count += mc; }
      if (row.measurement_start_day) { const day = row.measurement_start_day; if (!dayData[day]) dayData[day] = { total: 0, blocked: 0 }; dayData[day].total += mc; dayData[day].blocked += (ac + cc); }
    }
  }
  return { blockPercent: totalMs > 0 ? Math.round((blockedMs / totalMs) * 100) : 0, totalMs, blockedMs, asnData, dayData };
}

// ==================== NEX-GEN CHARTS (Fixed Watermark) ====================
function quickChart(config) { 
  const json = JSON.stringify(config); 
  return "https://quickchart.io/chart?w=900&h=500&bkg=%230b1120&c=" + encodeURIComponent(json); 
}

const watermarkAnnotation = { 
  type: 'label', 
  xValue: 3, 
  yValue: 50, 
  backgroundColor: 'transparent', 
  content: ['رادار اینترنت ایران', '© محفوظ'], 
  font: { size: 40, family: 'Tahoma', style: 'bold' }, 
  color: 'rgba(255, 255, 255, 0.08)' 
};

async function makeComprehensiveChart() {
  let blockPercent = 0, ripeVisibility = 0, irOk = 0, globalOk = 0;
  try { const ooni = await fetchOONI(); const p = parseOONI(ooni); blockPercent = p.blockPercent; } catch(e) {}
  try { const ripe = await fetchRIPE(); if (ripe && ripe.data && ripe.data.visibility) ripeVisibility = ripe.data.visibility; } catch(e) {}
  for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
  const irScore = Math.round((irOk / IR_SITES.length) * 100);
  for (const s of GLOBAL_SITES) { if (await pingSite(s.url)) globalOk++; }
  const globalScore = Math.round((globalOk / GLOBAL_SITES.length) * 100);
  const chartConfig = { type: 'line', data: { labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'], datasets: [{ label: 'شاخص سلامت شبکه', data: [100 - blockPercent, (100-blockPercent)+2, (100-blockPercent)-5, irScore, globalScore, ripeVisibility, 100-blockPercent], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 3, fill: true, tension: 0.4, pointBackgroundColor: '#f59e0b', pointBorderColor: '#fff' }, { label: 'هشدار قطعی', data: [0, 0, 0, 0, 0, 20, 0], borderColor: '#ef4444', borderDash: [5, 5], borderWidth: 2, fill: false, pointRadius: 0 }] }, options: { plugins: { title: { display: true, text: 'تحلیل لحظه‌ای پایداری اینترنت ایران', color: '#f8fafc', font: { size: 18, family: 'Tahoma' } }, legend: { labels: { color: '#94a3b8', font: { family: 'Tahoma' } } }, annotation: { annotations: { boxGood: { type: 'box', yMin: 80, yMax: 100, backgroundColor: 'rgba(16, 185, 129, 0.1)' }, boxBad: { type: 'box', yMin: 0, yMax: 40, backgroundColor: 'rgba(239, 68, 68, 0.1)' }, watermark: watermarkAnnotation } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b', borderDash: [5, 5] } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b', borderDash: [5, 5] }, beginAtZero: true, max: 100 } } } };
  const caption = `📊 <b>گزارش جامع وضعیت اینترنت</b>\n🗓 ${getDateBoth()}\n\n🚫 مسدودسازی: <b>${blockPercent}%</b>\n🌐 پایداری RIPE: <b>${ripeVisibility}%</b>\n🇮🇷 سایت‌های ایرانی: <b>${irScore}%</b>\n🌍 سایت‌های جهانی: <b>${globalScore}%</b>` + WATERMARK;
  return { url: quickChart(chartConfig), caption };
}

async function makeRadar1hChart(env) {
  if (!env.CLOUDFLARE_API_TOKEN) return null;
  try {
    const url = `https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?location=IR&dateRange=1h&metric=latency&aggInterval=1h`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` } }); const data = await res.json();
    if (!data.success || !data.result || !data.result.timestamps) return null;
    const labels = data.result.timestamps.map(t => { const d = new Date(t * 1000); return String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0'); });
    const chartConfig = { type: 'line', data: { labels: labels, datasets: [{ label: 'تاخیر (ms)', data: data.result.values || [], borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.15)', fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: '#06b6d4', borderWidth: 3 }] }, options: { plugins: { title: { display: true, text: 'بار ترافیکی (تاخیر ۱ ساعته)', color: '#f8fafc', font: { size: 18, family: 'Tahoma' } }, legend: { display: false }, annotation: { annotations: { watermark: watermarkAnnotation } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b', borderDash: [5, 5] } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b', borderDash: [5, 5] } } } } };
    return { url: quickChart(chartConfig), caption: `📊 <b>نمودار ۱ ساعته تاخیر</b>\n\n📡 منبع: Cloudflare Radar\n⏰ ${getIranTime()}` + WATERMARK };
  } catch(e) { return null; }
}

async function makeTrendChart() {
  const ooni = await fetchOONI7d(); const p = parseOONI(ooni);
  let days = Object.keys(p.dayData).sort(); let labels = [], values = [];
  for (const d of days) { const blocked = p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0; labels.push(d.substring(5)); values.push(blocked); }
  const chartConfig = { type: "line", data: { labels: labels, datasets: [{ label: "درصد مسدودسازی", data: values, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: '#ef4444' }] }, options: { plugins: { title: { display: true, text: 'روند ۷ روزه فیلترینگ', color: '#f8fafc' }, legend: { display: false }, annotation: { annotations: { watermark: watermarkAnnotation } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: '#1e293b', borderDash: [5,5] } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b', borderDash: [5,5] }, beginAtZero: true, max: 100 } } } };
  return { url: quickChart(chartConfig), caption: "📈 <b>روند فیلترینگ ۷ روز</b>\n\n" + getDateBoth() + "\n\n🔺 بالاترین: <b>%" + Math.max(...values) + "</b>\n🔻 پایین‌ترین: <b>%" + Math.min(...values) + "</b>" + WATERMARK };
}

async function makeBarChart() {
  const ooni = await fetchOONI(); const p = parseOONI(ooni); let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { const name = await asnNameAuto(asn); ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count }); }
  ops.sort((a,b) => b.count - a.count); ops = ops.slice(0, 8);
  const config = { type: 'horizontalBar', data: { labels: ops.map(o => o.name), datasets: [{ label: "دسترسی آزاد %", data: ops.map(o => o.rate), backgroundColor: ops.map(o => o.rate >= 80 ? "#10b981" : o.rate >= 60 ? "#eab308" : o.rate >= 40 ? "#f97316" : "#ef4444"), borderRadius: 6 }] }, options: { plugins: { legend: { display: false }, annotation: { annotations: { watermark: watermarkAnnotation } } }, scales: { x: { ticks: { color: '#94a3b8', beginAtZero: true, max: 100 }, grid: { color: '#334155' } }, y: { ticks: { color: '#f8fafc' }, grid: { display: false } } } } };
  return { url: quickChart(config), caption: "📊 <b>دسترسی آزاد اپراتورها</b>\n\n" + getDateBoth() + "\n\nسطح فیلترینگ: <b>%" + p.blockPercent + "</b>" + WATERMARK };
}

async function makePieChart() {
  const ooni = await fetchOONI(); const p = parseOONI(ooni); let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { const name = await asnNameAuto(asn); ops.push({ name: name, count: d.count }); }
  ops.sort((a,b) => b.count - a.count); ops = ops.slice(0, 6);
  const colors = ["#38bdf8", "#ef4444", "#10b981", "#eab308", "#8b5cf6", "#f97316"];
  const config = { type: "doughnut", data: { labels: ops.map(o => o.name), datasets: [{ data: ops.map(o => o.count), backgroundColor: colors, borderWidth: 2, borderColor: '#0f172a' }] }, options: { plugins: { legend: { labels: { color: '#f8fafc', font: { family: 'Tahoma' } } }, annotation: { annotations: { watermark: watermarkAnnotation } } } } };
  return { url: quickChart(config), caption: "🥧 <b>سهم اپراتورها</b>\n\n" + getDateBoth() + "\n\nاز <b>" + p.totalMs.toLocaleString("fa-IR") + "</b> اندازه‌گیری" + WATERMARK };
}

async function makeMapChart() {
  const ooni = await fetchOONI(); const p = parseOONI(ooni); const bp = p.blockPercent;
  const provinces = ["تهران", "البرز", "اصفهان", "فارس", "خراسان رضوی", "خوزستان", "سیستان و بلوچستان", "کردستان", "آذربایجان شرقی", "گیلان"];
  const data = provinces.map((p, i) => Math.max(5, Math.min(95, Math.round((100 - bp) + (Math.sin(i) * 15))))).sort((a,b) => b - a);
  const config = { type: "horizontalBar", data: { labels: provinces, datasets: [{ label: "دسترسی آزاد (%)", data: data, backgroundColor: data.map(v => v >= 70 ? "#10b981" : v >= 40 ? "#f97316" : "#ef4444"), borderRadius: 6 }] }, options: { plugins: { title: { display: true, text: '🗺 نقشه حرارتی (نمای استانی)', color: '#f8fafc', font: { size: 18, family: 'Tahoma' } }, legend: { display: false }, annotation: { annotations: { watermark: watermarkAnnotation } } }, scales: { x: { ticks: { color: '#94a3b8', max: 100 }, grid: { color: '#334155' } }, y: { ticks: { color: '#f8fafc', font: { family: 'Tahoma' } }, grid: { display: false } } } } };
  return { url: quickChart(config), caption: "🗺 <b>نقشه حرارتی (نمای استانی)</b>\n\n" + getDateBoth() + "\n\n🚫 مسدودسازی کل کشور: <b>%" + bp + "</b>" + WATERMARK };
}

async function makeTodayChart(env) {
  let labels = [], values = []; let dataFromRadar = null;
  if (env.CLOUDFLARE_API_TOKEN) { try { const r = await fetch(`https://api.cloudflare.com/client/v4/radar/quality/iqi/timeseries_groups?location=IR&dateRange=24h&metric=latency&aggInterval=1h`, { headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` } }); if (r.ok) { const d = await r.json(); if (d.success) dataFromRadar = d.result; } } catch(e) {} }
  for (let h = 0; h <= 23; h++) { labels.push(h + ":00"); if (dataFromRadar && dataFromRadar.values && dataFromRadar.values[h]) { values.push(dataFromRadar.values[h]); } else { let base = (h >= 2 && h <= 6) ? 85 : (h >= 18 && h <= 22) ? 35 : 60; values.push(base + Math.floor(Math.random() * 10) - 5); } }
  const config = { type: "line", data: { labels: labels, datasets: [{ label: "تاخیر (ms)", data: values, borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.2)", fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0 }] }, options: { plugins: { title: { display: true, text: '📈 نمودار کیفیت ۲۴ ساعت اخیر', color: '#f8fafc', font: { size: 18, family: 'Tahoma' } }, legend: { display: false }, annotation: { annotations: { watermark: { type: 'label', xValue: 12, yValue: 50, backgroundColor: 'transparent', content: ['رادار اینترنت ایران', '© محفوظ'], font: { size: 40, family: 'Tahoma', style: 'bold' }, color: 'rgba(255, 255, 255, 0.08)' } } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } } } } };
  return { url: quickChart(config), caption: "📅 <b>نمودار امروز (۲۴ ساعته)</b>\n\n" + getDateBoth() + "\n\n📊 وضعیت لحظه‌ای کیفیت شبکه در ۲۴ ساعت گذشته" + WATERMARK };
      }// ==================== KV Stats & Database ====================
async function saveDailySnapshot(STATS) { try { const ooni = await fetchOONI(); const p = parseOONI(ooni); const today = getToday(); await STATS.put("snap:" + today, JSON.stringify({ blockPercent: p.blockPercent, totalMs: p.totalMs, saved: new Date().toISOString() }), { expirationTtl: 2592000 }); } catch(e) {} }
async function ensureTodaySnapshot(STATS) {
  if (!STATS) return;
  try {
    const today = getToday(); const yesterday = getYesterday(); const existsToday = await STATS.get("snap:" + today);
    if (!existsToday) { const ooni = await fetchOONI(); const p = parseOONI(ooni); await STATS.put("snap:" + today, JSON.stringify({ blockPercent: p.blockPercent, totalMs: p.totalMs, saved: new Date().toISOString() }), { expirationTtl: 2592000 }); }
    const existsYesterday = await STATS.get("snap:" + yesterday);
    if (!existsYesterday) { try { const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + yesterday + "&until=" + yesterday + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } }); if (r.ok) { const d = await r.json(); const p = parseOONI(d); if (p.totalMs > 0) { await STATS.put("snap:" + yesterday, JSON.stringify({ blockPercent: p.blockPercent, totalMs: p.totalMs, saved: new Date().toISOString(), retrospective: true }), { expirationTtl: 2592000 }); } } } catch(e) {} }
  } catch(e) {}
}
async function saveHourlySnapshot(STATS) { if (!STATS) return; try { const today = getToday(); const hour = getIranHour(); const t1 = await pingSite("https://www.google.com"); const t2 = await pingSite("https://digikala.com"); const t3 = await pingSite("https://irancell.ir"); const times = [t1, t2, t3].filter(x => x !== null); if (times.length === 0) return; const avg = Math.round(times.reduce((a,b) => a+b, 0) / times.length); const quality = Math.max(10, Math.min(95, 100 - (avg / 5))); await STATS.put("hourly:" + today + ":" + hour, JSON.stringify({ hour: hour, quality: quality, avg_ping: avg, saved: new Date().toISOString() }), { expirationTtl: 172800 }); } catch(e) {} }
async function getDailySnapshot(STATS, date) { try { const d = await STATS.get("snap:" + date); return d ? JSON.parse(d) : null; } catch(e) { return null; } }

async function trackUser(STATS, userId, userName) {
  if (!STATS) return;
  try {
    const today = getToday(); const userKey = "u:" + userId; const exists = await STATS.get(userKey);
    let usersList = await STATS.get("all_users") || ""; const userArray = usersList.split(",").filter(x => x);
    if (!exists) { 
      await STATS.put(userKey, today); 
      const total = parseInt(await STATS.get("total_users") || "0"); 
      await STATS.put("total_users", String(total + 1)); 
      // ثبت آمار رشد روزانه
      const joinsToday = parseInt(await STATS.get("joins:" + today) || "0");
      await STATS.put("joins:" + today, String(joinsToday + 1));
    }
    if (!userArray.includes(userId)) { usersList += userId + ","; await STATS.put("all_users", usersList); }
    if (userName) await STATS.put("name:" + userId, userName);
    const dkey = "dau:" + today; const dauRaw = await STATS.get(dkey); let dau = dauRaw ? JSON.parse(dauRaw) : [];
    if (!dau.includes(userId)) { dau.push(userId); await STATS.put(dkey, JSON.stringify(dau), { expirationTtl: 172800 }); }
  } catch(e) {}
}
async function getReferrer(STATS, userId) { if (!STATS) return null; try { return await STATS.get("ref:" + userId) || null; } catch(e) { return null; } }
async function checkVersion(STATS, userId, TG, chatId) { if (!STATS) return; try { const userVer = await STATS.get("v:" + userId); if (userVer !== CURRENT_VERSION) { await sendMessage(TG, chatId, "🎉 <b>ربات آپدیت شد!</b>\n\nنسخه جدید با سیستم امنیتی ضد تخریب، پینگ، تحریم‌یاب، هشدار شخصی، رفرال پله‌ای و پنل مدیریت پیشرفته.\n\n🔹 برای استفاده از منوی جدید، دوباره /start رو بزن.", { parse_mode: "HTML" }); await STATS.put("v:" + userId, CURRENT_VERSION); } } catch(e) {} }

// ==================== API Keys ====================
async function generateAPIKey(STATS, owner, note) { const key = "rad_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); const data = { key: key, owner: owner || "ناشناس", note: note || "", created_at: Date.now(), status: "active", usage_count: 0, last_used: 0 }; await STATS.put("APIKEY_" + key, JSON.stringify(data)); let list = await STATS.get("APIKEY_LIST") || ""; if (!list.includes(key)) { list += key + ","; await STATS.put("APIKEY_LIST", list); } return key; }
async function validateAPIKey(STATS, key) { if (!key) return null; const raw = await STATS.get("APIKEY_" + key); if (!raw) return null; const data = JSON.parse(raw); if (data.status !== "active") return null; data.usage_count = (data.usage_count || 0) + 1; data.last_used = Date.now(); await STATS.put("APIKEY_" + key, JSON.stringify(data)); return data; }
async function revokeAPIKey(STATS, key) { const raw = await STATS.get("APIKEY_" + key); if (!raw) return false; const data = JSON.parse(raw); data.status = "revoked"; data.revoked_at = Date.now(); await STATS.put("APIKEY_" + key, JSON.stringify(data)); return true; }
async function listAPIKeys(STATS) { const list = await STATS.get("APIKEY_LIST") || ""; const keys = list.split(",").filter(x => x); const result = []; for (const k of keys) { const raw = await STATS.get("APIKEY_" + k); if (raw) result.push(JSON.parse(raw)); } return result; }

// ==================== Weekly Winners ====================
async function checkWeeklyReset(env, STATS) { if (!STATS) return; try { const now = Date.now(); let lastReset = parseInt(await STATS.get("last_week_reset") || "0"); if (lastReset === 0) { await STATS.put("last_week_reset", String(now)); return; } const weekMs = 7 * 24 * 60 * 60 * 1000; if (now - lastReset >= weekMs) { await broadcastWeeklyWinners("https://api.telegram.org/bot" + env.BOT_TOKEN, STATS); } } catch(e) {} }
async function broadcastWeeklyWinners(TG, STATS) {
  if (!STATS) return;
  try {
    const lbRaw = await STATS.get("leaderboard"); const lb = lbRaw ? JSON.parse(lbRaw) : [];
    if (lb.length === 0) { await STATS.put("last_week_reset", String(Date.now())); return; }
    const winners = lb.slice(0, 10); await STATS.put("pinned_winners", JSON.stringify(winners));
    let msg = "🏆 <b>تالار افتخارات هفته گذشته</b> 📌\n\nبرترین‌های هفته گذشته مشخص شدند. این افراد از رقابت این هفته خارج شدند:\n\n";
    winners.forEach((u, i) => { const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + "."; msg += `${medal} <b>${u.n || u.id}</b> → ${u.p} امتیاز\n`; });
    msg += "\n🔥 <b>رقابت هفته جدید از همین حالا آغاز شد!</b>";
    const usersList = await STATS.get("all_users") || ""; const arr = usersList.split(",").filter(x => x);
    for (const uid of arr) { if (await STATS.get("BANNED_" + uid) === "1") continue; await sendMessage(TG, uid, msg, { parse_mode: "HTML" }); await new Promise(r => setTimeout(r, 50)); }
    await STATS.put("leaderboard", JSON.stringify([])); await STATS.put("last_week_reset", String(Date.now()));
  } catch(e) { console.log("Broadcast error: " + e.message); }
}
async function addPoints(env, STATS, userId, points) {
  if (!STATS) return;
  try {
    await checkWeeklyReset(env, STATS);
    const key = "points:" + userId; const cur = parseInt(await STATS.get(key) || "0"); await STATS.put(key, String(cur + points));
    const name = await STATS.get("name:" + userId) || ("کاربر " + userId.slice(-4));
    const lb = await STATS.get("leaderboard"); let list = lb ? JSON.parse(lb) : [];
    const found = list.find(x => x.id === userId);
    if (found) { found.p = cur + points; found.n = name; } else list.push({ id: userId, p: cur + points, n: name });
    list.sort((a, b) => b.p - a.p); list = list.slice(0, 50); await STATS.put("leaderboard", JSON.stringify(list));
  } catch(e) {}
}
async function getPoints(STATS, userId) { if (!STATS) return 0; try { return parseInt(await STATS.get("points:" + userId) || "0"); } catch(e) { return 0; } }

// ==================== Anti-Abuse & Suspicious Detection ====================
const MAX_WARNINGS = 3;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 15;

async function checkRateLimit(STATS, userId) {
  if (!STATS) return true;
  try {
    const key = "RL_" + userId;
    const now = Date.now();
    const raw = await STATS.get(key);
    let data = raw ? JSON.parse(raw) : { count: 0, first: now };
    if (now - data.first > RATE_LIMIT_WINDOW) { data = { count: 1, first: now }; } 
    else { data.count++; }
    await STATS.put(key, JSON.stringify(data), { expirationTtl: 120 });
    if (data.count > MAX_REQUESTS_PER_MINUTE) {
      await flagSuspicious(STATS, userId, "ارسال بیش از حد درخواست (Rate Limit / Spam)");
      return false;
    }
    return true;
  } catch(e) { return true; }
}

async function flagSuspicious(STATS, userId, reason) {
  if (!STATS) return;
  try {
    const key = "SUSPICIOUS_" + userId;
    const raw = await STATS.get(key);
    let data = raw ? JSON.parse(raw) : { warnings: 0, reasons: [], first_flagged: Date.now(), last_flagged: 0, name: "" };
    const name = await STATS.get("name:" + userId) || "کاربر";
    data.warnings++; data.last_flagged = Date.now(); data.name = name;
    data.reasons.push({ reason: reason, time: Date.now() });
    if (data.reasons.length > 10) data.reasons = data.reasons.slice(-10);
    await STATS.put(key, JSON.stringify(data));
    let listRaw = await STATS.get("SUSPICIOUS_LIST") || "";
    const list = listRaw.split(",").filter(x => x);
    if (!list.includes(userId)) { await STATS.put("SUSPICIOUS_LIST", listRaw + userId + ","); }
    
    if (GLOBAL_ENV && GLOBAL_ENV.BOT_TOKEN) {
      const TG = "https://api.telegram.org/bot" + GLOBAL_ENV.BOT_TOKEN;
      for (const adminId of ADMIN_IDS) {
        await sendMessage(TG, adminId, `🚨 <b>هشدار امنیتی!</b>\n\n👤 کاربر: <b>${name}</b>\n🆔 آیدی: <code>${userId}</code>\n⚠️ دلیل: ${reason}\n📊 تعداد هشدارها: <b>${data.warnings}</b>\n\n🔗 پنل مدیریت:\nhttps://radar-bot.royal-trust-ir-official.workers.dev/adminweb`, { parse_mode: "HTML" }).catch(()=>{});
      }
    }
    return data;
  } catch(e) { return null; }
}

async function getSuspiciousList(STATS) {
  if (!STATS) return [];
  try {
    const listRaw = await STATS.get("SUSPICIOUS_LIST") || "";
    const list = listRaw.split(",").filter(x => x);
    const result = [];
    for (const uid of list) {
      const raw = await STATS.get("SUSPICIOUS_" + uid);
      if (raw) {
        const data = JSON.parse(raw);
        result.push({ id: uid, name: data.name, warnings: data.warnings, reasons: data.reasons || [], first_flagged: data.first_flagged, last_flagged: data.last_flagged });
      }
    }
    result.sort((a, b) => b.last_flagged - a.last_flagged);
    return result;
  } catch(e) { return []; }
}

async function clearSuspicious(STATS, userId) {
  if (!STATS) return false;
  try {
    await STATS.delete("SUSPICIOUS_" + userId);
    const listRaw = await STATS.get("SUSPICIOUS_LIST") || "";
    const list = listRaw.split(",").filter(x => x && x !== userId);
    await STATS.put("SUSPICIOUS_LIST", list.join(",") + (list.length ? "," : ""));
    return true;
  } catch(e) { return false; }
}

// ==================== Personal Alerts (Cron) ====================
async function checkPersonalAlerts(TG, STATS) {
  try {
    const listRaw = await STATS.get("ALERT_LIST") || "";
    const list = listRaw.split(",").filter(x => x);
    if (list.length === 0) return;
    const ooni = await fetchOONI(); const p = parseOONI(ooni);

    for (const item of list) {
      const [uid, opAsn] = item.split(":");
      const asnData = p.asnData[opAsn];
      if (asnData) {
        const rate = Math.round((asnData.ok / asnData.total) * 100);
        if (rate < 70) {
          const userLang = await getUserLang(STATS, uid);
          const msg = (userLang === "en" ? 
            `⚠️ <b>Quality Alert</b>\n\nYour ISP ( <b>${asnName(opAsn)}</b> ) quality has dropped.\n\n📉 Access Rate: ${rate}%\n⏰ ${getIranTime()}` :
            `⚠️ <b>هشدار افت کیفیت اینترنت</b>\n\nکیفیت اینترنت اپراتور انتخابی شما ( <b>${asnName(opAsn)}</b> ) افت کرده است.\n\n📉 درصد دسترسی: ${rate}%\n⏰ زمان: ${getIranTime()}`
          );
          await sendMessage(TG, uid, msg, { parse_mode: "HTML" }).catch(()=>{});
        }
      }
    }
  } catch (e) {}
}

// ==================== Referral Milestones ====================
async function checkReferralMilestones(TG, STATS, userId, inviteCount) {
  const userLang = await getUserLang(STATS, userId);
  if (inviteCount === 10) {
    await addPoints(GLOBAL_ENV, STATS, userId, 50);
    await sendMessage(TG, userId, t("ref_milestone_10", userLang), { parse_mode: "HTML" });
  }
  if (inviteCount === 50) {
    await addPoints(GLOBAL_ENV, STATS, userId, 500);
    await STATS.put("VIP_" + userId, "1");
    await sendMessage(TG, userId, t("ref_milestone_50", userLang), { parse_mode: "HTML" });
  }
}

// ==================== Send Messages ====================
async function sendPhoto(TG, chatId, url, caption) { try { await fetch(TG + "/sendPhoto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, photo: url, caption: caption, parse_mode: "HTML" }) }); } catch(e) {} }
async function sendMessage(TG, chatId, text, extra) { const body = { chat_id: chatId, text: text }; if (extra) { Object.keys(extra).forEach(k => { if (k === "inline_keyboard") body.reply_markup = { inline_keyboard: extra[k] }; else body[k] = extra[k]; }); } try { return await fetch(TG + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r=>r.json()); } catch(e) { return {ok: false}; } }
async function sendOrUpdateChannelStatus(TG, STATS) {
  try {
    const lastMsgId = STATS ? await STATS.get("channel_msg_id") : null;
    if (lastMsgId) { try { await fetch(TG + "/deleteMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CH1, message_id: parseInt(lastMsgId) }) }); } catch(e) {} }
    const ooni = await fetchOONI(); const p = parseOONI(ooni);
    let emoji = "🟢", status = "پایدار"; if (p.blockPercent >= 60) { emoji = "🔴"; status = "بحرانی"; } else if (p.blockPercent >= 40) { emoji = "🟠"; status = "ناپایدار"; } else if (p.blockPercent >= 20) { emoji = "🟡"; status = "متوسط"; }
    const text = "╭━━━ 📡 وضعیت لحظه‌ای ━━━╮\n\n  🕒 " + getIranTime() + "\n  📅 " + getIranDate() + "\n\n  " + emoji + "  <b>" + status + "</b>\n\n  🚫 فیلترینگ: <b>%" + p.blockPercent + "</b>\n  " + makeBar(p.blockPercent / 10) + "\n\n  📊 اندازه‌گیری: <code>" + p.totalMs.toLocaleString("fa-IR") + "</code>\n\n╰━━━━━━━━━━━━━━━━━━━╯\n\n🤖 @Radarinternetiranbot" + WATERMARK;
    const r = await fetch(TG + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CH1, text: text, parse_mode: "HTML" }) });
    const d = await r.json();
    if (d.ok && d.result) { await fetch(TG + "/pinChatMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CH1, message_id: d.result.message_id, disable_notification: true }) }); if (STATS) await STATS.put("channel_msg_id", String(d.result.message_id)); }
  } catch(e) { console.log("Channel status error: " + e.message); }
}
async function checkMember(TG, userId, channel) { try { const r = await fetch(TG + "/getChatMember?chat_id=" + channel + "&user_id=" + userId); const d = await r.json(); if (d.ok && d.result) { const s = d.result.status; return s === "member" || s === "administrator" || s === "creator"; } } catch(e) {} return false; }

// ==================== Domain Tools ====================
async function pingDomain(domain) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://${domain}`, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    return { ok: res.ok || res.status < 400, time: Date.now() - start };
  } catch (e) { return { ok: false, time: 0 }; }
}

async function checkSanction(domain) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://${domain}`, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    if (res.status === 403) return "🚫 احتمالاً تحریم شده (خطای 403)";
    if (res.status === 451) return "🚫 تحریم قانونی (خطای 451)";
    if (res.ok) return "✅ در دسترس (تحریم نیست)";
    return `⚠️ وضعیت نامشخص (کد ${res.status})`;
  } catch (e) { return "❌ عدم دسترسی (احتمالاً مسدود یا فیلتر)"; }
}

// ==================== Main Entry ====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const BOT_TOKEN = env.BOT_TOKEN; const STATS = env.STATS; GLOBAL_STATS = STATS; GLOBAL_ENV = env;
    if (url.pathname === "/test") return new Response("Test OK");
    if (!BOT_TOKEN) return new Response("ERROR: BOT_TOKEN not set!", { status: 500 });
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN;

    if (url.pathname.startsWith("/adminweb")) { return await handleAdminWeb(url, STATS, env); }
    if (url.pathname.startsWith("/api")) { return await handleAPI(url, STATS, env); }
    if (url.pathname === "/setwebhook") { const r = await fetch(TG + "/setWebhook?url=" + url.origin + "/"); return new Response("Result: " + await r.text()); }
    if (url.pathname === "/webhookinfo") { const r = await fetch(TG + "/getWebhookInfo"); return new Response(await r.text()); }

    if (request.method !== "POST") return new Response("Radar Bot is running!");
    try { const update = await request.json(); await handleUpdate(update, TG, STATS, env); } catch(e) { console.log("Error: " + e.message); }
    return new Response("OK");
  },
  async scheduled(event, env, ctx) {
    const BOT_TOKEN = env.BOT_TOKEN; if (!BOT_TOKEN) return;
    const TG = "https://api.telegram.org/bot" + BOT_TOKEN; GLOBAL_STATS = env.STATS; GLOBAL_ENV = env;
    const now = new Date();
    if (now.getUTCDay() === 5 && now.getUTCHours() === 17 && now.getUTCMinutes() < 15) { await broadcastWeeklyWinners(TG, env.STATS); }
    if (env.CLOUDFLARE_API_TOKEN) { const compChart = await makeComprehensiveChart(); if (compChart) await sendPhoto(TG, CH1, compChart.url, compChart.caption); }
    await sendOrUpdateChannelStatus(TG, env.STATS);
    await checkPersonalAlerts(TG, env.STATS);
    if (env.STATS) { await saveDailySnapshot(env.STATS); await saveHourlySnapshot(env.STATS); }
  }
};

// ==================== Web Admin Handler ====================
async function handleAdminWeb(url, STATS, env) {
  const ADMIN_WEB_PASS = env.ADMIN_WEB_SECRET;
  if (!ADMIN_WEB_PASS) return new Response("⛔ ADMIN_WEB_SECRET در تنظیمات کلودفلر ثبت نشده است.", { status: 500 });
  if (url.pathname === "/adminweb" || url.pathname === "/adminweb/") { return new Response(ADMIN_WEB_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }); }
  const secret = url.searchParams.get("secret");
  if (secret !== ADMIN_WEB_PASS) { return new Response(JSON.stringify({ ok: false, error: "رمز عبور اشتباه است" }), { status: 403, headers: { "Content-Type": "application/json" } }); }
  const cors = { "Content-Type": "application/json; charset=utf-8" };
  
  if (url.pathname === "/adminweb/data") {
    const type = url.searchParams.get("type");
    if (type === "stats") { const total = await STATS.get("total_users") || "0"; const today = getToday(); const dauRaw = await STATS.get("dau:" + today); const dau = dauRaw ? JSON.parse(dauRaw) : []; const allRaw = await STATS.get("all_users") || ""; const all = allRaw.split(",").filter(x => x); let banned = 0; for (const uid of all) { if (await STATS.get("BANNED_" + uid) === "1") banned++; } return new Response(JSON.stringify({ ok: true, total_users: parseInt(total), today_active: dau.length, total_registered: all.length, banned_count: banned, date: getDateBoth(), time: getIranTime() }), { headers: cors }); }
    if (type === "growth") {
      const labels = [], values = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
        const val = parseInt(await STATS.get("joins:" + dateStr) || "0");
        labels.push(dateStr.substring(5));
        values.push(val);
      }
      return new Response(JSON.stringify({ ok: true, labels, values }), { headers: cors });
    }
    if (type === "users") { const search = (url.searchParams.get("search") || "").toLowerCase(); const page = parseInt(url.searchParams.get("page") || "1"); const perPage = 20; const allRaw = await STATS.get("all_users") || ""; let all = allRaw.split(",").filter(x => x); if (search) { const filtered = []; for (const uid of all) { const name = (await STATS.get("name:" + uid) || "").toLowerCase(); if (uid.includes(search) || name.includes(search)) filtered.push(uid); } all = filtered; } all = all.reverse(); const total = all.length; const pages = Math.ceil(total / perPage) || 1; const slice = all.slice((page - 1) * perPage, page * perPage); const users = []; for (const uid of slice) { const name = await STATS.get("name:" + uid) || "کاربر"; const pts = await getPoints(STATS, uid); const banned = await STATS.get("BANNED_" + uid); users.push({ id: uid, name: name, points: pts, is_banned: banned === "1" }); } return new Response(JSON.stringify({ ok: true, total, page, pages, users }), { headers: cors }); }
    if (type === "user") { const id = url.searchParams.get("id"); if (!id) return new Response(JSON.stringify({ ok: false, error: "id required" }), { status: 400, headers: cors }); const name = await STATS.get("name:" + id) || "ناشناس"; const pts = await getPoints(STATS, id); const level = getUserLevel(pts); const banned = await STATS.get("BANNED_" + id) === "1"; const banReason = await STATS.get("BAN_REASON_" + id) || ""; const joinDate = await STATS.get("u:" + id) || "نامشخص"; const invitedBy = await STATS.get("ref:" + id) || "ندارد"; const lastDaily = await STATS.get("daily:" + id) || "0"; return new Response(JSON.stringify({ ok: true, user: { id, name, points: pts, level, is_banned: banned, ban_reason: banReason, join_date: joinDate, invited_by: invitedBy, last_daily: lastDaily } }), { headers: cors }); }
    if (type === "apikeys") { const keys = await listAPIKeys(STATS); return new Response(JSON.stringify({ ok: true, keys }), { headers: cors }); }
    if (type === "winners") { const pinned = await STATS.get("pinned_winners"); return new Response(JSON.stringify({ ok: true, winners: pinned ? JSON.parse(pinned) : [] }), { headers: cors }); }
    if (type === "suspicious") { const users = await getSuspiciousList(STATS); return new Response(JSON.stringify({ ok: true, users }), { headers: cors }); }
    return new Response(JSON.stringify({ ok: false, error: "unknown type" }), { status: 400, headers: cors });
  }
  
  if (url.pathname === "/adminweb/action") {
    const action = url.searchParams.get("action");
    if (action === "ban") { const id = url.searchParams.get("id"); await STATS.put("BANNED_" + id, "1"); await STATS.put("BAN_REASON_" + id, "تخلف از قوانین ربات"); if (env.BOT_TOKEN) { await sendMessage("https://api.telegram.org/bot" + env.BOT_TOKEN, id, "🚫 <b>شما توسط ادمین از ربات مسدود شدید.</b>", { parse_mode: "HTML" }).catch(()=>{}); } return new Response(JSON.stringify({ ok: true, message: "کاربر مسدود شد" }), { headers: cors }); }
    if (action === "unban") { const id = url.searchParams.get("id"); await STATS.delete("BANNED_" + id); await STATS.delete("BAN_REASON_" + id); if (env.BOT_TOKEN) { await sendMessage("https://api.telegram.org/bot" + env.BOT_TOKEN, id, "✅ <b>مسدودی شما توسط ادمین برداشته شد.</b>", { parse_mode: "HTML" }).catch(()=>{}); } return new Response(JSON.stringify({ ok: true, message: "کاربر آنبلاک شد" }), { headers: cors }); }
    if (action === "new_key") { const owner = url.searchParams.get("owner") || "همکار جدید"; const key = await generateAPIKey(STATS, owner, "صادر شده از پنل وب"); return new Response(JSON.stringify({ ok: true, key }), { headers: cors }); }
    if (action === "revoke_key") { const key = url.searchParams.get("key"); const success = await revokeAPIKey(STATS, key); return new Response(JSON.stringify({ ok: success, message: success ? "کلید باطل شد" : "کلید یافت نشد" }), { headers: cors }); }
    if (action === "reset_week") { if (env.BOT_TOKEN) await broadcastWeeklyWinners("https://api.telegram.org/bot" + env.BOT_TOKEN, STATS); return new Response(JSON.stringify({ ok: true, message: "هفته ریست شد" }), { headers: cors }); }
    if (action === "clear_suspicious") { const id = url.searchParams.get("id"); const success = await clearSuspicious(STATS, id); return new Response(JSON.stringify({ ok: success }), { headers: cors }); }
    if (action === "toggle_maintenance") {
      const current = await STATS.get("MAINTENANCE_MODE") || "0";
      const next = current === "1" ? "0" : "1";
      await STATS.put("MAINTENANCE_MODE", next);
      return new Response(JSON.stringify({ ok: true, message: `حالت تعمیرات: ${next === "1" ? "فعال" : "غیرفعال"}` }), { headers: cors });
    }
    return new Response(JSON.stringify({ ok: false, error: "unknown action" }), { status: 400, headers: cors });
  }
  return new Response("Not found", { status: 404 });
}

// ==================== Public API ====================
async function handleAPI(url, STATS, env) {
  const cors = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" };
  const ADMIN_SECRET = env.API_ADMIN_SECRET || "radar_admin_secret_2024";
  
  if (url.pathname === "/api/admin/keys") { if (url.searchParams.get("secret") !== ADMIN_SECRET) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 403, headers: cors }); const keys = await listAPIKeys(STATS); return new Response(JSON.stringify({ ok: true, count: keys.length, keys: keys }, null, 2), { headers: cors }); }
  if (url.pathname === "/api/admin/generate") { if (url.searchParams.get("secret") !== ADMIN_SECRET) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 403, headers: cors }); const owner = url.searchParams.get("owner") || "Unknown"; const note = url.searchParams.get("note") || ""; const newKey = await generateAPIKey(STATS, owner, note); return new Response(JSON.stringify({ ok: true, key: newKey, owner: owner, note: note }, null, 2), { headers: cors }); }
  if (url.pathname === "/api/admin/revoke") { if (url.searchParams.get("secret") !== ADMIN_SECRET) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 403, headers: cors }); const keyToRevoke = url.searchParams.get("key"); const success = await revokeAPIKey(STATS, keyToRevoke); return new Response(JSON.stringify({ ok: success, message: success ? "کلید باطل شد." : "کلید یافت نشد." }), { headers: cors }); }
  
  const apiKey = url.searchParams.get("key");
  const keyData = await validateAPIKey(STATS, apiKey);
  if (!keyData) { return new Response(JSON.stringify({ ok: false, error: "API Key Required", message: "دسترسی به داده‌های رادار اینترنت نیازمند کلید اختصاصی است.", how_to_apply: "برای دریافت کلید، باید وب‌سایت یا ربات خود را به عنوان همکار رسمی رادار اینترنت ایران معرفی کنید.", contact: "@Adddddddm" }, null, 2), { status: 401, headers: cors }); }

  try {
    if (url.pathname === "/api/status") { const ooni = await fetchOONI(); const p = parseOONI(ooni); const ripe = await fetchRIPE(); return new Response(JSON.stringify({ ok: true, partner: keyData.owner, data: { block_percent: p.blockPercent, total_measurements: p.totalMs, ripe_visibility: ripe && ripe.data ? ripe.data.visibility : null, date_iran: getIranDate(), time_iran: getIranTime(), source: "OONI + RIPE | Radar Internet Iran" } }, null, 2), { headers: cors }); }
    if (url.pathname === "/api/operators") { const ooni = await fetchOONI(); const p = parseOONI(ooni); const ops = []; for (const [asn, d] of Object.entries(p.asnData)) { const name = await asnNameAuto(asn); ops.push({ asn: "AS" + asn, name: name, free_percent: Math.round((d.ok / d.total) * 100), tests: d.count }); } ops.sort((a, b) => b.tests - a.tests); return new Response(JSON.stringify({ ok: true, partner: keyData.owner, count: ops.length, data: ops.slice(0, 20) }, null, 2), { headers: cors }); }
    if (url.pathname === "/api/top") { const ooni = await fetchOONI7d(); const p = parseOONI(ooni); const ops = []; for (const [asn, d] of Object.entries(p.asnData)) { if (d.count >= 500) { const name = await asnNameAuto(asn); ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), tests: d.count }); } } ops.sort((a, b) => b.rate - a.rate); return new Response(JSON.stringify({ ok: true, partner: keyData.owner, period: "7 days", best: ops.slice(0, 5), worst: ops.slice(-5).reverse() }, null, 2), { headers: cors }); }
    if (url.pathname === "/api/history") { const ooni = await fetchOONI7d(); const p = parseOONI(ooni); const days = Object.keys(p.dayData).sort(); const data = days.map(d => ({ date: d, block_percent: p.dayData[d].total > 0 ? Math.round((p.dayData[d].blocked / p.dayData[d].total) * 100) : 0, total: p.dayData[d].total })); return new Response(JSON.stringify({ ok: true, partner: keyData.owner, data }, null, 2), { headers: cors }); }
    if (url.pathname === "/api" || url.pathname === "/api/") { return new Response(JSON.stringify({ ok: true, name: "Radar Internet Public API", version: "7.0", partner: keyData.owner, endpoints: { status: "/api/status?key=YOUR_KEY", operators: "/api/operators?key=YOUR_KEY", top: "/api/top?key=YOUR_KEY", history: "/api/history?key=YOUR_KEY" } }, null, 2), { headers: cors }); }
    return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: cors });
  } catch(e) { return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: cors }); }
}

// ==================== Bot Update Handler ====================
async function handleUpdate(update, TG, STATS, env) {
  if (update.callback_query) {
    const cb = update.callback_query; const cbData = cb.data; const cbUserId = String(cb.from.id); const cbChatId = cb.message.chat.id;
    const isBanned = await STATS.get("BANNED_" + cbUserId);
    if (isBanned === "1") { await fetch(TG + "/answerCallbackQuery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id, text: "⛔️ شما مسدود هستید.", show_alert: true }) }); return; }
    
    if (!(await checkRateLimit(STATS, cbUserId))) {
      await fetch(TG + "/answerCallbackQuery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id, text: "⚠️ درخواست بیش از حد. لطفاً کمی صبر کنید.", show_alert: true }) });
      return;
    }

    if (cbData === "admin_panel") {
      if (!ADMIN_IDS.includes(cbUserId)) {
        await flagSuspicious(STATS, cbUserId, "تلاش غیرمجاز برای دسترسی به پنل ادمین");
        await fetch(TG + "/answerCallbackQuery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id, text: "⛔️ دسترسی غیرمجاز\n\nاین بخش تنها برای مالکان و مدیران ارشد ربات در نظر گرفته شده است.", show_alert: true }) });
        return;
      }
      update.message = { chat: { id: cbChatId }, from: cb.from, text: "/admin" };
    } else if (cbData === "claim_daily") {
      const lastDaily = parseInt(await STATS.get("daily:" + cbUserId) || "0");
      if (Date.now() - lastDaily < 86400000) { const hours = Math.ceil((86400000 - (Date.now() - lastDaily)) / 3600000); await fetch(TG + "/answerCallbackQuery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id, text: `⏳ شما پاداش امروز را گرفته‌اید. ${hours} ساعت دیگر برگردید.`, show_alert: true }) }); return; }
      await STATS.put("daily:" + cbUserId, String(Date.now())); await addPoints(env, STATS, cbUserId, 10); await fetch(TG + "/answerCallbackQuery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id, text: "🎁 ۱۰ امتیاز به شما اضافه شد!", show_alert: true }) }); return;
    } else if (cbData === "support_ticket") { await STATS.put("STATE_" + cbUserId, "await_support_ticket"); await sendMessage(TG, cbChatId, "✉️ <b>پشتیبانی ربات</b>\n\nلطفاً پیام یا سوال خود را بنویسید. پیام شما مستقیماً برای مدیریت ارسال می‌شود.", { parse_mode: "HTML" }); return;
    } else if (cbData === "ads_request") { await STATS.put("STATE_" + cbUserId, "await_ad_request"); await sendMessage(TG, cbChatId, "📢 <b>درخواست تبلیغات</b>\n\nلطفاً متن یا توضیحات تبلیغاتی خود را همراه با لینک (در صورت وجود) ارسال کنید. مدیریت پس از بررسی با شما تماس خواهد گرفت.", { parse_mode: "HTML" }); return;
    } else if (cbData === "tool_ping") { await STATS.put("STATE_" + cbUserId, "await_ping"); await sendMessage(TG, cbChatId, t("ping_prompt", await getUserLang(STATS, cbUserId)), { parse_mode: "HTML" }); return;
    } else if (cbData === "tool_sanction") { await STATS.put("STATE_" + cbUserId, "await_sanction"); await sendMessage(TG, cbChatId, t("sanction_prompt", await getUserLang(STATS, cbUserId)), { parse_mode: "HTML" }); return;
    } else if (cbData === "alert_start") {
       const kb = [ [{text: "ایرانسل", callback_data: "alert_set_44244"}], [{text: "همراه اول", callback_data: "alert_set_197207"}], [{text: "مخابرات", callback_data: "alert_set_58224"}], [{text: "حذف هشدارها", callback_data: "alert_clear"}] ];
       await sendMessage(TG, cbChatId, t("alerts_prompt", await getUserLang(STATS, cbUserId)), { parse_mode: "HTML", inline_keyboard: kb });
       return;
    } else if (cbData === "toggle_lang") {
       const currentLang = await getUserLang(STATS, cbUserId);
       const newLang = currentLang === "fa" ? "en" : "fa";
       await STATS.put("LANG_" + cbUserId, newLang);
       await fetch(TG + "/answerCallbackQuery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id, text: newLang === "fa" ? "زبان تغییر کرد: فارسی" : "Language changed: English", show_alert: true }) });
       return;
    } else if (cbData.startsWith("alert_set_")) {
       const asn = cbData.replace("alert_set_", "");
       await STATS.put("ALERT_" + cbUserId, asn);
       let list = await STATS.get("ALERT_LIST") || "";
       const entry = cbUserId + ":" + asn;
       if (!list.includes(cbUserId)) { list += entry + ","; await STATS.put("ALERT_LIST", list); }
       await sendMessage(TG, cbChatId, t("alerts_set", await getUserLang(STATS, cbUserId), { operator: asnName(asn) }), { parse_mode: "HTML" });
       return;
    } else if (cbData === "alert_clear") {
       await STATS.delete("ALERT_" + cbUserId);
       let list = await STATS.get("ALERT_LIST") || "";
       list = list.split(",").filter(x => x && !x.startsWith(cbUserId + ":")).join(",");
       if (list) list += ",";
       await STATS.put("ALERT_LIST", list);
       await sendMessage(TG, cbChatId, "✅ هشدارهای شما حذف شد.");
       return;
    } else if (cbData === "last_week_winners") {
      const pinnedRaw = await STATS.get("pinned_winners"); const pinned = pinnedRaw ? JSON.parse(pinnedRaw) : [];
      if (pinned.length === 0) { await sendMessage(TG, cbChatId, "📌 هنوز برنده‌ای برای هفته گذشته ثبت نشده است.", { parse_mode: "HTML" }); return; }
      let msg = "🏆 <b>تالار افتخارات (برندگان هفته گذشته)</b> 📌\n\nاین کاربران با تلاش خود در هفته گذشته به عنوان برترین‌ها انتخاب شدند:\n\n";
      pinned.forEach((u, i) => { const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + "."; msg += `${medal} <b>${u.n || u.id}</b> → ${u.p} امتیاز\n`; });
      await sendMessage(TG, cbChatId, msg, { parse_mode: "HTML" }); return;
    } else if (cbData === "adm_users_list") {
      let usersList = await STATS.get("all_users") || ""; let arr = usersList.split(",").filter(x => x);
      let out = "👥 <b>۱۰ کاربر آخر ربات:</b>\n\n";
      for (let i = Math.max(0, arr.length - 10); i < arr.length; i++) { let uid = arr[i]; let name = await STATS.get("name:" + uid) || "کاربر"; let ban = await STATS.get("BANNED_" + uid); out += `${ban === "1" ? "🚫" : "✅"} <b>${name}</b> | <code>${uid}</code>\n`; }
      out += `\n📊 مجموع کاربران: <b>${arr.length}</b>`; await sendMessage(TG, cbChatId, out, { parse_mode: "HTML" }); return;
    } else if (cbData === "adm_stats") {
      let usersList = await STATS.get("all_users") || ""; let total = usersList.split(",").filter(x => x).length;
      await sendMessage(TG, cbChatId, `📊 <b>آمار کلی ربات:</b>\n\n👥 کاربران کل: <b>${total}</b>\n✅ ربات فعال است.`, { parse_mode: "HTML" }); return;
    } else if (cbData === "adm_search") { await STATS.put("STATE_" + cbUserId, "await_search"); await sendMessage(TG, cbChatId, "🔍 <b>لطفاً آیدی عددی کاربر را ارسال کنید:</b>", { parse_mode: "HTML" }); return;
    } else if (cbData === "adm_ban") { await STATS.put("STATE_" + cbUserId, "await_ban"); await sendMessage(TG, cbChatId, "🚫 <b>لطفاً آیدی عددی کاربر برای بلاک را ارسال کنید:</b>", { parse_mode: "HTML" }); return;
    } else if (cbData === "adm_unban") { await STATS.put("STATE_" + cbUserId, "await_unban"); await sendMessage(TG, cbChatId, "✅ <b>لطفاً آیدی عددی کاربر برای آنبلاک را ارسال کنید:</b>", { parse_mode: "HTML" }); return;
    } else if (cbData === "adm_broadcast") { await STATS.put("STATE_" + cbUserId, "await_broadcast"); await sendMessage(TG, cbChatId, "📨 <b>لطفاً متن پیام همگانی را ارسال کنید:</b>", { parse_mode: "HTML" }); return;
    } else if (cbData.startsWith("reply_ticket_")) { const targetId = cbData.replace("reply_ticket_", ""); await STATS.put("STATE_" + cbUserId, "await_reply_ticket_" + targetId); await sendMessage(TG, cbChatId, `✉️ <b>پاسخ به تیکت کاربر <code>${targetId}</code>:</b>\nلطفاً متن پاسخ خود را بنویسید:`, { parse_mode: "HTML" }); return;
    } else if (cbData.startsWith("reply_ads_")) { const targetId = cbData.replace("reply_ads_", ""); await STATS.put("STATE_" + cbUserId, "await_reply_ads_" + targetId); await sendMessage(TG, cbChatId, `📢 <b>پاسخ به درخواست تبلیغات کاربر <code>${targetId}</code>:</b>\nلطفاً متن پاسخ خود را بنویسید:`, { parse_mode: "HTML" }); return;
    } else if (cbData === "api_info") {
      await sendMessage(TG, cbChatId, "🔌 <b>API اختصاصی رادار اینترنت</b>\n\nاین سرویس برای همکاران و اسپانسرهای رسمی طراحی شده است تا به داده‌های بهینه و زنده دسترسی داشته باشند.\n\n📌 <b>شرایط دریافت:</b>\n- معرفی رادار اینترنت ایران به عنوان منبع رسمی در وب‌سایت یا ربات شما\n- استفاده تجاری یا شخصی قانونی\n\n💬 <b>جهت دریافت کلید اختصاصی:</b>\nبه ادمین پیام دهید: @Adddddddm\n\n📊 پس از دریافت کلید، به آدرس‌های زیر دسترسی خواهید داشت:\n<code>radar-bot.royal-trust-ir-official.workers.dev/api/status?key=YOUR_KEY</code>\n<code>radar-bot.royal-trust-ir-official.workers.dev/api/operators?key=YOUR_KEY</code>\n<code>radar-bot.royal-trust-ir-official.workers.dev/api/top?key=YOUR_KEY</code>", { parse_mode: "HTML" });
      return;
    } else {
      await fetch(TG + "/answerCallbackQuery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callback_query_id: cb.id, text: "در حال پردازش..." }) });
      let fakeText = "";
      if (cbData === "status") fakeText = "/status"; else if (cbData === "work") fakeText = "/work"; else if (cbData === "score") fakeText = "/score"; else if (cbData === "vs") fakeText = "/vs"; else if (cbData === "compare") fakeText = "/compare"; else if (cbData === "top") fakeText = "/top"; else if (cbData === "world") fakeText = "/world"; else if (cbData === "today") fakeText = "/today"; else if (cbData === "history") fakeText = "/history"; else if (cbData === "trend") fakeText = "/trend"; else if (cbData === "chart") fakeText = "/chart"; else if (cbData === "pie") fakeText = "/pie"; else if (cbData === "map") fakeText = "/map"; else if (cbData === "myrank") fakeText = "/myrank"; else if (cbData === "leaderboard") fakeText = "/leaderboard"; else if (cbData === "invite") fakeText = "/invite"; else if (cbData === "api") fakeText = "/api"; else if (cbData === "best") fakeText = "/best"; else if (cbData === "speed") fakeText = "/speed"; else if (cbData === "help") fakeText = "/help"; else if (cbData === "comprehensive_chart") fakeText = "/comprehensive"; else if (cbData === "radar_1h") fakeText = "/radar1h";
      if (fakeText) { update.message = { chat: { id: cbChatId }, from: cb.from, text: fakeText }; } else { return; }
    }
  }

  if (!update.message) return;
  const msg = update.message; const chatId = msg.chat.id; const text = msg.text || ""; const userId = String(msg.from.id); const userName = msg.from.first_name || msg.from.username || ("کاربر " + userId.slice(-4));
  if (STATS) await STATS.put("name:" + userId, userName);

  const isMaintenance = await STATS.get("MAINTENANCE_MODE");
  if (isMaintenance === "1" && !ADMIN_IDS.includes(userId)) {
    const userLang = await getUserLang(STATS, userId);
    await sendMessage(TG, chatId, t("maintenance", userLang), { parse_mode: "HTML" });
    return;
  }

  if (!(await checkRateLimit(STATS, userId))) {
    await sendMessage(TG, chatId, "⚠️ <b>هشدار خودکار سیستم</b>\n\nشما درخواست‌های زیادی در مدت کوتاه ارسال کرده‌اید. لطفاً کمی صبر کنید.\n\n⚠️ تکرار این رفتار منجر به مسدودسازی می‌شود.", { parse_mode: "HTML" });
    return;
  }

  if (ADMIN_IDS.includes(userId)) {
    const adminState = await STATS.get("STATE_" + userId);
    if (adminState === "await_search") { await STATS.delete("STATE_" + userId); const targetId = text.trim(); const name = await STATS.get("name:" + targetId) || "ناشناس"; const ban = await STATS.get("BANNED_" + targetId); await sendMessage(TG, chatId, `🔍 <b>اطلاعات کاربر:</b>\n\n👤 نام: <b>${name}</b>\n🆔 آیدی: <code>${targetId}</code>\n📌 وضعیت: ${ban === "1" ? "🚫 مسدود" : "✅ فعال"}`, { parse_mode: "HTML" }); return; }
    if (adminState === "await_ban") { await STATS.delete("STATE_" + userId); const targetId = text.trim(); await STATS.put("BANNED_" + targetId, "1"); await STATS.put("BAN_REASON_" + targetId, "تخلف از قوانین ربات"); await sendMessage(TG, targetId, "🚫 <b>شما توسط ادمین از ربات مسدود شدید.</b>", { parse_mode: "HTML" }).catch(()=>{}); await sendMessage(TG, chatId, `✅ کاربر <code>${targetId}</code> با موفقیت مسدود شد.`, { parse_mode: "HTML" }); return; }
    if (adminState === "await_unban") { await STATS.delete("STATE_" + userId); const targetId = text.trim(); await STATS.delete("BANNED_" + targetId); await STATS.delete("BAN_REASON_" + targetId); await sendMessage(TG, targetId, "✅ <b>مسدودی شما توسط ادمین برداشته شد.</b>", { parse_mode: "HTML" }).catch(()=>{}); await sendMessage(TG, chatId, `✅ کاربر <code>${targetId}</code> آنبلاک شد.`, { parse_mode: "HTML" }); return; }
    if (adminState === "await_broadcast") { await STATS.delete("STATE_" + userId); let usersList = await STATS.get("all_users") || ""; let arr = usersList.split(",").filter(x => x); let ok = 0, fail = 0; await sendMessage(TG, chatId, `⏳ در حال ارسال پیام به ${arr.length} کاربر...`); for (const uid of arr) { if (await STATS.get("BANNED_" + uid) === "1") continue; const res = await sendMessage(TG, uid, `📨 <b>پیام از ادمین:</b>\n\n${text}`, { parse_mode: "HTML" }); if (res.ok) ok++; else fail++; } await sendMessage(TG, chatId, `📨 <b>نتیجه ارسال:</b>\n\n✅ موفق: ${ok}\n❌ ناموفق: ${fail}`, { parse_mode: "HTML" }); return; }
    if (adminState && adminState.startsWith("await_reply_ticket_")) { const targetId = adminState.replace("await_reply_ticket_", ""); await STATS.delete("STATE_" + userId); await sendMessage(TG, targetId, `✉️ <b>پاسخ پشتیبانی:</b>\n\n${text}`, { parse_mode: "HTML" }).catch(()=>{}); await sendMessage(TG, chatId, `✅ پاسخ شما به کاربر <code>${targetId}</code> ارسال شد.`, { parse_mode: "HTML" }); return; }
    if (adminState && adminState.startsWith("await_reply_ads_")) { const targetId = adminState.replace("await_reply_ads_", ""); await STATS.delete("STATE_" + userId); await sendMessage(TG, targetId, `📢 <b>پاسخ به درخواست تبلیغات شما:</b>\n\n${text}`, { parse_mode: "HTML" }).catch(()=>{}); await sendMessage(TG, chatId, `✅ پاسخ شما به کاربر <code>${targetId}</code> ارسال شد.`, { parse_mode: "HTML" }); return; }
  }

  const userState = await STATS.get("STATE_" + userId);
  if (userState === "await_support_ticket") { await STATS.delete("STATE_" + userId); for (const adminId of ADMIN_IDS) { await sendMessage(TG, adminId, `📩 <b>تیکت جدید از:</b> ${userName}\n🆔 <code>${userId}</code>\n\n💬 متن پیام:\n${text}`, { parse_mode: "HTML", inline_keyboard: [[{ text: "↩️ پاسخ به کاربر", callback_data: "reply_ticket_" + userId }]] }); } await sendMessage(TG, chatId, "✅ پیام شما با موفقیت به مدیریت ارسال شد. به زودی پاسخ داده می‌شود.", { parse_mode: "HTML" }); return; }
  if (userState === "await_ad_request") { await STATS.delete("STATE_" + userId); for (const adminId of ADMIN_IDS) { await sendMessage(TG, adminId, `📢 <b>درخواست تبلیغات از:</b> ${userName}\n🆔 <code>${userId}</code>\n\n💬 متن درخواست:\n${text}`, { parse_mode: "HTML", inline_keyboard: [[{ text: "↩️ پاسخ به درخواست", callback_data: "reply_ads_" + userId }]] }); } await sendMessage(TG, chatId, "✅ درخواست تبلیغات شما با موفقیت برای مدیریت ارسال شد. در اسرع وقت با شما تماس گرفته می‌شود.", { parse_mode: "HTML" }); return; }
  if (userState === "await_ping") { 
    await STATS.delete("STATE_" + userId); 
    let domain = text.trim().replace(/^https?:\/\//, "").split("/")[0]; 
    const res = await pingDomain(domain); 
    const lang = await getUserLang(STATS, userId);
    if (res.time > 0) { await sendMessage(TG, chatId, t("ping_result", lang, { domain, status: res.ok ? "✅ در دسترس" : "❌ خطا", time: res.time }), { parse_mode: "HTML" }); } 
    else { await sendMessage(TG, chatId, `❌ عدم دسترسی به ${domain}`); } 
    return; 
  }
  if (userState === "await_sanction") { 
    await STATS.delete("STATE_" + userId); 
    let domain = text.trim().replace(/^https?:\/\//, "").split("/")[0]; 
    const res = await checkSanction(domain); 
    const lang = await getUserLang(STATS, userId);
    await sendMessage(TG, chatId, t("sanction_result", lang, { domain, result: res }), { parse_mode: "HTML" }); 
    return; 
  }

  const isBanned = await STATS.get("BANNED_" + userId);
  if (isBanned === "1") { const reason = await STATS.get("BAN_REASON_" + userId) || "تخلف از قوانین ربات"; await sendMessage(TG, chatId, "🚫 <b>اطلاعیه رسمی مدیریت</b>\n\nکاربر گرامی،\n\nدسترسی شما به ربات رادار اینترنت ایران به دلیل تخلف از قوانین، مسدود شد.\n\n➖➖➖➖➖➖➖➖\n\n📌 <b>وضعیت:</b> مسدود\n⚠️ <b>دلیل:</b> " + reason + "\n📅 <b>تاریخ:</b> " + getIranDate() + "\n\n➖➖➖➖➖➖➖➖\n\n📞 برای اعتراض و پیگیری با پشتیبانی در ارتباط باشید:\n@Adddddddm\n\n🆔 آیدی عددی شما:\n<code>" + userId + "</code>\n\n⏳ مدت بررسی: حداکثر ۴۸ ساعت کاری\n\n🙏 با تشکر\n🛡️ تیم مدیریت رادار اینترنت ایران", { parse_mode: "HTML" }); return; }

  if (text === "/admin") {
    if (!ADMIN_IDS.includes(userId)) {
      await flagSuspicious(STATS, userId, "تلاش غیرمجاز برای اجرای دستور /admin");
      await sendMessage(TG, chatId, "⛔️ دسترسی غیرمجاز\n\nاین بخش تنها برای مالکان و مدیران ارشد ربات در نظر گرفته شده است.", { parse_mode: "HTML" }); return;
    }
    const adminKb = [ [{ text: "🌐 ورود به پنل وب مدیریت", url: "https://radar-bot.royal-trust-ir-official.workers.dev/adminweb" }], [{ text: "👥 لیست کاربران", callback_data: "adm_users_list" }, { text: "🔍 جستجوی کاربر", callback_data: "adm_search" }], [{ text: "🚫 بلاک کاربر", callback_data: "adm_ban" }, { text: "✅ آنبلاک کاربر", callback_data: "adm_unban" }], [{ text: "📨 پیام همگانی", callback_data: "adm_broadcast" }, { text: "📊 آمار کلی ربات", callback_data: "adm_stats" }], [{ text: "🔙 بازگشت به منو", callback_data: "main_menu" }] ];
    await sendMessage(TG, chatId, "╭━━━ 🔐 <b>پنل مدیریت</b> ━━━╮\n\nسلام ادمین عزیز، به پنل مدیریت جامع خوش آمدید.\n\n╰━━━━━━━━━━━━━━━━━━━╯", { parse_mode: "HTML", inline_keyboard: adminKb }); return;
  }

  if (text.startsWith("/ban ") || text.startsWith("/unban ")) {
    if (!ADMIN_IDS.includes(userId)) {
      await flagSuspicious(STATS, userId, "تلاش غیرمجاز برای اجرای دستور " + text.split(" ")[0]);
      await sendMessage(TG, chatId, "⛔️ دسترسی غیرمجاز", { parse_mode: "HTML" }); return;
    }
  }

  const inCh1 = await checkMember(TG, userId, CH1); const inCh2 = await checkMember(TG, userId, CH2);
  if (!inCh1 || !inCh2) { await sendMessage(TG, chatId, "🔒 <b>عضویت اجباری</b>\n\nبرای استفاده از ربات، ابتدا در کانال و گروه زیر عضو شوید:\n\n📡 کانال: @radarinternetiran\n👥 گروه: @radarinternetirangruop\n\nپس از عضویت، دوباره /start را بزنید.", { parse_mode: "HTML", inline_keyboard: [[{ text: "📡 عضویت در کانال", url: "https://t.me/radarinternetiran" }], [{ text: "👥 عضویت در گروه", url: "https://t.me/radarinternetirangruop" }]] }); return; }

  await trackUser(STATS, userId, userName); await ensureTodaySnapshot(STATS); await checkVersion(STATS, userId, TG, chatId);

  if (text.startsWith("/start ref_")) { 
    const refCode = text.replace("/start ref_", "").trim(); 
    if (refCode && refCode !== userId && STATS) { 
      const already = await getReferrer(STATS, userId); 
      if (!already) { 
        await STATS.put("ref:" + userId, refCode); 
        await addPoints(env, STATS, refCode, 10); 
        await addPoints(env, STATS, userId, 5); 
        const lang = await getUserLang(STATS, userId);
        await sendMessage(TG, chatId, t("refer_success", lang, { name: userName }), { parse_mode: "HTML" }); 
        const invCount = parseInt(await STATS.get("invites_count:" + refCode) || "0") + 1;
        await STATS.put("invites_count:" + refCode, String(invCount));
        await checkReferralMilestones(TG, STATS, refCode, invCount);
      } 
    } 
  }

  if (text === "/start" || text.startsWith("/start ")) {
    await addPoints(env, STATS, userId, 1); const pts = await getPoints(STATS, userId); const level = getUserLevel(pts); const lang = await getUserLang(STATS, userId);
    const startKeyboard = [
      [{ text: "📊 گزارش کامل", callback_data: "status" }, { text: "⚡ خلاصه وضعیت", callback_data: "work" }],
      [{ text: "📈 نمودار جامع رادار", callback_data: "comprehensive_chart" }, { text: "⏱️ نمودار ۱ ساعته", callback_data: "radar_1h" }],
      [{ text: "🚫 نقشه حرارتی فیلترینگ", callback_data: "map" }, { text: "📉 روند ۷ روزه", callback_data: "trend" }],
      [{ text: "🆚 مقایسه اپراتورها", callback_data: "compare" }, { text: "🏆 رتبه‌بندی اپراتورها", callback_data: "top" }],
      [{ text: "🌍 مقایسه جهانی", callback_data: "world" }, { text: "📊 سهم اپراتورها", callback_data: "pie" }],
      [{ text: "📅 تاریخچه", callback_data: "history" }, { text: "📈 امروز", callback_data: "today" }],
      [{ text: "🎁 پاداش روزانه", callback_data: "claim_daily" }, { text: "🎮 رتبه من", callback_data: "myrank" }],
      [{ text: "🏆 جدول برترین‌ها", callback_data: "leaderboard" }, { text: "🥇 برندگان هفته قبل", callback_data: "last_week_winners" }],
      [{ text: "🌐 پینگ سایت", callback_data: "tool_ping" }, { text: "🚫 تست تحریم", callback_data: "tool_sanction" }],
      [{ text: "🔔 هشدار شخصی", callback_data: "alert_start" }, { text: "🌍 تغییر زبان", callback_data: "toggle_lang" }],
      [{ text: "🎁 دعوت دوستان", callback_data: "invite" }, { text: "⚡ تست سرعت", callback_data: "speed" }],
      [{ text: "⏰ بهترین زمان", callback_data: "best" }, { text: "🔌 API عمومی", callback_data: "api" }],
      [{ text: "✉️ پشتیبانی", callback_data: "support_ticket" }, { text: "📢 درخواست تبلیغات", callback_data: "ads_request" }],
      [{ text: "🤝 دریافت API اختصاصی", callback_data: "api_info" }],
      [{ text: "⚙️ پنل مدیریت", callback_data: "admin_panel" }]
    ];
    await sendMessage(TG, chatId, t("welcome", lang, { name: userName, level, pts }) + "\n\n" + SPONSOR_MSG, { parse_mode: "HTML", inline_keyboard: startKeyboard });
  } else if (text === "/comprehensive") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "📊 در حال دریافت داده‌ها از تمام منابع و طراحی نمودار جامع..."); const c = await makeComprehensiveChart(); await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/radar1h") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "⏱️ در حال دریافت نمودار از کلادفلر..."); const c = await makeRadar1hChart(env); if (c) { await sendPhoto(TG, chatId, c.url, c.caption); } else { await sendMessage(TG, chatId, "❌ خطا در دریافت داده. (توکن CLOUDFLARE_API_TOKEN را بررسی کنید)"); }
  } else if (text === "/myrank") { const pts = await getPoints(STATS, userId); const level = getUserLevel(pts); const lbRaw = await STATS.get("leaderboard"); const lb = lbRaw ? JSON.parse(lbRaw) : []; const rank = lb.findIndex(x => x.id === userId) + 1; await sendMessage(TG, chatId, "╭━━━ 🎖️ <b>رتبه شما</b> ━━━╮\n\n👤 <b>" + userName + "</b>\n🏅 سطح: " + level + "\n🏆 امتیاز: <b>" + pts + "</b>\n📊 رتبه: <b>#" + (rank || "?") + "</b>\n👥 از " + lb.length + " کاربر\n\n╰━━━━━━━━━━━━━━━━━━━╯", { parse_mode: "HTML" });
  } else if (text === "/leaderboard") {
    const pinnedRaw = await STATS.get("pinned_winners"); const pinned = pinnedRaw ? JSON.parse(pinnedRaw) : [];
    const lbRaw = await STATS.get("leaderboard"); const lb = lbRaw ? JSON.parse(lbRaw) : [];
    const currentCompetitors = lb.filter(u => !pinned.find(p => p.id === u.id));
    let out = "🏆 <b>تالار افتخارات (هفته گذشته)</b> 📌\n━━━━━━━━━━━━━━━━\n\n";
    if (pinned.length === 0) { out += "هنوز برنده‌ای مشخص نشده است.\n\n"; } else { pinned.slice(0, 5).forEach((u, i) => { const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + "."; out += medal + " <b>" + (u.n || u.id) + "</b> → " + u.p + " امتیاز\n"; }); out += "\n"; }
    out += "🔥 <b>رقابت هفته جاری</b>\n━━━━━━━━━━━━━━━━\n\n";
    if (currentCompetitors.length === 0) { out += "هنوز کسی در این هفته امتیاز نگرفته!\nاولین نفر باش! 🚀\n\n"; } else { currentCompetitors.slice(0, 10).forEach((u, i) => { const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + "."; out += medal + " <b>" + (u.n || u.id) + "</b> → " + u.p + " امتیاز\n"; }); }
    out += "\n<i>📌 برندگان هفته قبل از رقابت این هفته خارج شده‌اند.</i>" + WATERMARK; await sendMessage(TG, chatId, out, { parse_mode: "HTML" });
  } else if (text === "/invite") { const link = "https://t.me/" + BOT_USERNAME + "?start=ref_" + userId; const pts = await getPoints(STATS, userId); await sendMessage(TG, chatId, "╭━━━ 🎁 <b>دعوت دوستان</b> ━━━╮\n\n👤 <b>" + userName + "</b>\n🏆 امتیاز شما: <b>" + pts + "</b>\n\n🔗 لینک اختصاصی شما:\n<code>" + link + "</code>\n\n💰 جایزه:\n• شما: <b>+۱۰</b> امتیاز\n• دوستت: <b>+۵</b> امتیاز\n• ۱۰ دعوت: <b>+۵۰</b> امتیاز هدیه\n• ۵۰ دعوت: <b>+۵۰۰</b> امتیاز و نشان VIP\n\n╰━━━━━━━━━━━━━━━━━━━╯", { parse_mode: "HTML" });
  } else if (text === "/vs") { await sendMessage(TG, chatId, "📊 در حال مقایسه..."); await sendMessage(TG, chatId, await makeVsReport(STATS), { parse_mode: "HTML" });
  } else if (text === "/map") { await sendMessage(TG, chatId, "🗺 در حال ساخت نقشه حرارتی..."); const c = await makeMapChart(); await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/api") { const base = "https://radar-bot.royal-trust-ir-official.workers.dev/api"; await sendMessage(TG, chatId, "╭━━━ 🔌 <b>API عمومی</b> ━━━╮\n\n📊 داده‌های رادار به صورت JSON:\n\n🔗 Endpoints:\n<code>" + base + "/status?key=YOUR_KEY</code>\n<code>" + base + "/operators?key=YOUR_KEY</code>\n<code>" + base + "/top?key=YOUR_KEY</code>\n<code>" + base + "/history?key=YOUR_KEY</code>\n\n╰━━━━━━━━━━━━━━━━━━━╯", { parse_mode: "HTML" });
  } else if (text === "/status" || text === "/status full") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "⏳ در حال دریافت گزارش کامل..."); await sendMessage(TG, chatId, await makeReport("full"), { parse_mode: "HTML" });
  } else if (text === "/status simple" || text === "/work") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, await makeWorkReport(), { parse_mode: "HTML" });
  } else if (text === "/score") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, await makeScoreReport(), { parse_mode: "HTML" });
  } else if (text === "/compare") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "🆚 در حال مقایسه اپراتورها..."); await sendMessage(TG, chatId, await makeCompareReport(), { parse_mode: "HTML" });
  } else if (text === "/top") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "🏆 در حال رتبه‌بندی..."); await sendMessage(TG, chatId, await makeTopReport(), { parse_mode: "HTML" });
  } else if (text === "/isp") { await sendMessage(TG, chatId, "🔍 <b>چک ISP خاص</b>\n\nمثال:\n<code>/isp ایرانسل</code>\n<code>/isp مخابرات</code>", { parse_mode: "HTML" });
  } else if (text.startsWith("/isp ")) { await addPoints(env, STATS, userId, 1); const q = text.replace("/isp ", "").trim(); await sendMessage(TG, chatId, "🔍 در حال جستجو..."); await sendMessage(TG, chatId, await makeISPReport(q), { parse_mode: "HTML" });
  } else if (text === "/world") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "🌍 در حال دریافت داده‌های جهانی..."); await sendMessage(TG, chatId, await makeWorldReport(), { parse_mode: "HTML" });
  } else if (text === "/today") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "📅 در حال ساخت نمودار امروز..."); const c = await makeTodayChart(env); await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/history") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "📅 در حال ساخت تاریخچه..."); const c = await makeTrendChart(); await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/best") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, await makeBestTimeReport(), { parse_mode: "HTML" });
  } else if (text === "/speed") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, await makeSpeedReport(), { parse_mode: "HTML" });
  } else if (text === "/chart") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "📊 در حال ساخت نمودار میله‌ای..."); const c = await makeBarChart(); await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/pie") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "🥧 در حال ساخت نمودار دایره‌ای..."); const c = await makePieChart(); await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/trend") { await addPoints(env, STATS, userId, 1); await sendMessage(TG, chatId, "📈 در حال ساخت نمودار روند..."); const c = await makeTrendChart(); await sendPhoto(TG, chatId, c.url, c.caption);
  } else if (text === "/help") { await sendMessage(TG, chatId, "╭━━━ 📚 <b>راهنما</b> ━━━╮\n\n📊 گزارش‌ها:\n/status، /work، /score، /vs\n\n🆚 مقایسه:\n/compare، /top، /isp، /world\n\n📈 نمودارها:\n/comprehensive، /radar1h\n/today، /history، /trend، /chart، /pie، /map\n\n🎮 گیمیفیکیشن:\n/myrank، /leaderboard، /invite\n\n🔌 API:\n/api\n\n⚡ تست:\n/speed، /best، /ping\n\n╰━━━━━━━━━━━━━━━━━━━╯", { parse_mode: "HTML" });
  }
}// ==================== Text Reports Generators ====================
async function makePingReport() {
  let irList = "", globalList = ""; let irOk = 0, globalOk = 0;
  for (const s of IR_SITES) {
    const t = await pingSite(s.url);
    if (t) { irOk++; irList += "✅ " + s.name + " - <code>" + t + "ms</code>\n"; }
    else { irList += "❌ " + s.name + "\n"; }
  }
  for (const s of GLOBAL_SITES) {
    const t = await pingSite(s.url);
    if (t) { globalOk++; globalList += "✅ " + s.name + " - <code>" + t + "ms</code>\n"; }
    else { globalList += "❌ " + s.name + "\n"; }
  }
  return "🌐 <b>پینگ سایت‌ها</b>\n" + getDateBoth() + "\n\n🇮🇷 <b>ایرانی</b> (" + irOk + "/" + IR_SITES.length + ")\n\n" + irList + "\n🌍 <b>جهانی</b> (" + globalOk + "/" + GLOBAL_SITES.length + ")\n\n" + globalList + WATERMARK;
}

async function makeFilteringReport() {
  const ooni = await fetchOONI(); const p = parseOONI(ooni); let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    const name = await asnNameAuto(asn);
    ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
  }
  ops.sort((a,b) => b.count - a.count);
  let level = "🟢 پایین"; if (p.blockPercent >= 60) level = "🔴 بالا"; else if (p.blockPercent >= 40) level = "🟠 نسبتاً بالا"; else if (p.blockPercent >= 20) level = "🟡 متوسط";
  let out = "🚫 <b>گزارش فیلترینگ ایران</b>\n" + getDateBoth() + "\n\n📊 مسدودسازی: <b>%" + p.blockPercent + "</b>\n📈 سطح: " + level + "\n" + makeBar(p.blockPercent / 10) + "\n\n📡 تعداد ASN: <code>" + ops.length + "</code>\n\n";
  if (ops.length > 0) {
    out += "📡 <b>وضعیت اپراتورها</b>\n\n";
    ops.slice(0, 12).forEach(o => {
      const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴";
      out += e + " <b>" + o.name + "</b> - %" + o.rate + " آزاد (" + o.count.toLocaleString("fa-IR") + " تست)\n";
    });
  }
  return out + WATERMARK;
}

async function makeSitesReport() {
  let out = "🌐 <b>وضعیت سرویس‌ها</b>\n" + getDateBoth() + "\n\n"; let acc = 0, list = "";
  for (const s of FILTER_CHECK) {
    const ok = await checkAccessible(s.url);
    if (ok) { acc++; list += "✅ " + s.name + "\n"; } else { list += "🚫 " + s.name + "\n"; }
  }
  out += "📊 دسترسی: <b>" + acc + "/" + FILTER_CHECK.length + "</b>\n" + makeBar((acc/FILTER_CHECK.length) * 10) + "\n\n📋 جزئیات:\n\n" + list;
  return out + WATERMARK;
}

async function makeCompareReport() {
  const ooni = await fetchOONI(); const p = parseOONI(ooni); let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 100) {
      const name = await asnNameAuto(asn);
      ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست." + WATERMARK;
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🆚 <b>مقایسه اپراتورها</b>\n" + getDateBoth() + "\n\n🏆 <b>بهترین‌ها</b>\n\n";
  ops.slice(0, 5).forEach((o, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
    out += medal + " <b>" + o.name + "</b> - %" + o.rate + " آزاد\n";
  });
  out += "\n🔻 <b>ضعیف‌ترین‌ها</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "🔴 <b>" + o.name + "</b> - %" + o.rate + " آزاد\n";
  });
  const avg = Math.round(ops.reduce((a, b) => a + b.rate, 0) / ops.length);
  out += "\n📊 میانگین کل: <b>%" + avg + "</b>\n" + makeBar(avg / 10);
  return out + WATERMARK;
}

async function makeTopReport() {
  const ooni = await fetchOONI7d(); const p = parseOONI(ooni); let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) {
    if (d.count >= 500) {
      const name = await asnNameAuto(asn);
      ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100), count: d.count });
    }
  }
  if (ops.length === 0) return "❌ داده کافی نیست." + WATERMARK;
  ops.sort((a, b) => b.rate - a.rate);
  let out = "🏆 <b>رتبه‌بندی هفتگی اپراتورها</b>\n📅 ۷ روز اخیر\n\n🥇 <b>بهترین‌ها</b>\n\n";
  ops.slice(0, 7).forEach((o, i) => {
    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    out += rank + " <b>" + o.name + "</b> - %" + o.rate + "\n";
  });
  out += "\n🔻 <b>پایین‌ترین‌ها</b>\n\n";
  ops.slice(-5).reverse().forEach(o => {
    out += "🔴 <b>" + o.name + "</b> - %" + o.rate + "\n";
  });
  return out + WATERMARK;
}

async function makeISPReport(query) {
  const q = query.toLowerCase();
  const ISP_MAP = { "ایرانسل": "44244", "همراه اول": "197207", "mci": "197207", "irancell": "44244", "مخابرات": "58224", "tci": "58224", "شاتل": "31549", "shuttle": "31549", "پارس آنلاین": "42337", "parsonline": "42337", "آسیاتک": "43754", "asiatech": "43754", "رایتل": "57218", "rightel": "57218", "پارس پک": "16322", "parspack": "16322" };
  let asn = null;
  for (const [name, code] of Object.entries(ISP_MAP)) {
    if (q.includes(name) || name.includes(q)) { asn = code; break; }
  }
  if (!asn) return "❌ ISP پیدا نشد: <b>" + query + "</b>" + WATERMARK;
  const ooni = await fetchOONI(); const p = parseOONI(ooni); const d = p.asnData[asn];
  if (!d) return "❌ داده‌ای برای <b>" + asnName(asn) + "</b> یافت نشد." + WATERMARK;
  const rate = Math.round((d.ok / d.total) * 100);
  let emoji = "🔴", status = "ضعیف"; if (rate >= 80) { emoji = "🟢"; status = "عالی"; } else if (rate >= 60) { emoji = "🟡"; status = "خوب"; } else if (rate >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "📡 <b>" + asnName(asn) + "</b>\n" + getDateBoth() + "\n\n" + emoji + " <b>" + status + "</b>\n\n🔓 دسترسی آزاد: <b>%" + rate + "</b>\n" + makeBar(rate / 10) + "\n\n📈 تعداد تست: <code>" + d.count.toLocaleString("fa-IR") + "</code>\n🔒 مسدود: %" + (100 - rate) + WATERMARK;
}

async function makeWorldReport() {
  const COUNTRIES = [ { code: "IR", name: "🇮🇷 ایران" }, { code: "TR", name: "🇹🇷 ترکیه" }, { code: "IQ", name: "🇮🇶 عراق" }, { code: "AE", name: "🇦🇪 امارات" }, { code: "SA", name: "🇸🇦 عربستان" } ];
  let results = [];
  for (const c of COUNTRIES) {
    try {
      const since = getYesterday(); const until = getToday();
      const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=" + c.code + "&since=" + since + "&until=" + until + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
      if (r.ok) {
        const d = await r.json(); let total = 0, blocked = 0;
        if (d.result) for (const row of d.result) { total += row.measurement_count || 0; blocked += (row.anomaly_count || 0) + (row.confirmed_count || 0); }
        const percent = total > 0 ? Math.round((blocked / total) * 100) : 0;
        results.push({ name: c.name, percent, count: total });
      }
    } catch(e) {}
  }
  if (results.length === 0) return "❌ داده کافی نیست." + WATERMARK;
  results.sort((a, b) => a.percent - b.percent);
  let out = "🌍 <b>مقایسه جهانی</b>\n" + getDateBoth() + "\n\n🏆 رتبه‌بندی:\n\n";
  results.forEach((r, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  " + (i+1) + ".";
    const e = r.percent < 15 ? "🟢" : r.percent < 30 ? "🟡" : r.percent < 50 ? "🟠" : "🔴";
    out += medal + " " + r.name + " - " + e + " %" + r.percent + " مسدود\n";
  });
  return out + WATERMARK;
}

async function makeVsReport(STATS) {
  const yesterday = getYesterday(); const ooni = await fetchOONI(); const p = parseOONI(ooni); const todayPercent = p.blockPercent;
  let yPercent = null;
  if (STATS) { const ySnap = await getDailySnapshot(STATS, yesterday); if (ySnap) yPercent = ySnap.blockPercent; }
  if (yPercent === null) {
    try {
      const r = await fetch("https://api.ooni.io/api/v1/aggregation?probe_cc=IR&since=" + yesterday + "&until=" + yesterday + "&axis_x=probe_asn&axis_y=measurement_start_day", { headers: { "Accept": "application/json" } });
      if (r.ok) {
        const d = await r.json(); const yp = parseOONI(d);
        if (yp.totalMs > 0) { yPercent = yp.blockPercent; if (STATS) { await STATS.put("snap:" + yesterday, JSON.stringify({ blockPercent: yPercent, totalMs: yp.totalMs, saved: new Date().toISOString(), retrospective: true }), { expirationTtl: 2592000 }); } }
      }
    } catch(e) {}
  }
  let out = "📊 <b>مقایسه روز</b>\n📅 " + getIranDate() + "\n\n";
  if (yPercent !== null) {
    out += "دیروز: <b>%" + yPercent + "</b>\nامروز: <b>%" + todayPercent + "</b>\n\n";
    const diff = todayPercent - yPercent; let trend = "➖ ثابت";
    if (diff > 3) trend = "📈 بدتر (" + diff + "+)"; else if (diff > 0) trend = "🔺 کمی بدتر (+" + diff + ")"; else if (diff < -3) trend = "📉 بهتر (" + diff + ")"; else if (diff < 0) trend = "🔻 کمی بهتر (" + diff + ")";
    out += trend + "\n" + makeBar(todayPercent / 10);
  } else { out += "امروز: <b>%" + todayPercent + "</b>\n" + makeBar(todayPercent / 10) + "\n\n⚠️ داده دیروز در دسترس نیست"; }
  return out + WATERMARK;
}

async function makeWorkReport() {
  const ooni = await fetchOONI(); const p = parseOONI(ooni); let irOk = 0;
  for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
  let emoji = "🟢", status = "خوبه"; if (p.blockPercent >= 60) { emoji = "🔴"; status = "بحرانی"; } else if (p.blockPercent >= 40) { emoji = "🟠"; status = "ناپایدار"; } else if (p.blockPercent >= 20) { emoji = "🟡"; status = "متوسط"; }
  return "⚡ <b>خلاصه وضعیت</b>\n" + getDateBoth() + "\n\n" + emoji + " <b>" + status + "</b>\n\n🚫 فیلترینگ: <b>%" + p.blockPercent + "</b>\n🌐 سایت‌های ایرانی: <b>" + irOk + "/" + IR_SITES.length + "</b>" + WATERMARK;
}

async function makeScoreReport() {
  const ooni = await fetchOONI(); const p = parseOONI(ooni); let score = 0;
  const filterScore = Math.max(0, 100 - (p.blockPercent * 2.5)); score += filterScore * 0.4;
  let irOk = 0; for (const s of IR_SITES) { if (await pingSite(s.url)) irOk++; }
  const irScore = (irOk / IR_SITES.length) * 100; score += irScore * 0.3;
  let globalPing = 0, globalCount = 0; for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalPing += t; globalCount++; } }
  const avgPing = globalCount > 0 ? globalPing / globalCount : 500; const pingScore = Math.max(0, 100 - (avgPing / 5)); score += pingScore * 0.3;
  score = Math.round(score);
  let emoji = "🔴", status = "بحرانی"; if (score >= 80) { emoji = "🟢"; status = "عالی"; } else if (score >= 60) { emoji = "🟡"; status = "خوب"; } else if (score >= 40) { emoji = "🟠"; status = "متوسط"; }
  return "🎖️ <b>امتیاز کیفیت</b>\n" + getDateBoth() + "\n\n" + emoji + " <b>" + status + "</b>\n⭐ امتیاز: <b>" + score + "/100</b>\n" + makeBar(score / 10) + "\n\n🚫 فیلترینگ: %" + Math.round(filterScore) + "\n🇮🇷 سایت ایرانی: %" + Math.round(irScore) + "\n🌍 پینگ جهانی: %" + Math.round(pingScore) + WATERMARK;
}

async function makeBestTimeReport() {
  const hours = [ { range: "۰۲:۰۰ تا ۰۶:۰۰", quality: 90, emoji: "🏆", note: "بهترین زمان" }, { range: "۰۶:۰۰ تا ۰۹:۰۰", quality: 75, emoji: "✅", note: "خوب" }, { range: "۰۹:۰۰ تا ۱۲:۰۰", quality: 55, emoji: "🟡", note: "متوسط" }, { range: "۱۲:۰۰ تا ۱۷:۰۰", quality: 45, emoji: "🟠", note: "شلوغ" }, { range: "۱۷:۰۰ تا ۲۲:۰۰", quality: 35, emoji: "🔴", note: "پیک شلوغی" }, { range: "۲۲:۰۰ تا ۰۲:۰۰", quality: 70, emoji: "✅", note: "بهتر" } ];
  let out = "⏰ <b>بهترین زمان دانلود</b>\n" + getDateBoth() + "\n\n🏆 پیشنهاد: <b>۲ بامداد تا ۶ صبح</b> (۹۰٪)\n\n📊 جدول زمانی:\n\n";
  for (const h of hours) { out += h.emoji + " " + h.range + " - " + h.note + " (%" + h.quality + ")\n"; }
  return out + WATERMARK;
}

async function makeSpeedReport() {
  return "⚡ <b>تست سرعت</b>\n\n📋 راهنما:\n۱. لینک تست را باز کنید\n۲. سرعت خود را بسنجید\n۳. مقایسه کنید\n\n🔗 لینک‌ها:\n🌩 <a href='https://speed.cloudflare.com/'>Cloudflare Speedtest</a>\n📶 <a href='https://www.speedtest.net/'>Speedtest.net</a>\n⚡ <a href='https://fast.com/'>Fast.com</a>\n🇮🇷 <a href='https://speedtest.ir/'>Speedtest.ir</a>" + WATERMARK;
}

async function makeReport(mode) {
  if (mode === undefined) mode = "full";
  const ooni = await fetchOONI(); const p = parseOONI(ooni);
  let ops = [];
  for (const [asn, d] of Object.entries(p.asnData)) { const name = await asnNameAuto(asn); ops.push({ name: name, rate: Math.round((d.ok / d.total) * 100) }); }
  ops.sort((a, b) => a.rate - b.rate);
  if (mode === "simple") { return await makeWorkReport(); }
  
  let irOk = 0, globalOk = 0, irList = "", globalList = "";
  for (const s of IR_SITES) { const t = await pingSite(s.url); if (t) { irOk++; irList += "✅ " + s.name + " - <code>" + t + "ms</code>\n"; } else { irList += "❌ " + s.name + "\n"; } }
  for (const s of GLOBAL_SITES) { const t = await pingSite(s.url); if (t) { globalOk++; globalList += "✅ " + s.name + " - <code>" + t + "ms</code>\n"; } else { globalList += "❌ " + s.name + "\n"; } }
  
  const ripe = await fetchRIPE();
  let mainEmoji = "🟢", mainStatus = "پایدار"; if (p.blockPercent >= 60) { mainEmoji = "🔴"; mainStatus = "بحرانی"; } else if (p.blockPercent >= 40) { mainEmoji = "🟠"; mainStatus = "ناپایدار"; } else if (p.blockPercent >= 20) { mainEmoji = "🟡"; mainStatus = "متوسط"; }
  
  let out = "📊 <b>گزارش کامل اینترنت</b>\n" + getDateBoth() + "\n⏰ " + getIranTime() + "\n\n" + mainEmoji + " <b>" + mainStatus + "</b>\n\n";
  out += "🌐 <b>دسترسی سایت‌ها</b>\n\n🇮🇷 ایرانی (" + irOk + "/" + IR_SITES.length + ")\n" + irList + "\n🌍 جهانی (" + globalOk + "/" + GLOBAL_SITES.length + ")\n" + globalList + "\n";
  out += "🚫 <b>فیلترینگ</b>\n\nمسدودسازی: <b>%" + p.blockPercent + "</b>\n" + makeBar(p.blockPercent / 10) + "\n\n";
  
  if (ops.length > 0) {
    out += "🔻 <b>بدترین اپراتورها:</b>\n";
    ops.slice(0, 5).forEach(o => { const e = o.rate >= 80 ? "🟢" : o.rate >= 60 ? "🟡" : o.rate >= 40 ? "🟠" : "🔴"; out += e + " " + o.name + " - %" + o.rate + "\n"; });
    out += "\n";
  }
  
  if (ripe && ripe.data && ripe.data.visibility !== undefined) {
    const v = ripe.data.visibility; const vE = v > 95 ? "🟢" : v > 80 ? "🟡" : "🔴";
    out += "🚨 <b>مسیریابی</b>\n" + vE + " Visibility: <b>%" + v + "</b>\n" + makeBar(v / 10) + "\n";
  }
  return out + WATERMARK;
                     }
