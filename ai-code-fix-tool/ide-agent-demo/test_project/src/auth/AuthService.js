/**
 * Authentication Service
 * Handles user login, registration, and token management
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { UserModel } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const TOKEN_EXPIRY = '24h';

class AuthService {
  /**
   * Register a new user
   * BUG: Password validation is too weak
   */
  async register(email, password, username) {
    // Validate email format
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }

    // BUG: Password should require minimum 8 characters, uppercase, lowercase, number
    if (password.length < 6) {
      throw new Error('Password too short');
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await UserModel.create({
      email,
      username,
      password: hashedPassword,
      createdAt: new Date(),
      isActive: true
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    };
  }

  /**
   * Login user
   * BUG: No rate limiting - vulnerable to brute force attacks
   */
  async login(email, password) {
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // BUG: Should update lastLoginAt timestamp
    // await UserModel.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
  }

  /**
   * Verify JWT token
   * BUG: No token blacklist check for logged out users
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(oldToken) {
    const decoded = this.verifyToken(oldToken);
    const user = await UserModel.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return this.generateToken(user);
  }
}

module.exports = new AuthService();
