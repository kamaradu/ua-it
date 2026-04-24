const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYxU7tQ9zljOOosiBseSOOUUmNHINufeWHdczDkEZMXzqPHyO81aXhrvQojO42j8AW5teS_nROvrKe/pub?gid=0&single=true&output=csv";

let words = [];
let index = 0;
let playing = false;
let timeout = null;
let currentAudio = null;
let stopFlag = false;

// =====================
// DEBUG SYSTEM
// =====================

class DebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 50;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    this.logs.push({ message: logMessage, type });
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    this.render();
    console.log(`[${type.toUpperCase()}]`, logMessage);
  }

  info(message) {
    this.log(message, 'info');
  }

  success(message) {
    this.log(message, 'success');
  }

  error(message) {
    this.log(message, 'error');
  }

  render() {
    const debugLog = document.getElementById('debugLog');
    if (!debugLog) return;

    debugLog.innerHTML = this.logs
      .map(log => `<div class="debug-log-item ${log.type}">${log.message}</div>`)
      .join('');
    
    debugLog.scrollTop = debugLog.scrollHeight;
  }

  clear() {
    this.logs = [];
    this.render();
  }
}

const debug = new DebugLogger();

// =====================
// DEVICE DETECTION
// =====================

function detectDevice() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  return { isMobile, isIOS, isAndroid };
}

// =====================
// AUDIO ENGINE
// =====================

function playAudio(src) {
  return new Promise((resolve) => {
    if (stopFlag) {
      debug.info(`⏸ Stopped, skipping: ${src}`);
      return resolve();
    }

    if (currentAudio) {
      debug.info(`🔇 Pausing previous audio`);
      currentAudio.pause();
      currentAudio = null;
    }

    debug.info(`📂 Loading: ${src}`);

    const audio = new Audio(src);
    currentAudio = audio;

    // Set audio attributes for better mobile support
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    audio.onended = () => {
      debug.success(`✅ Ended: ${src}`);
      resolve();
    };
    
    audio.onerror = (error) => {
      debug.error(`❌ Error loading ${src}: ${error.type || 'Unknown error'}`);
      resolve();
    };

    audio.onloadstart = () => {
      debug.info(`🔄 Loading started: ${src}`);
    };

    audio.oncanplay = () => {
      debug.success(`▶️ Ready to play: ${src}`);
    };

    // Play with error handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          debug.success(`🎵 Playing: ${src}`);
        })
        .catch(error => {
          debug.error(`❌ Play failed ${src}: ${error.message}`);
          resolve();
        });
    }
  });
}

function delay(ms) {
  return new Promise(resolve => {
    debug.info(`⏳ Waiting ${ms}ms...`);
    setTimeout(() => {
      debug.info(`✅ Wait finished (${ms}ms)`);
      resolve();
    }, ms);
  });
}

// =====================
// LOAD WORDS
// =====================

function loadWords() {
  debug.info(`📡 Fetching words from Google Sheets...`);
  
  return fetch(url)
    .then(res => {
      debug.success(`📊 Got response from server`);
      return res.text();
    })
    .then(text => {
      debug.info(`📝 Processing CSV data...`);
      
      const parsed = text
        .split("\n")
        .slice(1)
        .map(r => r.split(","))
        .filter(r => r.length >= 3)
        .map(r => ({
          id: r[0].trim(),
          ua: r[1].replace(/"/g, "").trim(),
          it: r[2].replace(/"/g, "").trim()
        }));
      
      debug.success(`✅ Parsed ${parsed.length} words`);
      return parsed;
    })
    .catch(error => {
      debug.error(`❌ Failed to load words: ${error.message}`);
      return [];
    });
}

// =====================
// UPDATE WORDS COUNT
// =====================

function updateWordsCount() {
  const wordsCountElement = document.getElementById("wordsCount");
  if (wordsCountElement) {
    wordsCountElement.textContent = words.length;
    debug.success(`📊 Word count updated: ${words.length}`);
  }
}

// =====================
// ROTATING PHRASES
// =====================

const phrases = [
  "Готуйся до нового вікторини",
  "Вчися італійської мови",
  "Розширюй свої знання",
  "Практикуйся щодня"
];

let currentPhraseIndex = 0;
let phraseInterval = null;

function hoursToMilliseconds(hours) {
  return hours * 60 * 60 * 1000;
}

function rotatePhrase() {
  const phraseElement = document.getElementById("rotatingPhrase");
  if (!phraseElement) return;

  currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
  phraseElement.textContent = phrases[currentPhraseIndex];
  debug.info(`🔄 Phrase rotated: "${phrases[currentPhraseIndex]}"`);
}

function startPhraseRotation(hours = 1) {
  const milliseconds = hoursToMilliseconds(hours);
  phraseInterval = setInterval(rotatePhrase, milliseconds);
  debug.success(`▶️ Phrase rotation started (${hours} hour${hours !== 1 ? 's' : ''})`);
}

function stopPhraseRotation() {
  if (phraseInterval) {
    clearInterval(phraseInterval);
    phraseInterval = null;
    debug.info(`⏹ Phrase rotation stopped`);
  }
}

// =====================
// RENDER UI
// =====================

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  updateWordsCount();

  words.forEach((w, i) => {
    const listItem = document.createElement("div");
    listItem.className = "list-item" + (i === index ? " active" : "");

    const content = document.createElement("div");
    content.className = "list-item-content";
    content.innerHTML = `
      <div class="list-item-primary">${w.ua}</div>
      <div>
        <span class="list-item-separator">/</span>
        <span class="list-item-secondary">${w.it}</span>
      </div>
    `;

    const playBtn = document.createElement("button");
    playBtn.className = "list-item-action";
    playBtn.type = "button";
    playBtn.title = "Play";
    playBtn.onclick = (e) => {
      e.stopPropagation();
      debug.info(`🎯 Play button clicked for word: ${w.ua}`);
      playOne(i);
    };
    playBtn.innerHTML = '<i class="fas fa-play"></i>';

    listItem.appendChild(content);
    listItem.appendChild(playBtn);

    listItem.onclick = () => {
      debug.info(`🎯 List item clicked for word: ${w.ua}`);
      playOne(i);
    };

    list.appendChild(listItem);
  });

  const current = words[index];
  const displayEl = document.getElementById("currentWord");
  displayEl.innerHTML =
    current
      ? `<span class="uk">${current.ua}</span><span class="separator">/</span><span class="it">${current.it}</span>`
      : "";
}

// =====================
// SPEAK (UA → IT)
// =====================

async function speak(id) {
  if (stopFlag) {
    debug.info(`⏸ Speak cancelled (stopFlag is true)`);
    return;
  }

  const uaFile = `audio/${id}_ua.mp3`;
  const itFile = `audio/${id}_it.mp3`;
  
  debug.info(`🎙️ === SPEAK START (ID: ${id}) ===`);
  debug.info(`📂 UA File: ${uaFile}`);
  
  await playAudio(uaFile);
  
  debug.info(`⏳ 3 second delay starting...`);
  await delay(3000);
  
  debug.info(`📂 IT File: ${itFile}`);
  await playAudio(itFile);
  
  debug.info(`🎙️ === SPEAK END ===`);
}

// =====================
// SEQUENCE ENGINE
// =====================

async function playSequence(i) {
  clearTimeout(timeout);
  stopFlag = false;

  index = i;
  debug.info(`▶️ Playing sequence for index: ${i}`);
  
  render();

  const w = words[i];
  if (!w || stopFlag) {
    debug.error(`❌ Invalid word or stopped`);
    return;
  }

  await speak(w.id);

  if (playing && !stopFlag) {
    debug.info(`⏭ Moving to next word...`);
    timeout = setTimeout(() => {
      next();
    }, 300);
  }
}

// =====================
// CONTROLS
// =====================

function play() {
  debug.info(`▶️ PLAY button clicked`);
  stopFlag = false;
  playing = true;
  clearTimeout(timeout);
  playSequence(index);
}

function pause() {
  debug.info(`⏸ PAUSE button clicked`);
  playing = false;
  stopFlag = true;
  clearTimeout(timeout);

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

function next() {
  index = (index + 1) % words.length;
  debug.info(`⏭ NEXT: Moving to index ${index}`);
  playSequence(index);
}

function prev() {
  index = (index - 1 + words.length) % words.length;
  debug.info(`⏮ PREV: Moving to index ${index}`);
  playSequence(index);
}

function randomPlay() {
  stopFlag = false;
  playing = true;
  clearTimeout(timeout);

  index = Math.floor(Math.random() * words.length);
  debug.info(`🎲 RANDOM: Playing index ${index}`);
  playSequence(index);
}

function playOne(i) {
  stopFlag = false;
  playing = false;
  clearTimeout(timeout);
  debug.info(`🎵 PLAY ONE: Index ${i}`);
  playSequence(i);
}

// =====================
// INIT
// =====================

async function init() {
  const device = detectDevice();
  debug.info(`📱 Device Type - Mobile: ${device.isMobile}, iOS: ${device.isIOS}, Android: ${device.isAndroid}`);
  debug.info(`🌐 User Agent: ${navigator.userAgent}`);
  debug.info(`📡 Loading words...`);
  
  words = await loadWords();
  debug.success(`✅ Loaded ${words.length} words`);
  
  updateWordsCount();
  startPhraseRotation(1);
  
  debug.success(`🚀 App initialized successfully`);
  debug.info(`Ready to play! Click a word or use controls.`);
  
  render();
}

init();

document.addEventListener("DOMContentLoaded", () => {
  debug.info(`📄 DOM Content Loaded`);
  
  document.getElementById("btnPlay")?.addEventListener("click", play);
  document.getElementById("btnPause")?.addEventListener("click", pause);
  document.getElementById("btnNext")?.addEventListener("click", next);
  document.getElementById("btnPrev")?.addEventListener("click", prev);
  document.getElementById("btnRandom")?.addEventListener("click", randomPlay);
  
  // Debug panel controls
  const debugPanel = document.getElementById("debugPanel");
  const toggleBtn = document.getElementById("toggleDebugBtn");
  const closeBtn = document.getElementById("closeDebugBtn");
  const clearBtn = document.getElementById("clearDebugBtn");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (debugPanel) {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'flex' : 'none';
        debug.info(`🔧 Debug panel toggled`);
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (debugPanel) {
        debugPanel.style.display = 'none';
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      debug.clear();
    });
  }
  
  debug.success(`✅ All event listeners attached`);
});
