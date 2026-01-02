const { Telegraf } = require('telegraf');
const axios = require('axios');
const cron = require('node-cron');

// Bot tokeningizni kiriting
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Foydalanuvchi ID sini saqlash (Ertalab xabar yuborish uchun)
// Real loyihada buni Database (MongoDB/PostgreSQL) da saqlash kerak
let userChatId = null; 

// 1. Valyuta kursini olish funksiyasi
async function getCurrency() {
    try {
        const response = await axios.get('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
        const usd = response.data.find(item => item.Code === '840');
        return `🇺🇸 1 USD = ${usd.Rate} so'm`;
    } catch (error) {
        return "Valyuta ma'lumotini olib bo'lmadi.";
    }
}

// 2. Ob-havoni olish funksiyasi
async function getWeather() {
    const city = 'Tashkent';
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.API_KEY}`;
        const response = await axios.get(url);
        const temp = response.data.main.temp;
        return `🌤 Toshkentda harorat: ${temp}°C`;
    } catch (error) {
        return "Ob-havo ma'lumotini olib bo'lmadi.";
    }
}

// /start buyrug'i
bot.start((ctx) => {
    userChatId = ctx.chat.id; // Chat ID ni eslab qolamiz
    ctx.reply("Xush kelibsiz! Men har kuni soat 07:00 da sizga ob-havo va valyuta kursini yuboraman.");
});

//buyruq qo'shish
bot.command('weather', async (ctx) => {
    const weather = await getWeather();
    ctx.reply(weather);
});

bot.command('currency', async (ctx) => {
    const currency = await getCurrency();
    ctx.reply(currency);
});
bot.command('info', (ctx) => {
    const infoMessage = `Men sizga har kuni ertalab ob-havo va valyuta kursini yuboraman.\n\n` +
                        `Buyruqlar:\n` +
                        `/weather - Ob-havo ma'lumotini olish\n` +
                        `/currency - Valyuta kursini olish\n` +
                        `/info - Bu xabar`;

    ctx.reply(infoMessage);
});

// 3. Har kuni ertalab 07:00 da yuborish (Scheduling)
// '0 7 * * *' -> Har kuni, soat 07, minut 00
cron.schedule('0 7 * * *', async () => {
    if (userChatId) {
        const weather = await getWeather();
        const currency = await getCurrency();
        const message = `👋 Xayrli tong!\n\n${weather}\n${currency}`;
        bot.telegram.sendMessage(userChatId, message);
    }
});

bot.launch();
console.log("Bot ishga tushdi...");