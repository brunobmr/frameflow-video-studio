import fs from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node generate-srt.mjs <transcription.json> <output.srt>");
}

const transcription = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const words = transcription.words.map((entry) => ({ ...entry }));

// Correction confirmed by a second transcription pass.
for (let index = 2; index < words.length - 1; index += 1) {
  const sequence = words.slice(index - 2, index + 2).map(({ word }) => word.toLowerCase());
  if (sequence.join(" ") === "mas em que fazem") {
    words[index].word = "ações que";
  }
}

const chunks = [];
let current = [];

for (const word of words) {
  current.push(word);
  const duration = current.at(-1).end - current[0].start;
  const characterCount = current.reduce((total, item) => total + item.word.length, 0) + current.length - 1;
  const shouldBreak = current.length >= 7 || duration >= 2.6 || characterCount >= 38;

  if (shouldBreak) {
    chunks.push(current);
    current = [];
  }
}

if (current.length) chunks.push(current);

function formatTimestamp(seconds) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function wrap(items) {
  const values = items.map(({ word }) => word.trim()).filter(Boolean);
  const totalLength = values.reduce((sum, value) => sum + value.length, 0) + values.length - 1;
  if (totalLength <= 25 || values.length < 4) return values.join(" ");

  let bestIndex = 1;
  let bestDifference = Number.POSITIVE_INFINITY;
  for (let index = 1; index < values.length; index += 1) {
    const left = values.slice(0, index).join(" ").length;
    const right = values.slice(index).join(" ").length;
    const difference = Math.abs(left - right);
    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = index;
    }
  }

  return `${values.slice(0, bestIndex).join(" ")}\n${values.slice(bestIndex).join(" ")}`;
}

const srt = chunks.map((chunk, index) => {
  const next = chunks[index + 1];
  const start = Math.max(0, chunk[0].start - 0.04);
  const naturalEnd = chunk.at(-1).end + 0.12;
  const end = next ? Math.min(naturalEnd, next[0].start - 0.02) : naturalEnd;
  const text = wrap(chunk);
  return `${index + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(Math.max(end, start + 0.65))}\n${text}`;
}).join("\n\n");

fs.writeFileSync(outputPath, `${srt}\n`, "utf8");
console.log(JSON.stringify({ captions: chunks.length, outputPath }));
