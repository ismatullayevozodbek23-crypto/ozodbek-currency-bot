const { Bot, InlineKeyboard } = require("grammy");
const axios = require("axios");
const express = require("express");

// Express veb-server (Render uchun)
const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot 24/7 rejimda ishlayapti!"));
app.listen(port, () => console.log(`Server ${port}-portda ishlamoqda`));

// Botni ishga tushirish
const bot = new Bot("8927006209:AAEq35XwstN9ywwBlRBMcRtrQ9j337mNfSU");

// Asosiy tugmalar paneli
function getMainMenu() {
  return new InlineKeyboard()
    .text("💵 Mb Kurslari", "mb_rates")
    .text("🪙 Kripto Kurslar", "crypto_rates")
    .row()
    .text("📊 Statistika", "stats")
    .text("🧮 Kalkulyator Haqida", "calc_info");
}

// /start buyrug'i
bot.command("start", async (ctx) => {
  await ctx.reply(
    `👋 **Xush kelibsiz!**\n\nBu bot orqali rasmiy valyuta kurslari, kriptovalyutalar va tezkor kalkulyatordan foydalanishingiz mumkin.\n\n👇 Quyidagi menyudan birini tanlang yoki **100 usd** deb yozing:`,
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// 1. Markaziy Bank kurslari
bot.callbackQuery("mb_rates", async (ctx) => {
  try {
    const response = await axios.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
    const data = response.data;
    const usd = data.find((c) => c.Ccy === "USD");
    const eur = data.find((c) => c.Ccy === "EUR");
    const rub = data.find((c) => c.Ccy === "RUB");

    let msg = `🏛 **Markaziy Bank rasmiy kurslari:**\n\n`;
    msg += `🇺🇸 **1 USD** = ${usd.Rate} so'm (${usd.Diff > 0 ? "+" : ""}${usd.Diff})\n`;
    msg += `🇪🇺 **1 EUR** = ${eur.Rate} so'm (${eur.Diff > 0 ? "+" : ""}${eur.Diff})\n`;
    msg += `🇷🇺 **1 RUB** = ${rub.Rate} so'm (${rub.Diff > 0 ? "+" : ""}${rub.Diff})\n\n`;
    msg += `✍️ *Valyuta hisoblash uchun ixtiyoriy summani yozing (Masalan: 500 usd)*`;

    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: getMainMenu() });
  } catch (err) {
    await ctx.reply("❌ Valyuta kurslarini olishda xatolik yuz berdi.");
  }
});

// 2. Kriptovalyuta kurslari (Binance & KuCoin barqaror API)
bot.callbackQuery("crypto_rates", async (ctx) => {
  try {
    const [btcRes, ethRes, tonRes] = await Promise.all([
      axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"),
      axios.get("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT"),
      axios.get("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=TON-USDT")
    ]);

    const btc = parseFloat(btcRes.data.price).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const eth = parseFloat(ethRes.data.price).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const ton = parseFloat(tonRes.data.data.price).toFixed(2);

    let msg = `🪙 **Real vaqtdagi Kriptovalyuta kurslari ($):**\n\n`;
    msg += `🪙 **Bitcoin (BTC):** $${btc}\n`;
    msg += `🔷 **Ethereum (ETH):** $${eth}\n`;
    msg += `💎 **TON Coin (TON):** $${ton}\n`;
    msg += `💵 **Tether (USDT):** $1.00\n`;

    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: getMainMenu() });
  } catch (err) {
    await ctx.reply("❌ Kripto kurslarni olishda xatolik bo'ldi.");
  }
});

// 3. Valyuta statistikasi
bot.callbackQuery("stats", async (ctx) => {
  try {
    const response = await axios.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
    const usd = response.data.find((c) => c.Ccy === "USD");
    
    let state = usd.Diff > 0 ? "📈 O'smoqda (O'sish tendensiyasi)" : "📉 Tushmoqda";
    let msg = `📊 **AQSH Dollari Dinamikasi:**\n\n`;
    msg += `📌 Bugungi kurs: **${usd.Rate} so'm**\n`;
    msg += `🔄 Oxirgi o'zgarish: **${usd.Diff} so'm**\n`;
    msg += `Holat: **${state}**\n`;
    msg += `Sana: **${usd.Date}**`;

    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: getMainMenu() });
  } catch (err) {
    await ctx.reply("❌ Statistikani yuklab bo'lmadi.");
  }
});

// Kalkulyator ko'rsatmasi
bot.callbackQuery("calc_info", async (ctx) => {
  await ctx.reply(
    "🧮 **Valyuta kalkulyatori qanday ishlaydi?**\n\nSiz botga shunchaki matn ko'rinishida qiymat yozasiz:\n\n• `100 usd` -> So'mga o'giradi\n• `50 euro` -> So'mga o'giradi\n• `500000 som` -> Dollarga o'giradi",
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// Matnli kalkulyator funksiyasi (Auto Convert)
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim().toLowerCase();
  const match = text.match(/^(\d+(\.\d+)?)\s*(usd|dollar|eur|euro|rub|som|so'm)?$/);

  if (match) {
    const amount = parseFloat(match[1]);
    const currency = match[3] || "usd";

    try {
      const response = await axios.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
      const data = response.data;
      const usdRate = parseFloat(data.find((c) => c.Ccy === "USD").Rate);
      const eurRate = parseFloat(data.find((c) => c.Ccy === "EUR").Rate);

      if (currency === "usd" || currency === "dollar") {
        const total = (amount * usdRate).toLocaleString();
        return ctx.reply(`💵 **${amount} USD** = **${total} so'm**`, { parse_mode: "Markdown" });
      } else if (currency === "eur" || currency === "euro") {
        const total = (amount * eurRate).toLocaleString();
        return ctx.reply(`💶 **${amount} EUR** = **${total} so'm**`, { parse_mode: "Markdown" });
      } else if (currency === "som" || currency === "so'm") {
        const total = (amount / usdRate).toFixed(2);
        return ctx.reply(`🇺🇿 **${amount.toLocaleString()} so'm** = **${total} USD**`, { parse_mode: "Markdown" });
      }
    } catch (e) {
      return ctx.reply("❌ Hisoblashda xatolik yuz berdi.");
    }
  }
});

console.log("Ozodbekning yangilangan boti ishga tushdi!");
bot.start();