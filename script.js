const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYxU7tQ9zljOOosiBseSOOUUmNHINufeWHdczDkEZMXzqPHyO81aXhrvQojO42j8AW5teS_nROvrKe/pub?gid=0&single=true&output=csv";

let words = [];
let index = 0;
let playing = false;
let timeout = null;

// =====================
// GLOBAL CONTROL
// =====================

let currentAudio = null;
let stopFlag = false;

// =====================
// AUDIO ENGINE (SAFE)
// =====================

function playAudio(src) {
  return new Promise((resolve) => {
    if (stopFlag) return resolve();

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new Audio(src);
    currentAudio = audio;

    audio.onended = () => resolve();
    audio.onerror = () => resolve();

    audio.play();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================
// LOAD WORDS
// =====================

function loadWords() {
  return fetch(url)
    .then(res => res.text())
    .then(text => {
      return text
        .split("\n")
        .slice(1)
        .map(r => r.split(","))
        .filter(r => r.length >= 3)
        .map(r => ({
          id: r[0].trim(),
          ua: r[1].replace(/"/g, "").trim(),
          it: r[2].replace(/"/g, "").trim()
        }));
    });
}

// =====================
// RENDER UI
// =====================

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  words.forEach((w, i) => {
    const row = document.createElement("div");
    row.className = "row" + (i === index ? " active" : "");

    // Create row content with Font Awesome icon
    const rowContent = document.createElement("div");
    rowContent.className = "row-content";
    rowContent.innerHTML = `
      <div class="row-primary">${w.ua}</div>
      <div>
        <span class="row-separator">/</span>
        <span class="row-secondary">${w.it}</span>
      </div>
    `;

    // Create play button with Font Awesome icon
    const playBtn = document.createElement("button");
    playBtn.className = "row-action btn-icon-small";
    playBtn.type = "button";
    playBtn.title = "Play";
    playBtn.onclick = (e) => {
      e.stopPropagation();
      playOne(i);
    };
    playBtn.innerHTML = '<i class="fas fa-play"></i>';

    row.appendChild(rowContent);
    row.appendChild(playBtn);

    list.appendChild(row);
  });

  const current = words[index];
  document.getElementById("currentWord").innerHTML =
    current
      ? `<span class="uk">${current.ua}</span><span class="separator">/</span><span class="it">${current.it}</span>`
      : "";
}

// =====================
// SPEAK (UA → IT)
// =====================

async function speak(id) {
  if (stopFlag) return;

  await playAudio(`audio/${id}_ua.mp3`);
  await delay(200);
  await playAudio(`audio/${id}_it.mp3`);
}

// =====================
// SEQUENCE ENGINE (NO OVERLAP)
// =====================

async function playSequence(i) {
  clearTimeout(timeout);
  stopFlag = false;

  index = i;
  render();

  const w = words[i];
  if (!w || stopFlag) return;

  await speak(w.id);

  if (playing && !stopFlag) {
    timeout = setTimeout(() => {
      next();
    }, 300);
  }
}

// =====================
// CONTROLS
// =====================

function play() {
  stopFlag = false;
  playing = true;
  clearTimeout(timeout);

  playSequence(index);
}

function pause() {
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
  playSequence(index);
}

function prev() {
  index = (index - 1 + words.length) % words.length;
  playSequence(index);
}

function randomPlay() {
  stopFlag = false;
  playing = true;

  clearTimeout(timeout);

  index = Math.floor(Math.random() * words.length);

  playSequence(index);
}

function playOne(i) {
  stopFlag = false;
  playing = false;

  clearTimeout(timeout);

  playSequence(i);
}

// =====================
// INIT
// =====================

async function init() {
  words = await loadWords();
  render();
}

init();

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnPlay")?.addEventListener("click", play);
  document.getElementById("btnPause")?.addEventListener("click", pause);
  document.getElementById("btnNext")?.addEventListener("click", next);
  document.getElementById("btnPrev")?.addEventListener("click", prev);
  document.getElementById("btnRandom")?.addEventListener("click", randomPlay);
});
