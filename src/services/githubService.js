const axios = require('axios');
require('dotenv').config();

const GITHUB_API_BASE = 'https://api.github.com';

const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    })
  }
});


const fetchUserProfile = async (username) => {
  try {
    const response = await githubClient.get(`/users/${username}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user '${username}' not found`);
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please add GITHUB_TOKEN to .env');
    }
    throw new Error(`GitHub API error: ${error.message}`);
  }
};


const fetchUserRepositories = async (username) => {
  try {
    const repositories = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await githubClient.get(`/users/${username}/repos`, {
        params: {
          page,
          per_page: perPage,
          sort: 'updated',
          direction: 'desc'
        }
      });

      if (response.data.length === 0) break;

      repositories.push(...response.data);

      if (response.data.length < perPage) break;

      page++;

      
      if (page > 1) break;
    }

    return repositories;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch repositories: ${error.message}`);
  }
};


const getCompleteProfile = async (username) => {
  const [profile, repositories] = await Promise.all([
    fetchUserProfile(username),
    fetchUserRepositories(username)
  ]);

  return {
    profile,
    repositories
  };
};

module.exports = {
  fetchUserProfile,
  fetchUserRepositories,
  getCompleteProfile
};
