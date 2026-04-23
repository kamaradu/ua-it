const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYxU7tQ9zljOOosiBseSOOUUmNHINufeWHdczDkEZMXzqPHyO81aXhrvQojO42j8AW5teS_nROvrKe/pub?gid=0&single=true&output=csv";

let words = [];
let index = 0;
let playing = false;
let timeout;

const DELAY = 4000;

// ===== CLEAN (для назв mp3)
function clean(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Zа-яА-Яіїєґ0-9]/g, "_")
    .toLowerCase();
}

// ===== LOAD GOOGLE SHEETS
async function loadWords() {
  const res = await fetch(url);
  const text = await res.text();

  return text
    .split("\n")
    .map((r) => r.split(","))
    .filter((r) => r.length >= 2)
    .map((r) => ({
      ua: r[0].replace(/"/g, "").trim(),
      it: r[1].replace(/"/g, "").trim(),
    }));
}

// ===== RENDER UI
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

// ===== AUDIO (UA → IT)
function speak(ua, it) {
  const uaFile = `audio/${clean(ua)}_ua.mp3`;
  const itFile = `audio/${clean(it)}_it.mp3`;

  const uaAudio = new Audio(uaFile);

  uaAudio.play();

  uaAudio.onended = () => {
    const itAudio = new Audio(itFile);
    itAudio.play();
  };
}

// ===== SEQUENCE
function playSequence(i) {
  clearTimeout(timeout);

  index = i;
  render();

  const w = words[i];

  speak(w.ua, w.it);

  if (playing) {
    timeout = setTimeout(next, DELAY);
  }
}

// ===== CONTROLS
function play() {
  playing = true;
  playSequence(index);
}

function pause() {
  playing = false;
  clearTimeout(timeout);
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

// ===== INIT
async function init() {
  words = await loadWords();
  render();
}

init();
