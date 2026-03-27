/**
 * Order API Routes
 * Handles order-related HTTP endpoints
 */

const express = require('express');
const router = express.Router();
const { OrderModel } = require('../../models/Order');
const { authMiddleware } = require('../../middleware/auth');
const { validateOrder } = require('../../validators/orderValidator');

/**
 * GET /api/orders
 * Get all orders for current user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await OrderModel.findByUserId(userId);
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:id
 * Get specific order details
 * BUG: No authorization check - any user can view any order
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // BUG: Should verify order belongs to current user
    // if (order.userId !== req.user.userId) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', authMiddleware, validateOrder, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items, shippingAddress, billingAddress } = req.body;

    // BUG: No validation for empty items array
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one item'
      });
    }

    const order = await OrderModel.create({
      userId,
      items,
      shippingAddress,
      billingAddress,
      status: 'pending',
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order
 * BUG: Can cancel orders that are already shipped
 */
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.userId;

    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Verify ownership
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // BUG: Should check if order status allows cancellation
    // if (['shipped', 'delivered'].includes(order.status)) {
    //   return res.status(400).json({ error: 'Cannot cancel shipped orders' });
    // }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await OrderModel.update(order);

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:id/tracking
 * Get order tracking information
 */
router.get('/:id/tracking', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await OrderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Verify ownership
    if (order.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // BUG: Tracking info is hardcoded, should integrate with shipping API
    const tracking = {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber || 'N/A',
      carrier: 'USPS',
      estimatedDelivery: order.estimatedDelivery,
      events: [
        { date: order.createdAt, status: 'Order placed' },
        { date: order.shippedAt, status: 'Shipped' }
      ]
    };

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
