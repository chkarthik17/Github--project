const mysql = require('mysql2/promise');
require('dotenv').config();

const connectionConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'github_analyzer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: {
    rejectUnauthorized: true
  }
};

const pool = mysql.createPool(connectionConfig);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    console.log('Connected to:', process.env.DB_HOST);
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Connection config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
