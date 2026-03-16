const express = require('express');
const router = express.Router();
const supportService = require('../services/supportService');
const { authMiddleware, adminOnly, customerOnly } = require('../middleware/authMiddleware');

router.post('/tickets', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { subject } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'Subject required' });
    const ticket = await supportService.createTicket({ customerId: req.user.customerId, subject });
    res.status(201).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/tickets/my', authMiddleware, customerOnly, async (req, res) => {
  try {
    const tickets = await supportService.findTicketsByCustomer(req.user.customerId);
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/tickets', authMiddleware, adminOnly, async (req, res) => {
  try {
    const tickets = await supportService.findAllTickets();
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/tickets/:ticketId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await supportService.updateTicket(req.params.ticketId, { status });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/tickets/:ticketId/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await supportService.findMessagesByTicket(req.params.ticketId);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tickets/:ticketId/messages', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });
    const ticket = await supportService.findTicketById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const isAdmin = req.user.role === 'ADMIN';
    const msg = await supportService.createMessage({ ticketId: req.params.ticketId, senderType: isAdmin ? 'ADMIN' : 'CUSTOMER', senderId: isAdmin ? req.user.adminId : req.user.customerId, message });
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
