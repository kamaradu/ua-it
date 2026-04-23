import fetch from "node-fetch";

import fs from "fs";
import textToSpeech from "@google-cloud/text-to-speech";

const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYxU7tQ9zljOOosiBseSOOUUmNHINufeWHdczDkEZMXzqPHyO81aXhrvQojO42j8AW5teS_nROvrKe/pub?gid=0&single=true&output=csv";

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: "key.json",
});

function clean(text) {
  return text.replace(/[^\wа-яіїєґ]/gi, "_").toLowerCase();
}

async function loadCSV() {
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

async function saveTTS(text, lang, filename) {
  if (fs.existsSync(filename)) return;

  const request = {
    input: { text },
    voice: {
      languageCode: lang,
      name: lang === "it-IT"
        ? "it-IT-Wavenet-C"
        : "uk-UA-Wavenet-A"
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.9
    }
  };

  const [response] = await client.synthesizeSpeech(request);

  fs.writeFileSync(filename, response.audioContent, "binary");
}

async function main() {
  if (!fs.existsSync("audio")) {
    fs.mkdirSync("audio");
  }

  const words = await loadCSV();

  for (const w of words) {
    await saveTTS(w.ua, "uk-UA", `audio/${clean(w.ua)}_ua.mp3`);
    await saveTTS(w.it, "it-IT", `audio/${clean(w.it)}_it.mp3`);

    console.log("✔", w.ua, "/", w.it);
  }
}

main();
