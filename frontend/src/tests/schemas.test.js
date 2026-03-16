import { registerSchema, loginSchema, depositSchema, withdrawSchema, transferSchema, loanSchema, fdSchema, rdSchema } from '../schemas';

describe('Yup Validation Schemas', () => {

  describe('loginSchema', () => {
    test('passes with valid email and password', async () => {
      await expect(loginSchema.validate({ email: 'test@test.com', password: 'password123' })).resolves.toBeTruthy();
    });
    test('fails with invalid email', async () => {
      await expect(loginSchema.validate({ email: 'notanemail', password: 'password123' })).rejects.toThrow('Invalid email');
    });
    test('fails with missing password', async () => {
      await expect(loginSchema.validate({ email: 'test@test.com' })).rejects.toThrow('Password is required');
    });
  });

  describe('registerSchema', () => {
    const valid = { name: 'Test User', email: 'test@test.com', password: 'password123', address: '123 Street', govIdType: 'AADHAAR', govIdNumber: '1234', accountType: 'SAVINGS' };
    test('passes with valid data', async () => {
      await expect(registerSchema.validate(valid)).resolves.toBeTruthy();
    });
    test('fails with short password', async () => {
      await expect(registerSchema.validate({ ...valid, password: 'short' })).rejects.toThrow('Min 8 characters');
    });
    test('fails with invalid phone number', async () => {
      await expect(registerSchema.validate({ ...valid, phone: '12345' })).rejects.toThrow();
    });
    test('fails with missing name', async () => {
      await expect(registerSchema.validate({ ...valid, name: '' })).rejects.toThrow();
    });
  });

  describe('depositSchema', () => {
    test('passes with valid account and amount', async () => {
      await expect(depositSchema.validate({ accountNumber: '00000001', amount: 1000 })).resolves.toBeTruthy();
    });
    test('fails if amount is 0', async () => {
      await expect(depositSchema.validate({ accountNumber: '00000001', amount: 0 })).rejects.toThrow();
    });
    test('fails if accountNumber missing', async () => {
      await expect(depositSchema.validate({ amount: 1000 })).rejects.toThrow('Account is required');
    });
  });

  describe('loanSchema', () => {
    const valid = { accountNumber: '00000001', loanAmount: 50000, interestRate: 10, tenureMonths: 12, purpose: 'Home' };
    test('passes with valid loan data', async () => {
      await expect(loanSchema.validate(valid)).resolves.toBeTruthy();
    });
    test('fails if loanAmount below 1000', async () => {
      await expect(loanSchema.validate({ ...valid, loanAmount: 500 })).rejects.toThrow('Min Rs.1,000');
    });
    test('fails if purpose missing', async () => {
      await expect(loanSchema.validate({ ...valid, purpose: '' })).rejects.toThrow('Purpose required');
    });
  });

  describe('fdSchema', () => {
    test('fails if amount below 1000', async () => {
      await expect(fdSchema.validate({ accountNumber: '00000001', amount: 500, interestRate: 7, tenureMonths: 12 })).rejects.toThrow();
    });
    test('passes with valid FD data', async () => {
      await expect(fdSchema.validate({ accountNumber: '00000001', amount: 10000, interestRate: 7, tenureMonths: 12 })).resolves.toBeTruthy();
    });
  });

  describe('transferSchema', () => {
    test('fails if toAccountNumber missing', async () => {
      await expect(transferSchema.validate({ fromAccountNumber: '00000001', amount: 500 })).rejects.toThrow('Recipient account required');
    });
    test('passes with valid transfer data', async () => {
      await expect(transferSchema.validate({ fromAccountNumber: '00000001', toAccountNumber: '00000002', amount: 500 })).resolves.toBeTruthy();
    });
  });

});