# Changelog

All notable changes to Dobby Studio are documented here.

Format: [Semantic Versioning](https://semver.org/)  
Date format: YYYY-MM-DD

---

## [1.0.0] — 2026-04-19

**Initial Production Release** 🎉

Complete, feature-rich AI fabric design tool with Groq Vision integration.

### Added

#### Core Features
- ✨ **AI Chat Assistant** — "Dobby" responds to natural language fabric descriptions
- 📸 **Image Analysis** — Drop fabric photos, auto-extract sett and weave structure
- 🎨 **Sett Builder** — Drag-reorder color stripes, pick colors, set thread counts
- 📋 **Sett Notation** — Industry standard format (R/6 K/2 G/4)
- 📐 **Physical Specs** — EPI/PPI calculator with automatic dimension calculations
- 🧶 **Weave Selection** — 4 structures (2/2 twill, 2/1 twill, plain, 5-end satin)

#### Rendering
- 🖼️ **2D Fabric Canvas** — Real-time weave rendering with optical color mixing
- 📊 **Weaving Draft Grid** — Thread-by-thread visualization with axis labels
- 🎭 **Dobby Peg Plan** — Loom control diagram (threading, tieup, treadling)
- 🗑️ **3D Drape Preview** — Three.js cloth simulation with gravity and wind

#### Data Management
- 💾 **Design Library** — Save and reload designs (localStorage-backed, max 20 designs)
- ↩️ **Undo/Redo** — Unlimited history (Ctrl+Z, Ctrl+Y)
- 🔍 **Tartan Registry Search** — Browse 100+ official Scottish tartans
- 🌙 **Dark/Light Theme** — Auto-detect system preference, manual toggle

#### Exports
- 🖼️ **PNG Export** — Canvas screenshot (transparent background)
- 📄 **JSON Export** — Full design state (saveable, shareable)
- 🧵 **WIF Export** — Weave Interchange Format 1.1 (ArahWeave, WeavePoint, compatible)
- 📋 **Spec Sheet** — Professional print-ready HTML with mill specifications

#### AI Integration
- 🤖 **Groq Chat API** — llama-3.3-70b for design suggestions
- 👁️ **Groq Vision API** — llama-4-scout for fabric image analysis
- 📥 **Fallback K-means** — Local color extraction if API unavailable
- 🔄 **Context-Aware AI** — Remembers current sett, weave, EPI/PPI in conversation

#### Deployment
- ⚡ **Vercel Serverless** — `/api/chat.js` proxy function (secure API key management)
- 🌍 **Global CDN** — Auto-deployed via git push, live in ~2 minutes
- 🔐 **Environment Variables** — Secure Groq API key storage

#### Responsive Design
- 📱 **Mobile Support** — Touch-friendly interface, responsive layout
- ♿ **Accessibility** — Keyboard navigation, semantic HTML
- 🎯 **Keyboard Shortcuts** — Ctrl+Z (undo), Ctrl+S (save), Ctrl+E (export PNG)

#### Quality
- ⚙️ **Weave Matrix Caching** — Prevents expensive recalculation, 60+ FPS
- 🎬 **RAF Render Loop** — Single animation frame for all canvases
- 🏃 **Fast Build** — Vite bundler (~300ms dev build)

### Technical Details

**Stack:**
- React 18 + Vite
- Three.js r128 (3D)
- Groq API (chat + vision)
- Vercel serverless

**Code Size:**
- Bundle: ~500KB gzipped
- Functional components: 12
- Utility functions: 25+
- Custom hooks: 3

**Browser Support:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## [0.5.0] — 2026-04-15

**Pre-release Testing Build**

Feature-complete but not yet deployed to production.

### Added
- Initial Groq Vision API integration
- K-means fallback for offline image analysis
- WIF export format (basic)
- 3D drape preview (Three.js)

### Fixed
- Chat API proxy 401 error (GROQ_API_KEY env var)
- Canvas rendering performance bottleneck

### Changed
- Simplified /api/chat endpoint (removed dynamic routing)
- Updated vercel.json for serverless functions

---

## [0.4.0] — 2026-04-10

**Feature Completion Phase 2**

Enhanced AI and image capabilities.

### Added
- Groq Vision API for fabric photograph analysis
- Image upload zone with drag-and-drop
- Clipboard paste support (Ctrl+V)
- Image analysis confidence scoring
- Local K-means color clustering

### Fixed
- Chat API endpoint 404 errors
- Export filename generation
- Notification display timing

---

## [0.3.0] — 2026-04-05

**Feature Completion Phase 1**

Core fabric design capabilities.

### Added
- EPI/PPI input fields with auto-calculation
- Physical dimension display (cm)
- Sett notation editor (R/6 K/2 format)
- Notation parser and rebuilder
- Spec sheet export (HTML)
- Weave matrix caching system
- Reflective repeat algorithm (correct tartan weave)

### Fixed
- Simple tile repeat → reflective repeat (proper tartan)
- Weave matrix recalculation performance
- Color palette consistency

### Changed
- Improved fabric rendering quality
- Expanded palette from 4 to 12 color codes
- Enhanced chat context with physical specs

---

## [0.2.0] — 2026-03-28

**Foundation & Core Features**

Basic fabric design tool ready for enhancement.

### Added
- Sett builder with add/remove/reorder stripes
- Color picker per stripe
- Thread count inputs
- 4 weave structures (twill22, twill21, plain, satin5)
- 2D fabric canvas renderer
- Chat integration with Groq API
- Preset library (Scottish tartans)
- Design saves to localStorage
- Undo/redo history
- PNG and JSON exports
- Dark/light theme toggle

### Features
- HTML5 Canvas 2D rendering
- Basic thread size adjustments
- Pattern repeat control
- Chat message history
- Settings panel

---

## [0.1.0] — 2026-03-15

**Initial Project Setup**

Scaffolding and initial architecture.

### Added
- React 18 + Vite project structure
- Basic component hierarchy
  - Sidebar (controls)
  - Canvas area (render)
  - Chat panel (AI)
- CSS styling framework with variables
- Initial .env configuration
- Git repository initialization
- Basic state management

### Documentation
- README with quick start
- Project structure overview

---

## Future Roadmap (Planned)

### v1.1.0 (May 2026)
- [ ] SVG export format
- [ ] PDF spec sheet export
- [ ] Design comparison view
- [ ] Keyboard shortcut help dialog
- [ ] Additional color codes (Cream, Maroon, etc.)

### v1.2.0 (June 2026)
- [ ] Image background removal
- [ ] Multiple weave patterns in single design
- [ ] Custom thread ratios
- [ ] Batch design import from CSV

### v2.0.0 (Q3 2026)
- [ ] Design collaboration (multi-user)
- [ ] Advanced weave editor
- [ ] Fabric weight simulator
- [ ] Durability checker
- [ ] Cost calculator for mills

### v3.0.0 (Future)
- [ ] Mobile app (React Native)
- [ ] Weave physics simulation upgrade
- [ ] AI texture generation
- [ ] Augmented reality preview
- [ ] Machine learning tartan recognition

---

## Known Issues

### Current Version (v1.0.0)
- None resolved yet — report bugs on GitHub!

### Performance
- Large designs (100+ threads) may slow on older devices
- 3D drape preview demanding on mobile

### Compatibility
- iOS Safari: Some CSS variable issues (minor)
- IE11: Not supported (legacy browser)

---

## Deprecated

### Removed in v1.0.0
- Dynamic Groq path routing (`/api/groq/[...path].js`)
  - Simplified to fixed endpoint (`/api/chat`)
- VITE_ prefix for server-side env vars
  - Now checks both `GROQ_API_KEY` and `VITE_GROQ_API_KEY`

---

## Migration Guides

### From 0.5.0 → 1.0.0

**No breaking changes for users!**

Local designs saved in v0.5 automatically load in v1.0.

**For Vercel deployments:**
- Update environment variables (both `GROQ_API_KEY` and `VITE_GROQ_API_KEY`)
- Rebuild and redeploy
- No code changes needed

---

## Credits

### Built With
- **React 18** — UI framework
- **Vite** — Build tool
- **Three.js** — 3D graphics
- **Groq API** — LLM inference
- **Vercel** — Deployment platform

### Opened Source
- MIT License — Free for personal and commercial use

### Contributors
- Initial development: Gaurav Patil
- Community contributions: [See GitHub](https://github.com/GauravPatil2515/Dobyy-AI)

---

## Support

### Getting Help
- 📖 Read [docs/README.md](./README.md) for overview
- 🎨 Check [docs/FEATURES.md](./FEATURES.md) for detailed guide
- 🛠️ See [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- 🐛 Report issues on [GitHub Issues](https://github.com/GauravPatil2515/Dobyy-AI/issues)
- 💬 Ask questions in [GitHub Discussions](https://github.com/GauravPatil2515/Dobyy-AI/discussions)

### Report Bugs
1. GitHub Issues → New Issue
2. Describe steps to reproduce
3. Include browser/OS info
4. Attach screenshots if helpful

### Request Features
1. GitHub Discussions → Feature Request
2. Explain use case
3. Show mockups or examples

---

## License

MIT License — See LICENSE file for details

Free to use, modify, and distribute (with attribution).

---

**Thank you for using Dobby Studio! 🧵✨**

*Last updated: 2026-04-19*
