
import fs from "fs";
import fetch from "node-fetch";
import textToSpeech from "@google-cloud/text-to-speech";

const url = "ТВОЄ_CSV_URL";

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: "key.json",
});

function clean(text) {
  return text.replace(/[^\wа-яіїєґ]/gi, "_").toLowerCase();
}

async function main() {
  const res = await fetch(url);
  const text = await res.text();

  const rows = text.split("\n")
    .map(r => r.split(","))
    .filter(r => r.length >= 2);

  for (const r of rows) {
    const ua = r[0].replace(/"/g, "").trim();
    const it = r[1].replace(/"/g, "").trim();

    await saveTTS(ua, "uk-UA", `audio/${clean(ua)}_ua.mp3`);
    await saveTTS(it, "it-IT", `audio/${clean(it)}_it.mp3`);

    console.log("✔", ua, it);
  }
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

main();
