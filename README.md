# AI News React Frontend

A modern React TypeScript frontend for the AI News Scraper API, providing a clean and responsive interface to browse AI news content from multiple sources.

## Features

### 📱 **Responsive Design**
- Modern, mobile-first design
- Clean card-based layout
- Smooth animations and transitions
- Responsive grid system

### 📰 **Content Display**
- **Mixed Content Types**: Articles, podcasts, and videos
- **Smart Categorization**: Filter by content type (blog, audio, video)
- **Top Stories**: Highlighted high-impact news
- **Metrics Dashboard**: Real-time statistics

### ⚡ **Real-time Updates**
- Manual refresh functionality
- Auto-update integration with backend
- Live status indicators
- Error handling with retry options

### 🎯 **User Experience**
- **Interactive Cards**: Hover effects and smooth transitions
- **External Links**: Direct access to original content
- **Audio Support**: Embedded audio players for podcasts
- **Video Thumbnails**: Rich media preview for video content
- **Significance Scoring**: Color-coded impact levels

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Axios** for API communication
- **Lucide React** for icons
- **CSS3** with custom properties for theming

## API Integration

This frontend connects to the AI News Scraper backend at:
- **Production**: `https://ai-news-scraper.vercel.app`
- **API Endpoints Used**:
  - `/api/digest` - Get news digest with articles
  - `/health` - Check API health status
  - `/api/sources` - Get source configuration
  - `/api/scrape` - Trigger manual content scraping
  - `/api/auto-update/trigger` - Trigger background updates

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

Since we encountered npm permission issues, you can try these alternatives:

#### Option 1: Fix npm permissions (recommended)
```bash
cd /Users/vijayansubramaniyan/Desktop/AI-ML/Projects/ai-news-react
sudo chown -R 501:20 "/Users/vijayansubramaniyan/.npm"
npm install
npm run dev
```

#### Option 2: Use yarn instead
```bash
cd /Users/vijayansubramaniyan/Desktop/AI-ML/Projects/ai-news-react
npm install -g yarn
yarn install
yarn dev
```

#### Option 3: Use pnpm
```bash
cd /Users/vijayansubramaniyan/Desktop/AI-ML/Projects/ai-news-react
npm install -g pnpm
pnpm install
pnpm dev
```

### Development Server

Once dependencies are installed:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit `http://localhost:5173` to view the application.

### Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

## Project Structure

```
src/
├── components/           # React components
│   ├── Header.tsx       # Main header with actions
│   ├── MetricsDashboard.tsx  # Statistics display
│   ├── TopStories.tsx   # Featured stories
│   ├── ContentSection.tsx    # Content tabs and grid
│   ├── ArticleCard.tsx  # Individual article cards
│   └── Loading.tsx      # Loading states
├── services/
│   └── api.ts          # API service and types
├── App.tsx             # Main application component
├── App.css             # Complete styling
└── main.tsx            # Application entry point
```

## Features Overview

### Header Component
- **Refresh Button**: Updates digest with latest content
- **Update Sources**: Triggers manual scraping of all sources
- **Real-time Status**: Shows last update time and loading states

### Metrics Dashboard
- **Total Updates**: Count of all recent articles
- **High Impact**: Articles with significance score ≥7
- **New Research**: Research-focused content
- **Industry Moves**: Corporate/business news
- **Key Points**: AI-generated summary bullets

### Content Organization
- **All Content**: Mixed feed sorted by ranking score
- **Articles**: Text-based blog posts and news
- **Podcasts**: Audio content with embedded players
- **Videos**: Video content with thumbnails and play buttons

### Article Cards
- **Rich Metadata**: Source, publish time, reading time
- **Impact Scoring**: Visual significance indicators
- **External Links**: Direct access to original content
- **Media Support**: Audio players and video previews

## API Configuration

The frontend is configured to work with your deployed backend at:
`https://ai-news-scraper.vercel.app`

To change the API endpoint, update the `API_BASE_URL` in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'your-api-url-here';
```

## Responsive Design

The application is fully responsive with breakpoints:
- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px-1199px (adapted layout)
- **Mobile**: 320px-767px (stacked layout)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### GitHub Pages
```bash
npm install --save-dev gh-pages
npm run build
npm run deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the AI News Scraper ecosystem.

---

**Note**: This frontend is designed to work specifically with the AI News Scraper backend. Ensure your backend is running and accessible at the configured API URL.
