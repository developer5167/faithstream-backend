const pool = require('../config/db');

class AppConfigRepository {
  /**
   * Get application configuration by key
   * @param {string} key 
   */
  async getConfig(key) {
    const query = 'SELECT value FROM app_configs WHERE key = $1';
    const result = await pool.query(query, [key]);
    return result.rows[0]?.value || null;
  }

  /**
   * Get multiple configurations at once
   * @param {string[]} keys 
   */
  async getConfigs(keys) {
    const query = 'SELECT key, value FROM app_configs WHERE key = ANY($1)';
    const result = await pool.query(query, [keys]);
    
    // Convert to a clean object
    return result.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }

  /**
   * Update or Create application configuration
   * @param {string} key 
   * @param {object} value 
   */
  async updateConfig(key, value) {
    const query = `
      INSERT INTO app_configs (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING key, value;
    `;
    const result = await pool.query(query, [key, value]);
    return result.rows[0];
  }

  /**
   * Get all app configurations (Admin use)
   */
  async getAllConfigs() {
    const query = 'SELECT key, value, updated_at FROM app_configs ORDER BY key ASC';
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new AppConfigRepository();
