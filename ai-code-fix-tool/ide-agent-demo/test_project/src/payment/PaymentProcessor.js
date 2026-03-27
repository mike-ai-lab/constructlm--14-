/**
 * Payment Processing Service
 * Handles payment transactions and validation
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { OrderModel } = require('../models/Order');
const { CartService } = require('../cart/CartService');

class PaymentProcessor {
  /**
   * Process payment
   * BUG: No idempotency key - duplicate charges possible
   * BUG: Insufficient error handling for network failures
   */
  async processPayment(userId, paymentMethod, billingAddress) {
    try {
      // Get cart total
      const cartTotal = await CartService.calculateTotal(userId);
      
      if (cartTotal.total <= 0) {
        throw new Error('Cart is empty');
      }

      // Validate payment method
      this.validatePaymentMethod(paymentMethod);

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(cartTotal.total * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethod.id,
        confirm: true,
        description: `Order for user ${userId}`,
        metadata: {
          userId: userId,
          orderDate: new Date().toISOString()
        }
      });

      // BUG: Should check payment status before creating order
      // if (paymentIntent.status !== 'succeeded') { ... }

      // Create order
      const order = await this.createOrder(userId, paymentIntent, billingAddress);

      // Clear cart
      await CartService.clearCart(userId);

      return {
        success: true,
        orderId: order.id,
        transactionId: paymentIntent.id,
        amount: cartTotal.total
      };

    } catch (error) {
      console.error('Payment processing error:', error);
      
      // BUG: Exposing internal error messages to client
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Validate payment method
   * BUG: Weak validation - should check card expiry, CVV, etc.
   */
  validatePaymentMethod(paymentMethod) {
    if (!paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (!paymentMethod.id) {
      throw new Error('Invalid payment method');
    }

    // BUG: Should validate card type, check if card is expired
    // BUG: Should check if card is in blacklist
  }

  /**
   * Create order record
   */
  async createOrder(userId, paymentIntent, billingAddress) {
    const cart = await CartService.getCart(userId);
    const totals = await CartService.calculateTotal(userId);

    const order = await OrderModel.create({
      userId,
      items: cart.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
      transactionId: paymentIntent.id,
      paymentStatus: 'completed',
      billingAddress,
      createdAt: new Date(),
      status: 'processing'
    });

    return order;
  }

  /**
   * Process refund
   * BUG: No validation for refund amount vs original charge
   * BUG: No partial refund support
   */
  async processRefund(orderId, reason) {
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.paymentStatus === 'refunded') {
      throw new Error('Order already refunded');
    }

    // BUG: Should check if order is older than refund window (e.g., 30 days)
    
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.transactionId,
        reason: reason || 'requested_by_customer'
      });

      // Update order status
      order.paymentStatus = 'refunded';
      order.refundId = refund.id;
      order.refundedAt = new Date();
      await OrderModel.update(order);

      return {
        success: true,
        refundId: refund.id,
        amount: order.total
      };

    } catch (error) {
      console.error('Refund processing error:', error);
      throw new Error('Refund failed');
    }
  }

  /**
   * Verify webhook signature
   * BUG: Webhook signature verification is commented out
   */
  verifyWebhook(payload, signature) {
    // BUG: This should be uncommented and properly implemented
    // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    return JSON.parse(payload);
  }

  /**
   * Handle payment webhook
   */
  async handleWebhook(event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      
      case 'charge.refunded':
        await this.handleRefund(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    // Update order status
    const order = await OrderModel.findByTransactionId(paymentIntent.id);
    if (order) {
      order.paymentStatus = 'completed';
      await OrderModel.update(order);
    }
  }

  async handlePaymentFailure(paymentIntent) {
    // Update order status
    const order = await OrderModel.findByTransactionId(paymentIntent.id);
    if (order) {
      order.paymentStatus = 'failed';
      order.failureReason = paymentIntent.last_payment_error?.message;
      await OrderModel.update(order);
    }
  }

  async handleRefund(charge) {
    // Update order status
    const order = await OrderModel.findByTransactionId(charge.payment_intent);
    if (order) {
      order.paymentStatus = 'refunded';
      await OrderModel.update(order);
    }
  }
}

module.exports = new PaymentProcessor();
