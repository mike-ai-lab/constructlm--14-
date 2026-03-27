# E-Commerce Backend - Test Project

A realistic e-commerce backend with authentication, shopping cart, payment processing, and order management.

## Project Structure

```
test_project/
├── src/
│   ├── auth/
│   │   └── AuthService.js          # User authentication & JWT
│   ├── cart/
│   │   └── CartService.js          # Shopping cart logic
│   ├── payment/
│   │   └── PaymentProcessor.js     # Stripe payment integration
│   ├── models/
│   │   └── User.js                 # User database model
│   ├── api/
│   │   └── routes/
│   │       └── orderRoutes.js      # Order API endpoints
│   └── utils/
│       └── emailService.js         # Email notifications
└── README.md
```

## Known Issues (Bugs)

### Authentication (AuthService.js)
1. Weak password validation (only 6 chars minimum)
2. No rate limiting on login (brute force vulnerability)
3. Missing lastLoginAt timestamp update
4. No token blacklist for logged out users

### Shopping Cart (CartService.js)
1. Discount codes not validated for expiry/usage limits
2. Tax calculation is fixed 10% (should vary by location)
3. Rounding errors in total calculation
4. Free shipping threshold is hardcoded
5. No stock validation when updating quantity
6. Discount codes hardcoded (should be in database)

### Payment (PaymentProcessor.js)
1. No idempotency key (duplicate charges possible)
2. Weak payment method validation
3. No card expiry/CVV validation
4. Exposing internal error messages to client
5. No refund amount validation
6. No partial refund support
7. Webhook signature verification commented out
8. No refund window validation (30 days)

### Order Routes (orderRoutes.js)
1. No authorization check on GET /orders/:id (any user can view any order)
2. Can cancel orders that are already shipped
3. Tracking info is hardcoded (should integrate with shipping API)

### Email Service (emailService.js)
1. Email credentials hardcoded
2. No retry mechanism for failed sends
3. No XSS protection in email content
4. No unsubscribe link (required by law)

### User Model (User.js)
1. updateLastLogin() not being called from AuthService

## Technologies Used

- Node.js / Express
- JWT for authentication
- bcrypt for password hashing
- Stripe for payments
- nodemailer for emails
- MySQL database

## Security Concerns

- SQL injection risks
- XSS vulnerabilities
- Missing rate limiting
- Weak input validation
- Exposed error messages
- Hardcoded secrets
