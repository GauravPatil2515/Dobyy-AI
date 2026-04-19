# Contributing Guide

Want to help improve Dobby Studio? We'd love your contributions!

## Ways to Contribute

### 🐛 Report Bugs
Found something broken?

1. **GitHub Issues** → Click **New Issue**
2. **Title:** Describe the bug in 1 line
3. **Description:**
   ```
   Describe what happened:
   [Your description]
   
   Steps to reproduce:
   1. ...
   2. ...
   3. ...
   
   Expected vs Actual:
   Expected: [what should happen]
   Actual: [what actually happens]
   
   Environment:
   - Browser: Chrome 120
   - OS: Windows 11
   ```

### ✨ Suggest Features
Have an idea?

1. **GitHub Discussions** → New Discussion
2. **Category:** Feature request
3. **Description:** Explain the feature and why it's useful

### 💻 Code Contributions
Want to code? Fork and submit a PR!

#### Setup for Development
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/dobby-studio.git
cd dobby-studio

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:5173
```

#### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** in `src/` or `api/`

3. **Test locally:**
   ```bash
   npm run dev
   # Test at http://localhost:5173
   ```

4. **Build to verify:**
   ```bash
   npm run build
   # Check dist/ folder has no errors
   ```

5. **Commit with clear message:**
   ```bash
   git add .
   git commit -m "feat: add cool feature" 
   # OR
   git commit -m "fix: resolve issue #123"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/my-feature
   ```

7. **Create Pull Request** on GitHub
   - Title: "feat: add cool feature"
   - Description: Explain what and why
   - Link related issues: "Fixes #123"

#### Code Style
- **JavaScript:** Use modern ES6+ syntax
- **Components:** Functional components + hooks
- **CSS:** Use existing CSS variables
- **Naming:** camelCase for functions, PascalCase for components
- No trailing semicolons (optional in modern JS)

#### Testing
- Test locally with `npm run dev`
- Try your feature with different inputs
- Test on mobile (F12 → responsive mode)
- Check console for errors

---

## Project Structure for Contributors

```
src/
├── App.jsx              ← Main app logic (start here)
├── components/          ← React components
├── utils/               ← Helper functions
├── data/                ← Presets, color codes
└── index.css            ← Global styles

api/
└── chat.js              ← Serverless API function

docs/                    ← Documentation (this folder)

vite.config.js           ← Build configuration
vercel.json              ← Deployment settings
```

### Key Files to Know

- **`src/App.jsx`** — Main state and reducer
- **`src/components/FabricCanvas.jsx`** — 2D render engine
- **`src/utils/groqClient.js`** — AI chat integration
- **`api/chat.js`** — Vercel serverless proxy
- **`.env`** — Local API key (Git ignored)
- **`vercel.json`** — Production deployment config

---

## Feature Ideas (Looking for Help!)

### Easy (Good First Issues)
- [ ] Add more color codes (C=Cream, M=Maroon, etc.)
- [ ] New preset tartans from registry
- [ ] Keyboard shortcut help dialog
- [ ] Export to SVG format
- [ ] Notification toast for errors

### Medium
- [ ] Undo limit (currently unlimited)
- [ ] Batch chat imports (multiple messages at once)
- [ ] Design comparison view (side-by-side)
- [ ] Print-friendly PDF export
- [ ] Performance metrics dashboard

### Hard (Advanced)
- [ ] Multi-user collaboration
- [ ] Tartan image scraper (auto-update registry)
- [ ] Weave simulation physics upgrade
- [ ] Mobile app (React Native)
- [ ] AI texture generation

---

## Commit Message Convention

Follow this format:

```
feat: add new feature description
fix: fix bug description  
docs: update documentation
style: fix code style (no logic change)
refactor: reorganize code (no logic change)
perf: improve performance
test: add tests
chore: build/dependency changes
```

Examples:
```
feat: add satin weave export to WIF
fix: resolve chat API 401 error
docs: add textile concepts guide
refactor: simplify renderFabric algorithm
perf: cache weave matrix calculations
```

---

## Pull Request Checklist

Before submitting:

- [ ] Code works locally (`npm run dev`)
- [ ] No console errors or warnings
- [ ] Build succeeds (`npm run build`)
- [ ] Commit messages are clear
- [ ] Documentation updated (if needed)
- [ ] New features tested on:
  - [ ] Desktop (Chrome)
  - [ ] Desktop (Firefox)
  - [ ] Mobile (if applicable)
- [ ] No sensitive data in commit (no API keys, passwords)

---

## Code Review Process

1. Maintainer reviews your PR
2. May request changes (don't worry, it's normal!)
3. Update code based on feedback
4. Maintainer merges when approved
5. Feature goes live on next Vercel deployment

**Typical timeline:** 1–7 days review

---

## Setting Up Your IDE

### Recommended: VS Code
```bash
# Essential extensions:
- ES7+ React/Redux/React-Native snippets
- Prettier (auto-format)
- ESLint
- Thunder Client (API testing)
```

### Vite Development
Auto-refresh on save (HMR):
```bash
npm run dev
# Change src/App.jsx
# Browser updates instantly (no refresh)
```

---

## Environment Variables

### Local Development
Create `.env` (Git ignored):
```
VITE_GROQ_API_KEY=gsk_your_key_here
```

### Get API Key
1. https://console.groq.com
2. **API Keys** → Create new
3. Copy and paste in `.env`

### Production
Set in Vercel dashboard:
- **Settings** → **Environment Variables**
- Add `GROQ_API_KEY` and `VITE_GROQ_API_KEY`

---

## Debugging

### Browser Console
F12 → Console tab
- Check for errors
- Use `console.log()` for debugging

### React Developer Tools
Chrome extension: "React Developer Tools"
- Inspect components
- View state/props
- Check re-renders

### Vercel Functions Log
1. Vercel Dashboard → Deployments
2. Click latest
3. Functions → `/api/chat.js`
4. View logs

### Local API Testing
```bash
# Test /api/chat locally:
curl -X POST http://localhost:5173/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"test"}]}'
```

---

## Documentation

### Update Documentation
Edit files in `docs/` folder:
- `README.md` — Main overview
- `FEATURES.md` — Feature descriptions
- `API.md` — API reference
- `ARCHITECTURE.md` — Technical design
- `DEPLOYMENT.md` — Deployment guide
- etc.

### Markdown Formatting
```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- Bullet list
  - Nested bullet

1. Numbered list
2. Item 2

[Link text](https://url.com)

`inline code`

```javascript
// Code block
const x = 42;
```
```

---

## Community Guidelines

### Be Respectful
- Assume good intent
- Help others learn
- Welcome all backgrounds
- No harassment, discrimination, hate speech

### Be Collaborative
- Share knowledge
- Review peers' PRs kindly
- Celebrate contributions
- Ask questions, don't demand

### Be Constructive
- Feedback: what and why, not just criticism
- Suggest improvements, not blame
- Learn from mistakes

---

## Getting Help

### Questions?
1. **Check existing GitHub Issues** — Your question might be answered
2. **Search Discussions** — Community Q&A
3. **Post a Discussion** — Ask the community
4. **DM maintainer** on GitHub (last resort)

### Common Questions

**Q: I found a bug, should I fix it?**  
A: Yes! Report it first as an issue, then offer to fix it.

**Q: Can I add a new weave structure?**  
A: Yes! Add to `src/utils/weaveMatrix.js`, update docs.

**Q: How do I test my changes on production?**  
A: Deploy to your own Vercel → test → submit PR.

**Q: Can I add a new export format?**  
A: Yes! Examples: SVG, PDF, DXF. Add to `src/utils/`, create export function.

---

## Release Cycle

### Versions Follow Semantic Versioning
`MAJOR.MINOR.PATCH`

Example: v1.2.3
- `1` = Major (breaking changes)
- `2` = Minor (new features)
- `3` = Patch (bug fixes)

### Release Schedule
- Bug fixes: Released ASAP
- Features: Released every 2 weeks
- Major versions: As needed (rare)

### How to Release (Maintainers Only)
```bash
npm version patch    # or minor/major
npm publish
git push origin main --tags
```

---

## Legal

### License
This project is **MIT Licensed**.

By contributing, you agree:
- Your code can be used under MIT
- You have right to your code
- No warranty (software provided as-is)

### Attribution
Contributors listed in PRs. Major contributors may get:
- GitHub profile link
- Mention in README

---

## Recognition

Contributions large or small are valued!

- ⭐ Review your PR
- 🎉 Mention in CHANGELOG
- 📣 Share on socials (with permission)
- 🏆 Add to contributors list

---

## Getting Started

Pick a task:

1. **Easy:** Comment colors, keyboard shortcuts, help dialog
2. **Medium:** Design gallery improvements, export formats
3. **Hard:** Collaboration features, weave physics

Then:
```bash
git clone https://github.com/YOUR_USERNAME/dobby-studio.git
cd dobby-studio
npm install
npm run dev
# Make changes...
git push origin feature/your-feature
# Submit PR!
```

**Thank you for contributing! 🙏**

---

## Questions or Issues?

- 📧 Comments on your PR
- 💬 GitHub Discussions
- 🐛 GitHub Issues
- 📝 Pull request template (auto-filled)

We're here to help!
