# GitHub Profile Analyzer API

A backend service for analyzing GitHub profiles and generating insights. Built as part of my Node.js learning project using Express.js, MySQL, and GitHub API integration.

## Features

✅ **Profile Analysis**
- Fetch public GitHub profile data
- Analyze repositories and calculate insights
- Store comprehensive profile metrics

✅ **Advanced Insights**
- Total stars across all repositories
- Total forks count
- Most starred repository
- Analysis score calculation
- Developer level categorization (Beginner → Expert)
- Popularity score metrics

✅ **REST API Endpoints**
- Analyze and store GitHub profiles
- Get all analyzed profiles with pagination
- Get single profile details
- Get top developers by score
- Delete profiles

✅ **Bonus Features**
- Repository insights (stars, forks, most starred repo)
- Developer level classification
- Popularity scoring algorithm
- Pagination support
- Rate limit handling

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **External API**: GitHub REST API v3
- **Libraries**: Axios, dotenv, CORS

## Database Schema

```sql
github_profiles
├── id (Primary Key)
├── github_id (Unique)
├── username (Unique)
├── name
├── bio
├── company
├── location
├── email
├── blog
├── twitter_username
├── public_repos
├── public_gists
├── followers
├── following
├── total_stars
├── total_forks
├── most_starred_repo
├── most_starred_repo_stars
├── analysis_score
├── developer_level (ENUM)
├── popularity_score
├── profile_url
├── avatar_url
├── account_created_at
├── account_updated_at
├── analyzed_at
└── last_updated
```

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- GitHub Personal Access Token (optional, but recommended)

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd github-profile-analyzer
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Database

1. Open MySQL:
```bash
mysql -u root -p
```

2. Run the schema:
```bash
mysql -u root -p < schema.sql
```

Or manually:
```sql
CREATE DATABASE github_analyzer;
USE github_analyzer;
-- Copy and run the SQL from schema.sql
```

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_analyzer

GITHUB_TOKEN=your_github_token_here
```

### Step 5: Get GitHub Token (Recommended)

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name: "GitHub Profile Analyzer"
4. Select scope: `public_repo` (or leave all unchecked for public data only)
5. Generate token and copy it
6. Add to your `.env` file

**Why use a token?**
- Without token: 60 requests/hour
- With token: 5,000 requests/hour

### Step 6: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start at: `http://localhost:5000`

## API Endpoints

### 1. Analyze GitHub Profile

**Endpoint:** `POST /api/profiles/:username`

**Description:** Fetches GitHub profile data, analyzes it, and stores insights in the database.

**Example:**
```bash
POST http://localhost:5000/api/profiles/torvalds
```

**Response:**
```json
{
  "success": true,
  "message": "Profile analyzed successfully",
  "data": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "followers": 150000,
    "public_repos": 20,
    "total_stars": 50000,
    "analysis_score": 250416,
    "developer_level": "Expert",
    "analyzed_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. Get All Profiles

**Endpoint:** `GET /api/profiles`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Example:**
```bash
GET http://localhost:5000/api/profiles?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "torvalds",
      "name": "Linus Torvalds",
      "analysis_score": 250416,
      "developer_level": "Expert"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 3. Get Single Profile

**Endpoint:** `GET /api/profiles/:username`

**Example:**
```bash
GET http://localhost:5000/api/profiles/torvalds
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "github_id": 1024025,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "bio": "Creator of Linux",
    "followers": 150000,
    "total_stars": 50000,
    "analysis_score": 250416,
    "developer_level": "Expert"
  }
}
```

### 4. Get Top Developers (Bonus)

**Endpoint:** `GET /api/profiles/top-developers`

**Query Parameters:**
- `limit` (optional, default: 10)

**Example:**
```bash
GET http://localhost:5000/api/profiles/top-developers?limit=5
```

### 5. Delete Profile (Bonus)

**Endpoint:** `DELETE /api/profiles/:username`

**Example:**
```bash
DELETE http://localhost:5000/api/profiles/torvalds
```

## Insights Calculation

### Analysis Score Formula
```javascript
score = (public_repos × 2) + (followers × 3) + (total_stars × 5) - following
```

### Developer Level Classification
- **Beginner**: score < 50
- **Intermediate**: score < 200
- **Advanced**: score < 500
- **Expert**: score ≥ 500

### Popularity Score Formula
```javascript
popularity = (followers × 3) + (total_stars × 2)
```

## Project Structure

```
github-profile-analyzer/
│
├── src/
│   ├── config/
│   │   └── db.js                 # Database connection
│   │
│   ├── controllers/
│   │   └── githubController.js   # Request handlers
│   │
│   ├── services/
│   │   └── githubService.js      # GitHub API calls
│   │
│   ├── routes/
│   │   └── githubRoutes.js       # API routes
│   │
│   ├── models/
│   │   └── profileModel.js       # Database operations
│   │
│   ├── utils/
│   │   └── insightsCalculator.js # Analysis algorithms
│   │
│   └── app.js                    # Express app setup
│
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore file
├── package.json                  # Dependencies
├── schema.sql                    # Database schema
└── README.md                     # Documentation
```

## Testing with Postman

### Import Collection

Create a Postman collection with these requests:

1. **Analyze Profile**
   - Method: POST
   - URL: `http://localhost:5000/api/profiles/torvalds`

2. **Get All Profiles**
   - Method: GET
   - URL: `http://localhost:5000/api/profiles?page=1&limit=10`

3. **Get Single Profile**
   - Method: GET
   - URL: `http://localhost:5000/api/profiles/torvalds`

4. **Get Top Developers**
   - Method: GET
   - URL: `http://localhost:5000/api/profiles/top-developers?limit=5`

5. **Delete Profile**
   - Method: DELETE
   - URL: `http://localhost:5000/api/profiles/torvalds`

## Deployment

### Option 1: Render.com (Recommended)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Add environment variables
5. Deploy

### Option 2: Railway.app

1. Push code to GitHub
2. Create new project on Railway
3. Connect repository
4. Add MySQL database
5. Configure environment variables
6. Deploy

### Database Hosting

- **PlanetScale**: Free MySQL hosting
- **Aiven**: Free tier available
- **Railway**: Includes database

## Error Handling

The API handles various error scenarios:

- ✅ User not found (404)
- ✅ Rate limit exceeded (429)
- ✅ Invalid username (400)
- ✅ Database errors (500)
- ✅ GitHub API errors

## Rate Limiting

**Without GitHub Token:**
- 60 requests per hour

**With GitHub Token:**
- 5,000 requests per hour

## Future Enhancements

- [ ] Add caching (Redis)
- [ ] Implement webhook for auto-updates
- [ ] Add authentication
- [ ] Create frontend dashboard
- [ ] Export data to CSV/JSON
- [ ] Add more GitHub metrics (contributions, issues, PRs)
- [ ] Implement search functionality
- [ ] Add profile comparison feature

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## License

ISC

## Author

Karthik

## Support

For issues and questions, please create an issue on GitHub.

---

**Built with ❤️ using Node.js, Express, and MySQL**
