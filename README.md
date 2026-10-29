# MoodPulse — Minimalist Context-Aware Music Player

A distraction-free, context-aware mobile music player for Android with automatic taste vector profiling, background audio playback, and Gemini AI.

---

## 📱 Minimalist Interface Overview
As configured:
- **Clean Main Screen**:
  - Full-focus artwork display
  - Song title and artist
  - Active scenario badge and estimated tempo (`BPM`)
  - **Three quick scenario suggestion buttons** (minimalist names only, one-tap active learning)
  - Subtle real-time audio visualizer responding to frequencies
  - Seek scrubber with exact duration & timestamp
  - Minimal bottom controls: `Shuffle`, `Previous`, `Play/Pause`, `Next`, `Repeat`
- **Side Menu (Hidden out of the way)**:
  - Accessible via the hamburger icon (`☰`) at the top right.
  - Houses the full **Music Library** with folder scanner.
  - Houses **Scenarios & + Scenario Generator**.
  - Houses the **AI Discovery Engine**.
  - Houses the **2D Psychoacoustic Taste Coordinate Plane** (`[valence, energy]`).
  - Houses **Settings** (Gemini API key management).
- **Synced Karaoke Lyrics**:
  - Accessible via the lyrics button (`≡`) at the top left.
  - Auto-fetches `.lrc` timestamped lyrics from LRCLIB and syncs to current playback.

---

## 🤖 How to Enable Gemini AI Capabilities

1. Tap the **Menu (`☰`)** at the top right of the app.
2. Select the **Settings** tab.
3. Paste your **Google Gemini API Key** (`AIzaSy...`) into the input box and tap **Save API Key**.
4. The key is stored locally on your device in secure storage.

### What Gemini Powers:
- **Custom Scenario Synthesizer**: In the *Scenarios* tab, describe any mood or situation (e.g., *"Late night drive in rainy Tokyo"*). Gemini computes the mathematical centroid `[valence, energy]`, color theme, and icon.
- **Acoustic Vector Estimation**: Predicts valence and energy coordinates for any untagged local track.
- **AI Music Discovery**: In the *AI Discovery* tab, pick any scenario and tap **Find Tracks**. Gemini recommends matching real-world songs based on your learned centroid coordinates.

---

## 📂 Scanning Local Music on Your Phone

1. Tap the **Menu (`☰`)** > **Library** tab.
2. Tap **Scan Music Folder** (or pick files).
3. Select your phone's music folder (e.g. `/Music` or `/Download`).
4. MoodPulse automatically reads the ID3 metadata tags, extracts embedded album covers, and builds your persistent offline library.

---

## 🎧 Background Audio & Lock-Screen Playback

MoodPulse integrates with the native Android **MediaSession API**:
- When you switch apps or lock your phone screen, playback continues seamlessly in the background without interruptions.
- The Android lock-screen widget displays the song title, artist, album art, and controls (Play/Pause, Next, Previous, Seek).

---

## 📦 How to Download & Install the APK

The project is fully structured as a native Android project using Capacitor with an automated GitHub Actions CI pipeline in `.github/workflows/build-apk.yml`.

### Option A: Build & Download via GitHub Actions (Recommended)
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "MoodPulse Initial Release"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/moodpulse.git
   git push -u origin main
   ```
2. In your GitHub repository, click on the **Actions** tab.
3. The **Build MoodPulse Android APK** workflow will automatically run.
4. When finished (usually under 2 minutes), click on the completed run and download the **`MoodPulse-Debug-APK`** artifact (`app-debug.apk`) directly to your phone.
5. Tap the APK on your phone to install!

### Option B: Direct 1-Tap Home Screen PWA Installation
MoodPulse is also bundled as a Progressive Web App (PWA) with complete offline caching and background audio:
1. Run `npm run preview -- --host` (or deploy to Vercel/Netlify).
2. Open the URL in Chrome on your phone.
3. Tap the Chrome menu (`⋮`) and select **Add to Home screen** / **Install App**.
4. It will launch as a standalone, fullscreen native-like app with lock-screen controls.
