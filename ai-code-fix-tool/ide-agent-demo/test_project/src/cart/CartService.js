/**
 * Shopping Cart Service
 * Manages cart operations and calculations
 */

const { CartModel } = require('../models/Cart');
const { ProductModel } = require('../models/Product');

class CartService {
  /**
   * Add item to cart
   */
  async addItem(userId, productId, quantity) {
    // Validate quantity
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Get product details
    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check stock availability
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    // Get or create cart
    let cart = await CartModel.findByUserId(userId);
    if (!cart) {
      cart = await CartModel.create({ userId, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(item => item.productId === productId);
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      existingItem.updatedAt = new Date();
    } else {
      // Add new item
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        addedAt: new Date()
      });
    }

    // Save cart
    await CartModel.update(cart);

    return cart;
  }

  /**
   * Calculate cart total
   * BUG: Doesn't handle discount codes properly
   * BUG: Tax calculation is incorrect for international orders
   */
  async calculateTotal(userId, discountCode = null) {
    const cart = await CartModel.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        total: 0
      };
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.price * item.quantity;
    }

    // Apply discount
    let discount = 0;
    if (discountCode) {
      // BUG: Should validate discount code expiry and usage limits
      const discountPercent = this.getDiscountPercent(discountCode);
      discount = subtotal * (discountPercent / 100);
    }

    // Calculate tax (BUG: Fixed 10% tax, should vary by location)
    const taxRate = 0.10;
    const tax = (subtotal - discount) * taxRate;

    // Calculate shipping
    const shipping = this.calculateShipping(subtotal, cart.items.length);

    // BUG: Rounding error - should use Math.round(total * 100) / 100
    const total = subtotal - discount + tax + shipping;

    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2)
    };
  }

  /**
   * Calculate shipping cost
   * BUG: Free shipping threshold should be configurable
   */
  calculateShipping(subtotal, itemCount) {
    // Free shipping over $50
    if (subtotal >= 50) {
      return 0;
    }

    // $5 base + $2 per item
    return 5 + (itemCount * 2);
  }

  /**
   * Get discount percentage
   * BUG: Hardcoded discounts, should be in database
   */
  getDiscountPercent(code) {
    const discounts = {
      'SAVE10': 10,
      'SAVE20': 20,
      'WELCOME': 15,
      'SUMMER': 25
    };

    return discounts[code.toUpperCase()] || 0;
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId, productId) {
    const cart = await CartModel.findByUserId(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(item => item.productId !== productId);
    await CartModel.update(cart);

    return cart;
  }

  /**
   * Update item quantity
   * BUG: No validation for negative quantities
   */
  async updateQuantity(userId, productId, quantity) {
    const cart = await CartModel.findByUserId(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = cart.items.find(item => item.productId === productId);
    if (!item) {
      throw new Error('Item not in cart');
    }

    // BUG: Should check product stock before updating
    item.quantity = quantity;
    item.updatedAt = new Date();

    await CartModel.update(cart);

    return cart;
  }

  /**
   * Clear cart
   */
  async clearCart(userId) {
    const cart = await CartModel.findByUserId(userId);
    if (cart) {
      cart.items = [];
      await CartModel.update(cart);
    }
    return cart;
  }
}

module.exports = new CartService();
