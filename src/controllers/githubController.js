const githubService = require('../services/githubService');
const profileModel = require('../models/profileModel');
const {
  calculateHealthScore,
  getDeveloperGrade,
  calculateAccountAge,
  getDeveloperType,
  processRepositories,
  analyzeLanguages,
  generateRecommendations,
  compareProfiles
} = require('../utils/insightsCalculator');

// Analyze GitHub profile
const analyzeProfile = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    // Fetch profile and repositories from GitHub
    const { profile, repositories } = await githubService.getCompleteProfile(username);

    // Helper function to convert ISO date to MySQL datetime
    const formatDateForMySQL = (isoDate) => {
      if (!isoDate) return null;
      const date = new Date(isoDate);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    // 1. Save basic profile
    const profileId = await profileModel.saveProfile({
      github_id: profile.id,
      username: profile.login,
      name: profile.name,
      bio: profile.bio,
      company: profile.company,
      location: profile.location,
      avatar_url: profile.avatar_url,
      profile_url: profile.html_url,
      followers: profile.followers,
      following: profile.following,
      public_repos: profile.public_repos,
      account_created_at: formatDateForMySQL(profile.created_at)
    });

    // 2. Process repositories
    const repoInsights = processRepositories(repositories);

    // 3. Save repositories
    await profileModel.saveRepositories(profileId, repositories);

    // 4. Analyze languages
    const languages = analyzeLanguages(repositories);
    await profileModel.saveLanguages(profileId, languages);

    // 5. Calculate analytics
    const accountAge = calculateAccountAge(profile.created_at);
    const healthScore = calculateHealthScore(profile, repoInsights, languages);
    const developerGrade = getDeveloperGrade(healthScore);
    const developerType = getDeveloperType(repositories, languages);

    // console.log('Health score:', healthScore); // for testing

    // 6. Generate recommendations
    const recommendations = generateRecommendations(profile, { healthScore }, languages, repoInsights);

    // 7. Save analytics
    await profileModel.saveAnalytics({
      profile_id: profileId,
      health_score: healthScore,
      developer_grade: developerGrade,
      total_stars: repoInsights.totalStars,
      total_forks: repoInsights.totalForks,
      top_repository: repoInsights.mostStarredRepo,
      account_age_years: accountAge,
      developer_type: developerType,
      recommendation_count: recommendations.length
    });

    // 8. Save snapshot for history tracking
    await profileModel.saveSnapshot({
      profile_id: profileId,
      followers: profile.followers,
      following: profile.following,
      public_repos: profile.public_repos,
      total_stars: repoInsights.totalStars,
      total_forks: repoInsights.totalForks,
      health_score: healthScore
    });

    // 9. Save recommendations
    await profileModel.saveRecommendations(profileId, recommendations);

    // 10. Fetch complete profile with analytics
    const savedProfile = await profileModel.getProfileByUsername(username);

    res.status(200).json({
      success: true,
      message: 'Profile analyzed successfully',
      data: {
        profile: savedProfile,
        analytics: {
          health_score: healthScore,
          developer_grade: developerGrade,
          developer_type: developerType,
          account_age_years: accountAge,
          total_stars: repoInsights.totalStars,
          total_forks: repoInsights.totalForks,
          top_repository: repoInsights.mostStarredRepo
        },
        languages: languages.slice(0, 5),
        recommendations: recommendations
      }
    });

  } catch (error) {
    console.error('Error analyzing profile:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze profile',
      details: error.message
    });
  }
};

const getAllProfiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [profiles, totalCount] = await Promise.all([
      profileModel.getAllProfiles(limit, offset),
      profileModel.getProfileCount()
    ]);

    res.status(200).json({
      success: true,
      data: profiles,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profiles',
      details: error.message
    });
  }
};

const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const profile = await profileModel.getProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found in database'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      details: error.message
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { username } = req.params;

    const analytics = await profileModel.getAnalytics(username);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Analytics not found for this profile'
      });
    }

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      details: error.message
    });
  }
};


const getLanguages = async (req, res) => {
  try {
    const { username } = req.params;

    const languages = await profileModel.getLanguages(username);

    res.status(200).json({
      success: true,
      data: languages
    });

  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch languages',
      details: error.message
    });
  }
};


const getHistory = async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit) || 30;

    const history = await profileModel.getHistory(username, limit);

    res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
      details: error.message
    });
  }
};


const getRecommendations = async (req, res) => {
  try {
    const { username } = req.params;

    const recommendations = await profileModel.getRecommendations(username);

    res.status(200).json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
      details: error.message
    });
  }
};


const compareTwoProfiles = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const result = await profileModel.compareProfiles(user1, user2);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'One or both profiles not found'
      });
    }

    const comparison = compareProfiles(result.profile1, result.profile2);

    // Save comparison history
    await profileModel.saveComparison({
      profile1_id: result.profile1.id,
      profile2_id: result.profile2.id,
      winner_profile_id: comparison.winner_profile_id,
      score_difference: comparison.score_difference
    });

    res.status(200).json({
      success: true,
      data: {
        profile1: result.profile1,
        profile2: result.profile2,
        comparison: comparison
      }
    });

  } catch (error) {
    console.error('Error comparing profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare profiles',
      details: error.message
    });
  }
};


const deleteProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const deleted = await profileModel.deleteProfile(username);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete profile',
      details: error.message
    });
  }
};

module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  getAnalytics,
  getLanguages,
  getHistory,
  getRecommendations,
  compareTwoProfiles,
  deleteProfile
};
