let questions = [];
let queue = [];
let current = null;
let asked = 0;
let correctCount = 0;
let targetCount = 20;
let showVerbHint = true;

const setup = document.getElementById("setup");
const game = document.getElementById("game");
const tenseSelect = document.getElementById("tenseSelect");
const questionCount = document.getElementById("questionCount");
const startBtn = document.getElementById("startVerbBtn");
const progress = document.getElementById("verbProgress");
const score = document.getElementById("verbScore");
const english = document.getElementById("englishSentence");
const portuguese = document.getElementById("portugueseSentence");
const tenseHint = document.getElementById("tenseHint");
const hint = document.getElementById("verbHint");
const input = document.getElementById("verbAnswer");
const checkBtn = document.getElementById("checkVerbBtn");
const feedback = document.getElementById("verbFeedback");
const nextBtn = document.getElementById("nextVerbBtn");
const visibilityBtn = document.getElementById("verbVisibilityBtn");

const files = [
  "irregular-verbs-1.json",
  "irregular-verbs-2.json",
  "irregular-verbs-3.json",
  "irregular-verbs-4.json",
  "irregular-verbs-5.json",
  "irregular-verbs-6.json"
];

const loadStatus = document.createElement("div");
loadStatus.id = "verbLoadStatus";
loadStatus.style.marginTop = "10px";
loadStatus.style.fontWeight = "700";
loadStatus.style.fontSize = "14px";
startBtn.insertAdjacentElement("afterend", loadStatus);

async function loadExercises() {
  startBtn.disabled = true;
  loadStatus.textContent = "Carregando exercícios...";
  loadStatus.style.color = "#666";

  const results = await Promise.allSettled(files.map(async file => {
    const response = await fetch(file, { cache: "no-store" });
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error(`${file}: conteúdo inválido`);
    return data;
  }));

  const loaded = [];
  const failed = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") loaded.push(...result.value);
    else failed.push(files[index]);
  });

  questions = loaded;
  if (questions.length) {
    startBtn.disabled = false;
    loadStatus.textContent = failed.length ? `⚠️ Alguns exercícios não carregaram: ${failed.join(", ")}` : "";
    loadStatus.style.color = failed.length ? "#b36b00" : "#666";
    console.info(`✅ Carregados ${questions.length} exercícios de verbos irregulares.`);
  } else {
    loadStatus.textContent = "❌ Não foi possível carregar os exercícios.";
    loadStatus.style.color = "#d64545";
  }
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function updateVerbHintVisibility() {
  hint.style.display = showVerbHint ? "inline-block" : "none";
  visibilityBtn.textContent = showVerbHint ? "Ocultar verbo em português" : "Mostrar verbo em português";
}

function startGame() {
  const tense = tenseSelect.value;
  const pool = tense === "all" ? questions : questions.filter(q => q.tense === tense);

  if (!pool.length) {
    loadStatus.textContent = "❌ Não há exercícios disponíveis para esse tempo verbal.";
    loadStatus.style.color = "#d64545";
    return;
  }

  loadStatus.textContent = "";
  targetCount = Math.min(Math.max(Number(questionCount.value) || 20, 1), pool.length);
  queue = shuffle(pool).slice(0, targetCount);
  asked = 0;
  correctCount = 0;
  setup.style.display = "none";
  game.style.display = "block";
  input.style.display = "block";
  checkBtn.style.display = "block";
  showQuestion();
}

function showQuestion() {
  if (asked >= targetCount) {
    english.textContent = "Desafio concluído!";
    portuguese.textContent = `Você acertou ${correctCount} de ${targetCount}.`;
    tenseHint.textContent = "";
    hint.textContent = "";
    input.style.display = "none";
    checkBtn.style.display = "none";
    nextBtn.style.display = "none";
    feedback.textContent = "";
    return;
  }

  current = queue.shift();
  asked++;
  progress.textContent = `${asked} / ${targetCount}`;
  score.textContent = `Score: ${correctCount}`;
  english.textContent = current.english;
  portuguese.textContent = current.sentence;
  tenseHint.textContent = current.tenseLabel;
  hint.textContent = current.verb.toUpperCase();
  updateVerbHintVisibility();

  input.value = "";
  input.disabled = false;
  checkBtn.disabled = false;
  feedback.textContent = "";
  feedback.className = "verb-feedback";
  nextBtn.style.display = "none";
  input.focus();
}

function checkAnswer() {
  if (!current || !input.value.trim()) return;
  const isCorrect = normalize(input.value) === normalize(current.correct);
  input.disabled = true;
  checkBtn.disabled = true;

  if (isCorrect) {
    correctCount++;
    feedback.textContent = `✅ Correto! ${current.sentence.replace("___", current.correct)}`;
    feedback.className = "verb-feedback success";
  } else {
    feedback.textContent = `❌ Incorreto. Resposta correta: ${current.correct}`;
    feedback.className = "verb-feedback error";
  }

  score.textContent = `Score: ${correctCount}`;
  nextBtn.style.display = "block";
}

startBtn.addEventListener("click", startGame);
checkBtn.addEventListener("click", checkAnswer);
nextBtn.addEventListener("click", showQuestion);
visibilityBtn.addEventListener("click", () => {
  showVerbHint = !showVerbHint;
  updateVerbHintVisibility();
});

updateVerbHintVisibility();
loadExercises();

document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  if (game.style.display === "none") {
    if (!startBtn.disabled) startGame();
    return;
  }
  if (nextBtn.style.display !== "none") {
    showQuestion();
    return;
  }
  checkAnswer();
});
