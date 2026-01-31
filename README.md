# Prixe API Status Page

[![Uptime CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Uptime%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Uptime+CI%22)
[![Response Time CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Response%20Time%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Response+Time+CI%22)
[![Graphs CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Graphs%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Graphs+CI%22)
[![Static Site CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Static%20Site%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Static+Site+CI%22)
[![Summary CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Summary%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Summary+CI%22)

This repository contains the status page for the [Prixe Stock Data API](https://api.prixe.io), powered by [Upptime](https://github.com/upptime/upptime).

## 🚀 Setup Instructions

### Step 1: Update Configuration

1. Open `.upptimerc.yml` and replace `YOUR_GITHUB_USERNAME` with your actual GitHub username
2. Update the `repo` field if your repository name is different from `prixe-status-page`

### Step 2: Create GitHub Repository

1. Create a new repository on GitHub (public or private)
2. Push this code to your repository:

```bash
git init
git add .
git commit -m "Initial Upptime setup for Prixe API"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page.git
git push -u origin main
```

### Step 3: Configure Repository Secrets

Go to your repository **Settings** > **Secrets and variables** > **Actions** and add the following secrets:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `GH_PAT` | GitHub Personal Access Token with `repo` scope | Yes |
| `PRIXE_API_KEY` | Your Prixe API key for authenticated endpoints | Yes |

#### Creating a GitHub Personal Access Token (GH_PAT)

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Upptime Status Page"
4. Select the `repo` scope (Full control of private repositories)
5. Click "Generate token"
6. Copy the token and add it as the `GH_PAT` secret

### Step 4: Enable GitHub Actions

1. Go to your repository's **Actions** tab
2. Click "I understand my workflows, go ahead and enable them"
3. Workflows will now run automatically based on their schedules

### Step 5: Enable GitHub Pages

1. Go to repository **Settings** > **Pages**
2. Under "Source", select **Deploy from a branch**
3. Select the `gh-pages` branch and `/ (root)` folder
4. Click **Save**

Your status page will be available at: `https://YOUR_GITHUB_USERNAME.github.io/prixe-status-page/`

### Step 6: (Optional) Custom Domain

To use a custom domain like `status.prixe.io`:

1. Uncomment the `cname` line in `.upptimerc.yml` and set your domain
2. Add a CNAME DNS record pointing to `YOUR_GITHUB_USERNAME.github.io`
3. In repository Settings > Pages, add your custom domain

## 📊 Monitored Endpoints

| Endpoint | Description | Method |
|----------|-------------|--------|
| Prixe API (Base) | Main API health check | GET |
| WebSocket Server | Real-time data streaming server | TCP |
| Search API | Stock ticker search | POST |
| Last Sold Price API | Real-time price data | POST |
| Historical Price API | Historical price data | POST |
| Market Stats API | Market gainers/losers | POST |
| News API | Stock news fetching | POST |

## 🔔 Notifications (Optional)

You can configure notifications to be alerted when services go down. Add these secrets to enable notifications:

### Slack
- `NOTIFICATION_SLACK_WEBHOOK`: Your Slack webhook URL

### Discord
- `NOTIFICATION_DISCORD_WEBHOOK`: Your Discord webhook URL

### Telegram
- `NOTIFICATION_TELEGRAM_BOT_KEY`: Your Telegram bot token
- `NOTIFICATION_TELEGRAM_CHAT_ID`: Your Telegram chat ID

### Email (SMTP)
- `NOTIFICATION_SMTP_HOST`: SMTP server hostname
- `NOTIFICATION_SMTP_PORT`: SMTP server port
- `NOTIFICATION_SMTP_USERNAME`: SMTP username
- `NOTIFICATION_SMTP_PASSWORD`: SMTP password
- `NOTIFICATION_SMTP_FROM`: Sender email address
- `NOTIFICATION_EMAIL`: Recipient email address

See [Upptime Notifications Documentation](https://upptime.js.org/docs/notifications) for more options.

## 🔄 Workflow Schedules

| Workflow | Schedule | Description |
|----------|----------|-------------|
| Uptime CI | Every 5 minutes | Checks endpoint availability |
| Response Time CI | Every 6 hours | Records response times |
| Graphs CI | Daily at midnight | Generates response time graphs |
| Static Site CI | Daily at 1 AM | Rebuilds the status page |
| Summary CI | Daily at midnight | Updates status summary |
| Update Template CI | Weekly (Sundays) | Updates from Upptime template |
| Setup CI | On config change | Runs after `.upptimerc.yml` changes |

## 🛠️ Manual Triggers

All workflows can be manually triggered:

1. Go to repository **Actions** tab
2. Select the workflow you want to run
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## 📁 Repository Structure

```
.
├── .github/
│   └── workflows/          # GitHub Actions workflow files
│       ├── uptime.yml      # Main uptime monitoring
│       ├── response-time.yml
│       ├── graphs.yml
│       ├── static-site.yml
│       ├── summary.yml
│       ├── setup.yml
│       └── update-template.yml
├── .upptimerc.yml          # Main configuration file
└── README.md               # This file
```

## 📈 Status Badges

You can embed status badges in your documentation:

```markdown
![Uptime](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/prixe-status-page/master/api/prixe-api-base/uptime.json)
![Response Time](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/prixe-status-page/master/api/prixe-api-base/response-time.json)
```

## 🔗 Links

- **Status Page**: https://YOUR_GITHUB_USERNAME.github.io/prixe-status-page/
- **Prixe API**: https://api.prixe.io
- **API Documentation**: https://api.prixe.io/docs
- **Upptime Documentation**: https://upptime.js.org/docs/

## 📝 License

This project is powered by [Upptime](https://github.com/upptime/upptime), which is licensed under the [MIT License](https://github.com/upptime/upptime/blob/master/LICENSE).

---

**Note**: After initial setup, Upptime will automatically update this README with live status information.
