export default {
  async fetch(req) {
    const u = new URL(req.url);
    const BOT = "CFGHGD0YPAGBXPUDLFUSIFNBMRNLBEPSRPLWKYPYBOAMJFXCRAZTGIGYEAKJQHHR";
    const API = "https://botapi.rubika.ir/v3/" + BOT;
    const WH = u.origin + "/";

    if (u.pathname === "/setwebhook") {
      let out = "";
      const params = [
        {url: WH},
        {endpoint: WH},
        {webhook_url: WH},
        {webhook: WH},
        {address: WH},
        {bot_endpoint: WH},
        {endpoint_url: WH}
      ];
      for (let p of params) {
        try {
          const r = await fetch(API + "/updateBotEndpoint", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(p)
          });
          const t = await r.text();
          out += JSON.stringify(p) + " => " + t + "\n\n";
        } catch(e) {
          out += JSON.stringify(p) + " => ERR: " + e.message + "\n\n";
        }
      }
      return new Response(out);
    }

    if (req.method !== "POST") return new Response("OK");
    return new Response("OK");
  }
};
