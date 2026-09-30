import time
import os
import requests

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
CHANNEL = "radar_internet_ir"
RADAR_TOKEN = os.environ.get("RADAR_TOKEN", "")
API = f"https://botapi.rubika.ir/v3/{BOT_TOKEN}"

last_update_id = None

def get_updates():
    global last_update_id
    params = {"limit": 10}
    if last_update_id:
        params["offset_id"] = last_update_id
    try:
        r = requests.get(f"{API}/getUpdates", params=params, timeout=30)
        return r.json()
    except Exception as e:
        print(f"خطا: {e}")
        return None

def send_message(chat_id, text, inline=None):
    body = {"chat_id": chat_id, "text": text}
    if inline:
        body["inline_keypad"] = inline
    try:
        requests.post(f"{API}/sendMessage", json=body, timeout=10)
    except Exception as e:
        print(f"خطا در ارسال: {e}")

def check_member(user_id):
    try:
        r = requests.post(f"{API}/getChatMember", 
            json={"chat_id": "@" + CHANNEL, "user_id": user_id}, timeout=10)
        d = r.json()
        print(f"Check member: {d}")
        if d.get("status") == "OK":
            st = d.get("data", {}).get("member", {}).get("status")
            return st in ["Member", "Admin", "Creator"]
    except Exception as e:
        print(f"خطا: {e}")
    return False

def get_radar_data():
    try:
        r = requests.get(
            "https://api.cloudflare.com/client/v4/radar/quality/iqi/summary",
            headers={"Authorization": f"Bearer {RADAR_TOKEN}"},
            params={"location": "IR", "dateRange": "1d"}, timeout=10)
        d = r.json()
        if d.get("success"):
            return d.get("result", {})
    except Exception as e:
        print(f"خطا: {e}")
    return {}

def make_report():
    data = get_radar_data()
    iqi = int(data.get("iqi", {}).get("score", 50))
    latency = int(data.get("latency", {}).get("value", 15))
    emoji = "🟢" if iqi >= 80 else "🟡" if iqi >= 60 else "🟠" if iqi >= 40 else "🔴"
    status = "پایدار" if iqi >= 80 else "نسبتا پایدار" if iqi >= 60 else "ناپایدار" if iqi >= 40 else "بحرانی"
    t = time.strftime("%H:%M:%S")
    return f"""📊 گزارش وضعیت شبکه

وضعیت: {emoji} {status}
🛡️ سلامت شبکه: %{iqi}
📉 افت: %{100-iqi}

🌐 کیفیت اتصال
⭐ QoE: %{iqi}
⏱️ تاخیر: {latency} ms

🕒 {t}
🤖 رادار اینترنت"""

def handle_update(update):
    msg = update.get("new_message", {})
    if not msg:
        return
    chat_id = update.get("chat_id")
    text = msg.get("text", "")
    user_id = msg.get("sender_id")
    
    print(f"پیام: {text} از {user_id}")
    
    if not check_member(user_id):
        send_message(chat_id, "🔒 برای استفاده، ابتدا در کانال @radar_internet_ir عضو شوید.",
            [[{"text": "📡 عضویت", "type": "join_channel", "username": CHANNEL}]])
        return
    
    if text == "/start":
        send_message(chat_id, "سلام! 👋\n\nبه ربات رادار اینترنت خوش آمدید.\n\n📊 برای گزارش: /status")
    elif text == "/status":
        send_message(chat_id, "🔍 در حال دریافت...")
        send_message(chat_id, make_report())
    elif text == "/help":
        send_message(chat_id, "دستورات:\n/start\n/status\n/help")

def main():
    global last_update_id
    print("🤖 ربات رادار اینترنت فعال شد!")
    while True:
        data = get_updates()
        if data and data.get("status") == "OK":
            updates = data.get("data", {}).get("updates", [])
            for u in updates:
                handle_update(u)
                last_update_id = u.get("update_id")
        time.sleep(3)

main()
