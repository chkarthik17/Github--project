const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

router.post('/profiles/:username', githubController.analyzeProfile);

router.get('/profiles', githubController.getAllProfiles);

router.get('/profiles/compare/:user1/:user2', githubController.compareTwoProfiles);

router.get('/profiles/:username/analytics', githubController.getAnalytics);

router.get('/profiles/:username/languages', githubController.getLanguages);

router.get('/profiles/:username/history', githubController.getHistory);

router.get('/profiles/:username/recommendations', githubController.getRecommendations);

router.get('/profiles/:username', githubController.getProfileByUsername);

router.delete('/profiles/:username', githubController.deleteProfile);

module.exports = router;
