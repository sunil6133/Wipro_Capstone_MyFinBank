# 💳 MyFin Bank — Full Stack MERN Banking Application

## Architecture
React Frontend → Express Backend → MongoDB (12 Collections)

### Tech Stack
- **Frontend**: React, Redux Toolkit, Axios + Interceptors, Formik + Yup, React Router, Socket.io Client
- **Backend**: Express, Mongoose, JWT Auth, Multer (file uploads), Socket.io, node-cron, Nodemailer
- **Database**: MongoDB with 12 Collections

## Collections
1. `customers` — MYFIN-CUST-XXXX
2. `accounts` — MYFIN-SACC-XXXX / MYFIN-CACC-XXXX
3. `transactions` — MYFIN-TXN-XXXXXX
4. `loans` — MYFIN-LN-XXXX
5. `loan_payments` — MYFIN-PAY-XXXX
6. `fixed_deposits` — MYFIN-FD-XXXX
7. `recurring_deposits` — MYFIN-RD-XXXX
8. `beneficiaries` — MYFIN-BEN-XXXX
9. `support_tickets` — MYFIN-TKT-XXXX
10. `support_messages` — MYFIN-MSG-XXXX
11. `admins` — MYFIN-ADMIN-XXXX
12. `password_reset_tokens` — MYFIN-OTP-XXXX

## Setup

### Backend
```bash
cd backend
npm install
# Edit .env with your MongoDB URI and email credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Seed Admin
```bash
curl -X POST http://localhost:5000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@myfinbank.com","password":"admin123"}'
```

## Key Features
- KYC registration with Aadhaar/PAN upload
- Admin KYC approval/rejection flow
- Savings & Current accounts with AT_RISK → DEACTIVATED lifecycle
- Full passbook with referenceId pairing for transfers
- Loans with EMI calculator and disbursement
- Fixed Deposits & Recurring Deposits
- Beneficiary management with admin approval
- Real-time support chat via Socket.io
- Forgot Password with OTP via email
- Cron job: AT_RISK accounts auto-deactivated after 24h
- Admin dashboard with live computed stats
