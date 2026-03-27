/**
 * User Model
 * Database operations for user management
 */

const db = require('../database/connection');

class UserModel {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const [rows] = await db.execute(query, [email]);
    return rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(userId) {
    const query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    const [rows] = await db.execute(query, [userId]);
    return rows[0] || null;
  }

  /**
   * Create new user
   * BUG: SQL injection vulnerability if not using parameterized queries
   */
  async create(userData) {
    const query = `
      INSERT INTO users (email, username, password, created_at, is_active, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.execute(query, [
      userData.email,
      userData.username,
      userData.password,
      userData.createdAt,
      userData.isActive,
      userData.role || 'user'
    ]);

    return {
      id: result.insertId,
      ...userData
    };
  }

  /**
   * Update user
   */
  async update(userId, updates) {
    const allowedFields = ['username', 'email', 'is_active', 'role'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    await db.execute(query, values);
    return this.findById(userId);
  }

  /**
   * Update last login timestamp
   * BUG: Not being called from AuthService
   */
  async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login_at = NOW() WHERE id = ?';
    await db.execute(query, [userId]);
  }

  /**
   * Delete user (soft delete)
   */
  async delete(userId) {
    const query = 'UPDATE users SET is_active = false, deleted_at = NOW() WHERE id = ?';
    await db.execute(query, [userId]);
  }

  /**
   * Get user statistics
   */
  async getStats(userId) {
    const query = `
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    const [rows] = await db.execute(query, [userId]);
    return rows[0] || { total_orders: 0, total_spent: 0, last_order_date: null };
  }
}

module.exports = { UserModel: new UserModel() };
