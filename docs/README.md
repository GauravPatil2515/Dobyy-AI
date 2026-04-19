# 🧵 Dobby Studio — AI Fabric Designer

AI-powered tartan and dobby fabric design tool. Design professional woven fabrics using natural language and visual references.

## Live Demo
🌐 [https://dobyy-ai.vercel.app](https://dobyy-ai.vercel.app)

![Vercel](https://img.shields.io/badge/deployed-vercel-black)
![Groq](https://img.shields.io/badge/AI-Groq-orange)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What It Does
- ✨ **Type fabric descriptions** → Live preview renders instantly  
  *"autumn forest tartan" → Get a complete design*
- 📸 **Drop fabric images** → AI extracts colors and pattern  
  *Upload a photo → Get sett notation + weave structure*
- 📊 **Real physical specs** → EPI/PPI calculator for fabric dimensions  
  *Exact cm measurements + warp end count for 150cm width*
- 📋 **Export for production** → PNG, JSON, WIF (industry format)  
  *Share with mills, import to WeavePoint/ArahWeave*
- 📄 **Spec sheets** → Printable design documentation  
  *Ready to send to fabric manufacturers*
- 🎨 **Preset library** → 100+ regional tartans from Scottish Tartan Registry
- 🔄 **Undo/Redo** → Never lose a design idea
- 💾 **Design gallery** → Save designs locally, access anytime

## Tech Stack
| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | React 18 + Vite                   |
| 3D Preview   | Three.js r128                     |
| AI Chat      | Groq API (llama-3.3-70b)          |
| Vision AI    | Groq Vision (llama-4-scout)       |
| Deployment   | Vercel (serverless functions)     |
| Styling      | CSS + Tailwind-inspired variables |

## Quick Start

### 1. Clone
```bash
git clone https://github.com/GauravPatil2515/Dobyy-AI.git
cd Dobyy-AI
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env, add your Groq API key:
# VITE_GROQ_API_KEY=gsk_xxxxx
```

Get free API key: [console.groq.com](https://console.groq.com)

### 3. Install & Run
```bash
npm install
npm run dev
```

Open http://localhost:5173 → Start designing!

### 4. Build for Production
```bash
npm run build
# Outputs to dist/
```

## Key Features Explained

### Sett Notation
Industry standard: `R/6 K/2 G/4` means 6 red threads, 2 black, 4 green

### Weave Structures
- **2/2 Twill** — Standard tartan weave, strong and balanced
- **2/1 Twill** — Lighter, more drape, elegant
- **Plain** — Simple over-under, woven checks
- **5-End Satin** — Smooth luxury surface

### Physical Specs
- **EPI (Ends Per Inch)** — Warp thread density (default 50)
- **PPI (Picks Per Inch)** — Weft thread density (default 48)
- Auto-calculation of repeat dimensions (cm) and total warp ends

### 3D Drape Preview
See your design as a draped cloth with gravity and wind simulation using Three.js

### Image Analysis
**Primary:** Groq Vision AI extracts sett from fabric photos  
**Fallback:** Local K-means color analysis if API unavailable

## File Structure
```
.
├── src/
│   ├── App.jsx                 ← Root component
│   ├── components/
│   │   ├── Sidebar.jsx         ← Sett builder, presets
│   │   ├── FabricCanvas.jsx    ← 2D weave renderer
│   │   ├── DrapeView.jsx       ← 3D cloth simulation
│   │   ├── ChatPanel.jsx       ← AI assistant
│   │   └── ...
│   ├── utils/
│   │   ├── groqClient.js       ← Chat API calls
│   │   ├── imageAnalysis.js    ← Vision + K-means
│   │   └── ...
│   └── index.css
├── api/
│   └── chat.js                 ← Vercel serverless proxy
├── docs/                       ← This documentation
├── vite.config.js
├── vercel.json
└── package.json
```

## How to Use

### 1. Chat with Dobby
Type a fabric description:
```
"Royal Stewart tartan"
"ocean blues with white stripes"
"something that feels like an autumn forest"
```

Dobby responds with a live design.

### 2. Upload a Fabric Image
- Drag & drop from your computer
- Click upload zone
- Paste from clipboard (Ctrl+V)

AI analyzes colors and pattern, generates matching sett.

### 3. Edit Manually
- Add/remove color stripes
- Adjust thread counts
- Change weave structure
- Modify EPI/PPI for physical dimensions

### 4. Export
- **PNG** — Share on social media
- **JSON** — Save to reload later
- **WIF** — Open in WeavePoint/ArahWeave
- **Spec Sheet** — Print for mill orders

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables:
   - `GROQ_API_KEY` = your API key
   - `VITE_GROQ_API_KEY` = same key
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

## Contributing
Found a bug? Have an idea? See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT — Use freely, modify, share

## Support
- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/GauravPatil2515/Dobyy-AI/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/GauravPatil2515/Dobyy-AI/discussions)

---

**Built with ❤️ by fabric designers, for fabric designers.**  
*Woven together with Groq AI, Three.js, and React.*
