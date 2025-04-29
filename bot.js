
const express = require('express');
const { Telegraf } = require('telegraf');
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN || '7539675476:AAG3HvyqvP4xapW_k6HG_VlsOTWvjiK5z7M');

let currentModule = 'login-form'; // default module

bot.start((ctx) => ctx.reply('Welcome! Use /login-form or /codeSms etc. to switch modules.'));
bot.hears(/\/([\w-]+)/, (ctx) => {
    currentModule = ctx.match[1];
    ctx.reply(`Switched to module: ${currentModule}`);
});

app.get('/current-module', (req, res) => {
    res.json({ module: currentModule });
});

app.get('/', (req, res) => res.send('Bot is running.'));
bot.launch();
app.listen(process.env.PORT || 3000, () => console.log('Server running'));
            