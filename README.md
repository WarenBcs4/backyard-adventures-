# Backyard Adventures Frontend

Static frontend for Backyard Adventures - Water Sports & Tours Management System.

## Features
- Clean, responsive design
- Client dashboard with booking system
- Admin dashboard with analytics
- PayPal payment integration
- Real-time data from backend API

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:3000

## Vercel Deployment

1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL` - Your backend API URL

## Environment Variables

- `VITE_API_URL` - Backend API URL (production)

## Project Structure

```
├── css/           # Stylesheets
├── js/            # JavaScript files
├── index.html     # Main website
├── login.html     # Login page
├── register.html  # Registration page
├── dashboard.html # Dashboard
└── vercel.json    # Vercel configuration
```

## Backend Repository

The backend API is in a separate repository and should be deployed independently.