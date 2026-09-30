import time
import os
import sys
import threading
import requests
from http.server import HTTPServer, BaseHTTPRequestHandler

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
RADAR_TOKEN = os.environ.get("RADAR_TOKEN", "")
API = f"https://botapi.rubika.ir/v3/{BOT_TOKEN}"

# ==================== وب‌سرور برای Render ====================
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write("Radar Bot OK".encode("utf-8"))
    def log_message(self, *args):
        pass

def run_server():
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"Web server on {port}", flush=True)
    server.serve_forever()

# ==================== توابع ====================
def log(msg):
    print(msg, flush=True)

def get_updates():
    try:
        r = requests.get(f"{API}/getUpdates", timeout=30)
        return r.json()
    except Exception as e:
        log(f"Error in getUpdates: {e}")
        return None

def send_message(chat_id, text, inline=None):
    body = {"chat_id": chat_id, "text": text}
    if inline:
        body["inline_keypad"] = inline
    try:
        r = requests.post(f"{API}/sendMessage", json=body, timeout=10)
        log(f"Send result: {r.text[:200]}")
    except Exception as e:
        log(f"Send error: {e}")

def get_radar():
    try:
        r = requests.get(
            "https://api.cloudflare.com/client/v4/radar/quality/iqi/summary",
            headers={"Authorization": f"Bearer {RADAR_TOKEN}"},
            params={"location": "IR", "dateRange": "1d"}, timeout=10)
        d = r.json()
        if d.get("success"):
            return d.get("result", {})
    except Exception as e:
        log(f"Radar error: {e}")
    return {}

def make_report():
    data = get_radar()
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
    log(f"UPDATE: {update}")
    msg = update.get("new_message", {})
    if not msg:
        return
    chat_id = update.get("chat_id")
    text = msg.get("text", "")
    user_id = msg.get("sender_id")
    log(f"TEXT={text} CHAT={chat_id} USER={user_id}")

    if text == "/start":
        send_message(chat_id, "سلام! 👋\n\nبه ربات رادار اینترنت خوش آمدید.\n\n📊 برای گزارش: /status")
    elif text == "/status":
        send_message(chat_id, "🔍 در حال دریافت...")
        send_message(chat_id, make_report())
    elif text == "/help":
        send_message(chat_id, "دستورات:\n/start\n/status\n/help")
    else:
        send_message(chat_id, f"پیام شما دریافت شد: {text}")

def main():
    log("=" * 40)
    log("Radar Bot Started!")
    log(f"BOT_TOKEN exists: {bool(BOT_TOKEN)}")
    log(f"RADAR_TOKEN exists: {bool(RADAR_TOKEN)}")
    
    # تست اولیه getMe
    try:
        r = requests.get(f"{API}/getMe", timeout=10)
        log(f"getMe: {r.text[:300]}")
    except Exception as e:
        log(f"getMe error: {e}")
    
    log("=" * 40)
    
    while True:
        try:
            data = get_updates()
            if data:
                log(f"getUpdates status: {data.get('status')}")
                if data.get("status") == "OK":
                    updates = data.get("data", {}).get("updates", [])
                    if updates:
                        log(f"Got {len(updates)} updates")
                        for u in updates:
                            handle_update(u)
                    else:
                        log("No new updates")
                else:
                    log(f"getUpdates response: {data}")
        except Exception as e:
            log(f"Main loop error: {e}")
        time.sleep(5)

if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    main()
