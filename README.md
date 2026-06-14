# Ls_anime
# MK Anime - Telegram Anime Streaming Site

## 🚀 Features
- Fetch anime from Telegram channel automatically
- Premium UI/UX - Mobile + Desktop
- Free API for anime details (Jikan API)
- HD Video Streaming
- Search, Filter, Trending
- Episode list with auto-play

## 📋 Setup Instructions

### Step 1: Create Telegram Bot
1. Message @BotFather on Telegram
2. Type `/newbot` and follow steps
3. Copy your Bot Token
4. Add bot to your anime channel as Admin

### Step 2: Upload Anime to Channel
Format your uploads like this:
attack on titan s1 e2 (video file) 
### Step 3: Configure
1. Open `assets/config.js`
2. Paste your Bot Token: `TG_BOT_TOKEN: '123456:ABC...'`
3. Set channel: `TG_CHANNEL: '@yourchannel'`

### Step 4: Deploy
**Option A - GitHub Pages (Free):**
1. Push to GitHub
2. Settings → Pages → Deploy from main branch
3. Done! Site live at `username.github.io/repo`

**Option B - Netlify/Vercel:**
1. Connect GitHub repo
2. Deploy - Auto updates on push

### Step 5: Backend (IMPORTANT)
Telegram Bot API blocks CORS. You need a backend proxy.

**Simple PHP Backend** (`api/tg-fetch.php`):
```php
<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
$token = 'YOUR_BOT_TOKEN';
$channel = '@YOUR_CHANNEL';
$url = "https://api.telegram.org/bot$token/getUpdates";
echo file_get_contents($url);
?>
