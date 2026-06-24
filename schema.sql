
CREATE TABLE IF NOT EXISTS profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    github_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    profile_url VARCHAR(500),
    company VARCHAR(255),
    location VARCHAR(255),
    followers INT DEFAULT 0,
    following INT DEFAULT 0,
    public_repos INT DEFAULT 0,
    account_created_at DATETIME,
    last_analyzed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    health_score DECIMAL(5,2),
    developer_grade VARCHAR(10),
    total_stars INT DEFAULT 0,
    total_forks INT DEFAULT 0,
    top_repository VARCHAR(255),
    account_age_years DECIMAL(5,2),
    developer_type VARCHAR(100),
    recommendation_count INT DEFAULT 0,
    analyzed_at DATETIME,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_languages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    language_name VARCHAR(100) NOT NULL,
    repository_count INT DEFAULT 0,
    percentage DECIMAL(5,2),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repositories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    github_repo_id BIGINT,
    repo_name VARCHAR(255),
    language VARCHAR(100),
    stars INT DEFAULT 0,
    forks INT DEFAULT 0,
    watchers INT DEFAULT 0,
    open_issues INT DEFAULT 0,
    is_fork BOOLEAN DEFAULT FALSE,
    repo_url VARCHAR(500),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    followers INT,
    following INT,
    public_repos INT,
    total_stars INT,
    total_forks INT,
    health_score DECIMAL(5,2),
    snapshot_date DATETIME,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    recommendation_text TEXT,
    priority_level VARCHAR(20),
    generated_at DATETIME,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_comparisons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile1_id BIGINT NOT NULL,
    profile2_id BIGINT NOT NULL,
    winner_profile_id BIGINT,
    score_difference DECIMAL(10,2),
    compared_at DATETIME
);
