# Dobby Studio ✨

An AI-powered tartan and fabric design tool powered by Groq's llama3-70b LLM.

## Features

- 🎨 **Live Fabric Preview** — Real-time tartan rendering with fiber textures and lighting
- 🤖 **AI Designer** — Describe your vision in natural language, watch the loom respond
- 🔐 **Firebase Authentication** — Secure Google Sign-in with offline demo mode
- ☁️ **Cloud Sync** — Firestore database saves designs across devices
- 📴 **Offline Support** — Full functionality without internet via localStorage fallback
- 💾 **Design Gallery** — Save, load, rename, and delete fabric designs
- 🚦 **Rate Limiting** — Free tier (5 AI designs/day, 20 saved designs) with Pro upgrade path
- 🧵 **Sett Builder** — Edit individual color stripes with precise thread counts
- 🎯 **8 Presets** — Royal Stewart, Black Watch, Burberry, and more classic tartans
- 🌈 **27 Named Colors** — Rich textile-appropriate color palette
- 🌓 **Light/Dark Theme** — Full theme support with CSS variables
- ⚡ **4 Weave Types** — 2/2 Twill, 2/1 Twill, Plain Weave, 5-End Satin
- 📱 **Responsive UI** — Sidebar (presets), center (canvas), right panel (chat)

## Stack

- **Frontend**: React 18 + Vite
- **Styling**: Pure CSS with CSS variables (light/dark theme)
- **AI**: Groq API (llama3-70b-8192)
- **Auth**: Firebase Authentication (Google Sign-in)
- **Database**: Firestore with offline persistence
- **Rendering**: HTML5 Canvas with 5-pass rendering pipeline

## Getting Started

### Clone & Install

```bash
git clone <repo-url>
cd dobby-studio
npm install
```

### Environment Setup

Create `.env` with your API keys:

```
VITE_GROQ_API_KEY=gsk_your_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

Get a free Groq API key at: https://console.groq.com

For Firebase, create a project at: https://console.firebase.google.com

### Development

```bash
npm run dev
```

Opens at http://localhost:5173

### Build for Production

```bash
npm run build
npm run preview
```

## Deploy to Vercel

### Option 1: CLI

```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add `VITE_GROQ_API_KEY` environment variable
4. Deploy!

## How It Works

### Authentication & Cloud Sync

1. **Sign in with Google** — Secure Firebase authentication
2. **Offline Demo Mode** — Continue working without internet (designs saved locally)
3. **Auto-Sync** — Designs sync to Firestore when online, fallback to localStorage when offline

### Subscription Tiers

| Feature | Free | Pro (Planned) |
|---------|------|---------------|
| AI designs/day | 5 | 100 |
| Saved designs | 20 | 200 |
| WIF Export | ❌ | ✅ |
| Cloud sync | ✅ | ✅ |

### NLP Engine

Describe your fabric in natural language:
- "autumn forest tartan" → AI generates forest greens, russet browns, gold accents
- "make it finer" → Reduces thread size for delicate weave
- "plain weave" → Changes from twill to plain structure
- "more repeats" → Increases pattern repeats

### Rendering Pipeline

1. **Optical Mix Fill** — Blends warp/weft colors based on weave structure
2. **Twill Strokes** — Adds directional highlights for 3D effect
3. **Shadow Grid** — Subtle cell borders for texture
4. **Fiber Noise** — Procedural fabric texture overlay
5. **Vignette** — Radial shading for depth

## Architecture

```
src/
├── components/          # React components
│   ├── Header.jsx           # Toolbar with undo/redo, profile dropdown
│   ├── Sidebar.jsx          # Navigation, gallery, sett builder
│   ├── SettBuilder.jsx      # Color stripe editor
│   ├── FabricCanvas.jsx     # Main rendering canvas
│   ├── ChatPanel.jsx        # AI chat with rate limiting
│   ├── LoginPage.jsx        # Google Sign-in UI
│   ├── UpgradeModal.jsx     # Subscription upgrade prompt
│   └── LandingPage.jsx      # Marketing landing page
├── contexts/            # React Context providers
│   ├── AuthContext.jsx      # Firebase auth state + offline detection
│   ├── SubscriptionContext.jsx  # Rate limits + usage tracking
│   └── OfflineContext.jsx   # Network status banner
├── hooks/               # Custom hooks
│   ├── useFabricState.js        (state + Groq async)
│   ├── useFabricRenderer.js     (canvas rendering)
│   ├── useGallery.js            (localStorage gallery - legacy)
│   └── useFirestoreGallery.js   (Firestore + offline gallery)
├── utils/               # Utilities
│   ├── colorUtils.js        (hex ↔ rgb, blending)
│   ├── weaveUtils.js        (pattern expansion, matrices)
│   ├── groqClient.js        (Groq SDK wrapper)
│   └── imageAnalyzer.js     (Image upload analysis)
├── data/                # Constants
│   ├── presets.js       (8 tartan presets)
│   └── colors.js        (27 color map)
├── styles/
│   └── main.css         (light/dark theme)
├── firebase.js          # Firebase initialization
└── App.jsx, main.jsx
```

## Configuration

### CSS Theme Variables

Edit `src/styles/main.css` `:root` and `[data-theme=dark]` sections:

```css
--bg:   #f5f3ee;      /* Background */
--surf: #faf9f6;      /* Surface */
--tx:   #1c140a;      /* Text */
--ac:   #5c7a5a;      /* Accent (green) */
--fd:   'Cormorant Garamond';  /* Display font */
--fb:   'DM Sans';             /* Body font */
```

### Fonts

Uses Google Fonts (loaded in `index.html`):
- **Cormorant Garamond** — Serif, elegant headings
- **DM Sans** — Clean UI typeface

## Troubleshooting

### "Connection error. Check your VITE_GROQ_API_KEY"

- Verify `.env` has correct key
- Restart dev server: `npm run dev`
- Check key is still active at console.groq.com

### Canvas not rendering

- Ensure browser supports HTML5 Canvas
- Check browser console for JS errors
- Try a different weave type (plain vs twill)

### Groq API Rate Limited

With free tier, you can send ~30 requests per minute. Wait a moment between prompts.

### "Daily AI design limit reached"

Free tier allows 5 AI-generated designs per day. Designs are tracked per user and reset daily.

### Offline Mode Not Working

- Check browser console for Firebase errors
- Ensure `localStorage` is enabled in browser
- Demo mode activates automatically when `navigator.onLine === false`

### Designs Not Syncing to Cloud

- Verify you're signed in with Google (not demo mode)
- Check Firebase Firestore rules allow read/write
- Designs saved in demo mode (with `local-` prefix IDs) will sync when you sign in online

## Technical Details

### Offline Support Implementation

1. **Network Detection**: Uses `navigator.onLine` API + online/offline event listeners
2. **Demo User**: Automatic fallback to `demo-user` account when offline
3. **Dual Storage**: Firestore (online) + localStorage (offline) with seamless sync
4. **Design IDs**: Online designs use Firestore IDs, offline designs prefixed with `local-`

### Rate Limiting

- Tracked in Firestore `users/{uid}/usage/dailyCalls`
- Fallback to localStorage when offline: `dobby-usage-{uid}`
- Daily reset at midnight based on `lastReset` timestamp

### Firebase Configuration

Required collections:
- `users/{uid}` - User profile, tier, usage stats
- `designs/{id}` - Saved fabric designs with `userId` field

Firestore rules example:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /designs/{designId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## License

MIT

## Credits

Built with ❤️ for fiber artists and textile designers.

Dobby Studio © 2026 — Where looms meet language models.
