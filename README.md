# Prixe API Status Page

[![Uptime CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Uptime%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Uptime+CI%22)
[![Response Time CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Response%20Time%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Response+Time+CI%22)
[![Graphs CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Graphs%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Graphs+CI%22)
[![Static Site CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Static%20Site%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Static+Site+CI%22)
[![Summary CI](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/workflows/Summary%20CI/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/prixe-status-page/actions?query=workflow%3A%22Summary+CI%22)

This repository contains the status page for the [Prixe Stock Data API](https://prixe.io), powered by [Upptime](https://github.com/upptime/upptime).

## 📊 Monitored Endpoints

| Endpoint             | Description                     | Method |
| -------------------- | ------------------------------- | ------ |
| Prixe API (Base)     | Main API health check           | GET    |
| WebSocket Server     | Real-time data streaming server | TCP    |
| Search API           | Stock ticker search             | POST   |
| Last Sold Price API  | Real-time price data            | POST   |
| Historical Price API | Historical price data           | POST   |
| Market Stats API     | Market gainers/losers           | POST   |
| News API             | Stock news fetching             | POST   |

## 🔄 Workflow Schedules

| Workflow           | Schedule          | Description                         |
| ------------------ | ----------------- | ----------------------------------- |
| Uptime CI          | Every 5 minutes   | Checks endpoint availability        |
| Response Time CI   | Every 6 hours     | Records response times              |
| Graphs CI          | Daily at midnight | Generates response time graphs      |
| Static Site CI     | Daily at 1 AM     | Rebuilds the status page            |
| Summary CI         | Daily at midnight | Updates status summary              |
| Update Template CI | Weekly (Sundays)  | Updates from Upptime template       |
| Setup CI           | On config change  | Runs after `.upptimerc.yml` changes |

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

- **Status Page**: https://status.prixe.io
- **Prixe API**: https://prixe.io
- **API Documentation**: https://prixe.io/docs
- **Upptime Documentation**: https://upptime.js.org/docs/

## 📝 License

This project is powered by [Upptime](https://github.com/upptime/upptime), which is licensed under the [MIT License](https://github.com/upptime/upptime/blob/master/LICENSE).

---
