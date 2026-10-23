# JosephSpch — AI-Powered Studio Teleprompter & Video Suite

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Desktop_%7C_Mobile_%7C_Tablet-success?style=for-the-badge)

<p align="center">
  <strong>A modern, high-performance studio teleprompter engineered for video creators, keynote speakers, journalists, and interviewees.</strong>
  <br />
  Includes real-time voice-follow scrolling, dual-mode webcam overlays, universal MP4 video recording (H.264 + AAC), and an integrated AI speechwriting engine.
</p>

</div>

---

## 🌟 Key Highlights

- 🎬 **Universal MP4 Video Recording**: Records video directly in hardware-accelerated **MP4 with H.264 video and AAC audio**, guaranteeing 100% plug-and-play playback on iPhones, Android, Mac, Windows, WhatsApp, and social media without missing audio or broken thumbnails.
- 📹 **Dual-Mode Webcam Studio**:
  - **Background Camera Mode**: Overlays high-contrast teleprompter text over your full-screen camera feed so you can maintain natural eye contact while seeing yourself on mobile or desktop.
  - **Picture-in-Picture (PiP) Mode**: Resizable, draggable floating webcam box with mirror reflection, flip, and opacity adjustments.
- 🗣️ **Intelligent Voice-Follow**: Syncs teleprompter scrolling to the cadence of your live voice using browser speech recognition and real-time audio waveform visualization.
- 🤖 **AI Speechwriter & Script Enhancer**: Generate custom speeches from a simple topic or refine existing scripts with dramatic pauses (`[PAUSE 1s]`), emphasis marks, bullet speaking cues, and phonetic pronunciations.
- 🎨 **Pro Studio Display**: OLED dark & light themes, customizable text colors (preset palette + custom hex picker), font scaling, line height, mirror mode for beam-splitter rigs, and focus guide lines.
- 📱 **Mobile & Tablet Optimized**: Custom slide-out mobile drawer, touch-friendly floating glass HUD pills, and responsive studio controls.
- 🚀 **Zero-Config Deployment**: Run locally with a lightweight Python backend (`server.py`) or deploy globally on Vercel with serverless API functions.

---

## 📸 Overview & Features

### 1. 🎙️ Teleprompter Display & Controls
| Feature | Description |
| :--- | :--- |
| **Smooth Auto-Scroll** | Variable speed slider from 1 to 100 WPM with buttery smooth requestAnimationFrame scrolling. |
| **Multi-Color Typography** | Choose from crisp white, golden yellow, neon cyan, spring green, or any custom color via the built-in color picker. |
| **Mirror Mode** | One-click horizontal flip to project onto beam-splitter teleprompter glass rigs. |
| **Reading Guide Line** | Adjustable focal cue bar highlighting the active reading line. |
| **Reading Stats & Timer** | Real-time elapsed time counter, word count, estimated reading duration, and percentage progress. |
| **OLED Dark Mode** | True pure black background (`#000000`) for maximum contrast and battery savings on OLED mobile screens. |

### 2. 📹 Webcam & Video Studio
- **Background Camera Feed**: Positions your webcam as a full-screen canvas behind your script with adjustable scrim opacity.
- **Picture-in-Picture (PiP)**: Draggable studio window with corner resize and mirror toggle.
- **Universal MP4 Recording**: Automatically negotiates `video/mp4;codecs=avc1,mp4a.40.2` with graceful WebM fallbacks for legacy browsers.
- **One-Click Download**: Instant timestamped file download (`promptflow_recording_YYYY-MM-DD.mp4`).

### 3. 🤖 AI Scriptwriter & Coach
Powered by OpenRouter with automatic multi-model failover (Nemotron, Llama 3, Gemini, Liquid):
- **Generate**: Input a topic, select your format (Keynote, Pitch, Tutorial, Interview, Vlog), choose a tone, and specify target duration.
- **Add Dramatic Pauses**: Inserts natural breath breaks (`[PAUSE 1s]`, `[PAUSE 2s]`) and spoken-word emphasis.
- **Bullet Speaking Cues**: Compresses long prose into punchy cue cards for confident ad-lib delivery.
- **Simplify**: Transforms dense academic or written copy into natural, conversational speech.

---

## ⌨️ Keyboard Shortcuts

Speed up your recording sessions with fast studio hotkeys:

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Start 3-second countdown / Play / Pause prompter |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Increase / Decrease scroll speed (±5 WPM) |
| <kbd>R</kbd> | Rewind script to the top & reset timer |
| <kbd>[</kbd> / <kbd>]</kbd> | Decrease / Increase font size (±4px) |
| <kbd>F</kbd> | Toggle Fullscreen mode |
| <kbd>V</kbd> | Toggle Voice-Follow speech tracking |
| <kbd>C</kbd> | Toggle Webcam on / off |
| <kbd>?</kbd> | Open Keyboard Shortcuts & Help modal |
| <kbd>Esc</kbd> | Close any open modal or exit fullscreen |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vanilla HTML5, Modern CSS3 (Glassmorphism, CSS Custom Properties), Vanilla JavaScript (ES6+ Modules, Web Speech API, MediaRecorder API, Web Audio API).
- **Local Backend**: Python 3 standard library HTTP server (`server.py`) with zero third-party dependencies required.
- **Cloud / Serverless**: Vercel Serverless Functions (`/api/ai/generate.js`, `/api/ai/enhance.js`, `/api/ai/transcribe.js`, `/api/status.js`).
- **AI Integrations**: OpenRouter API, Groq Whisper API, Google Gemini API, AssemblyAI.

---

## 🚀 Quick Start Guide

### Option 1: Local Development (Python)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/daikictrl/Interview_speech_reader.git
   cd Interview_speech_reader
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your API keys:
   ```env
   PUBLIC_OPEN_ROUTER_API_KEY="your-openrouter-key"
   PUBLIC_GROK_WHISPER_API="your-groq-key"
   PUBLIC_GEMINI_API_KEY="your-gemini-key"
   ```

3. **Start the local server**:
   ```bash
   python server.py
   ```

4. **Open in browser**:
   Navigate to `http://localhost:8080`.

---

### Option 2: Deploy to Vercel (1-Click)

1. Push your repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. Set the following **Environment Variables** in Vercel Project Settings:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key.
   - `GROQ_API_KEY`: Your Groq Whisper API key (optional, for cloud transcription).
   - `GEMINI_API_KEY`: Your Google Gemini API key (optional).
4. Click **Deploy**. Vercel will automatically serve the static assets and mount the `/api` serverless endpoints.

---

## 📁 Repository Structure

```plaintext
Interview_speech_reader/
├── api/                        # Vercel Serverless Functions
│   ├── ai/
│   │   ├── enhance.js          # AI script enhancement (pauses, cues, simplify)
│   │   ├── generate.js         # AI script generator
│   │   └── transcribe.js       # Cloud audio transcription (Groq Whisper)
│   └── status.js               # API health & configuration status
├── app.js                      # Core teleprompter application logic
├── index.html                  # Main studio interface & markup
├── style.css                   # Glassmorphism studio design & responsive themes
├── server.py                   # Lightweight local Python server & AI proxy
├── vercel.json                 # Vercel routing configuration
├── .env.example                # Template for environment keys
├── .gitignore                  # Git ignore rules
└── README.md                   # Documentation & setup guide
```

---

## 🔒 Privacy & Security

- **Client-Side Processing**: Camera feeds, audio analysis, and video recordings are processed directly in your browser.
- **Zero Video Uploads**: Video recordings are encoded locally and saved directly to your device storage. No video data is ever sent to external servers.
- **Safe Key Management**: API secrets are stored securely in `.env` or Vercel serverless environment variables, keeping credentials shielded from public view.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
