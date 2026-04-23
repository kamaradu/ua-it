const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYxU7tQ9zljOOosiBseSOOUUmNHINufeWHdczDkEZMXzqPHyO81aXhrvQojO42j8AW5teS_nROvrKe/pub?gid=0&single=true&output=csv";

let words = [];
let index = 0;
let playing = false;
let timeout;

const DELAY = 4000;

// ===== CLEAN (для назв mp3 файлів)
function clean(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Zа-яА-Яіїєґ0-9]/g, "_")
    .toLowerCase();
}

// ===== LOAD WORDS FROM GOOGLE SHEETS
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

// ===== AUDIO (1 FILE PER WORD PAIR)
function speak(ua, it) {
  const file = `audio/${clean(ua)}_${clean(it)}.mp3`;

  const audio = new Audio(file);
  audio.play();
}

// ===== PLAY SEQUENCE
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
