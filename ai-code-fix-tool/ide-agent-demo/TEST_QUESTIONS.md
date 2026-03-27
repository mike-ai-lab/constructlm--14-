# 🧠 Test Questions for Reasoning Display

These questions are designed to trigger complex reasoning and thinking processes from the AI agent.

## 🔴 Critical Security Questions (High Reasoning)

### 1. Authentication Vulnerabilities
```
Find all security vulnerabilities in the authentication system and explain how an attacker could exploit them.
```
**Expected Reasoning:**
- Search for AuthService
- Read authentication code
- Identify weak password validation
- Find missing rate limiting
- Explain brute force attack vector
- Check token management issues

### 2. Payment Security Audit
```
What are the most critical security issues in the payment processing system that could lead to financial loss?
```
**Expected Reasoning:**
- Search for payment-related files
- Read PaymentProcessor code
- Identify idempotency issues
- Find duplicate charge vulnerability
- Check webhook security
- Explain financial impact

### 3. Authorization Bypass
```
Is there an authorization vulnerability that would allow users to access other users' orders? Show me the exact code.
```
**Expected Reasoning:**
- Search for order routes
- Read orderRoutes.js
- Find GET /orders/:id endpoint
- Identify missing authorization check
- Show vulnerable code section
- Explain exploit scenario

## 🟡 Complex Logic Questions (Medium Reasoning)

### 4. Cart Calculation Bug
```
The cart total calculation has a rounding error. Find the bug and explain why it causes incorrect totals.
```
**Expected Reasoning:**
- Search for cart calculation
- Read CartService.calculateTotal
- Identify toFixed() usage
- Explain floating point precision issue
- Show correct rounding method
- Calculate example with error

### 5. Discount Code System
```
How does the discount code system work and what are its limitations? What happens if I use an expired code?
```
**Expected Reasoning:**
- Search for discount code logic
- Read getDiscountPercent method
- Identify hardcoded discounts
- Find missing expiry validation
- Explain current behavior
- Suggest improvements

### 6. Email Notification Flow
```
Trace the complete flow of what happens when an order is placed, including all email notifications sent.
```
**Expected Reasoning:**
- Search for order creation
- Find email service calls
- Read email templates
- Identify notification triggers
- Map complete flow
- Note missing notifications

## 🟢 Code Understanding Questions (Reasoning Required)

### 7. Password Reset Process
```
Explain step-by-step how the password reset process works, including token generation and validation.
```
**Expected Reasoning:**
- Search for password reset
- Read AuthService methods
- Find token generation
- Check email sending
- Explain security measures
- Identify missing features

### 8. Shipping Cost Logic
```
How is shipping cost calculated? When do customers get free shipping? Is this configurable?
```
**Expected Reasoning:**
- Search for shipping calculation
- Read calculateShipping method
- Identify free shipping threshold
- Find hardcoded values
- Explain calculation formula
- Note configuration issues

### 9. Order Cancellation Rules
```
What are the rules for canceling an order? Can I cancel an order that's already shipped?
```
**Expected Reasoning:**
- Search for order cancellation
- Read cancel endpoint
- Find status checks
- Identify missing validation
- Explain current behavior
- Show bug in code

## 🔵 Architecture Questions (Deep Reasoning)

### 10. Database Query Patterns
```
Find all database queries in the User model. Are there any SQL injection vulnerabilities?
```
**Expected Reasoning:**
- Search for User model
- Read all query methods
- Check parameterization
- Identify safe queries
- Find potential risks
- Explain prevention

### 11. Error Handling Analysis
```
How does the payment system handle errors? Are error messages exposed to users?
```
**Expected Reasoning:**
- Search for error handling
- Read PaymentProcessor try-catch
- Find error message exposure
- Identify security risk
- Show vulnerable code
- Suggest fixes

### 12. Token Management
```
How are JWT tokens managed? What happens when a user logs out? Is there a token blacklist?
```
**Expected Reasoning:**
- Search for JWT usage
- Read token generation
- Find logout handling
- Identify missing blacklist
- Explain security gap
- Suggest implementation

## 🟣 Multi-File Analysis (Complex Reasoning)

### 13. Complete Checkout Flow
```
Trace the complete checkout flow from adding items to cart through payment completion. What could go wrong?
```
**Expected Reasoning:**
- Search for cart operations
- Read payment processing
- Find order creation
- Identify failure points
- Map complete flow
- List potential issues

### 14. Tax Calculation Problem
```
The tax calculation is incorrect for international orders. Find the bug and explain how to fix it for different countries.
```
**Expected Reasoning:**
- Search for tax calculation
- Read calculateTotal method
- Find hardcoded 10% tax
- Identify location issue
- Explain international tax
- Suggest solution

### 15. Refund System Analysis
```
What are all the limitations and bugs in the refund system? Can I refund more than the original charge?
```
**Expected Reasoning:**
- Search for refund logic
- Read processRefund method
- Find missing validations
- Identify amount check gap
- Check partial refund support
- List all issues

## 🎯 Best Questions for Testing Reasoning

**Top 3 for Maximum Reasoning:**
1. Question #1 (Authentication Vulnerabilities) - Requires multi-file analysis
2. Question #13 (Complete Checkout Flow) - Requires tracing across multiple services
3. Question #2 (Payment Security Audit) - Requires deep security analysis

**Quick Test Questions:**
- Question #3 (Authorization Bypass) - Clear bug to find
- Question #4 (Cart Calculation Bug) - Specific technical issue
- Question #9 (Order Cancellation Rules) - Logic analysis

## Expected Reasoning Indicators

When reasoning is working, you should see:
- 🧠 Purple "THINKING" badge in topbar
- Purple section with "THINKING PROCESS (REASONING DETECTED)"
- Console logs showing reasoning detection
- Step-by-step analysis before the answer

Example reasoning output:
```
Let me analyze this security issue:
1. First, I'll search for authentication-related files
2. Then I'll read the AuthService to understand the login flow
3. I'll identify weak password validation (only 6 chars)
4. I'll check for rate limiting - it's missing!
5. This means attackers can brute force passwords
6. I'll also check token management for other issues
```
