import * as Yup from 'yup';

export const registerSchema = Yup.object({
  name: Yup.string().min(2).required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Min 8 characters').required('Password is required'),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'Enter valid 10-digit phone'),
  address: Yup.string().required('Address is required'),
  govIdType: Yup.string().oneOf(['AADHAAR', 'PAN']).required('ID type required'),
  govIdNumber: Yup.string().required('ID number required'),
  accountType: Yup.string().oneOf(['SAVINGS', 'CURRENT']).required('Account type required')
});

export const loginSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required')
});

export const depositSchema = Yup.object({
  accountNumber: Yup.string().required('Account is required'),
  amount: Yup.number().min(1, 'Min Rs.1').required('Amount required')
});

export const withdrawSchema = Yup.object({
  accountNumber: Yup.string().required('Account is required'),
  amount: Yup.number().min(1, 'Min Rs.1').required('Amount required')
});

export const transferSchema = Yup.object({
  fromAccountNumber: Yup.string().required('Source account is required'),
  toAccountNumber: Yup.string().required('Recipient account required'),
  amount: Yup.number().min(1, 'Min Rs.1').required('Amount required'),
  description: Yup.string()
});

export const loanSchema = Yup.object({
  accountNumber: Yup.string().required('Account is required'),
  loanAmount: Yup.number().min(1000, 'Min Rs.1,000').required('Loan amount required'),
  interestRate: Yup.number().min(1).max(30).required('Interest rate required'),
  tenureMonths: Yup.number().min(1).max(360).required('Tenure required'),
  purpose: Yup.string().required('Purpose required')
});

export const fdSchema = Yup.object({
  accountNumber: Yup.string().required('Account is required'),
  amount: Yup.number().min(1000, 'Min Rs.1,000').required('Amount required'),
  interestRate: Yup.number().min(1).max(20).required('Interest rate required'),
  tenureMonths: Yup.number().min(1).max(120).required('Tenure required')
});

export const rdSchema = Yup.object({
  accountNumber: Yup.string().required('Account is required'),
  monthlyAmount: Yup.number().min(100, 'Min Rs.100').required('Monthly amount required'),
  interestRate: Yup.number().min(1).max(20).required('Interest rate required'),
  tenureMonths: Yup.number().min(6).max(120).required('Tenure required')
});

export const beneficiarySchema = Yup.object({
  beneficiaryName: Yup.string().required('Name required'),
  accountNumber: Yup.string().required('Account number required'),
  branch: Yup.string()
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email().required('Email required')
});

export const resetPasswordSchema = Yup.object({
  otp: Yup.string().length(6, 'OTP must be 6 digits').required('OTP required'),
  newPassword: Yup.string().min(8).required('New password required')
});
