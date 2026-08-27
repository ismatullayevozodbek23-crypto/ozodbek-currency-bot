const { Bot, InlineKeyboard } = require("grammy");
const axios = require("axios");

// Yangi tokeningiz ulandi:
const bot = new Bot("8927006209:AAEq35XwstN9ywwBlRBMcRtrQ9j337mNfSU");

const userState = {};

// /start buyrug'i
bot.command("start", (ctx) => {
    delete userState[ctx.from.id];

    const keyboard = new InlineKeyboard()
        .text("💵 USD (AQSH Dollari)", "calc_USD")
        .text("💶 EUR (Yevro)", "calc_EUR")
        .row()
        .text("RUB (Ruble)", "calc_RUB")
        .text("KZT (Tenge)", "calc_KZT")
        .row()
        .text("📊 Barcha valyutalar", "all_rates");

    ctx.reply(
        "👋 Assalomu alaykum!\n\n" +
        "🤖 **Ozodbekning rasmiy Valyuta Konvertor botiga xush kelibsiz!**\n\n" +
        "Hisoblamoqchi bo'lgan valyutangizni tanlang:",
        { reply_markup: keyboard, parse_mode: "Markdown" }
    );
});

// Valyuta tanlanganda
bot.callbackQuery(/^calc_(.+)$/, (ctx) => {
    const currency = ctx.match[1];
    userState[ctx.from.id] = currency;

    ctx.answerCallbackQuery();
    ctx.reply(
        `Siz **${currency}** valyutasini tanladingiz!\n\n` +
        `Endi summani yozib yuboring (Masalan: 50, 100):`,
        { parse_mode: "Markdown" }
    );
});

// Summa yuborilganda hisoblash
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    const amount = parseFloat(text);

    if (isNaN(amount)) {
        return ctx.reply("Iltimos, faqat raqam kiriting (Masalan: 100).");
    }

    const userId = ctx.from.id;
    const selectedCurrency = userState[userId] || "USD";

    try {
        const response = await axios.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
        const data = response.data;
        const currencyData = data.find((item) => item.Ccy === selectedCurrency);

        if (!currencyData) return ctx.reply("Valyuta topilmadi.");

        const rate = parseFloat(currencyData.Rate);
        const total = (amount * rate).toLocaleString("uz-UZ");

        ctx.reply(
            `🧮 **Hisob-kitob natijasi:**\n\n` +
            `💰 **${amount} ${selectedCurrency}** = **${total} so'm**\n\n` +
            `📊 *Joriy kurs: 1 ${selectedCurrency} = ${currencyData.Rate} so'm*\n\n` +
            `👨‍💻 *Dasturchi: Ozodbek*`,
            { parse_mode: "Markdown" }
        );
    } catch (error) {
        ctx.reply("❌ Xatolik yuz berdi.");
    }
});

// Barcha valyutalar ro'yxati
bot.callbackQuery("all_rates", async (ctx) => {
    ctx.answerCallbackQuery({ text: "Yuklanmoqda..." });

    try {
        const response = await axios.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/");
        const data = response.data;

        let message = "📊 **Markaziy Bank valyuta kurslari:**\n\n";
        const popular = ["USD", "EUR", "RUB", "KZT", "GBP", "CNY"];
        
        data.filter(item => popular.includes(item.Ccy)).forEach((item) => {
            message += `• **1 ${item.Ccy}** = ${item.Rate} so'm\n`;
        });

        message += "\n👨‍💻 *Created by Ozodbek*";

        ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
        ctx.reply("❌ Xatolik yuz berdi.");
    }
});

console.log("Ozodbekning yangi boti ishga tushdi!");
bot.start();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot ishlayapti!'));
app.listen(port, () => console.log(`Server ${port}-portda ishlamoqda`));