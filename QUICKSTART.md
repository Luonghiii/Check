# 🚀 QUICK START GUIDE

## Cách deploy trong 5 phút!

### Bước 1: Download Project
- Download file `tiktok-checker.zip`
- Giải nén ra thư mục

### Bước 2: Deploy lên Vercel
```bash
# Cài Vercel CLI (chỉ cần 1 lần)
npm install -g vercel

# Di chuyển vào thư mục
cd tiktok-checker

# Deploy!
vercel
```

### Bước 3: Trả lời các câu hỏi
```
? Set up and deploy? [Y/n] Y
? Which scope? → Chọn account của bạn
? Link to existing project? [y/N] N
? What's your project's name? → tiktok-checker
? In which directory is your code located? → ./
? Want to override the settings? [y/N] N
```

### Bước 4: Hoàn tất! 🎉
```
✅ Deployed to production: https://tiktok-checker-xxx.vercel.app
```

---

## Test Local (không cần deploy)

### Cách 1: Vercel Dev
```bash
cd tiktok-checker
vercel dev
# Mở http://localhost:3000
```

### Cách 2: Test API trực tiếp
```bash
node test.js
```

---

## Cấu trúc Files

```
tiktok-checker/
├── 📄 index.html          ← Frontend (UI đẹp)
├── 📁 api/
│   └── 📄 check.js        ← Backend API
├── 📄 vercel.json         ← Config
├── 📄 package.json        ← Metadata
├── 📄 test.js             ← Test script
└── 📄 README.md           ← Full docs
```

---

## Đổi API Endpoint

Sau khi deploy, mở `index.html` dòng ~510:

```javascript
// Development
const API_ENDPOINT = 'http://localhost:3000/api/check';

// Production (sau khi deploy)
const API_ENDPOINT = '/api/check';
```

---

## Features Chính

✅ **Input linh hoạt**
- @username
- username
- https://tiktok.com/@username

✅ **Thông tin đầy đủ**
- Profile: nickname, bio, avatar (3 sizes)
- Stats: followers, likes, videos
- Analytics: quality score, engagement rate
- Privacy: account type, settings
- Growth: tips & insights

✅ **UI/UX đỉnh**
- Responsive mobile
- Dark theme gradient
- Loading animations
- Error handling
- Tab-based info
- Copy JSON
- Download avatar
- Share profile

---

## API Response Structure

```json
{
  "success": true,
  "profile": { ... },      // Script 1 format
  "stats": { ... },        // Basic stats
  "enhanced": {            // Advanced analytics
    "status": { ... },
    "privacy": { ... },
    "metrics": { ... },
    "insights": { ... }
  },
  "quick": { ... },        // Quick access
  "raw": { ... }           // Full TikTok data
}
```

---

## Troubleshooting

### ❌ "User not found"
→ Check spelling, account có thể bị xóa

### ❌ CORS error
→ Dùng `vercel dev` thay vì mở file:// trực tiếp

### ❌ Slow loading
→ TikTok server chậm, chờ hoặc retry

### ❌ API không hoạt động
→ Check console logs, TikTok có thể đã đổi HTML structure

---

## Support

📧 Email: support@example.com
💬 GitHub Issues: github.com/yourname/tiktok-checker
📱 Discord: example#1234

---

**Made with ❤️ - Enjoy! 🎉**
