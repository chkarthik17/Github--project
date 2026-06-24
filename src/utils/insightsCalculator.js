const calculateHealthScore = (profile, repoInsights, languageData) => {
  let score = 0;

  score += Math.min((profile.followers / 100) * 20, 20);
  score += Math.min((profile.public_repos / 50) * 20, 20);
  score += Math.min((repoInsights.totalStars / 500) * 30, 30);
  score += Math.min((repoInsights.totalForks / 100) * 15, 15);

  const languageCount = languageData.length;
  score += Math.min(languageCount * 2, 10);

  const followRatio = profile.followers / Math.max(profile.following, 1);
  score += Math.min(followRatio, 5);

  return Math.round(Math.min(score, 100));
};

const getDeveloperGrade = (healthScore) => {
  if (healthScore >= 90) return 'A+';
  if (healthScore >= 80) return 'A';
  if (healthScore >= 70) return 'B+';
  if (healthScore >= 60) return 'B';
  if (healthScore >= 50) return 'C+';
  if (healthScore >= 40) return 'C';
  if (healthScore >= 30) return 'D';
  return 'F';
};

const calculateAccountAge = (createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();
  const ageInYears = (now - created) / (1000 * 60 * 60 * 24 * 365);
  return parseFloat(ageInYears.toFixed(2));
};

const getDeveloperType = (repositories, languages) => {
  if (!languages || languages.length === 0) return 'Beginner';

  const topLanguage = languages[0]?.name || '';
  const repoCount = repositories.length;

  if (repoCount > 50) return 'Prolific Contributor';
  if (repoCount > 20) return 'Active Developer';
  if (repoCount > 10) return 'Regular Contributor';
  if (repoCount > 5) return 'Growing Developer';

  const webLanguages = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'React'];
  const backendLanguages = ['Python', 'Java', 'Go', 'Ruby', 'PHP', 'C#'];
  const systemLanguages = ['C', 'C++', 'Rust', 'Assembly'];
  const dataLanguages = ['Python', 'R', 'Julia', 'MATLAB'];

  if (webLanguages.includes(topLanguage)) return 'Web Developer';
  if (backendLanguages.includes(topLanguage)) return 'Backend Developer';
  if (systemLanguages.includes(topLanguage)) return 'Systems Programmer';
  if (dataLanguages.includes(topLanguage)) return 'Data Scientist';

  return 'General Developer';
};

const processRepositories = (repositories) => {
  if (!repositories || repositories.length === 0) {
    return {
      totalStars: 0,
      totalForks: 0,
      mostStarredRepo: null,
      mostStarredRepoStars: 0,
      totalWatchers: 0,
      totalOpenIssues: 0,
      forkPercentage: 0
    };
  }

  let totalStars = 0;
  let totalForks = 0;
  let totalWatchers = 0;
  let totalOpenIssues = 0;
  let forkedRepoCount = 0;
  let mostStarredRepo = null;
  let mostStarredRepoStars = 0;

  repositories.forEach(repo => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    totalWatchers += repo.watchers_count || 0;
    totalOpenIssues += repo.open_issues_count || 0;

    if (repo.fork) forkedRepoCount++;

    if (repo.stargazers_count > mostStarredRepoStars) {
      mostStarredRepoStars = repo.stargazers_count;
      mostStarredRepo = repo.name;
    }
  });

  const forkPercentage = repositories.length > 0
    ? (forkedRepoCount / repositories.length) * 100
    : 0;

  return {
    totalStars,
    totalForks,
    mostStarredRepo,
    mostStarredRepoStars,
    totalWatchers,
    totalOpenIssues,
    forkPercentage: parseFloat(forkPercentage.toFixed(2))
  };
};

const analyzeLanguages = (repositories) => {
  if (!repositories || repositories.length === 0) return [];

  const languageCount = {};
  let totalRepos = 0;

  repositories.forEach(repo => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      totalRepos++;
    }
  });

  const languages = Object.entries(languageCount).map(([name, count]) => ({
    name,
    count,
    percentage: parseFloat(((count / totalRepos) * 100).toFixed(2))
  }));

  languages.sort((a, b) => b.count - a.count);

  return languages;
};

const generateRecommendations = (profile, analytics, languages, repoInsights) => {
  const recommendations = [];

  if (profile.followers < 10) {
    recommendations.push({
      text: 'Increase visibility by contributing to popular open-source projects',
      priority: 'high'
    });
  }

  if (profile.public_repos < 5) {
    recommendations.push({
      text: 'Create more public repositories to showcase your skills',
      priority: 'high'
    });
  }

  if (repoInsights.totalStars < 10) {
    recommendations.push({
      text: 'Improve code quality and add better documentation to attract stars',
      priority: 'medium'
    });
  }

  if (languages.length < 3) {
    recommendations.push({
      text: 'Learn additional programming languages to increase versatility',
      priority: 'medium'
    });
  }

  const followRatio = profile.followers / Math.max(profile.following, 1);
  if (followRatio < 0.5) {
    recommendations.push({
      text: 'Focus on building quality projects rather than following many accounts',
      priority: 'low'
    });
  }

  if (repoInsights.forkPercentage > 50) {
    recommendations.push({
      text: 'Create more original repositories instead of just forking',
      priority: 'medium'
    });
  }

  if (!profile.bio) {
    recommendations.push({
      text: 'Add a bio to your profile to introduce yourself',
      priority: 'low'
    });
  }

  if (profile.public_repos > 5 && repoInsights.totalStars < profile.public_repos * 2) {
    recommendations.push({
      text: 'Add comprehensive README files to your repositories',
      priority: 'medium'
    });
  }

  return recommendations.slice(0, 5);
};

const compareProfiles = (profile1, profile2) => {
  const score1 = profile1.health_score || 0;
  const score2 = profile2.health_score || 0;

  const winner = score1 > score2 ? profile1 : profile2;
  const scoreDifference = Math.abs(score1 - score2);

  const comparison = {
    winner: winner.username,
    winner_profile_id: winner.id,
    score_difference: scoreDifference,
    metrics: {
      followers: {
        [profile1.username]: profile1.followers,
        [profile2.username]: profile2.followers,
        winner: profile1.followers > profile2.followers ? profile1.username : profile2.username
      },
      public_repos: {
        [profile1.username]: profile1.public_repos,
        [profile2.username]: profile2.public_repos,
        winner: profile1.public_repos > profile2.public_repos ? profile1.username : profile2.username
      },
      total_stars: {
        [profile1.username]: profile1.total_stars,
        [profile2.username]: profile2.total_stars,
        winner: profile1.total_stars > profile2.total_stars ? profile1.username : profile2.username
      },
      health_score: {
        [profile1.username]: score1,
        [profile2.username]: score2,
        winner: winner.username
      }
    }
  };

  return comparison;
};

module.exports = {
  calculateHealthScore,
  getDeveloperGrade,
  calculateAccountAge,
  getDeveloperType,
  processRepositories,
  analyzeLanguages,
  generateRecommendations,
  compareProfiles
};
