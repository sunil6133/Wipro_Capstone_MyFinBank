const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

const Account = require('../models/Account');
const accountService = require('../services/accountService');

afterEach(() => {
  sinon.restore();
});

describe('Account Service - generateAccountNumber', () => {
  it('should return 00000001 when no accounts exist', async () => {
    sinon.stub(Account, 'findOne').resolves(null);
    sinon.stub(Account, 'findOneAndUpdate').resolves({
      requestId: 'TESTREQID1',
      status: 'ACTIVE',
      accountNumber: '00000001'
    });
    const result = await accountService.approveAccount('TESTREQID1');
    expect(result.accountNumber).to.equal('00000001');
  });

  it('should generate next number after existing highest', async () => {
    sinon.stub(Account, 'findOne').resolves({ accountNumber: '00000005' });
    sinon.stub(Account, 'findOneAndUpdate').resolves({
      requestId: 'TESTREQID2',
      status: 'ACTIVE',
      accountNumber: '00000006'
    });
    const result = await accountService.approveAccount('TESTREQID2');
    expect(result.accountNumber).to.equal('00000006');
  });
});

describe('Account Service - createAccount', () => {
  it('should create account with REQUESTED status', async () => {
    sinon.stub(Account, 'countDocuments').resolves(0);
    sinon.stub(Account, 'create').resolves({
      accountNumber: '00000001',
      customerId: 'MYFIN-CUST-0001',
      accountType: 'SAVINGS',
      status: 'REQUESTED'
    });
    const result = await accountService.createAccount('MYFIN-CUST-0001', 'SAVINGS');
    expect(result.status).to.equal('REQUESTED');
    expect(result.accountType).to.equal('SAVINGS');
  });
});

describe('Account Service - rejectAccount', () => {
  it('should set status to REJECTED without assigning accountNumber', async () => {
    sinon.stub(Account, 'findOneAndUpdate').resolves({
      status: 'REJECTED',
      accountNumber: undefined
    });
    const result = await accountService.rejectAccount('REQ123');
    expect(result.status).to.equal('REJECTED');
    expect(result.accountNumber).to.be.undefined;
  });
});

describe('Account Service - findByCustomer', () => {
  it('should return all accounts for a customer', async () => {
    const mockAccounts = [
      { accountNumber: '00000001', customerId: 'MYFIN-CUST-0001', accountType: 'SAVINGS' },
      { accountNumber: '00000002', customerId: 'MYFIN-CUST-0001', accountType: 'CURRENT' }
    ];
    sinon.stub(Account, 'find').resolves(mockAccounts);
    const result = await accountService.findByCustomer('MYFIN-CUST-0001');
    expect(result).to.have.length(2);
    expect(result[0].accountType).to.equal('SAVINGS');
    expect(result[1].accountType).to.equal('CURRENT');
  });
});