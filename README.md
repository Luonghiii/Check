# 🎵 TikTok Profile Checker - Complete Solution

## ✨ Features

### 🎯 Core Features
- ✅ Check TikTok profile bằng username hoặc URL
- ✅ Hiển thị đầy đủ thông tin: followers, likes, videos, bio, avatar...
- ✅ 3 kích thước avatar (thumb, medium, large)
- ✅ Quality Score (0-100) dựa trên nhiều metrics
- ✅ Engagement Rate calculation
- ✅ Account type detection (Influencer/Seller/Creator/User)
- ✅ Privacy level analysis
- ✅ Growth insights & tips

### 📊 Advanced Analytics
- Quality Score với progress bar
- Engagement Rate visualization
- Account type classification
- Privacy settings analysis
- Growth potential insights
- Follower/Following ratio
- Average likes per video

### 🎨 UI/UX
- Modern, responsive design
- Dark theme với gradient backgrounds
- Smooth animations & transitions
- Tab-based detailed information
- Loading states với progress bar
- Error handling
- Mobile-friendly

### 🔒 Privacy & Settings Info
- Account type (Public/Private)
- Comment settings
- Duet settings
- Stitch settings
- Download settings
- Following list visibility

## 📁 Project Structure

```
tiktok-checker/
├── index.html          # Frontend UI (Beautiful, responsive)
├── api/
│   └── check.js        # Backend API (Enhanced scraping + analytics)
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## 🚀 Deployment Guide

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd tiktok-checker
vercel
```

4. **Follow prompts:**
   - Set up and deploy? `Y`
   - Which scope? Choose your account
   - Link to existing project? `N`
   - Project name? `tiktok-checker` (or your choice)
   - Directory? `./`
   - Override settings? `N`

5. **Done!** Your app is live at: `https://tiktok-checker.vercel.app`

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import from Git (or upload folder)
4. Configure:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. Click "Deploy"

### Option 3: Local Development

1. **Install dependencies**
```bash
npm install -g vercel
```

2. **Run locally**
```bash
cd tiktok-checker
vercel dev
```

3. **Open browser**
```
http://localhost:3000
```

## 🔧 Configuration

### API Endpoint

Edit `index.html` line ~510:
```javascript
const API_ENDPOINT = '/api/check';
```

**Options:**
- Production: `/api/check` (auto-detected after Vercel deployment)
- Local dev: `http://localhost:3000/api/check`
- Custom domain: `https://your-domain.com/api/check`

### Rate Limiting

API has basic rate limiting built-in. To customize, edit `api/check.js`:
```javascript
// Add rate limiting logic here
const MAX_REQUESTS = 100; // per hour
```

## 📖 API Documentation

### Endpoint
```
GET /api/check?input={username_or_url}
```

### Parameters
- `input` (required): TikTok username hoặc profile URL
  - Examples: 
    - `@khaby.lame`
    - `khaby.lame`
    - `https://tiktok.com/@khaby.lame`

### Response Format
```json
{
  "success": true,
  "timestamp": "2025-01-10T12:00:00.000Z",
  
  "profile": {
    "Nickname": "Display Name",
    "Username": "@username",
    "Country": "Vietnam 🇻🇳",
    "Language": "vi",
    "About": "Bio text...",
    "User ID": "123456789",
    "SecUID": "MS4wLjABAAAA...",
    "Bio Link": "https://...",
    "Account Created": "2020-01-01 00:00:00",
    "Avatar URL": "https://...",
    "Avatar Thumb": "https://...100x100.jpeg",
    "Avatar Medium": "https://...720x720.jpeg",
    "Avatar Large": "https://...1080x1080.jpeg"
  },
  
  "stats": {
    "Followers": "1.2M",
    "Following": "500",
    "Hearts": "50.5M",
    "Videos": "250",
    "Friends": "18"
  },
  
  "enhanced": {
    "status": {
      "verified": false,
      "private": false,
      "seller": false,
      "commerceUser": false
    },
    
    "privacy": {
      "accountType": "Public",
      "commentsAllowed": "Everyone",
      "duetsAllowed": true,
      "stitchAllowed": true,
      "downloadAllowed": false,
      "privacyLevel": {
        "level": "🔓 Open",
        "score": "80"
      }
    },
    
    "metrics": {
      "engagementRate": "5.25%",
      "qualityScore": 75,
      "accountType": "📈 Growing Creator",
      "avgLikesPerVideo": 202000,
      "followerToFollowingRatio": "2400"
    },
    
    "insights": {
      "growthTips": [
        "💬 Low engagement rate - Reply to comments",
        "🎭 Enable duets to boost discoverability"
      ],
      "nextMilestone": "10K Followers"
    },
    
    "rawStats": {
      "followerCount": 1200000,
      "followingCount": 500,
      "heartCount": 50500000,
      "videoCount": 250,
      "diggCount": 1500,
      "friendCount": 18
    }
  },
  
  "quick": {
    "username": "username",
    "nickname": "Display Name",
    "avatar": "https://...1080x1080.jpeg",
    "followers": 1200000,
    "verified": false,
    "private": false,
    "qualityScore": 75,
    "engagementRate": "5.25",
    "profileUrl": "https://www.tiktok.com/@username"
  },
  
  "raw": {
    "userInfo": { ... },
    "shareMeta": { ... }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "User not found or TikTok changed their HTML structure"
}
```

## 🎯 Use Cases

### 1. Simple Profile Display
```javascript
const response = await fetch('/api/check?input=@khaby.lame');
const data = await response.json();

console.log(data.quick.username);      // khaby.lame
console.log(data.quick.followers);      // 162500000
console.log(data.quick.qualityScore);   // 95
```

### 2. Advanced Analytics Dashboard
```javascript
const { enhanced } = data;

// Quality metrics
console.log(enhanced.metrics.qualityScore);     // 0-100
console.log(enhanced.metrics.engagementRate);   // "5.25%"
console.log(enhanced.metrics.accountType);      // "🌟 Celebrity/Influencer"

// Privacy analysis
console.log(enhanced.privacy.privacyLevel);     // { level: "🔓 Open", score: "80" }

// Growth insights
console.log(enhanced.insights.growthTips);      // Array of actionable tips
```

### 3. Bulk Checking
```javascript
const usernames = ['@user1', '@user2', '@user3'];

const results = await Promise.all(
  usernames.map(username => 
    fetch(`/api/check?input=${username}`).then(r => r.json())
  )
);

// Process results
results.forEach(data => {
  if (data.success) {
    console.log(`${data.quick.username}: ${data.quick.qualityScore}/100`);
  }
});
```

## 🔒 Security & Best Practices

### Rate Limiting
- API có thể bị rate limit bởi TikTok
- Recommend: Cache results, không check cùng user quá thường xuyên
- Add Redis/KV cache nếu có traffic cao

### Error Handling
- API trả về `success: false` nếu có lỗi
- Check `data.success` trước khi access data
- Handle network errors với try-catch

### Privacy
- Không lưu trữ data người dùng
- Tất cả data đều public từ TikTok
- Tuân thủ TikTok Terms of Service

## 🎨 Customization

### Change Colors
Edit Tailwind classes in `index.html`:
```html
<!-- Current gradient: purple to pink -->
<div class="gradient-bg">

<!-- Change to blue to green -->
<div class="bg-gradient-to-r from-blue-500 to-green-500">
```

### Add More Metrics
Edit `api/check.js` - function `calculateQualityScore()`:
```javascript
// Add your custom scoring logic
if (user.someNewMetric > threshold) {
    score += 10;
}
```

### Modify UI Layout
Edit `index.html` - sections are clearly marked:
```html
<!-- Profile Header -->
<!-- Stats Grid -->
<!-- Analytics Dashboard -->
<!-- Growth Insights -->
<!-- Detailed Info Tabs -->
```

## 🐛 Troubleshooting

### "User not found" error
- Check username spelling (case-sensitive)
- Account có thể bị ban hoặc deleted
- TikTok có thể đã thay đổi HTML structure

### Slow loading
- TikTok server có thể chậm
- Network issues
- Add caching để improve speed

### CORS errors (local dev)
- Use `vercel dev` thay vì file:// protocol
- Or use a local server: `python -m http.server`

### Deployment issues
- Check `vercel.json` config
- Ensure Node.js version compatibility
- Check Vercel logs: `vercel logs`

## 📝 License

MIT License - Free to use and modify

## 🤝 Contributing

Pull requests welcome! Please:
1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open PR

## 📧 Support

Issues? Questions? 
- GitHub Issues
- Email: support@example.com
- Discord: example#1234

## 🌟 Credits

Made with ❤️ by TikTok Checker Pro Team

### Built with:
- Node.js
- Vercel Serverless Functions
- Tailwind CSS
- Vanilla JavaScript (no frameworks!)

## 🚀 What's Next?

Planned features:
- [ ] Historical data tracking
- [ ] Compare multiple profiles
- [ ] Export to PDF/Excel
- [ ] Chrome Extension
- [ ] API authentication
- [ ] Premium features (paid tier)
- [ ] Mobile app

---

**Happy Checking! 🎉**
