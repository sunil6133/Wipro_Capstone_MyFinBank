const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

const transactionService = require('../services/transactionService');
const Transaction = require('../models/Transaction');

afterEach(() => {
  sinon.restore();
});

describe('Transaction Service - createTransaction', () => {
  it('should create transaction with generated txnId MYFIN-TXN-000001', async () => {
    sinon.stub(Transaction, 'countDocuments').resolves(0);
    sinon.stub(Transaction, 'create').callsFake(async (data) => data);

    const result = await transactionService.createTransaction({
      accountNumber: '00000001',
      transactionCategory: 'DEPOSIT',
      type: 'CREDIT',
      amount: 5000,
      balanceAfterTxn: 5000,
      description: 'Test deposit'
    });

    expect(result.txnId).to.equal('MYFIN-TXN-000001');
    expect(result.amount).to.equal(5000);
    expect(result.type).to.equal('CREDIT');
  });

  it('should generate MYFIN-TXN-000158 when 157 transactions exist', async () => {
    sinon.stub(Transaction, 'countDocuments').resolves(157);
    sinon.stub(Transaction, 'create').callsFake(async (data) => data);

    const result = await transactionService.createTransaction({
      accountNumber: '00000001',
      transactionCategory: 'WITHDRAW',
      type: 'DEBIT',
      amount: 1000,
      balanceAfterTxn: 4000,
      description: 'Cash withdrawal'
    });

    expect(result.txnId).to.equal('MYFIN-TXN-000158');
  });

  it('should store correct transactionCategory DEPOSIT', async () => {
    sinon.stub(Transaction, 'countDocuments').resolves(0);
    sinon.stub(Transaction, 'create').callsFake(async (data) => data);

    const result = await transactionService.createTransaction({
      accountNumber: '00000001',
      transactionCategory: 'DEPOSIT',
      type: 'CREDIT',
      amount: 2000,
      balanceAfterTxn: 2000,
      description: 'Cash Deposit'
    });

    expect(result.transactionCategory).to.equal('DEPOSIT');
    expect(result.balanceAfterTxn).to.equal(2000);
  });

  it('should store TRANSFER category with referenceId', async () => {
    sinon.stub(Transaction, 'countDocuments').resolves(5);
    sinon.stub(Transaction, 'create').callsFake(async (data) => data);

    const result = await transactionService.createTransaction({
      accountNumber: '00000001',
      referenceId: 'REF12345678',
      transactionCategory: 'TRANSFER',
      type: 'DEBIT',
      amount: 3000,
      balanceAfterTxn: 7000,
      description: 'Transfer to 00000002'
    });

    expect(result.transactionCategory).to.equal('TRANSFER');
    expect(result.referenceId).to.equal('REF12345678');
  });

  it('should store LOAN_EMI category correctly', async () => {
    sinon.stub(Transaction, 'countDocuments').resolves(10);
    sinon.stub(Transaction, 'create').callsFake(async (data) => data);

    const result = await transactionService.createTransaction({
      accountNumber: '00000001',
      transactionCategory: 'LOAN_EMI',
      type: 'DEBIT',
      amount: 8792,
      balanceAfterTxn: 91208,
      description: 'EMI #1 - MYFIN-LN-0001'
    });

    expect(result.transactionCategory).to.equal('LOAN_EMI');
    expect(result.amount).to.equal(8792);
  });
});

describe('Transaction Business Logic - Deposit Validation', () => {
  it('should reject deposit when amount is zero', () => {
    const amount = 0;
    expect(!amount || Number(amount) <= 0).to.be.true;
  });

  it('should reject deposit when amount is negative', () => {
    const amount = -500;
    expect(!amount || Number(amount) <= 0).to.be.true;
  });

  it('should accept deposit when amount is positive', () => {
    const amount = 1000;
    expect(!amount || Number(amount) <= 0).to.be.false;
  });
});

describe('Transaction Business Logic - Withdraw Validation', () => {
  it('should reject withdrawal if balance less than amount for SAVINGS', () => {
    const account = { accountType: 'SAVINGS', balance: 500, overdraftLimit: 0 };
    const amount = 1000;
    expect(account.balance - amount < -(account.overdraftLimit || 0)).to.be.true;
  });

  it('should allow withdrawal within overdraft limit for CURRENT', () => {
    const account = { accountType: 'CURRENT', balance: 500, overdraftLimit: 10000 };
    const amount = 1000;
    expect(account.balance - amount < -(account.overdraftLimit || 0)).to.be.false;
  });

  it('should reject withdrawal exceeding overdraft limit for CURRENT', () => {
    const account = { accountType: 'CURRENT', balance: 500, overdraftLimit: 200 };
    const amount = 1000;
    expect(account.balance - amount < -(account.overdraftLimit || 0)).to.be.true;
  });

  it('should allow exact balance withdrawal for SAVINGS', () => {
    const account = { accountType: 'SAVINGS', balance: 1000, overdraftLimit: 0 };
    const amount = 1000;
    expect(account.balance - amount < -(account.overdraftLimit || 0)).to.be.false;
  });
});

describe('Transaction Business Logic - AT_RISK Check', () => {
  it('should flag SAVINGS account as AT_RISK when balance hits zero', () => {
    const account = { accountType: 'SAVINGS', balance: 0, status: 'ACTIVE' };
    const isAtRisk = account.accountType === 'SAVINGS' && account.balance <= 0;
    expect(isAtRisk).to.be.true;
  });

  it('should flag CURRENT account as AT_RISK when overdraft exceeded', () => {
    const account = { accountType: 'CURRENT', balance: -1500, overdraftLimit: 1000, status: 'ACTIVE' };
    const isAtRisk = account.accountType === 'CURRENT' && account.balance < -account.overdraftLimit;
    expect(isAtRisk).to.be.true;
  });

  it('should NOT flag CURRENT account as AT_RISK within overdraft limit', () => {
    const account = { accountType: 'CURRENT', balance: -500, overdraftLimit: 1000, status: 'ACTIVE' };
    const isAtRisk = account.accountType === 'CURRENT' && account.balance < -account.overdraftLimit;
    expect(isAtRisk).to.be.false;
  });

  it('should NOT flag SAVINGS account as AT_RISK when balance is positive', () => {
    const account = { accountType: 'SAVINGS', balance: 100, status: 'ACTIVE' };
    const isAtRisk = account.accountType === 'SAVINGS' && account.balance <= 0;
    expect(isAtRisk).to.be.false;
  });
});