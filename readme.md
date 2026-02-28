# 🔍 LeadSeer — Finding Hidden Business Gems

> A professional desktop app for discovering local businesses without websites — your best web design sales leads.

![LeadSeer Banner](./assets/banner.png)

---

## ✨ What It Does

LeadSeer searches Google Places for local businesses that **do not have a website** listed. Every result is a warm sales lead for web designers, digital marketers, and web agencies.

- **Search by ZIP + category** (e.g., "Plumbers in 33904")
- **Filters**: Exclude chains, minimum reviews, minimum rating, high-value only
- **Export to CSV** — download or auto-save after every search
- **Full search history** with session stats
- **Works as a desktop app (Electron)** or in a browser (React)

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | Comes with Node |
| Google Maps API Key | — | [console.cloud.google.com](https://console.cloud.google.com) |

### 1. Get your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Library**
4. Enable **"Places API"** (search for it)
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Copy your key — you'll paste it into LeadSeer's Settings on first launch

### 2. Install & Run

```bash
# Clone or download this repo
cd leadseer

# Install dependencies
npm install

# Run as desktop app (development mode)
npm run electron-dev

# OR run as web app only (browser)
npm start
```

---

## 📦 Build & Package (Distributable App)

```bash
# Build for your current OS
npm run build          # First build the React app
npm run electron       # Then test the production build

# Package for distribution
npm run package-win    # Windows (.exe installer)
npm run package-mac    # macOS (.dmg)
npm run package-linux  # Linux (.AppImage)
npm run package-all    # All platforms at once
```

Packaged output lands in the `dist/` folder.

> **macOS Note**: Code signing requires an Apple Developer certificate. For personal use, you can bypass the Gatekeeper warning by right-clicking the app and selecting "Open."

> **Windows Note**: The NSIS installer lets users choose their install directory and creates a desktop shortcut.

---

## 🗂️ Project Structure

```
leadseer/
├── main.js              # Electron main process (window, IPC, file I/O)
├── preload.js           # Secure bridge between Electron and React
├── package.json         # Dependencies + build config
├── public/
│   └── index.html       # HTML entry point
├── src/
│   ├── index.js         # React entry point
│   ├── index.css        # Design system / global styles
│   ├── App.js           # Re-export shim
│   └── App.jsx          # Main application (all UI logic)
└── assets/              # App icons (add icon.ico, icon.icns, icon.png here)
```

---

## ⚙️ Configuration

All settings are saved locally on your machine in your OS's app data folder:

| OS | Location |
|----|---------|
| Windows | `%APPDATA%\leadseer\` |
| macOS | `~/Library/Application Support/leadseer/` |
| Linux | `~/.config/leadseer/` |

**Settings available in the app:**
- `api_key` — your Google Maps API key (stored securely, never sent anywhere except Google)
- `min_reviews` — minimum review count filter (default: 5)
- `min_rating` — minimum star rating filter (default: 3.5)
- `max_results` — cap on results per search (default: 20, max: 60)
- `auto_save` — automatically save results as CSV after each search
- `save_location` — folder path for auto-saved CSVs

---

## 📊 API Usage Notes

Each search makes **1 + N API calls** (1 text search + 1 detail lookup per result). With `max_results = 20`, that's up to **21 calls per search**.

Google Places API pricing (as of 2024):
- Text Search: $32 per 1,000 requests
- Place Details: $17 per 1,000 requests
- **Google offers $200/month free credit** — roughly 400 full searches per month at default settings.

---

## 🔄 Iterating on GitHub

1. Fork or push this repo to GitHub
2. Make changes locally, commit, and push
3. To release a new version:
   - Bump `version` in `package.json`
   - Run `npm run package-all`
   - Upload the files from `dist/` to a GitHub Release

### Recommended GitHub Actions CI (optional)

Add `.github/workflows/build.yml` to auto-build on push:
```yaml
name: Build
on: [push]
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm install
      - run: npm run build
      - run: npm run package-${{ matrix.os == 'windows-latest' && 'win' || matrix.os == 'macos-latest' && 'mac' || 'linux' }}
      - uses: actions/upload-artifact@v3
        with:
          name: leadseer-${{ matrix.os }}
          path: dist/
```

---

## 🛠️ Development Tips

- **Hot reload** is active in dev mode — changes to `src/` files auto-refresh the app window
- **DevTools** open automatically in dev mode — check the Console for any errors
- **API errors**: If you see `REQUEST_DENIED`, the Places API isn't enabled for your key
- **CORS in browser mode**: The Google Places API doesn't support browser-side requests without a proxy. The app works best as the Electron desktop app. For browser-only testing, consider adding a simple Express proxy.

---

## 🤝 Contributing

Pull requests welcome! Please open an issue first to discuss major changes.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with React + Electron · Powered by Google Places API*
