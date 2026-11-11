export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // ==================== توابع کمکی ====================
    async function hashPassword(password) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function getCookie(request, name) {
      const cookieString = request.headers.get("Cookie");
      if (cookieString) {
        const cookies = cookieString.split(";");
        for (let cookie of cookies) {
          const [cookieName, cookieValue] = cookie.trim().split("=");
          if (cookieName === name) return cookieValue;
        }
      }
      return null;
    }

    // ==================== API ها ====================
    
    if (url.pathname === '/api/register' && method === 'POST') {
      try {
        const { phone, password, role } = await request.json();
        if (!phone || !phone.match(/^09[0-9]{9}$/)) return new Response(JSON.stringify({ error: "شماره موبایل نامعتبر است" }), { status: 400 });
        if (!password || !role) return new Response(JSON.stringify({ error: "همه فیلدها الزامی است" }), { status: 400 });

        const existing = await env.DB.prepare("SELECT id FROM users WHERE phone = ?").bind(phone).first();
        if (existing) return new Response(JSON.stringify({ error: "این شماره قبلا ثبت شده است" }), { status: 400 });

        const userId = crypto.randomUUID();
        const hashedPassword = await hashPassword(password);

        await env.DB.prepare("INSERT INTO users (id, phone, password_hash, role) VALUES (?, ?, ?, ?)").bind(userId, phone, hashedPassword, role).run();
        await env.DB.prepare("INSERT INTO profiles (user_id) VALUES (?)").bind(userId).run();

        const headers = new Headers();
        headers.append("Set-Cookie", `session=${userId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
        headers.append("Content-Type", "application/json");
        return new Response(JSON.stringify({ success: true, role: role }), { status: 200, headers: headers });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }

    if (url.pathname === '/api/login' && method === 'POST') {
      try {
        const { phone, password } = await request.json();
        const hashedPassword = await hashPassword(password);
        const user = await env.DB.prepare("SELECT id, role FROM users WHERE phone = ? AND password_hash = ?").bind(phone, hashedPassword).first();
        
        if (!user) return new Response(JSON.stringify({ error: "شماره یا رمز عبور اشتباه است" }), { status: 401 });

        const headers = new Headers();
        headers.append("Set-Cookie", `session=${user.id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
        headers.append("Content-Type", "application/json");
        return new Response(JSON.stringify({ success: true, role: user.role }), { status: 200, headers: headers });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }

    if (url.pathname === '/api/get_profile' && method === 'GET') {
      const userId = getCookie(request, "session");
      if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

      const user = await env.DB.prepare("SELECT u.phone, u.role, p.full_name, p.skills, p.bio, p.company_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?").bind(userId).first();
      return new Response(JSON.stringify({ user }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === '/api/save_profile' && method === 'POST') {
      const userId = getCookie(request, "session");
      if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

      try {
        const { full_name, skills, bio, company_name } = await request.json();
        await env.DB.prepare("UPDATE profiles SET full_name = ?, skills = ?, bio = ?, company_name = ? WHERE user_id = ?").bind(full_name, skills, bio, company_name, userId).run();
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }

    // ==================== صفحه ورود / ثبت‌نام ====================
    if (url.pathname === '/') {
      const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>هم‌کد | ورود</title>
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg: #0f172a; --surface: #1e293b; --text: #f8fafc; --muted: #94a3b8; --primary: #3b82f6; --border: #334155; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Vazirmatn', sans-serif; }
        body { background-color: var(--bg); color: var(--text); height: 100vh; display: flex; align-items: center; justify-content: center; background-image: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15), transparent 50%); }
        .container { width: 100%; max-width: 420px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px 30px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .logo { font-size: 1.8rem; font-weight: 900; margin-bottom: 5px; display: flex; justify-content: center; align-items: center; gap: 10px; }
        .logo i { color: var(--primary); }
        .subtitle { color: var(--muted); font-size: 0.9rem; margin-bottom: 30px; }
        .form-group { margin-bottom: 15px; text-align: right; }
        .form-group label { display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 5px; font-weight: 600; }
        .form-control { width: 100%; padding: 14px; border-radius: 10px; border: 1px solid var(--border); background: #0b1120; color: #fff; outline: none; transition: 0.3s; direction: ltr; text-align: left; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        .btn { width: 100%; padding: 14px; border-radius: 10px; border: none; background: var(--primary); color: #fff; font-weight: bold; cursor: pointer; margin-top: 10px; transition: 0.3s; }
        .btn:hover { background: #2563eb; transform: translateY(-2px); }
        .switch-text { margin-top: 20px; font-size: 0.85rem; color: var(--muted); }
        .switch-text a { color: var(--primary); cursor: pointer; text-decoration: none; font-weight: bold; }
        .role-selector { display: flex; gap: 10px; margin-bottom: 15px; }
        .role-card { flex: 1; padding: 15px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; text-align: center; background: #0b1120; transition: 0.3s; }
        .role-card.active { border-color: var(--primary); background: rgba(59, 130, 246, 0.1); }
        .role-card i { font-size: 1.5rem; color: var(--muted); margin-bottom: 5px; display: block; }
        .role-card.active i { color: var(--primary); }
        .alert { padding: 10px; border-radius: 8px; margin-bottom: 15px; display: none; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444; font-size: 0.85rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo"><i class="fa-solid fa-code"></i> هم‌کد</div>
        <p class="subtitle" id="subtitle">به پلتفرم فریلنسری هم‌کد خوش آمدید</p>
        <div id="alert-box" class="alert"></div>

        <form id="register-form" style="display: none;" onsubmit="handleRegister(event)">
            <div class="role-selector">
                <div class="role-card active" onclick="selectRole('freelancer', this)"><i class="fa-solid fa-user-tie"></i> برنامه‌نویس</div>
                <div class="role-card" onclick="selectRole('employer', this)"><i class="fa-solid fa-building"></i> کارفرما</div>
            </div>
            <div class="form-group">
                <label>شماره موبایل</label>
                <input type="tel" id="reg-phone" class="form-control" required placeholder="09123456789">
            </div>
            <div class="form-group">
                <label>رمز عبور</label>
                <input type="password" id="reg-password" class="form-control" required placeholder="********">
            </div>
            <button type="submit" class="btn">ثبت‌نام</button>
        </form>

        <form id="login-form" onsubmit="handleLogin(event)">
            <div class="form-group">
                <label>شماره موبایل</label>
                <input type="tel" id="login-phone" class="form-control" required placeholder="09123456789">
            </div>
            <div class="form-group">
                <label>رمز عبور</label>
                <input type="password" id="login-password" class="form-control" required placeholder="********">
            </div>
            <button type="submit" class="btn">ورود</button>
        </form>

        <p class="switch-text" id="switch-area">حساب ندارید؟ <a onclick="toggleAuth()">ثبت‌نام کنید</a></p>
    </div>

    <script>
        let selectedRole = 'freelancer';
        let isLogin = true;

        function toggleAuth() {
            isLogin = !isLogin;
            document.getElementById('login-form').style.display = isLogin ? 'block' : 'none';
            document.getElementById('register-form').style.display = isLogin ? 'none' : 'block';
            document.getElementById('subtitle').innerText = isLogin ? 'به پلتفرم فریلنسری هم‌کد خوش آمدید' : 'یک حساب کاربری جدید بسازید';
            document.getElementById('switch-area').innerHTML = isLogin ? 'حساب ندارید؟ <a onclick="toggleAuth()">ثبت‌نام کنید</a>' : 'حساب دارید؟ <a onclick="toggleAuth()">وارد شوید</a>';
        }

        function selectRole(role, el) {
            selectedRole = role;
            document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
        }

        function showError(msg) {
            const box = document.getElementById('alert-box');
            box.innerText = msg;
            box.style.display = 'block';
            setTimeout(() => { box.style.display = 'none'; }, 3000);
        }

        async function handleRegister(e) {
            e.preventDefault();
            const phone = document.getElementById('reg-phone').value;
            const password = document.getElementById('reg-password').value;

            const res = await fetch('/api/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password, role: selectedRole })
            });
            const data = await res.json();
            if (data.success) { window.location.href = '/dashboard'; } 
            else { showError(data.error); }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const phone = document.getElementById('login-phone').value;
            const password = document.getElementById('login-password').value;

            const res = await fetch('/api/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();
            if (data.success) { window.location.href = '/dashboard'; } 
            else { showError(data.error); }
        }
    </script>
</body>
</html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // ==================== داشبورد کاربری ====================
    if (url.pathname === '/dashboard') {
      const userId = getCookie(request, "session");
      if (!userId) return Response.redirect(url.origin + '/', 302);

      const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>داشبورد | هم‌کد</title>
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --bg: #0f172a; --surface: #1e293b; --surface-hover: #334155; --text: #f8fafc; --muted: #94a3b8; --primary: #3b82f6; --border: #334155; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Vazirmatn', sans-serif; }
        body { background-color: var(--bg); color: var(--text); min-height: 100vh; display: flex; }
        
        .sidebar { width: 260px; background: #0b1120; border-left: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; height: 100vh; position: fixed; right: 0; top: 0; z-index: 100; }
        .logo { font-size: 1.5rem; font-weight: 900; display: flex; align-items: center; gap: 10px; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .logo i { color: var(--primary); }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 15px; border-radius: 10px; color: var(--muted); cursor: pointer; transition: 0.3s; margin-bottom: 5px; font-weight: 600; text-decoration: none; }
        .nav-item:hover, .nav-item.active { background: rgba(59, 130, 246, 0.1); color: var(--primary); }
        .nav-item i { width: 20px; text-align: center; font-size: 1.1rem; }
        
        .main-content { flex: 1; margin-right: 260px; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .header h1 { font-size: 1.8rem; font-weight: 800; }
        
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 30px; margin-bottom: 25px; }
        .card-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 15px; }
        .card-title i { color: var(--primary); }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: var(--muted); font-size: 0.9rem; font-weight: 600; }
        .form-control { width: 100%; padding: 14px; border-radius: 10px; border: 1px solid var(--border); background: #0b1120; color: #fff; outline: none; font-family: inherit; transition: 0.3s; }
        .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        textarea.form-control { min-height: 120px; resize: vertical; }

        .btn { padding: 14px 24px; border-radius: 10px; border: none; background: var(--primary); color: #fff; font-size: 1rem; font-weight: bold; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 8px; }
        .btn:hover { background: #2563eb; transform: translateY(-2px); }

        .alert { padding: 15px; border-radius: 10px; margin-bottom: 20px; display: none; font-weight: 600; text-align: center; }
        .alert-success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid #10b981; }

        @media (max-width: 768px) {
            .sidebar { width: 100%; height: 70px; flex-direction: row; bottom: 0; top: auto; border-left: none; border-top: 1px solid var(--border); justify-content: space-around; padding: 0 10px; }
            .logo { display: none; }
            .nav-item { flex-direction: column; padding: 8px; font-size: 0.75rem; gap: 4px; margin: 0; }
            .nav-item i { font-size: 1.3rem; }
            .main-content { margin-right: 0; margin-bottom: 70px; padding: 20px; }
            .form-row { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <aside class="sidebar">
        <div class="logo"><i class="fa-solid fa-code"></i> هم‌کد</div>
        <a href="/dashboard" class="nav-item active"><i class="fa-solid fa-user"></i> پروفایل من</a>
        <a href="#" class="nav-item" onclick="alert('به زودی...')"><i class="fa-solid fa-briefcase"></i> پروژه‌ها</a>
        <a href="/logout" class="nav-item" style="margin-top: auto; color: #ef4444;"><i class="fa-solid fa-arrow-right-from-bracket"></i> خروج</a>
    </aside>

    <main class="main-content">
        <div class="header">
            <h1>پروفایل کاربری</h1>
        </div>

        <div id="alert-box" class="alert alert-success"></div>

        <form id="profile-form" onsubmit="saveProfile(event)">
            <div class="card">
                <div class="card-title"><i class="fa-solid fa-id-card"></i> اطلاعات اصلی</div>
                <div class="form-row">
                    <div class="form-group">
                        <label>نام و نام خانوادگی</label>
                        <input type="text" id="full_name" class="form-control" required>
                    </div>
                    <div class="form-group" id="company-group" style="display:none;">
                        <label>نام شرکت (برای کارفرما)</label>
                        <input type="text" id="company_name" class="form-control">
                    </div>
                    <div class="form-group" id="skills-group" style="display:none;">
                        <label>مهارت‌ها (با کاما جدا کنید)</label>
                        <input type="text" id="skills" class="form-control" placeholder="HTML, CSS, React, Node.js">
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title"><i class="fa-solid fa-align-right"></i> توضیحات</div>
                <div class="form-group">
                    <label>درباره من</label>
                    <textarea id="bio" class="form-control" placeholder="درباره خودتان و تجربیاتتان بنویسید..."></textarea>
                </div>
            </div>

            <button type="submit" class="btn"><i class="fa-solid fa-floppy-disk"></i> ذخیره تغییرات</button>
        </form>
    </main>

    <script>
        async function loadProfile() {
            const res = await fetch('/api/get_profile');
            if (res.ok) {
                const data = await res.json();
                const u = data.user;
                document.getElementById('full_name').value = u.full_name || '';
                document.getElementById('bio').value = u.bio || '';
                document.getElementById('skills').value = u.skills || '';
                document.getElementById('company_name').value = u.company_name || '';

                if (u.role === 'freelancer') {
                    document.getElementById('skills-group').style.display = 'block';
                } else if (u.role === 'employer') {
                    document.getElementById('company-group').style.display = 'block';
                }
            } else {
                window.location.href = '/';
            }
        }

        async function saveProfile(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> در حال ذخیره...';
            btn.disabled = true;

            const payload = {
                full_name: document.getElementById('full_name').value,
                bio: document.getElementById('bio').value,
                skills: document.getElementById('skills').value,
                company_name: document.getElementById('company_name').value
            };

            const res = await fetch('/api/save_profile', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const box = document.getElementById('alert-box');
            if (res.ok) {
                box.textContent = '✅ تغییرات با موفقیت ذخیره شد.';
                box.style.display = 'block';
                setTimeout(() => { box.style.display = 'none'; }, 3000);
            } else {
                alert('خطا در ذخیره اطلاعات');
            }

            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> ذخیره تغییرات';
            btn.disabled = false;
        }

        window.onload = loadProfile;
    </script>
</body>
</html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === '/logout') {
      const headers = new Headers();
      headers.append("Set-Cookie", `session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
      headers.append("Location", "/");
      return new Response("Logged out", { status: 302, headers });
    }

    return new Response("صفحه مورد نظر یافت نشد", { status: 404 });
  }
};
