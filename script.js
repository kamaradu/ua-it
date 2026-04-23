
const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYxU7tQ9zljOOosiBseSOOUUmNHINufeWHdczDkEZMXzqPHyO81aXhrvQojO42j8AW5teS_nROvrKe/pub?gid=0&single=true&output=csv";

let words = [];
let index = 0;
let playing = false;
let timeout;

const DELAY = 4000; // ⏱ фіксовано 4 секунди

// LOAD
async function loadWords() {
  const res = await fetch(url);
  const text = await res.text();

  return text.split("\n")
    .map(r => r.split(","))
    .filter(r => r.length >= 2)
    .map(r => ({
      ua: r[0].replace(/"/g, "").trim(),
      it: r[1].replace(/"/g, "").trim()
    }));
}

// RENDER
function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  words.forEach((w, i) => {
    const row = document.createElement("div");
    row.className = "row" + (i === index ? " active" : "");

    row.innerHTML = `
      <div class="word">
        <div class="ua">${w.ua}</div>
        <div class="it">${w.it}</div>
      </div>
      <button class="play-btn" onclick="playOne(${i})">▶️</button>
    `;

    list.appendChild(row);
  });

  document.getElementById("currentWord").innerText = words[index]?.ua || "";
  document.getElementById("currentTranslation").innerText = words[index]?.it || "";
}

// SPEAK
function speak(text, lang) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  speechSynthesis.speak(u);
}

// SEQUENCE
function playSequence(i) {
  clearTimeout(timeout);
  speechSynthesis.cancel();

  index = i;
  localStorage.setItem("pos", index);
  render();

  const w = words[i];

  speak(w.ua, "uk-UA");

  timeout = setTimeout(() => {
    speak(w.it, "it-IT");

    timeout = setTimeout(() => {
      speak(w.it, "it-IT");

      if (playing) {
        timeout = setTimeout(next, DELAY);
      }

    }, DELAY);

  }, DELAY);
}

// CONTROLS
function play() {
  playing = true;
  playSequence(index);
}

function pause() {
  playing = false;
  speechSynthesis.cancel();
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

function playOne(i) {
  playing = false;
  playSequence(i);
}

// INIT
async function init() {
  words = await loadWords();
  index = parseInt(localStorage.getItem("pos")) || 0;
  render();
}

init();
