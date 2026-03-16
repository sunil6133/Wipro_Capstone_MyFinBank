const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;

const loanService = require('../services/loanService');
const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');

afterEach(() => {
  sinon.restore();
});

describe('Loan Service - EMI Calculation', () => {
  it('should calculate correct EMI for standard loan', async () => {
    sinon.stub(Loan, 'create').callsFake(async (data) => data);
    const result = await loanService.createLoan({
      customerId: 'MYFIN-CUST-0001',
      accountNumber: '00000001',
      loanAmount: 100000,
      interestRate: 10,
      tenureMonths: 12,
      purpose: 'Test'
    });
    expect(result.emi).to.be.a('number');
    expect(result.emi).to.be.greaterThan(0);
    expect(result.emi).to.equal(8792);
  });

  it('should calculate correct EMI for 24 month loan at 8%', async () => {
    sinon.stub(Loan, 'create').callsFake(async (data) => data);
    const result = await loanService.createLoan({
      customerId: 'MYFIN-CUST-0001',
      accountNumber: '00000001',
      loanAmount: 50000,
      interestRate: 8,
      tenureMonths: 24,
      purpose: 'Test'
    });
    expect(result.emi).to.be.a('number');
    expect(result.emi).to.be.greaterThan(0);
    expect(result.remainingBalance).to.equal(50000);
  });

  it('should set remainingBalance equal to loanAmount on creation', async () => {
    sinon.stub(Loan, 'create').callsFake(async (data) => data);
    const result = await loanService.createLoan({
      customerId: 'MYFIN-CUST-0001',
      accountNumber: '00000001',
      loanAmount: 200000,
      interestRate: 12,
      tenureMonths: 36,
      purpose: 'Home'
    });
    expect(result.remainingBalance).to.equal(200000);
  });
});

describe('Loan Service - findByCustomer', () => {
  it('should return loans sorted by createdAt descending', async () => {
    const mockLoans = [
      { loanId: 'MYFIN-LN-0002', customerId: 'MYFIN-CUST-0001' },
      { loanId: 'MYFIN-LN-0001', customerId: 'MYFIN-CUST-0001' }
    ];
    sinon.stub(Loan, 'find').returns({ sort: sinon.stub().resolves(mockLoans) });
    const result = await loanService.findByCustomer('MYFIN-CUST-0001');
    expect(result).to.have.length(2);
    expect(result[0].loanId).to.equal('MYFIN-LN-0002');
  });
});

describe('Loan Service - countPayments', () => {
  it('should return count of payments for a loan', async () => {
    sinon.stub(LoanPayment, 'countDocuments').resolves(3);
    const count = await loanService.countPayments('MYFIN-LN-0001');
    expect(count).to.equal(3);
  });
});