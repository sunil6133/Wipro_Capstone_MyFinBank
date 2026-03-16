const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const FixedDeposit = require('../models/FixedDeposit');
const RecurringDeposit = require('../models/RecurringDeposit');
const SupportTicket = require('../models/SupportTicket');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCustomers, activeCustomers, pendingKYC, atRiskAccounts, totalAccounts, pendingAccounts, totalTransactions, pendingLoans, activeLoans, activeFDs, activeRDs, openTickets, inProgressTickets] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: 'ACTIVE' }),
      Customer.countDocuments({ status: 'PENDING_VERIFICATION' }),
      Account.countDocuments({ status: 'AT_RISK' }),
      Account.countDocuments(),
      Account.countDocuments({ status: 'REQUESTED' }),
      Transaction.countDocuments(),
      Loan.countDocuments({ status: 'PENDING' }),
      Loan.countDocuments({ status: { $in: ['APPROVED', 'ACTIVE'] } }),
      FixedDeposit.countDocuments({ status: 'ACTIVE' }),
      RecurringDeposit.countDocuments({ status: 'ACTIVE' }),
      SupportTicket.countDocuments({ status: 'OPEN' }),
      SupportTicket.countDocuments({ status: 'IN_PROGRESS' })
    ]);

    const balanceAgg = await Account.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
    const totalBalance = balanceAgg[0]?.total || 0;

    const loanAgg = await Loan.aggregate([{ $match: { status: { $in: ['APPROVED', 'ACTIVE'] } } }, { $group: { _id: null, total: { $sum: '$loanAmount' } } }]);
    const totalLoanDisbursed = loanAgg[0]?.total || 0;

    const todayTxnAgg = await Transaction.aggregate([{ $match: { date: { $gte: today } } }, { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }]);
    const todayStats = { CREDIT: { count: 0, total: 0 }, DEBIT: { count: 0, total: 0 } };
    todayTxnAgg.forEach(t => { todayStats[t._id] = { count: t.count, total: t.total }; });

    res.json({
      success: true,
      stats: {
        customers: { total: totalCustomers, active: activeCustomers, pendingKYC, atRisk: atRiskAccounts },
        accounts: { total: totalAccounts, pending: pendingAccounts, totalBalance },
        transactions: { total: totalTransactions, todayDeposited: todayStats.CREDIT.total, todayWithdrawn: todayStats.DEBIT.total, todayCount: todayStats.CREDIT.count + todayStats.DEBIT.count },
        loans: { pending: pendingLoans, active: activeLoans, totalDisbursed: totalLoanDisbursed },
        investments: { activeFDs, activeRDs },
        support: { open: openTickets, inProgress: inProgressTickets }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
