const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customer'));
app.use('/api/accounts', require('./routes/account'));
app.use('/api/transactions', require('./routes/transaction'));
app.use('/api/loans', require('./routes/loan'));
app.use('/api/investments', require('./routes/investment'));
app.use('/api/beneficiaries', require('./routes/beneficiary'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const supportService = require('./services/supportService');

io.on('connection', (socket) => {
  socket.on('join_ticket', (ticketId) => socket.join(ticketId));

  socket.on('send_message', async ({ ticketId, senderType, senderId, message }) => {
    try {
      const msg = await supportService.createMessage({ ticketId, senderType, senderId, message });
      io.to(ticketId).emit('receive_message', msg);
    } catch (err) {
      console.error('Socket error:', err.message);
    }
  });

  socket.on('disconnect', () => {});
});

const Account = require('./models/Account');

cron.schedule('0 * * * *', async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Account.updateMany(
      { status: 'AT_RISK', atRiskSince: { $lte: cutoff } },
      { $set: { status: 'DEACTIVATED', deactivationType: 'AUTO' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Auto-deactivated ${result.modifiedCount} AT_RISK accounts`);
    }
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('MongoDB error:', err);
    process.exit(1);
  });

module.exports = server;
