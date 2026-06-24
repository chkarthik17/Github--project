const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const githubRoutes = require('./routes/githubRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GitHub Profile Analyzer API - Advanced Edition',
    version: '2.0.0',
    features: [
      'Profile Analysis with Health Score',
      'Language Distribution',
      'Historical Tracking',
      'Profile Comparison',
      'AI-Powered Recommendations',
      'Developer Grading System'
    ],
    endpoints: {
      analyze: 'POST /api/profiles/:username',
      getAllProfiles: 'GET /api/profiles',
      getProfile: 'GET /api/profiles/:username',
      getAnalytics: 'GET /api/profiles/:username/analytics',
      getLanguages: 'GET /api/profiles/:username/languages',
      getHistory: 'GET /api/profiles/:username/history',
      getRecommendations: 'GET /api/profiles/:username/recommendations',
      compareProfiles: 'GET /api/profiles/compare/:user1/:user2',
      deleteProfile: 'DELETE /api/profiles/:username'
    }
  });
});

app.use('/api', githubRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message
  });
});

const startServer = async () => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(`\n Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log(`Documentation: http://localhost:${PORT}/\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
