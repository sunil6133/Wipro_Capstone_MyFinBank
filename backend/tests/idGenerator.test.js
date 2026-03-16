const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
const { generateId } = require('../utils/idGenerator');

afterEach(() => {
  sinon.restore();
});

describe('ID Generator - generateId', () => {
  it('should generate MYFIN-CUST-0001 when count is 0', async () => {
    const MockModel = { countDocuments: sinon.stub().resolves(0) };
    const id = await generateId(MockModel, 'customerId', 'MYFIN-CUST-');
    expect(id).to.equal('MYFIN-CUST-0001');
  });

  it('should generate MYFIN-CUST-0042 when count is 41', async () => {
    const MockModel = { countDocuments: sinon.stub().resolves(41) };
    const id = await generateId(MockModel, 'customerId', 'MYFIN-CUST-');
    expect(id).to.equal('MYFIN-CUST-0042');
  });

  it('should generate MYFIN-TXN-000001 with padLength 6', async () => {
    const MockModel = { countDocuments: sinon.stub().resolves(0) };
    const id = await generateId(MockModel, 'txnId', 'MYFIN-TXN-', 6);
    expect(id).to.equal('MYFIN-TXN-000001');
  });

  it('should generate MYFIN-LN-0010 when count is 9', async () => {
    const MockModel = { countDocuments: sinon.stub().resolves(9) };
    const id = await generateId(MockModel, 'loanId', 'MYFIN-LN-');
    expect(id).to.equal('MYFIN-LN-0010');
  });

  it('should pad numbers correctly for large counts', async () => {
    const MockModel = { countDocuments: sinon.stub().resolves(999) };
    const id = await generateId(MockModel, 'customerId', 'MYFIN-CUST-');
    expect(id).to.equal('MYFIN-CUST-1000');
  });
});