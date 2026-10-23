/**
 * PROMPTFLOW - PROFESSIONAL TELEPROMPTER ENGINE
 * Features:
 * - Real-Time Voice Follow (speech-driven auto-scrolling locked to reading guide)
 * - Live Audio Track VU Meter for mic verification (desktop & mobile)
 * - Precision Stopwatch & Progress Tracking
 * - Webcam Eye-Contact HUD
 * - AI Speechwriter & Teleprompter Enhancer
 */

// ================= SAMPLE SCRIPTS =================
const SAMPLE_SCRIPTS = {
  keynote: `Ladies and gentlemen... [PAUSE 1s]

Every once in a while, a revolutionary product comes along that changes EVERYTHING.

In 1984, we introduced the Macintosh. It didn't just change Apple... it changed the whole computer industry.

In 2001, we introduced the first iPod. And it didn't just change the way we all listen to music... it changed the entire music industry.

Well, today... [PAUSE 2s] we're introducing three revolutionary products of this class.

The first one: a wide-screen teleprompter with natural controls.
The second: a breakthrough AI speechwriter.
And the third: a voice-adaptive teleprompter engine.

These are not three separate devices.
They are ONE device. And we are calling it: PromptFlow.`,

  youtube: `Stop scrolling! Because what you are about to see will genuinely blow your mind. [PAUSE 1s]

For the past two weeks, I have replaced my entire video production workflow with an AI teleprompter.

No memorizing scripts. [PAUSE 1s] No awkward retakes. And zero awkward side-eye glances away from the lens.

Here is the secret most creators won't tell you:
Your audience doesn't judge you on whether you memorized your lines. They judge you on your eye contact, your confidence, and your pacing.

In today's video, I'm breaking down the exact three-step framework to deliver flawless YouTube presentations on the very first take.

Hit subscribe, drop a like, and let's jump right into step number one!`,

  ted: `Imagine standing at the edge of a cliff... [PAUSE 2s]

Below you is the vast unknown. Above you is infinite possibility.

Most of our lives, we are taught to stay firmly on the designated path. We are told to memorize the conventional answers. We are told to keep our heads down.

[PAUSE 1s] But what if the greatest discoveries in human history were made by people who simply dared to look up?

Today, I want to talk to you about the power of oral storytelling.
How three simple words can alter the trajectory of an entire generation.
And why your unique voice is the most potent instrument on this planet.`,

  pitch: `Hi everyone. Did you know that 87% of video creators discard their first ten takes simply because they stumble over their words?

That is four hours of lost productivity per video.

We built PromptFlow: the world's smartest, voice-following teleprompter. [PAUSE 1s]

Unlike static prompters that force you to match an arbitrary scrolling speed, PromptFlow listens to your vocal cadence. When you pause for dramatic effect, it pauses with you. When you speed up, it stays right at your eye line.

We've already saved early beta testers over ten thousand hours of studio production time.

We are raising 1.5 Million dollars to scale our creator studio globally. Join us in making public speaking effortless for everyone.`,

  news: `Good evening. Tonight's top story: [PAUSE 1s]

Global tech leaders have gathered for the annual Artificial Intelligence Summit, unveiling unprecedented breakthroughs in real-time generative interfaces.

Industry analysts project that adaptive AI tools will increase creator productivity by more than 300 percent over the next eighteen months.

[PAUSE 1s] Meanwhile, local markets showed steady gains today following robust quarterly earnings reports across the software sector.

Coming up after the break: how next-generation studio tools are transforming modern broadcast news. Stay with us.`
};

// ================= APPLICATION STATE =================
const state = {
  script: "",
  isPlaying: false,
  speedWpm: 45,
  fontSizePx: 56,
  columnWidthPct: 70,
  guidePosPct: 30,
  showGuide: true,
  currentTheme: "theme-oled",
  textColor: localStorage.getItem("promptflow_text_color") || "#ffffff",
  
  // Timer & Progress
  elapsedSeconds: 0,
  timerInterval: null,
  timerStartTime: null,
  scrollAccumulator: 0,
  animFrameId: null,

  // Voice Follow Engine
  voiceFollowActive: false,
  isSpeechRecognizing: false,
  speechRecognition: null,
  whisperCaptureActive: false,
  mediaRecorder: null,
  scriptWords: [],
  currentWordIndex: 0,
  voiceEnergyLevel: 0,
  simulatedVoiceActive: false,
  simulatedVoiceTimer: null,

  // Audio Track / Mic Waveform Visualizer
  audioContext: null,
  audioAnalyser: null,
  audioStream: null,
  soundtrackCtx: null,
  soundtrackAnimId: null,
  micActive: false,

  // Webcam
  webcamActive: false,
  webcamStream: null,
  webcamMirrored: true,
  webcamMode: window.innerWidth <= 768 ? "background" : "pip",

  // Video Recording
  videoRecorder: null,
  videoRecordingActive: false,
  videoChunks: [],
  lastVideoBlob: null,
  recTimerInterval: null,
  recStartTime: null,

  // View Mode
  activeTab: "prompter",
  isFullscreen: false,
  hudTimeout: null,

  // Mobile UI State
  mobileDrawerOpen: false,
  hudSettingsOpen: false
};

// ================= DOM ELEMENT REFERENCES =================
let elements = {};

function initElements() {
  elements = {
    // Header & Stats
    studioHeader: document.getElementById("studioHeader"),
    metaElapsedItem: document.getElementById("metaElapsedItem"),
    statElapsed: document.getElementById("statElapsed"),
    btnResetTimer: document.getElementById("btnResetTimer"),
    statProgress: document.getElementById("statProgress"),

    // Mode Switchers & Actions
    tabPrompter: document.getElementById("tabPrompter"),
    tabEditor: document.getElementById("tabEditor"),
    prompterStage: document.getElementById("prompterStage"),
    editorStage: document.getElementById("editorStage"),
    btnVoiceFollow: document.getElementById("btnVoiceFollow"),
    btnWebcam: document.getElementById("btnWebcam"),
    btnOpenAI: document.getElementById("btnOpenAI"),
    btnHelp: document.getElementById("btnHelp"),

    // Prompter Stage
    readingGuide: document.getElementById("readingGuide"),
    prompterViewport: document.getElementById("prompterViewport"),
    prompterContentBox: document.getElementById("prompterContentBox"),
    prompterTextDisplay: document.getElementById("prompterTextDisplay"),
    leadPad: document.getElementById("leadPad"),
    tailPad: document.getElementById("tailPad"),
    countdownOverlay: document.getElementById("countdownOverlay"),
    countdownNumber: document.getElementById("countdownNumber"),
    voiceHud: document.getElementById("voiceHud"),
    voiceHudText: document.getElementById("voiceHudText"),

    // Sound Track Right Dock Panel
    soundtrackPanel: document.getElementById("soundtrackPanel"),
    soundtrackCanvas: document.getElementById("soundTrackCanvas"),
    soundtrackDot: document.getElementById("soundtrackDot"),

    // Editor View
    scriptEditor: document.getElementById("scriptEditor"),
    sampleScriptSelect: document.getElementById("sampleScriptSelect"),
    btnUploadScript: document.getElementById("btnUploadScript"),
    fileInput: document.getElementById("fileInput"),
    btnExportScript: document.getElementById("btnExportScript"),
    btnClearScript: document.getElementById("btnClearScript"),
    btnLaunchPrompter: document.getElementById("btnLaunchPrompter"),

    // Controller HUD
    prompterHud: document.getElementById("prompterHud"),
    progressTrack: document.getElementById("progressTrack"),
    progressFill: document.getElementById("progressFill"),
    btnPlayPause: document.getElementById("btnPlayPause"),
    playIcon: document.getElementById("playIcon"),
    pauseIcon: document.getElementById("pauseIcon"),
    btnRewind: document.getElementById("btnRewind"),
    btnSpeedDown: document.getElementById("btnSpeedDown"),
    btnSpeedUp: document.getElementById("btnSpeedUp"),
    speedVal: document.getElementById("speedVal"),
    sliderFontSize: document.getElementById("sliderFontSize"),
    fontSizeVal: document.getElementById("fontSizeVal"),
    sliderWidth: document.getElementById("sliderWidth"),
    widthVal: document.getElementById("widthVal"),
    sliderGuidePos: document.getElementById("sliderGuidePos"),
    guidePosVal: document.getElementById("guidePosVal"),
    btnToggleGuide: document.getElementById("btnToggleGuide"),
    themeSelect: document.getElementById("themeSelect"),
    btnFullscreen: document.getElementById("btnFullscreen"),

    // Text Color Controls
    btnTextColorMenu: document.getElementById("btnTextColorMenu"),
    textColorControlWrap: document.getElementById("textColorControlWrap"),
    textColorDot: document.getElementById("textColorDot"),
    colorDropdownMenu: document.getElementById("colorDropdownMenu"),
    inputCustomColor: document.getElementById("inputCustomColor"),
    inputCustomColorMobile: document.getElementById("inputCustomColorMobile"),
    mobileColorSwatches: document.getElementById("mobileColorSwatches"),

    // Webcam
    webcamContainer: document.getElementById("webcamContainer"),
    webcamBackdrop: document.getElementById("webcamBackdrop"),
    webcamVideoWrap: document.getElementById("webcamVideoWrap"),
    webcamHeader: document.getElementById("webcamHeader"),
    webcamVideo: document.getElementById("webcamVideo"),
    btnWebcamFlip: document.getElementById("btnWebcamFlip"),
    btnWebcamClose: document.getElementById("btnWebcamClose"),
    btnWebcamMode: document.getElementById("btnWebcamMode"),
    webcamModeIcon: document.getElementById("webcamModeIcon"),
    webcamModeText: document.getElementById("webcamModeText"),
    webcamScrim: document.getElementById("webcamScrim"),
    webcamOpacity: document.getElementById("webcamOpacity"),
    btnWebcamRecord: document.getElementById("btnWebcamRecord"),
    recIndicator: document.getElementById("recIndicator"),
    recTimer: document.getElementById("recTimer"),
    btnDownloadRec: document.getElementById("btnDownloadRec"),

    // Modals
    aiModal: document.getElementById("aiModal"),
    btnCloseAIModal: document.getElementById("btnCloseAIModal"),
    tabAIGenerate: document.getElementById("tabAIGenerate"),
    tabAIEnhance: document.getElementById("tabAIEnhance"),
    paneAIGenerate: document.getElementById("paneAIGenerate"),
    paneAIEnhance: document.getElementById("paneAIEnhance"),
    aiTopic: document.getElementById("aiTopic"),
    aiFormat: document.getElementById("aiFormat"),
    aiTone: document.getElementById("aiTone"),
    aiDuration: document.getElementById("aiDuration"),
    btnRunGenerate: document.getElementById("btnRunGenerate"),
    generateSpinner: document.getElementById("generateSpinner"),
    btnRunEnhance: document.getElementById("btnRunEnhance"),
    enhanceSpinner: document.getElementById("enhanceSpinner"),
    helpModal: document.getElementById("helpModal"),
    btnCloseHelpModal: document.getElementById("btnCloseHelpModal"),

    // Mic Troubleshooter Modal
    micTroubleshootModal: document.getElementById("micTroubleshootModal"),
    btnCloseMicModal: document.getElementById("btnCloseMicModal"),
    btnRetryMicPermission: document.getElementById("btnRetryMicPermission"),
    btnTestSimulatedVoice: document.getElementById("btnTestSimulatedVoice"),
    micErrorNotice: document.getElementById("micErrorNotice"),

    // Mobile UI
    btnHamburger: document.getElementById("btnHamburger"),
    headerActions: document.getElementById("headerActions"),
    mobileDrawerBackdrop: document.getElementById("mobileDrawerBackdrop"),
    btnHudSettings: document.getElementById("btnHudSettings"),
    hudSettingsPopup: document.getElementById("hudSettingsPopup"),
    sliderFontSizeMobile: document.getElementById("sliderFontSizeMobile"),
    fontSizeValMobile: document.getElementById("fontSizeValMobile"),
    sliderWidthMobile: document.getElementById("sliderWidthMobile"),
    widthValMobile: document.getElementById("widthValMobile"),
    sliderGuidePosMobile: document.getElementById("sliderGuidePosMobile"),
    guidePosValMobile: document.getElementById("guidePosValMobile"),
    btnToggleGuideMobile: document.getElementById("btnToggleGuideMobile"),
    themeSelectMobile: document.getElementById("themeSelectMobile"),
    btnFullscreenMobile: document.getElementById("btnFullscreenMobile")
  };
}

// ================= INITIALIZATION =================
function init() {
  initElements();
  loadSavedPreferences();
  setupEventListeners();
  setupDragAndDrop();
  updatePrompterDisplay();
  applyPrompterGeometry();
  updateElapsedDisplay(0);
  startSoundTrackCanvas();
}

function loadSavedPreferences() {
  const savedScript = localStorage.getItem("promptflow_script");
  state.script = savedScript !== null ? savedScript : SAMPLE_SCRIPTS.keynote;
  if (elements.scriptEditor) elements.scriptEditor.value = state.script;

  if (localStorage.getItem("promptflow_speed")) {
    state.speedWpm = parseInt(localStorage.getItem("promptflow_speed"), 10) || 45;
  }
  if (localStorage.getItem("promptflow_font_size")) {
    state.fontSizePx = parseInt(localStorage.getItem("promptflow_font_size"), 10) || 56;
  }
  if (localStorage.getItem("promptflow_theme")) {
    state.currentTheme = localStorage.getItem("promptflow_theme");
    document.body.className = state.currentTheme;
    if (elements.themeSelect) elements.themeSelect.value = state.currentTheme;
  }

  // Restore script text color
  const savedColor = localStorage.getItem("promptflow_text_color") || "#ffffff";
  setScriptTextColor(savedColor);

  // Initialize webcam mode based on viewport
  if (window.innerWidth <= 768) {
    state.webcamMode = "background";
  }

  if (elements.speedVal) elements.speedVal.textContent = state.speedWpm;
  if (elements.sliderFontSize) elements.sliderFontSize.value = state.fontSizePx;
  if (elements.fontSizeVal) elements.fontSizeVal.textContent = `${state.fontSizePx}px`;
  if (elements.prompterTextDisplay) elements.prompterTextDisplay.style.fontSize = `${state.fontSizePx}px`;
}

// ================= SCRIPT RENDERING WITH WORD TRACKING =================
function normalizeWord(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^\w]/g, "")
    .trim();
}

function updatePrompterDisplay() {
  const raw = state.script || "Click 'Editor' above to type or generate your teleprompter script.";
  const paragraphs = raw.split(/\n\s*\n/);
  
  state.scriptWords = [];
  let globalWordIdx = 0;
  let html = "";

  paragraphs.forEach((para, pIdx) => {
    if (!para.trim()) return;

    // Tokenize text: handle cues [PAUSE...], words, and whitespace/punctuation
    let paraHtml = "";
    // Regex splits by bracket cues, or words, or punctuation
    const tokens = para.match(/\[.*?\]|\S+/g) || [];

    tokens.forEach((token) => {
      if (token.startsWith("[") && token.endsWith("]")) {
        // Stage cue tag
        paraHtml += `<span class="prompt-cue">${token}</span> `;
      } else {
        // Clean word for tracking
        const norm = normalizeWord(token);
        if (norm) {
          const wIdx = globalWordIdx++;
          state.scriptWords.push({
            idx: wIdx,
            word: token,
            norm: norm
          });
          paraHtml += `<span class="prompt-word" id="pw-${wIdx}" data-idx="${wIdx}">${token}</span> `;
        } else {
          paraHtml += `${token} `;
        }
      }
    });

    html += `<p class="prompter-para" data-para="${pIdx}">${paraHtml.trim()}</p>`;
  });

  if (elements.prompterTextDisplay) {
    elements.prompterTextDisplay.innerHTML = html;
  }
  state.currentWordIndex = 0;
  updateProgressBar();
}

function applyPrompterGeometry() {
  if (elements.prompterContentBox) {
    elements.prompterContentBox.style.width = `${state.columnWidthPct}%`;
  }
  if (elements.readingGuide) {
    elements.readingGuide.style.top = `${state.guidePosPct}%`;
    elements.readingGuide.classList.toggle("hidden", !state.showGuide);
  }
  if (elements.leadPad) {
    elements.leadPad.style.height = `${state.guidePosPct}vh`;
  }
  if (elements.btnToggleGuide) {
    elements.btnToggleGuide.classList.toggle("active", state.showGuide);
  }
}

// ================= ELAPSED TIMER FUNCTIONALITY =================
function updateElapsedDisplay(totalSeconds) {
  if (!elements.statElapsed) return;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  elements.statElapsed.textContent = `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function startElapsedTimer() {
  if (state.timerInterval) return;
  state.timerStartTime = Date.now() - (state.elapsedSeconds * 1000);
  state.timerInterval = setInterval(() => {
    state.elapsedSeconds = Math.floor((Date.now() - state.timerStartTime) / 1000);
    updateElapsedDisplay(state.elapsedSeconds);
  }, 250);
}

function pauseElapsedTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function resetElapsedTimer() {
  pauseElapsedTimer();
  state.elapsedSeconds = 0;
  state.timerStartTime = Date.now();
  updateElapsedDisplay(0);
}

function updateProgressBar() {
  const vp = elements.prompterViewport;
  if (!vp) return;
  const maxScroll = vp.scrollHeight - vp.clientHeight;
  if (maxScroll <= 0) {
    if (elements.statProgress) elements.statProgress.textContent = "0%";
    if (elements.progressFill) elements.progressFill.style.width = "0%";
    return;
  }
  const pct = Math.min(100, Math.max(0, Math.round((vp.scrollTop / maxScroll) * 100)));
  if (elements.statProgress) elements.statProgress.textContent = `${pct}%`;
  if (elements.progressFill) elements.progressFill.style.width = `${pct}%`;
}

// ================= SCROLLING ENGINE =================
function startCountdownAndPlay() {
  if (state.isPlaying) {
    pausePrompter();
    return;
  }

  // If already underway or voice follow is active, resume immediately
  if (state.voiceFollowActive || elements.prompterViewport.scrollTop > 40) {
    playPrompter();
    return;
  }

  // 3-second visual countdown
  let count = 3;
  elements.countdownNumber.textContent = count;
  elements.countdownOverlay.classList.add("active");

  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      elements.countdownNumber.textContent = count;
    } else {
      clearInterval(countdownInterval);
      elements.countdownOverlay.classList.remove("active");
      playPrompter();
    }
  }, 1000);
}

let lastScrollTime = 0;
function playPrompter() {
  if (state.isPlaying) return;
  state.isPlaying = true;

  if (elements.btnPlayPause) elements.btnPlayPause.classList.add("playing");
  if (elements.playIcon) elements.playIcon.classList.add("hidden");
  if (elements.pauseIcon) elements.pauseIcon.classList.remove("hidden");

  startElapsedTimer();

  if (state.voiceFollowActive) {
    // In voice follow mode, speech dictates movement
    startSpeechRecognition();
  } else {
    // Normal auto-scroll mode
    lastScrollTime = performance.now();
    state.animFrameId = requestAnimationFrame(scrollStep);
  }
}

function pausePrompter() {
  state.isPlaying = false;
  if (elements.btnPlayPause) elements.btnPlayPause.classList.remove("playing");
  if (elements.playIcon) elements.playIcon.classList.remove("hidden");
  if (elements.pauseIcon) elements.pauseIcon.classList.add("hidden");

  pauseElapsedTimer();

  if (state.animFrameId) {
    cancelAnimationFrame(state.animFrameId);
    state.animFrameId = null;
  }
}

function scrollStep(timestamp) {
  if (!state.isPlaying || state.voiceFollowActive) return;

  const deltaTime = (timestamp - lastScrollTime) / 1000;
  lastScrollTime = timestamp;

  const pxPerSec = (state.speedWpm * 1.35) * (state.fontSizePx / 56);
  state.scrollAccumulator += pxPerSec * deltaTime;

  const vp = elements.prompterViewport;
  if (state.scrollAccumulator >= 1) {
    const toScroll = Math.floor(state.scrollAccumulator);
    vp.scrollTop += toScroll;
    state.scrollAccumulator -= toScroll;
    updateProgressBar();
  }

  const maxScroll = vp.scrollHeight - vp.clientHeight;
  if (vp.scrollTop >= maxScroll - 5) {
    pausePrompter();
    return;
  }

  state.animFrameId = requestAnimationFrame(scrollStep);
}

function rewindPrompter() {
  pausePrompter();
  if (elements.prompterViewport) {
    elements.prompterViewport.scrollTo({ top: 0, behavior: "smooth" });
  }
  resetElapsedTimer();
  state.currentWordIndex = 0;
  clearWordHighlights();
  updateProgressBar();
}

function adjustSpeed(delta) {
  state.speedWpm = Math.max(10, Math.min(150, state.speedWpm + delta));
  if (elements.speedVal) elements.speedVal.textContent = state.speedWpm;
  localStorage.setItem("promptflow_speed", state.speedWpm);
}

// ================= LIVE AUDIO TRACK / SOUNDTRACK CANVAS VISUALIZER =================
let idleWavePhase = 0;

async function initAudioTrack() {
  if (state.audioContext && state.audioStream) {
    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume();
    }
    state.micActive = true;
    updateSoundtrackUI(true);
    return true;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false, // Don't clip low-amplitude voice
        autoGainControl: true
      }
    });
    state.audioStream = stream;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume();
    }

    const source = state.audioContext.createMediaStreamSource(stream);
    state.audioAnalyser = state.audioContext.createAnalyser();
    state.audioAnalyser.fftSize = 256;
    state.audioAnalyser.smoothingTimeConstant = 0.5;
    source.connect(state.audioAnalyser);

    state.micActive = true;
    updateSoundtrackUI(true);

    // Start Real-Time Waveform Soundtrack Render Loop
    startSoundTrackCanvas();
    return true;
  } catch (err) {
    console.warn("Microphone access notice:", err);
    state.micActive = false;
    updateSoundtrackUI(false);

    let explanation = "Microphone hardware access was denied by Windows or browser permissions.";
    if (err.name === "NotAllowedError" || (err.message && err.message.includes("Permission denied by system"))) {
      explanation = "Windows System Privacy is set to <strong>Deny</strong>. Even though your browser allowed it, Windows blocked desktop apps from accessing the physical mic.";
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      explanation = "No physical microphone device was detected on your PC.";
    } else if (err.name === "NotReadableError") {
      explanation = "Another app (Zoom, Teams, or another tab) is currently using your microphone exclusively.";
    }

    if (state.voiceFollowActive) {
      openMicModal(explanation);
    }
    return false;
  }
}

function updateSoundtrackUI(isActive) {
  if (elements.soundtrackPanel) {
    elements.soundtrackPanel.classList.toggle("active", isActive);
  }
}

function startSoundTrackCanvas() {
  const canvas = elements.soundtrackCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  state.soundtrackCtx = ctx;

  if (state.soundtrackAnimId) {
    cancelAnimationFrame(state.soundtrackAnimId);
    state.soundtrackAnimId = null;
  }

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = (rect.width || 22) * dpr;
  canvas.height = (rect.height || 64) * dpr;
  ctx.scale(dpr, dpr);

  drawSoundTrackWaveform();
}

function drawSoundTrackWaveform() {
  const canvas = elements.soundtrackCanvas;
  const ctx = state.soundtrackCtx;
  if (!canvas || !ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const centerX = width / 2;

  ctx.clearRect(0, 0, width, height);

  // 1. Live Mic Active
  if (state.audioAnalyser && state.micActive) {
    const freqData = new Uint8Array(state.audioAnalyser.frequencyBinCount);
    state.audioAnalyser.getByteFrequencyData(freqData);

    // Focus on vocal frequency range (bins 1 to 35, approx 80Hz - 4000Hz)
    let vocalEnergy = 0;
    const vocalBins = Math.min(35, freqData.length);
    for (let i = 1; i < vocalBins; i++) {
      vocalEnergy += freqData[i];
    }
    const avgVocal = vocalEnergy / (vocalBins - 1);

    const numBars = 12;
    const maxHalfWidth = (width / 2) - 1.5;
    const barSpacing = (height - 6) / (numBars - 1);

    idleWavePhase += 0.06;

    if (avgVocal > 2) {
      // Actively speaking: draw real vocal equalizer bars
      for (let i = 0; i < numBars; i++) {
        const y = 3 + (i * barSpacing);
        const binIndex = 1 + Math.floor((i / numBars) * (vocalBins - 1));
        const freqVal = freqData[binIndex] || 0;
        const normalized = Math.min(1, Math.max(0.1, freqVal / 200));
        const barWidth = Math.max(1.5, normalized * maxHalfWidth);

        ctx.beginPath();
        if (normalized > 0.6) {
          ctx.strokeStyle = "#4ade80"; // Bright emerald peak
          ctx.lineWidth = 1.8;
        } else if (normalized > 0.3) {
          ctx.strokeStyle = "rgba(34, 197, 94, 0.9)";
          ctx.lineWidth = 1.4;
        } else {
          ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
          ctx.lineWidth = 1.1;
        }
        ctx.moveTo(centerX - barWidth, y);
        ctx.lineTo(centerX + barWidth, y);
        ctx.stroke();
      }
    } else {
      // Resting / Idle listening state: subtle glowing breathing wave
      const idleWave = Math.sin(idleWavePhase) * 1.2 + 2.2;
      for (let i = 0; i < numBars; i++) {
        const y = 3 + (i * barSpacing);
        const waveOffset = Math.sin(idleWavePhase + (i * 0.4)) * 1.0;
        const bWidth = Math.max(1.2, idleWave + waveOffset);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.moveTo(centerX - bWidth, y);
        ctx.lineTo(centerX + bWidth, y);
        ctx.stroke();
      }
    }
  } else if (state.simulatedVoiceActive) {
    // 2. Simulated Demo Voice Mode: dynamic animated wave in cyan
    idleWavePhase += 0.14;
    const numBars = 12;
    const maxHalfWidth = (width / 2) - 1.5;
    const barSpacing = (height - 6) / (numBars - 1);

    for (let i = 0; i < numBars; i++) {
      const y = 3 + (i * barSpacing);
      const wave = Math.abs(Math.sin(idleWavePhase + (i * 0.5))) * maxHalfWidth * 0.9;
      ctx.beginPath();
      ctx.strokeStyle = "#38bdf8"; // Cyan
      ctx.lineWidth = 1.6;
      ctx.moveTo(centerX - wave, y);
      ctx.lineTo(centerX + wave, y);
      ctx.stroke();
    }
  }

  state.soundtrackAnimId = requestAnimationFrame(drawSoundTrackWaveform);
}

function stopAudioTrack() {
  if (state.soundtrackAnimId) {
    cancelAnimationFrame(state.soundtrackAnimId);
    state.soundtrackAnimId = null;
  }
  if (state.audioStream) {
    state.audioStream.getTracks().forEach(t => t.stop());
    state.audioStream = null;
  }
  if (state.audioContext) {
    state.audioContext.close().catch(() => {});
    state.audioContext = null;
  }
  if (state.simulatedVoiceTimer) {
    clearInterval(state.simulatedVoiceTimer);
    state.simulatedVoiceTimer = null;
  }
  state.simulatedVoiceActive = false;
  state.micActive = false;
  updateSoundtrackUI(false);
}

// ================= MICROPHONE TROUBLESHOOTER MODAL =================
function openMicModal(explanation = "") {
  if (elements.micTroubleshootModal) {
    if (elements.micErrorNotice && explanation) {
      elements.micErrorNotice.innerHTML = `<strong>Microphone Access Issue:</strong> ${explanation}`;
    }
    elements.micTroubleshootModal.classList.add("active");
  }
}

function closeMicModal() {
  if (elements.micTroubleshootModal) {
    elements.micTroubleshootModal.classList.remove("active");
  }
}

// ================= SIMULATED DEMO VOICE MODE =================
function startSimulatedVoiceDemo() {
  closeMicModal();
  stopAudioTrack();
  stopSpeechRecognition();

  state.simulatedVoiceActive = true;
  state.voiceFollowActive = true;
  state.isPlaying = true;
  updateSoundtrackUI(true);

  if (elements.btnVoiceFollow) elements.btnVoiceFollow.classList.add("active");
  if (elements.voiceHud) elements.voiceHud.classList.add("active");
  if (elements.btnPlayPause) elements.btnPlayPause.classList.add("playing");
  if (elements.playIcon) elements.playIcon.classList.add("hidden");
  if (elements.pauseIcon) elements.pauseIcon.classList.remove("hidden");

  if (elements.voiceHudText) {
    elements.voiceHudText.textContent = "🎙️ Demo Mode: Simulating live voice follow...";
  }

  startElapsedTimer();
  startSoundTrackCanvas();

  // Step through script words one by one at natural speaking speed (~130 WPM)
  state.currentWordIndex = 0;
  state.simulatedVoiceTimer = setInterval(() => {
    if (!state.simulatedVoiceActive || !state.voiceFollowActive) {
      clearInterval(state.simulatedVoiceTimer);
      state.simulatedVoiceTimer = null;
      return;
    }

    if (state.currentWordIndex < state.scriptWords.length) {
      const currentItem = state.scriptWords[state.currentWordIndex];
      if (elements.voiceHudText && currentItem) {
        elements.voiceHudText.textContent = `Speaking: "${currentItem.word}"`;
      }
      scrollPrompterToWord(state.currentWordIndex);
      state.currentWordIndex++;
    } else {
      clearInterval(state.simulatedVoiceTimer);
      state.simulatedVoiceTimer = null;
      if (elements.voiceHudText) {
        elements.voiceHudText.textContent = "✅ Demo Finished! Script complete.";
      }
    }
  }, 400); // 400ms per word ≈ 150 words per minute
}

// ================= REAL-TIME VOICE FOLLOW ENGINE =================
// ================= REAL-TIME VOICE FOLLOW ENGINE =================
async function toggleVoiceFollow() {
  state.voiceFollowActive = !state.voiceFollowActive;

  if (elements.btnVoiceFollow) {
    elements.btnVoiceFollow.classList.toggle("active", state.voiceFollowActive);
  }
  if (elements.voiceHud) {
    elements.voiceHud.classList.toggle("active", state.voiceFollowActive);
  }

  if (state.voiceFollowActive) {
    // 1. Activate Live Audio Track Waveform FIRST (captures mic in Brave, Chrome, Edge)
    const micReady = await initAudioTrack();
    if (!micReady) {
      state.voiceFollowActive = false;
      if (elements.btnVoiceFollow) elements.btnVoiceFollow.classList.remove("active");
      if (elements.voiceHud) elements.voiceHud.classList.remove("active");
      return;
    }

    // 2. Start Groq Whisper continuous audio transcription (works in Brave and all browsers)
    startWhisperCapture();

    // 3. Also initialize native Web Speech recognition if supported
    startSpeechRecognition();

    // 4. Start Prompter Playback & Stopwatch
    state.isPlaying = true;
    if (elements.btnPlayPause) elements.btnPlayPause.classList.add("playing");
    if (elements.playIcon) elements.playIcon.classList.add("hidden");
    if (elements.pauseIcon) elements.pauseIcon.classList.remove("hidden");
    startElapsedTimer();

    if (elements.voiceHudText) {
      elements.voiceHudText.textContent = "Listening... Start speaking aloud.";
    }
  } else {
    stopWhisperCapture();
    stopSpeechRecognition();
    stopAudioTrack();
    pausePrompter();
    clearWordHighlights();
  }
}

// ================= CONTINUOUS GROQ WHISPER CAPTURE (UNIVERSAL BROWSER SUPPORT) =================
function startWhisperCapture() {
  if (!state.audioStream || !state.voiceFollowActive) return;

  try {
    state.whisperCaptureActive = true;
    let chunks = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(state.audioStream, { mimeType });
    state.mediaRecorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = async () => {
      if (chunks.length && state.voiceFollowActive) {
        const audioBlob = new Blob(chunks, { type: mimeType });
        chunks = [];
        sendAudioToGroq(audioBlob);
      }

      if (state.voiceFollowActive && state.whisperCaptureActive) {
        setTimeout(() => {
          if (state.voiceFollowActive && state.whisperCaptureActive) {
            startWhisperCapture();
          }
        }, 30);
      }
    };

    recorder.start();

    // Slices of 1.6s for fast, responsive teleprompter updates
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, 1600);
  } catch (err) {
    console.warn("Whisper capture notice:", err);
  }
}

async function sendAudioToGroq(blob) {
  if (blob.size < 1200) return;

  try {
    const res = await fetch("/api/ai/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "audio/webm"
      },
      body: blob
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text && data.text.trim()) {
        matchSpokenWords(data.text.trim());
      }
    }
  } catch (err) {
    // Non-fatal, next slice retries
  }
}

function stopWhisperCapture() {
  state.whisperCaptureActive = false;
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    try { state.mediaRecorder.stop(); } catch (e) {}
  }
  state.mediaRecorder = null;
}

// ================= WEB SPEECH API ENGINE =================
function startSpeechRecognition() {
  if (state.isSpeechRecognizing) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.log("Web Speech API not present; relying on Groq Whisper engine.");
    return;
  }

  if (state.speechRecognition) {
    try { state.speechRecognition.abort(); } catch (e) {}
  }

  try {
    const sr = new SpeechRecognition();
    sr.continuous = true;
    sr.interimResults = true;
    sr.lang = navigator.language || "en-US";
    sr.maxAlternatives = 1;

    sr.onstart = () => {
      state.isSpeechRecognizing = true;
    };

    sr.onresult = (event) => {
      let transcriptChunk = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const piece = event.results[i][0].transcript;
        if (piece) {
          transcriptChunk += " " + piece;
        }
      }
      if (transcriptChunk.trim()) {
        matchSpokenWords(transcriptChunk.trim());
      }
    };

    sr.onerror = (err) => {
      if (err.error === "no-speech") return;
      // In Brave Browser or when Google services are disabled, Web Speech emits audio-capture/not-allowed.
      // Log info and let Groq Whisper handle transcription smoothly without interrupting the user.
      console.log(`Native speech recognition notice (${err.error}); Groq Whisper is active.`);
    };

    sr.onend = () => {
      state.isSpeechRecognizing = false;
      if (state.voiceFollowActive && !state.simulatedVoiceActive) {
        setTimeout(() => {
          if (state.voiceFollowActive && !state.isSpeechRecognizing && !state.simulatedVoiceActive) {
            try { sr.start(); } catch (e) {}
          }
        }, 1000);
      }
    };

    sr.start();
    state.speechRecognition = sr;
  } catch (err) {
    console.log("Speech recognition start notice; Groq Whisper active.", err);
  }
}

function stopSpeechRecognition() {
  state.isSpeechRecognizing = false;
  if (state.speechRecognition) {
    try { state.speechRecognition.abort(); } catch (e) {}
    state.speechRecognition = null;
  }
}

/**
 * Robust sentence and word matcher that glides the teleprompter directly to the spoken line
 */
function matchSpokenWords(rawTranscript) {
  if (!state.scriptWords.length) return;

  const spokenTokens = rawTranscript
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (!spokenTokens.length) return;

  if (elements.voiceHudText) {
    elements.voiceHudText.textContent = `Hearing: "${rawTranscript.slice(-36)}"`;
  }

  // Look ahead up to 65 words from current position, and back 3 words
  const scanStart = Math.max(0, state.currentWordIndex - 3);
  const scanEnd = Math.min(state.scriptWords.length, state.currentWordIndex + 65);

  let bestMatchIdx = -1;

  // Search forward through script from current word position
  for (let s = spokenTokens.length - 1; s >= 0; s--) {
    const sWord = spokenTokens[s];
    if (sWord.length < 2) continue;

    for (let i = state.currentWordIndex; i < scanEnd; i++) {
      const scriptItem = state.scriptWords[i];
      if (!scriptItem) continue;

      if (
        scriptItem.norm === sWord ||
        (sWord.length >= 3 && scriptItem.norm.startsWith(sWord)) ||
        (scriptItem.norm.length >= 3 && sWord.startsWith(scriptItem.norm)) ||
        (sWord.length >= 4 && scriptItem.norm.includes(sWord))
      ) {
        bestMatchIdx = i;
        break;
      }
    }
    if (bestMatchIdx !== -1) break;
  }

  // Fallback: if no match found ahead, check near scanStart in case speaker repeated words
  if (bestMatchIdx === -1) {
    for (let s = spokenTokens.length - 1; s >= 0; s--) {
      const sWord = spokenTokens[s];
      if (sWord.length < 3) continue;
      for (let i = scanStart; i < state.currentWordIndex; i++) {
        const scriptItem = state.scriptWords[i];
        if (scriptItem && scriptItem.norm === sWord) {
          bestMatchIdx = i;
          break;
        }
      }
      if (bestMatchIdx !== -1) break;
    }
  }

  if (bestMatchIdx !== -1) {
    state.currentWordIndex = bestMatchIdx;
    scrollPrompterToWord(bestMatchIdx);
  }
}

function scrollPrompterToWord(wordIdx) {
  const wordEl = document.getElementById(`pw-${wordIdx}`);
  if (!wordEl || !elements.prompterViewport) return;

  highlightWord(wordIdx);

  // Exact vertical alignment with reading guide beam:
  const currentScroll = elements.prompterViewport.scrollTop;
  const wordViewportOffset = wordEl.getBoundingClientRect().top - elements.prompterViewport.getBoundingClientRect().top;
  const guideOffset = elements.prompterViewport.clientHeight * (state.guidePosPct / 100);
  const targetScroll = currentScroll + (wordViewportOffset - guideOffset);

  elements.prompterViewport.scrollTo({
    top: Math.max(0, targetScroll),
    behavior: "smooth"
  });

  updateProgressBar();

  if (wordIdx >= state.scriptWords.length - 2) {
    if (elements.voiceHudText) {
      elements.voiceHudText.textContent = "Script complete! Flawless delivery.";
    }
  }
}

function highlightWord(currentIdx) {
  for (let i = 0; i <= currentIdx; i++) {
    const el = document.getElementById(`pw-${i}`);
    if (el) {
      if (i === currentIdx) {
        el.classList.add("word-active");
        el.classList.remove("word-past");
      } else {
        el.classList.remove("word-active");
        el.classList.add("word-past");
      }
    }
  }
}

function clearWordHighlights() {
  document.querySelectorAll(".prompt-word").forEach(el => {
    el.classList.remove("word-active", "word-past", "word-spoken");
  });
}

// ================= WEBCAM EYE-CONTACT & BACKGROUND RECORDING =================
function setWebcamMode(mode) {
  state.webcamMode = mode;
  if (!elements.webcamContainer) return;

  if (mode === "background") {
    // Relocate video element to the background backdrop (behind text at z-index 1)
    if (elements.webcamBackdrop && elements.webcamVideo) {
      elements.webcamBackdrop.appendChild(elements.webcamVideo);
      elements.webcamBackdrop.classList.add("active");
    }
    elements.webcamContainer.classList.add("bg-mode");
    document.body.classList.add("webcam-bg-active");
    elements.webcamContainer.style.left = "";
    elements.webcamContainer.style.top = "";
    elements.webcamContainer.style.right = "";
    if (elements.webcamModeIcon) elements.webcamModeIcon.textContent = "🔲";
    if (elements.webcamModeText) elements.webcamModeText.textContent = "PiP";
    if (elements.btnWebcamMode) elements.btnWebcamMode.title = "Switch to Floating Window";
  } else {
    // Relocate video element back to the PiP window wrap
    if (elements.webcamVideoWrap && elements.webcamVideo) {
      elements.webcamVideoWrap.appendChild(elements.webcamVideo);
    }
    if (elements.webcamBackdrop) {
      elements.webcamBackdrop.classList.remove("active");
    }
    elements.webcamContainer.classList.remove("bg-mode");
    document.body.classList.remove("webcam-bg-active");
    if (elements.webcamModeIcon) elements.webcamModeIcon.textContent = "⛶";
    if (elements.webcamModeText) elements.webcamModeText.textContent = "Full BG";
    if (elements.btnWebcamMode) elements.btnWebcamMode.title = "Switch to Background Camera";
  }
}

function toggleWebcamMode() {
  const newMode = state.webcamMode === "background" ? "pip" : "background";
  setWebcamMode(newMode);
}

// ================= SCRIPT TEXT COLOR =================
function setScriptTextColor(color) {
  if (!color) return;
  state.textColor = color;
  document.documentElement.style.setProperty("--text-prompter", color);
  if (elements.prompterTextDisplay) {
    elements.prompterTextDisplay.style.color = color;
  }
  if (elements.textColorDot) {
    elements.textColorDot.style.backgroundColor = color;
  }
  document.querySelectorAll(".swatch-btn").forEach(btn => {
    btn.classList.toggle("active", (btn.dataset.color || "").toLowerCase() === color.toLowerCase());
  });
  if (elements.inputCustomColor) elements.inputCustomColor.value = color;
  if (elements.inputCustomColorMobile) elements.inputCustomColorMobile.value = color;
  localStorage.setItem("promptflow_text_color", color);
}

function toggleColorDropdown(e) {
  if (e) e.stopPropagation();
  if (elements.colorDropdownMenu) {
    elements.colorDropdownMenu.classList.toggle("hidden");
  }
}

function closeColorDropdown() {
  if (elements.colorDropdownMenu) {
    elements.colorDropdownMenu.classList.add("hidden");
  }
}

async function toggleWebcam() {
  if (state.webcamActive) {
    closeWebcam();
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true
      });
      state.webcamStream = stream;
      elements.webcamVideo.srcObject = stream;
      state.webcamActive = true;
      elements.webcamContainer.classList.add("active");
      elements.btnWebcam.classList.add("active");

      // Default to background mode on mobile view
      if (window.innerWidth <= 768) {
        setWebcamMode("background");
      } else {
        setWebcamMode(state.webcamMode);
      }
    } catch (err) {
      // Retry without audio if audio fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false
        });
        state.webcamStream = stream;
        elements.webcamVideo.srcObject = stream;
        state.webcamActive = true;
        elements.webcamContainer.classList.add("active");
        elements.btnWebcam.classList.add("active");

        if (window.innerWidth <= 768) {
          setWebcamMode("background");
        } else {
          setWebcamMode(state.webcamMode);
        }
      } catch (err2) {
        alert("Unable to access camera. Please allow webcam permissions in your browser.");
        console.error(err2);
      }
    }
  }
}

function closeWebcam() {
  if (state.videoRecordingActive) stopVideoRecording();
  if (state.webcamStream) {
    state.webcamStream.getTracks().forEach(track => track.stop());
    state.webcamStream = null;
  }
  if (elements.webcamVideo) elements.webcamVideo.srcObject = null;
  state.webcamActive = false;
  if (elements.webcamContainer) {
    elements.webcamContainer.classList.remove("active");
    elements.webcamContainer.classList.remove("bg-mode");
  }
  if (elements.webcamBackdrop) {
    elements.webcamBackdrop.classList.remove("active");
  }
  if (elements.webcamVideoWrap && elements.webcamVideo) {
    elements.webcamVideoWrap.appendChild(elements.webcamVideo);
  }
  document.body.classList.remove("webcam-bg-active");
  if (elements.btnWebcam) elements.btnWebcam.classList.remove("active");
}

function flipWebcam() {
  state.webcamMirrored = !state.webcamMirrored;
  if (elements.webcamVideo) {
    elements.webcamVideo.classList.toggle("flipped", !state.webcamMirrored);
  }
}

// ================= VIDEO RECORDING =================
function toggleVideoRecording() {
  if (state.videoRecordingActive) {
    stopVideoRecording();
  } else {
    startVideoRecording();
  }
}

function startVideoRecording() {
  if (!state.webcamStream || !state.webcamActive) return;

  try {
    state.videoChunks = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

    const recorder = new MediaRecorder(state.webcamStream, { mimeType });
    state.videoRecorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.videoChunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(state.videoChunks, { type: mimeType });
      state.lastVideoBlob = blob;
      state.videoChunks = [];
      if (elements.btnDownloadRec) elements.btnDownloadRec.classList.remove("hidden");
    };

    recorder.start(1000); // Collect data every second
    state.videoRecordingActive = true;

    // Update UI
    if (elements.btnWebcamRecord) {
      elements.btnWebcamRecord.classList.add("recording");
      elements.btnWebcamRecord.title = "Stop Recording";
    }
    if (elements.recIndicator) elements.recIndicator.classList.add("active");

    // Start recording timer
    state.recStartTime = Date.now();
    updateRecTimer();
    state.recTimerInterval = setInterval(updateRecTimer, 500);
  } catch (err) {
    console.error("Failed to start video recording:", err);
    alert("Unable to start recording. Your browser may not support MediaRecorder.");
  }
}

function stopVideoRecording() {
  if (state.videoRecorder && state.videoRecorder.state !== "inactive") {
    try { state.videoRecorder.stop(); } catch (e) {}
  }
  state.videoRecordingActive = false;
  state.videoRecorder = null;

  if (elements.btnWebcamRecord) {
    elements.btnWebcamRecord.classList.remove("recording");
    elements.btnWebcamRecord.title = "Start Recording";
  }
  if (elements.recIndicator) elements.recIndicator.classList.remove("active");

  if (state.recTimerInterval) {
    clearInterval(state.recTimerInterval);
    state.recTimerInterval = null;
  }
}

function updateRecTimer() {
  if (!state.recStartTime || !elements.recTimer) return;
  const elapsed = Math.floor((Date.now() - state.recStartTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  elements.recTimer.textContent = `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function downloadLastRecording() {
  if (!state.lastVideoBlob) return;
  const url = URL.createObjectURL(state.lastVideoBlob);
  const a = document.createElement("a");
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.download = `promptflow_recording_${timestamp}.webm`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ================= MOBILE HAMBURGER DRAWER =================
function toggleMobileDrawer() {
  state.mobileDrawerOpen = !state.mobileDrawerOpen;
  if (elements.btnHamburger) elements.btnHamburger.classList.toggle("active", state.mobileDrawerOpen);
  if (elements.headerActions) elements.headerActions.classList.toggle("drawer-open", state.mobileDrawerOpen);
  if (elements.mobileDrawerBackdrop) elements.mobileDrawerBackdrop.classList.toggle("active", state.mobileDrawerOpen);
}

function closeMobileDrawer() {
  state.mobileDrawerOpen = false;
  if (elements.btnHamburger) elements.btnHamburger.classList.remove("active");
  if (elements.headerActions) elements.headerActions.classList.remove("drawer-open");
  if (elements.mobileDrawerBackdrop) elements.mobileDrawerBackdrop.classList.remove("active");
}

// ================= MOBILE HUD SETTINGS POPUP =================
function toggleHudSettings() {
  state.hudSettingsOpen = !state.hudSettingsOpen;
  if (elements.hudSettingsPopup) elements.hudSettingsPopup.classList.toggle("active", state.hudSettingsOpen);
  if (elements.btnHudSettings) elements.btnHudSettings.classList.toggle("active", state.hudSettingsOpen);
}

function closeHudSettings() {
  state.hudSettingsOpen = false;
  if (elements.hudSettingsPopup) elements.hudSettingsPopup.classList.remove("active");
  if (elements.btnHudSettings) elements.btnHudSettings.classList.remove("active");
}

// Sync mobile slider values with desktop sliders
function syncMobileSliders() {
  if (elements.sliderFontSizeMobile) {
    elements.sliderFontSizeMobile.value = state.fontSizePx;
    if (elements.fontSizeValMobile) elements.fontSizeValMobile.textContent = `${state.fontSizePx}px`;
  }
  if (elements.sliderWidthMobile) {
    elements.sliderWidthMobile.value = state.columnWidthPct;
    if (elements.widthValMobile) elements.widthValMobile.textContent = `${state.columnWidthPct}%`;
  }
  if (elements.sliderGuidePosMobile) {
    elements.sliderGuidePosMobile.value = state.guidePosPct;
    if (elements.guidePosValMobile) elements.guidePosValMobile.textContent = `${state.guidePosPct}%`;
  }
  if (elements.btnToggleGuideMobile) {
    elements.btnToggleGuideMobile.classList.toggle("active", state.showGuide);
  }
  if (elements.themeSelectMobile) {
    elements.themeSelectMobile.value = state.currentTheme;
  }
}

// ================= AI ASSISTANT API CALLS =================
async function requestAIGeneration() {
  const topic = elements.aiTopic.value.trim();
  if (!topic) {
    alert("Please enter a speech topic.");
    elements.aiTopic.focus();
    return;
  }

  const format = elements.aiFormat.value;
  const tone = elements.aiTone.value;
  const targetTime = elements.aiDuration.value;

  elements.btnRunGenerate.disabled = true;
  elements.generateSpinner.classList.remove("hidden");

  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic,
        format: format,
        tone: tone,
        target_time: targetTime
      })
    });

    const data = await response.json();
    if (data.success && data.script) {
      state.script = data.script;
      elements.scriptEditor.value = state.script;
      localStorage.setItem("promptflow_script", state.script);
      updatePrompterDisplay();
      closeAIModal();
      switchTab("prompter");
    } else {
      alert("Notice: " + (data.error || "Could not generate script."));
    }
  } catch (err) {
    console.error("AI Generate Error:", err);
    alert("Error contacting local AI server. Please make sure server.py is running!");
  } finally {
    elements.btnRunGenerate.disabled = false;
    elements.generateSpinner.classList.add("hidden");
  }
}

async function requestAIEnhance() {
  const currentText = state.script.trim() || elements.scriptEditor.value.trim();
  if (!currentText) {
    alert("Please add text in the script editor first to enhance it.");
    return;
  }

  const selectedCard = document.querySelector(".enhance-card.selected");
  const mode = selectedCard ? selectedCard.dataset.mode : "teleprompter_polish";

  elements.btnRunEnhance.disabled = true;
  elements.enhanceSpinner.classList.remove("hidden");

  try {
    const response = await fetch("/api/ai/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: currentText,
        mode: mode
      })
    });

    const data = await response.json();
    if (data.success && data.refined) {
      state.script = data.refined;
      elements.scriptEditor.value = state.script;
      localStorage.setItem("promptflow_script", state.script);
      updatePrompterDisplay();
      closeAIModal();
      switchTab("prompter");
    } else {
      alert("Notice: " + (data.error || "Could not refine script."));
    }
  } catch (err) {
    console.error("AI Enhance Error:", err);
    alert("Error contacting local AI server. Please make sure server.py is running!");
  } finally {
    elements.btnRunEnhance.disabled = false;
    elements.enhanceSpinner.classList.add("hidden");
  }
}

// ================= UI & EVENT LISTENERS =================
function setupEventListeners() {
  // Mode switcher tabs
  elements.tabPrompter.addEventListener("click", () => { switchTab("prompter"); closeMobileDrawer(); });
  elements.tabEditor.addEventListener("click", () => { switchTab("editor"); closeMobileDrawer(); });
  elements.btnLaunchPrompter.addEventListener("click", () => {
    syncEditorToPrompter();
    switchTab("prompter");
  });

  // Playback HUD controls
  elements.btnPlayPause.addEventListener("click", startCountdownAndPlay);
  elements.btnRewind.addEventListener("click", rewindPrompter);
  elements.btnSpeedDown.addEventListener("click", () => adjustSpeed(-5));
  elements.btnSpeedUp.addEventListener("click", () => adjustSpeed(5));

  // ELAPSED timer click & reset
  if (elements.metaElapsedItem) {
    elements.metaElapsedItem.addEventListener("click", (e) => {
      if (e.target === elements.btnResetTimer) return;
      startCountdownAndPlay();
    });
  }
  if (elements.btnResetTimer) {
    elements.btnResetTimer.addEventListener("click", (e) => {
      e.stopPropagation();
      resetElapsedTimer();
    });
  }

  // Right-side Sound Track Panel click (activates live audio waveform)
  if (elements.soundtrackPanel) {
    elements.soundtrackPanel.addEventListener("click", async () => {
      if (state.micActive) {
        stopAudioTrack();
      } else {
        await initAudioTrack();
      }
    });
  }

  // Desktop Sliders
  elements.sliderFontSize.addEventListener("input", (e) => {
    state.fontSizePx = parseInt(e.target.value, 10);
    elements.fontSizeVal.textContent = `${state.fontSizePx}px`;
    elements.prompterTextDisplay.style.fontSize = `${state.fontSizePx}px`;
    localStorage.setItem("promptflow_font_size", state.fontSizePx);
    syncMobileSliders();
  });

  elements.sliderWidth.addEventListener("input", (e) => {
    state.columnWidthPct = parseInt(e.target.value, 10);
    elements.widthVal.textContent = `${state.columnWidthPct}%`;
    elements.prompterContentBox.style.width = `${state.columnWidthPct}%`;
    syncMobileSliders();
  });

  elements.sliderGuidePos.addEventListener("input", (e) => {
    state.guidePosPct = parseInt(e.target.value, 10);
    elements.guidePosVal.textContent = `${state.guidePosPct}%`;
    elements.readingGuide.style.top = `${state.guidePosPct}%`;
    elements.leadPad.style.height = `${state.guidePosPct}vh`;
    syncMobileSliders();
  });

  // Mobile Sliders (synced to desktop)
  if (elements.sliderFontSizeMobile) {
    elements.sliderFontSizeMobile.addEventListener("input", (e) => {
      state.fontSizePx = parseInt(e.target.value, 10);
      if (elements.fontSizeValMobile) elements.fontSizeValMobile.textContent = `${state.fontSizePx}px`;
      elements.fontSizeVal.textContent = `${state.fontSizePx}px`;
      elements.sliderFontSize.value = state.fontSizePx;
      elements.prompterTextDisplay.style.fontSize = `${state.fontSizePx}px`;
      localStorage.setItem("promptflow_font_size", state.fontSizePx);
    });
  }
  if (elements.sliderWidthMobile) {
    elements.sliderWidthMobile.addEventListener("input", (e) => {
      state.columnWidthPct = parseInt(e.target.value, 10);
      if (elements.widthValMobile) elements.widthValMobile.textContent = `${state.columnWidthPct}%`;
      elements.widthVal.textContent = `${state.columnWidthPct}%`;
      elements.sliderWidth.value = state.columnWidthPct;
      elements.prompterContentBox.style.width = `${state.columnWidthPct}%`;
    });
  }
  if (elements.sliderGuidePosMobile) {
    elements.sliderGuidePosMobile.addEventListener("input", (e) => {
      state.guidePosPct = parseInt(e.target.value, 10);
      if (elements.guidePosValMobile) elements.guidePosValMobile.textContent = `${state.guidePosPct}%`;
      elements.guidePosVal.textContent = `${state.guidePosPct}%`;
      elements.sliderGuidePos.value = state.guidePosPct;
      elements.readingGuide.style.top = `${state.guidePosPct}%`;
      elements.leadPad.style.height = `${state.guidePosPct}vh`;
    });
  }

  // Guide Toggle
  elements.btnToggleGuide.addEventListener("click", () => {
    state.showGuide = !state.showGuide;
    applyPrompterGeometry();
    syncMobileSliders();
  });

  if (elements.btnToggleGuideMobile) {
    elements.btnToggleGuideMobile.addEventListener("click", () => {
      state.showGuide = !state.showGuide;
      applyPrompterGeometry();
      elements.btnToggleGuideMobile.classList.toggle("active", state.showGuide);
      elements.btnToggleGuide.classList.toggle("active", state.showGuide);
    });
  }

  // Theme Select (desktop + mobile)
  function applyTheme(val) {
    state.currentTheme = val;
    document.body.className = state.currentTheme;
    if (state.isFullscreen) document.body.classList.add("fullscreen-mode");
    localStorage.setItem("promptflow_theme", state.currentTheme);
    if (elements.themeSelect) elements.themeSelect.value = val;
    if (elements.themeSelectMobile) elements.themeSelectMobile.value = val;
  }
  elements.themeSelect.addEventListener("change", (e) => applyTheme(e.target.value));
  if (elements.themeSelectMobile) {
    elements.themeSelectMobile.addEventListener("change", (e) => applyTheme(e.target.value));
  }

  // Fullscreen (desktop + mobile)
  elements.btnFullscreen.addEventListener("click", toggleFullscreen);
  if (elements.btnFullscreenMobile) {
    elements.btnFullscreenMobile.addEventListener("click", () => { toggleFullscreen(); closeHudSettings(); });
  }

  // Voice Follow & Webcam
  elements.btnVoiceFollow.addEventListener("click", () => { toggleVoiceFollow(); closeMobileDrawer(); });
  elements.btnWebcam.addEventListener("click", () => { toggleWebcam(); closeMobileDrawer(); });
  if (elements.btnWebcamMode) {
    elements.btnWebcamMode.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWebcamMode();
    });
  }
  elements.btnWebcamFlip.addEventListener("click", flipWebcam);
  elements.btnWebcamClose.addEventListener("click", closeWebcam);
  elements.webcamOpacity.addEventListener("input", (e) => {
    const val = e.target.value / 100;
    document.documentElement.style.setProperty("--webcam-opacity", val);
    if (elements.webcamVideo) elements.webcamVideo.style.opacity = val;
  });

  // Script Text Color Listeners
  if (elements.btnTextColorMenu) {
    elements.btnTextColorMenu.addEventListener("click", toggleColorDropdown);
  }
  document.addEventListener("click", (e) => {
    if (elements.textColorControlWrap && !elements.textColorControlWrap.contains(e.target)) {
      closeColorDropdown();
    }
  });
  document.addEventListener("click", (e) => {
    const swatch = e.target.closest(".swatch-btn");
    if (swatch && swatch.dataset.color) {
      setScriptTextColor(swatch.dataset.color);
      closeColorDropdown();
    }
  });
  if (elements.inputCustomColor) {
    elements.inputCustomColor.addEventListener("input", (e) => setScriptTextColor(e.target.value));
  }
  if (elements.inputCustomColorMobile) {
    elements.inputCustomColorMobile.addEventListener("input", (e) => setScriptTextColor(e.target.value));
  }

  // Handle responsive resize for camera
  window.addEventListener("resize", () => {
    if (state.webcamActive && window.innerWidth <= 768 && state.webcamMode !== "background") {
      setWebcamMode("background");
    }
  });

  // Webcam Recording
  if (elements.btnWebcamRecord) {
    elements.btnWebcamRecord.addEventListener("click", toggleVideoRecording);
  }
  if (elements.btnDownloadRec) {
    elements.btnDownloadRec.addEventListener("click", downloadLastRecording);
  }

  // Clickable Progress Track
  elements.progressTrack.addEventListener("click", (e) => {
    const rect = elements.progressTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const vp = elements.prompterViewport;
    const maxScroll = vp.scrollHeight - vp.clientHeight;
    vp.scrollTop = ratio * maxScroll;
    updateProgressBar();
  });

  // Editor Actions
  elements.scriptEditor.addEventListener("input", () => {
    state.script = elements.scriptEditor.value;
    localStorage.setItem("promptflow_script", state.script);
    updatePrompterDisplay();
  });

  elements.sampleScriptSelect.addEventListener("change", (e) => {
    const key = e.target.value;
    if (SAMPLE_SCRIPTS[key]) {
      state.script = SAMPLE_SCRIPTS[key];
      elements.scriptEditor.value = state.script;
      localStorage.setItem("promptflow_script", state.script);
      updatePrompterDisplay();
      e.target.value = "";
    }
  });

  elements.btnUploadScript.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", handleFileUpload);
  elements.btnExportScript.addEventListener("click", exportScriptToFile);
  elements.btnClearScript.addEventListener("click", () => {
    if (confirm("Clear script editor?")) {
      state.script = "";
      elements.scriptEditor.value = "";
      localStorage.setItem("promptflow_script", "");
      updatePrompterDisplay();
    }
  });

  // Manual scroll detection: pauses auto-scroll when user scrolls with wheel
  elements.prompterViewport.addEventListener("wheel", () => {
    if (state.isPlaying && !state.voiceFollowActive) {
      pausePrompter();
    }
    updateProgressBar();
  }, { passive: true });

  // Touch scroll detection for mobile
  elements.prompterViewport.addEventListener("touchmove", () => {
    if (state.isPlaying && !state.voiceFollowActive) {
      pausePrompter();
    }
    updateProgressBar();
  }, { passive: true });

  // AI Modal
  elements.btnOpenAI.addEventListener("click", () => { openAIModal(); closeMobileDrawer(); });
  elements.btnCloseAIModal.addEventListener("click", closeAIModal);
  elements.aiModal.addEventListener("click", (e) => {
    if (e.target === elements.aiModal) closeAIModal();
  });

  elements.tabAIGenerate.addEventListener("click", () => {
    elements.tabAIGenerate.classList.add("active");
    elements.tabAIEnhance.classList.remove("active");
    elements.paneAIGenerate.classList.add("active");
    elements.paneAIEnhance.classList.remove("active");
  });

  elements.tabAIEnhance.addEventListener("click", () => {
    elements.tabAIEnhance.classList.add("active");
    elements.tabAIGenerate.classList.remove("active");
    elements.paneAIEnhance.classList.add("active");
    elements.paneAIGenerate.classList.remove("active");
  });

  document.querySelectorAll(".enhance-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".enhance-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  elements.btnRunGenerate.addEventListener("click", requestAIGeneration);
  elements.btnRunEnhance.addEventListener("click", requestAIEnhance);

  // Help Modal
  elements.btnHelp.addEventListener("click", () => { openHelpModal(); closeMobileDrawer(); });
  elements.btnCloseHelpModal.addEventListener("click", closeHelpModal);
  elements.helpModal.addEventListener("click", (e) => {
    if (e.target === elements.helpModal) closeHelpModal();
  });

  // Mic Troubleshooter Modal
  if (elements.btnCloseMicModal) {
    elements.btnCloseMicModal.addEventListener("click", closeMicModal);
  }
  if (elements.micTroubleshootModal) {
    elements.micTroubleshootModal.addEventListener("click", (e) => {
      if (e.target === elements.micTroubleshootModal) closeMicModal();
    });
  }
  if (elements.btnRetryMicPermission) {
    elements.btnRetryMicPermission.addEventListener("click", async () => {
      closeMicModal();
      if (state.voiceFollowActive) {
        toggleVoiceFollow(); // turn off
      }
      setTimeout(() => {
        toggleVoiceFollow(); // turn back on and re-test
      }, 300);
    });
  }
  if (elements.btnTestSimulatedVoice) {
    elements.btnTestSimulatedVoice.addEventListener("click", () => {
      startSimulatedVoiceDemo();
    });
  }

  // Mobile Hamburger Menu
  if (elements.btnHamburger) {
    elements.btnHamburger.addEventListener("click", toggleMobileDrawer);
  }
  if (elements.mobileDrawerBackdrop) {
    elements.mobileDrawerBackdrop.addEventListener("click", closeMobileDrawer);
  }

  // Mobile HUD Settings Popup
  if (elements.btnHudSettings) {
    elements.btnHudSettings.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleHudSettings();
      syncMobileSliders();
    });
  }
  // Close popup when clicking outside
  document.addEventListener("click", (e) => {
    if (state.hudSettingsOpen && elements.hudSettingsPopup && elements.btnHudSettings) {
      if (!elements.hudSettingsPopup.contains(e.target) && !elements.btnHudSettings.contains(e.target)) {
        closeHudSettings();
      }
    }
  });

  // Keyboard Shortcuts
  window.addEventListener("keydown", handleGlobalKeyDown);

  // Fullscreen HUD auto-hide
  window.addEventListener("mousemove", handleMouseMoveFullscreen);
}

function switchTab(tab) {
  state.activeTab = tab;
  if (tab === "prompter") {
    elements.tabPrompter.classList.add("active");
    elements.tabEditor.classList.remove("active");
    elements.prompterStage.style.display = "flex";
    elements.editorStage.classList.remove("active");
    elements.prompterHud.style.display = "flex";
  } else {
    elements.tabPrompter.classList.remove("active");
    elements.tabEditor.classList.add("active");
    elements.prompterStage.style.display = "none";
    elements.editorStage.classList.add("active");
    elements.prompterHud.style.display = "none";
    pausePrompter();
  }
}

function syncEditorToPrompter() {
  state.script = elements.scriptEditor.value;
  localStorage.setItem("promptflow_script", state.script);
  updatePrompterDisplay();
}

function handleGlobalKeyDown(e) {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
    if (e.key === "Escape") e.target.blur();
    return;
  }

  switch (e.key) {
    case " ":
      e.preventDefault();
      startCountdownAndPlay();
      break;
    case "ArrowUp":
      e.preventDefault();
      adjustSpeed(5);
      break;
    case "ArrowDown":
      e.preventDefault();
      adjustSpeed(-5);
      break;
    case "r":
    case "R":
      rewindPrompter();
      break;
    case "[":
      state.fontSizePx = Math.max(24, state.fontSizePx - 4);
      elements.sliderFontSize.value = state.fontSizePx;
      elements.fontSizeVal.textContent = `${state.fontSizePx}px`;
      elements.prompterTextDisplay.style.fontSize = `${state.fontSizePx}px`;
      break;
    case "]":
      state.fontSizePx = Math.min(96, state.fontSizePx + 4);
      elements.sliderFontSize.value = state.fontSizePx;
      elements.fontSizeVal.textContent = `${state.fontSizePx}px`;
      elements.prompterTextDisplay.style.fontSize = `${state.fontSizePx}px`;
      break;
    case "f":
    case "F":
      toggleFullscreen();
      break;
    case "v":
    case "V":
      toggleVoiceFollow();
      break;
    case "c":
    case "C":
      toggleWebcam();
      break;
    case "?":
      openHelpModal();
      break;
    case "Escape":
      closeAIModal();
      closeHelpModal();
      closeMicModal();
      if (document.fullscreenElement) document.exitFullscreen();
      break;
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.log(err));
    document.body.classList.add("fullscreen-mode");
    state.isFullscreen = true;
  } else {
    document.exitFullscreen();
    document.body.classList.remove("fullscreen-mode");
    document.body.classList.remove("hud-hidden");
    state.isFullscreen = false;
  }
}

document.addEventListener("fullscreenchange", () => {
  state.isFullscreen = !!document.fullscreenElement;
  document.body.classList.toggle("fullscreen-mode", state.isFullscreen);
  if (!state.isFullscreen) {
    document.body.classList.remove("hud-hidden");
  }
});

function handleMouseMoveFullscreen() {
  if (!state.isFullscreen) return;
  document.body.classList.remove("hud-hidden");
  clearTimeout(state.hudTimeout);
  state.hudTimeout = setTimeout(() => {
    if (state.isPlaying && state.isFullscreen) {
      document.body.classList.add("hud-hidden");
    }
  }, 2500);
}

function openAIModal() {
  elements.aiModal.classList.add("active");
}

function closeAIModal() {
  elements.aiModal.classList.remove("active");
}

function openHelpModal() {
  elements.helpModal.classList.add("active");
}

function closeHelpModal() {
  elements.helpModal.classList.remove("active");
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    state.script = event.target.result;
    elements.scriptEditor.value = state.script;
    localStorage.setItem("promptflow_script", state.script);
    updatePrompterDisplay();
  };
  reader.readAsText(file);
}

function exportScriptToFile() {
  const blob = new Blob([state.script], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "promptflow_script.txt";
  a.click();
}

function setupDragAndDrop() {
  const header = elements.webcamHeader;
  const container = elements.webcamContainer;
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  if (!header || !container) return;

  // Mouse drag (desktop)
  header.addEventListener("mousedown", (e) => {
    if (state.webcamMode === "background") return;
    if (e.target.closest("button") || e.target.closest("input")) return;
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    header.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging || state.webcamMode === "background") return;
    container.style.left = `${Math.max(10, e.clientX - offsetX)}px`;
    container.style.top = `${Math.max(10, e.clientY - offsetY)}px`;
    container.style.right = "auto";
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
    header.style.cursor = "grab";
  });

  // Touch drag (mobile)
  header.addEventListener("touchstart", (e) => {
    if (state.webcamMode === "background") return;
    if (e.target.closest("button") || e.target.closest("input")) return;
    const touch = e.touches[0];
    isDragging = true;
    offsetX = touch.clientX - container.offsetLeft;
    offsetY = touch.clientY - container.offsetTop;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!isDragging || state.webcamMode === "background") return;
    const touch = e.touches[0];
    container.style.left = `${Math.max(4, touch.clientX - offsetX)}px`;
    container.style.top = `${Math.max(4, touch.clientY - offsetY)}px`;
    container.style.right = "auto";
  }, { passive: true });

  window.addEventListener("touchend", () => {
    isDragging = false;
  });
}

// Auto-run on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
