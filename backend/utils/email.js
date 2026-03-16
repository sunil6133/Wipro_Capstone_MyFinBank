const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"MyFin Bank" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
  console.log(`Email sent to ${to}`);
};

const sendBalanceZeroAlert = async (customerId, accountNumber) => {
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `[MyFin Bank] Account AT_RISK: ${accountNumber}`,
      html: `<p>Account <strong>${accountNumber}</strong> (Customer: <strong>${customerId}</strong>) has reached zero balance and is now AT_RISK. It will be auto-deactivated in 24 hours if funds are not deposited.</p>`
    });
  } catch (err) {
    console.error('Balance alert email failed:', err.message);
  }
};

const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: '[MyFin Bank] Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b; margin: 0 0 16px;">MyFin Bank</h2>
        <p style="color: #475569; font-size: 15px;">You requested a password reset. Use the OTP below.</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
          <p style="margin: 0; font-size: 36px; font-weight: 800; color: #3b82f6; letter-spacing: 8px;">${otp}</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `
  });
};

const sendKYCStatusEmail = async (email, name, status) => {
  try {
    await sendEmail({
      to: email,
      subject: `[MyFin Bank] KYC Verification ${status === 'ACTIVE' ? 'Approved' : 'Rejected'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e293b; margin: 0 0 16px;">MyFin Bank</h2>
          <p style="color: #475569; font-size: 15px;">Dear <strong>${name}</strong>,</p>
          <p style="color: #475569; font-size: 15px;">Your KYC verification has been <strong style="color: ${status === 'ACTIVE' ? '#22c55e' : '#ef4444'};">${status === 'ACTIVE' ? 'Approved' : 'Rejected'}</strong>.</p>
          <p style="color: #475569; font-size: 15px;">${status === 'ACTIVE' ? 'You can now log in and start using your MyFin Bank account.' : 'Please contact our support team for more information.'}</p>
        </div>
      `
    });
  } catch (err) {
    console.error('KYC email failed:', err.message);
  }
};

const sendWelcomeEmail = async (email, name, accountNumber, accountType) => {
  try {
    await sendEmail({
      to: email,
      subject: '[MyFin Bank] Welcome! Your Account is Now Active',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: #1e293b; padding: 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">MyFin Bank</h1>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Your trusted banking partner</p>
          </div>
          <div style="padding: 36px 32px; background: #fff;">
            <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 22px;">Welcome, ${name}!</h2>
            <p style="color: #475569; font-size: 15px; margin: 0 0 24px;">We are delighted to welcome you to MyFin Bank. Your KYC verification has been successfully approved and your bank account is now active.</p>
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Your Account Details</p>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Account Number</span>
                <strong style="color: #1e293b; font-family: monospace; font-size: 16px;">${accountNumber || 'Assigned by Bank'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b; font-size: 14px;">Account Type</span>
                <strong style="color: #1e293b; font-size: 14px;">${accountType} Account</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-size: 14px;">Account Status</span>
                <strong style="color: #22c55e; font-size: 14px;">ACTIVE</strong>
              </div>
            </div>
            <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">You can now:</p>
            <ul style="color: #475569; font-size: 14px; margin: 0 0 24px; padding-left: 20px; line-height: 2;">
              <li>Deposit and withdraw funds</li>
              <li>Transfer money to other accounts</li>
              <li>Apply for loans</li>
              <li>Open Fixed and Recurring Deposits</li>
              <li>Chat with our support team</li>
            </ul>
            <p style="color: #94a3b8; font-size: 13px; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">If you have any questions, please contact our support team through the app. Thank you for choosing MyFin Bank.</p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }
};

module.exports = { sendBalanceZeroAlert, sendOTPEmail, sendKYCStatusEmail, sendWelcomeEmail };