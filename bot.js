const { Bot, InlineKeyboard } = require("grammy");
const axios = require("axios");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot 24/7 rejimda ishlayapti!"));
app.listen(port, () => console.log(`Server ishlamoqda`));

const bot = new Bot("8927006209:AAEq35XwstN9ywwBlRBMcRtrQ9j337mNfSU");

// Kengaytirilgan Asosiy menyu
function getMainMenu() {
  return new InlineKeyboard()
    .text("💵 Valyuta", "mb_rates")
    .text("🪙 Kripto", "crypto_rates")
    .row()
    .text("🕌 Namoz Vaqtlari", "prayer_times")
    .text("⛅️ Ob-havo", "weather_info")
    .row()
    .text("🗳 Open Budget Yordamchi", "open_budget");
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    `👋 **Xush kelibsiz!**\n\nBu bot orqali nafaqat valyuta, balki ob-havo, namoz vaqtlari va Open Budget haqida ma'lumot olishingiz mumkin.\n\n👇 Quyidagi menyudan birini tanlang:`,
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

    let msg = `🏛 **Markaziy Bank rasmiy kurslari:**\n\n`;
    msg += `🇺🇸 **1 USD** = ${usd.Rate} so'm (${usd.Diff > 0 ? "+" : ""}${usd.Diff})\n`;
    msg += `🇪🇺 **1 EUR** = ${eur.Rate} so'm (${eur.Diff > 0 ? "+" : ""}${eur.Diff})\n\n`;
    msg += `✍️ *Maslahat: 100 usd yoki 50 euro deb yozib kalkulyatordan foydalaning!*`;
    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: getMainMenu() });
  } catch (err) {
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
});

// 2. Kriptovalyuta
bot.callbackQuery("crypto_rates", async (ctx) => {
  let btc = "-", eth = "-";
  try {
    const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    btc = parseFloat(res.data.price).toLocaleString("en-US", { maximumFractionDigits: 2 });
  } catch (e) {}
  try {
    const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
    eth = parseFloat(res.data.price).toLocaleString("en-US", { maximumFractionDigits: 2 });
  } catch (e) {}

  await ctx.reply(`🪙 **Kripto ($):**\n\n🪙 **BTC:** $${btc}\n🔷 **ETH:** $${eth}`, { parse_mode: "Markdown", reply_markup: getMainMenu() });
});

// 3. Namoz Vaqtlari (Islom.uz API)
bot.callbackQuery("prayer_times", async (ctx) => {
  try {
    // Navoiy shahri misolida olingan (boshqa hudud ham qilish mumkin)
    const res = await axios.get("https://islomapi.uz/api/present/day?region=Navoiy");
    const data = res.data;

    let msg = `🕌 **Namoz Vaqtlari (Navoiy hududi uchun):**\n📅 Sana: ${data.date}\n\n`;
    msg += `🌅 Bomdod: **${data.times.tong_saharlik}**\n`;
    msg += `🌇 Quyosh: **${data.times.quyosh}**\n`;
    msg += `🏞 Peshin: **${data.times.peshin}**\n`;
    msg += `🌆 Asr: **${data.times.asr}**\n`;
    msg += `🏙 Shom: **${data.times.shom_iftor}**\n`;
    msg += `🌃 Xufton: **${data.times.hufton}**`;

    await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: getMainMenu() });
  } catch (e) {
    await ctx.reply("❌ Namoz vaqtlarini olishda xatolik.");
  }
});

// 4. Ob-havo yordamchisi
bot.callbackQuery("weather_info", async (ctx) => {
  await ctx.reply(
    "⛅️ **Ob-havo ma'lumotini olish uchun shahringiz nomini inglizcha yoki lotincha yozib yuboring.**\n\nMasalan:\n• `Tashkent`\n• `Navoi`\n• `Samarkand`",
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// 5. Open Budget Yordamchi
bot.callbackQuery("open_budget", async (ctx) => {
  let msg = `🗳 **Ochiq Byudjet (Open Budget) bo'yicha maslahatlar:**\n\n`;
  msg += `1️⃣ **Qanday ovoz beriladi?** - Maxsus Open Budget portali orqali SMS kod tasdiqlanadi.\n`;
  msg += `2️⃣ **E'tibor bering:** Bir raqamdan faqat bir marta ovoz berish mumkin.\n`;
  msg += `3️⃣ **Yordam:** O'z qishlog'ingiz yoki mahallangiz loyihasini botlar va Telegram guruhlar orqali tarqating!\n\n`;
  msg += `🔗 Rasmiy sayt: [openbudget.uz](https://openbudget.uz)`;
  
  await ctx.reply(msg, { parse_mode: "Markdown", disable_web_page_preview: true, reply_markup: getMainMenu() });
});

// Matnli buyruqlar: Ob-havo va Valyuta kalkulyatori
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  
  // Valyuta kalkulyatorini tekshirish
  const calcMatch = text.toLowerCase().match(/^(\d+(\.\d+)?)\s*(usd|dollar|eur|euro|rub|som|so'm)?$/);
  if (calcMatch) {
    const amount = parseFloat(calcMatch[1]);
    const currency = calcMatch[3] || "usd";
    try {
      const response = await axios.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
      const usdRate = parseFloat(response.data.find((c) => c.Ccy === "USD").Rate);
      const eurRate = parseFloat(response.data.find((c) => c.Ccy === "EUR").Rate);

      if (currency === "usd" || currency === "dollar") {
        return ctx.reply(`💵 **${amount} USD** = **${(amount * usdRate).toLocaleString()} so'm**`, { parse_mode: "Markdown" });
      } else if (currency === "eur" || currency === "euro") {
        return ctx.reply(`💶 **${amount} EUR** = **${(amount * eurRate).toLocaleString()} so'm**`, { parse_mode: "Markdown" });
      } else if (currency === "som" || currency === "so'm") {
        return ctx.reply(`🇺🇿 **${amount.toLocaleString()} so'm** = **${(amount / usdRate).toFixed(2)} USD**`, { parse_mode: "Markdown" });
      }
    } catch (e) {
      return ctx.reply("❌ Hisoblashda xatolik yuz berdi.");
    }
  }

  // Agar kalkulyator bo'lmasa, ob-havo ekanligini tekshiramiz (OpenWeatherMap tekin API)
  if (text.length > 2 && text.length < 20 && !calcMatch) {
    try {
      const apiKey = "a4b5749f96b270034a7eb6d95368a183"; // Test uchun umumiy API kalit
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${text}&units=metric&appid=${apiKey}&lang=ru`);
      const temp = res.data.main.temp;
      const desc = res.data.weather[0].description;
      const city = res.data.name;

      await ctx.reply(`⛅️ **${city} shahri ob-havosi:**\n\n🌡 Harorat: **${temp}°C**\n☁️ Holat: **${desc}**`, { parse_mode: "Markdown" });
    } catch (e) {
      // Agar shahar topilmasa
    }
  }
});

console.log("Kengaytirilgan bot ishga tushdi!");
bot.start();