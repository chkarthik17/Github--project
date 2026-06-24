const { pool } = require('../config/db');

const saveProfile = async (profileData) => {
  const query = `
    INSERT INTO profiles (
      github_id, username, name, bio, company, location,
      avatar_url, profile_url, followers, following, public_repos,
      account_created_at, last_analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      bio = VALUES(bio),
      company = VALUES(company),
      location = VALUES(location),
      avatar_url = VALUES(avatar_url),
      followers = VALUES(followers),
      following = VALUES(following),
      public_repos = VALUES(public_repos),
      last_analyzed_at = NOW()
  `;

  const values = [
    profileData.github_id,
    profileData.username,
    profileData.name,
    profileData.bio,
    profileData.company,
    profileData.location,
    profileData.avatar_url,
    profileData.profile_url,
    profileData.followers,
    profileData.following,
    profileData.public_repos,
    profileData.account_created_at
  ];

  const [result] = await pool.execute(query, values);

  const profileId = result.insertId || await getProfileIdByUsername(profileData.username);

  return profileId;
};


const getProfileIdByUsername = async (username) => {
  const query = 'SELECT id FROM profiles WHERE username = ?';
  const [rows] = await pool.execute(query, [username]);
  return rows[0]?.id || null;
};


const saveAnalytics = async (analyticsData) => {
  const query = `
    INSERT INTO profile_analytics (
      profile_id, health_score, developer_grade, total_stars, total_forks,
      top_repository, account_age_years, developer_type, recommendation_count, analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      health_score = VALUES(health_score),
      developer_grade = VALUES(developer_grade),
      total_stars = VALUES(total_stars),
      total_forks = VALUES(total_forks),
      top_repository = VALUES(top_repository),
      account_age_years = VALUES(account_age_years),
      developer_type = VALUES(developer_type),
      recommendation_count = VALUES(recommendation_count),
      analyzed_at = NOW()
  `;

  const values = [
    analyticsData.profile_id,
    analyticsData.health_score,
    analyticsData.developer_grade,
    analyticsData.total_stars,
    analyticsData.total_forks,
    analyticsData.top_repository,
    analyticsData.account_age_years,
    analyticsData.developer_type,
    analyticsData.recommendation_count
  ];

  await pool.execute(query, values);
};


const saveRepositories = async (profileId, repositories) => {
  await pool.execute('DELETE FROM repositories WHERE profile_id = ?', [profileId]);

  if (!repositories || repositories.length === 0) return;

  const query = `
    INSERT INTO repositories (
      profile_id, github_repo_id, repo_name, language, stars, forks,
      watchers, open_issues, is_fork, repo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const promises = repositories.map(repo => {
    const values = [
      profileId,
      repo.id,
      repo.name,
      repo.language,
      repo.stargazers_count || 0,
      repo.forks_count || 0,
      repo.watchers_count || 0,
      repo.open_issues_count || 0,
      repo.fork || false,
      repo.html_url
    ];
    return pool.execute(query, values);
  });

  await Promise.all(promises);
};


const saveLanguages = async (profileId, languages) => {
  await pool.execute('DELETE FROM profile_languages WHERE profile_id = ?', [profileId]);

  if (!languages || languages.length === 0) return;

  const query = `
    INSERT INTO profile_languages (profile_id, language_name, repository_count, percentage)
    VALUES (?, ?, ?, ?)
  `;

  const promises = languages.map(lang => {
    const values = [profileId, lang.name, lang.count, lang.percentage];
    return pool.execute(query, values);
  });

  await Promise.all(promises);
};


const saveSnapshot = async (snapshotData) => {
  const query = `
    INSERT INTO profile_snapshots (
      profile_id, followers, following, public_repos,
      total_stars, total_forks, health_score, snapshot_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const values = [
    snapshotData.profile_id,
    snapshotData.followers,
    snapshotData.following,
    snapshotData.public_repos,
    snapshotData.total_stars,
    snapshotData.total_forks,
    snapshotData.health_score
  ];

  await pool.execute(query, values);
};


const saveRecommendations = async (profileId, recommendations) => {
  await pool.execute('DELETE FROM recommendations WHERE profile_id = ?', [profileId]);

  if (!recommendations || recommendations.length === 0) return;

  const query = `
    INSERT INTO recommendations (profile_id, recommendation_text, priority_level, generated_at)
    VALUES (?, ?, ?, NOW())
  `;

  const promises = recommendations.map(rec => {
    const values = [profileId, rec.text, rec.priority];
    return pool.execute(query, values);
  });

  await Promise.all(promises);
};


const getAllProfiles = async (limit = 10, offset = 0) => {
  const parsedLimit = parseInt(limit, 10) || 10;
  const parsedOffset = parseInt(offset, 10) || 0;

  const query = `
    SELECT
      p.id, p.username, p.name, p.avatar_url, p.public_repos,
      p.followers, p.following, p.last_analyzed_at,
      pa.health_score, pa.developer_grade, pa.total_stars, pa.total_forks
    FROM profiles p
    LEFT JOIN profile_analytics pa ON p.id = pa.profile_id
    ORDER BY COALESCE(pa.health_score, 0) DESC
    LIMIT ${parsedLimit} OFFSET ${parsedOffset}
  `;

  const [rows] = await pool.query(query);
  return rows;
};


const getProfileCount = async () => {
  const query = 'SELECT COUNT(*) as count FROM profiles';
  const [rows] = await pool.execute(query);
  return rows[0].count;
};


const getProfileByUsername = async (username) => {
  const query = `
    SELECT p.*, pa.health_score, pa.developer_grade, pa.total_stars,
           pa.total_forks, pa.top_repository, pa.developer_type
    FROM profiles p
    LEFT JOIN profile_analytics pa ON p.id = pa.profile_id
    WHERE p.username = ?
  `;

  const [rows] = await pool.execute(query, [username]);
  return rows[0] || null;
};


const getAnalytics = async (username) => {
  const query = `
    SELECT pa.*
    FROM profile_analytics pa
    JOIN profiles p ON pa.profile_id = p.id
    WHERE p.username = ?
  `;

  const [rows] = await pool.execute(query, [username]);
  return rows[0] || null;
};


const getLanguages = async (username) => {
  const query = `
    SELECT pl.language_name, pl.repository_count, pl.percentage
    FROM profile_languages pl
    JOIN profiles p ON pl.profile_id = p.id
    WHERE p.username = ?
    ORDER BY pl.percentage DESC
  `;

  const [rows] = await pool.execute(query, [username]);
  return rows;
};


const getHistory = async (username, limit = 30) => {
  const parsedLimit = parseInt(limit, 10) || 30;

  const query = `
    SELECT ps.*
    FROM profile_snapshots ps
    JOIN profiles p ON ps.profile_id = p.id
    WHERE p.username = ?
    ORDER BY ps.snapshot_date DESC
    LIMIT ${parsedLimit}
  `;

  const [rows] = await pool.query(query, [username]);
  return rows;
};


const getRecommendations = async (username) => {
  const query = `
    SELECT r.recommendation_text, r.priority_level, r.generated_at
    FROM recommendations r
    JOIN profiles p ON r.profile_id = p.id
    WHERE p.username = ?
    ORDER BY
      CASE r.priority_level
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
      END
  `;

  const [rows] = await pool.execute(query, [username]);
  return rows;
};


const compareProfiles = async (user1, user2) => {
  const query = `
    SELECT p.id, p.username, p.name, p.avatar_url, p.followers, p.following,
           p.public_repos,
           COALESCE(pa.health_score, 0) as health_score,
           COALESCE(pa.developer_grade, 'N/A') as developer_grade,
           COALESCE(pa.total_stars, 0) as total_stars,
           COALESCE(pa.total_forks, 0) as total_forks
    FROM profiles p
    LEFT JOIN profile_analytics pa ON p.id = pa.profile_id
    WHERE p.username IN (?, ?)
  `;

  const [rows] = await pool.execute(query, [user1, user2]);

  if (rows.length !== 2) return null;

  const profile1 = rows.find(r => r.username === user1);
  const profile2 = rows.find(r => r.username === user2);

  return { profile1, profile2 };
};


const saveComparison = async (comparisonData) => {
  const query = `
    INSERT INTO profile_comparisons (
      profile1_id, profile2_id, winner_profile_id, score_difference, compared_at
    ) VALUES (?, ?, ?, ?, NOW())
  `;

  const values = [
    comparisonData.profile1_id,
    comparisonData.profile2_id,
    comparisonData.winner_profile_id,
    comparisonData.score_difference
  ];

  await pool.execute(query, values);
};


const deleteProfile = async (username) => {
  const query = 'DELETE FROM profiles WHERE username = ?';
  const [result] = await pool.execute(query, [username]);
  return result.affectedRows > 0;
};

module.exports = {
  saveProfile,
  saveAnalytics,
  saveRepositories,
  saveLanguages,
  saveSnapshot,
  saveRecommendations,
  getProfileIdByUsername,
  getAllProfiles,
  getProfileCount,
  getProfileByUsername,
  getAnalytics,
  getLanguages,
  getHistory,
  getRecommendations,
  compareProfiles,
  saveComparison,
  deleteProfile
};
