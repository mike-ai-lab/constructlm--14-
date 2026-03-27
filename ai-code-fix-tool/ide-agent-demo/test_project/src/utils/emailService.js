/**
 * Email Service
 * Handles sending transactional emails
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // BUG: Email credentials hardcoded, should use environment variables
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'noreply@example.com',
        pass: process.env.EMAIL_PASS || 'password123'
      }
    });
  }

  /**
   * Send order confirmation email
   * BUG: No email template validation
   * BUG: No retry mechanism for failed sends
   */
  async sendOrderConfirmation(userEmail, orderDetails) {
    try {
      const mailOptions = {
        from: '"E-Shop" <noreply@example.com>',
        to: userEmail,
        subject: `Order Confirmation - #${orderDetails.orderId}`,
        html: this.generateOrderConfirmationHTML(orderDetails)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Order confirmation sent:', info.messageId);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      // BUG: Should retry or queue for later
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate order confirmation HTML
   * BUG: No XSS protection in email content
   */
  generateOrderConfirmationHTML(orderDetails) {
    const itemsHTML = orderDetails.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>$${item.price}</td>
        <td>$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Order Confirmation</h1>
          <p>Thank you for your order!</p>
          
          <h2>Order #${orderDetails.orderId}</h2>
          <p>Order Date: ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
          
          <table border="1" cellpadding="10" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div style="margin-top: 20px;">
            <p><strong>Subtotal:</strong> $${orderDetails.subtotal}</p>
            <p><strong>Tax:</strong> $${orderDetails.tax}</p>
            <p><strong>Shipping:</strong> $${orderDetails.shipping}</p>
            <p><strong>Total:</strong> $${orderDetails.total}</p>
          </div>
          
          <p>Your order will be shipped to:</p>
          <p>
            ${orderDetails.shippingAddress.street}<br>
            ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.zip}
          </p>
          
          <p>Track your order: <a href="https://example.com/orders/${orderDetails.orderId}/tracking">Click here</a></p>
        </body>
      </html>
    `;
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(userEmail, resetToken) {
    try {
      const resetLink = `https://example.com/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: '"E-Shop" <noreply@example.com>',
        to: userEmail,
        subject: 'Password Reset Request',
        html: `
          <html>
            <body>
              <h1>Password Reset</h1>
              <p>You requested a password reset. Click the link below to reset your password:</p>
              <p><a href="${resetLink}">Reset Password</a></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send shipping notification
   * BUG: No unsubscribe link (required by law)
   */
  async sendShippingNotification(userEmail, trackingInfo) {
    try {
      const mailOptions = {
        from: '"E-Shop" <noreply@example.com>',
        to: userEmail,
        subject: `Your order has shipped! - #${trackingInfo.orderId}`,
        html: `
          <html>
            <body>
              <h1>Your Order Has Shipped!</h1>
              <p>Order #${trackingInfo.orderId} is on its way!</p>
              <p><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber}</p>
              <p><strong>Carrier:</strong> ${trackingInfo.carrier}</p>
              <p><strong>Estimated Delivery:</strong> ${trackingInfo.estimatedDelivery}</p>
              <p><a href="https://example.com/orders/${trackingInfo.orderId}/tracking">Track Your Package</a></p>
            </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Shipping notification error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
