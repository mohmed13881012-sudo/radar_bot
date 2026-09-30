import time
import os
import requests

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
CHANNEL_1 = "radar_internet_ir"
CHANNEL_2 = "royal_trust_ir_official"
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

def check_single_channel(user_id, channel):
    """چک کردن عضویت در یک کانال"""
    try:
        r = requests.post(f"{API}/getChatMember", 
            json={"chat_id": "@" + channel, "user_id": user_id}, timeout=10)
        d = r.json()
        if d.get("status") == "OK":
            st = d.get("data", {}).get("member", {}).get("status")
            return st in ["Member", "Admin", "Creator"]
    except Exception as e:
        print(f"خطا در چک {channel}: {e}")
    return False

def check_member(user_id):
    """چک کردن عضویت در هر دو کانال"""
    in_channel_1 = check_single_channel(user_id, CHANNEL_1)
    in_channel_2 = check_single_channel(user_id, CHANNEL_2)
    
    print(f"عضویت: کانال ۱ = {in_channel_1}, کانال ۲ = {in_channel_2}")
    
    return in_channel_1 and in_channel_2

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
        send_message(chat_id, 
            "🔒 برای استفاده از ربات، ابتدا در کانال‌های زیر عضو شوید:\n\n"
            "1️⃣ رادار اینترنت\n"
            "2️⃣ رویال تراست",
            [
                [{"text": "📡 عضویت در رادار اینترنت", "type": "join_channel", "username": CHANNEL_1}],
                [{"text": "👑 عضویت در رویال تراست", "type": "join_channel", "username": CHANNEL_2}]
            ])
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
