
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYxU7tQ9zljOOosiBseSOOUUmNHINufeWHdczDkEZMXzqPHyO81aXhrvQojO42j8AW5teS_nROvrKe/pub?gid=0&single=true&output=csv";

let words = [];
let index = 0;
let playing = false;
let timeout;

const DELAY = 4000;

// =====================
// AUDIO ENGINE (FIXED)
// =====================

let currentAudio = null;

function playAudio(src) {
  return new Promise((resolve) => {
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
// RENDER
// =====================

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  words.forEach((w, i) => {
    const row = document.createElement("div");
    row.className = "row" + (i === index ? " active" : "");

    row.innerHTML = `
      <div class="line">
        ${w.ua} / <span class="it">${w.it}</span>
      </div>
      <button onclick="playOne(${i})">▶️</button>
    `;

    list.appendChild(row);
  });

  const current = words[index];
  document.getElementById("currentWord").innerHTML =
    current
      ? `${current.ua} / <span class="it">${current.it}</span>`
      : "";
}

// =====================
// SPEAK (FIXED ORDER)
// =====================

async function speak(id) {
  await playAudio(`audio/${id}_ua.mp3`);
  await delay(200);
  await playAudio(`audio/${id}_it.mp3`);
}

// =====================
// SEQUENCE (NO OVERLAP)
// =====================

async function playSequence(i) {
  clearTimeout(timeout);

  index = i;
  render();

  const w = words[i];
  if (!w) return;

  await speak(w.id);

  if (playing) {
    timeout = setTimeout(() => {
      next();
    }, 300);
  }
}

// =====================
// CONTROLS
// =====================

function play() {
  playing = true;
  playSequence(index);
}

function pause() {
  playing = false;
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
  playing = true;
  const i = Math.floor(Math.random() * words.length);
  playSequence(i);
}

function playOne(i) {
  playing = false;
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
