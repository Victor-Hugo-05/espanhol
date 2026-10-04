let questions = [];
let queue = [];
let current = null;
let asked = 0;
let correctCount = 0;
let targetCount = 20;
let showVerbHint = true;

const setup = document.getElementById("setup");
const game = document.getElementById("game");
const categorySelect = document.getElementById("categorySelect");
const questionCount = document.getElementById("questionCount");
const startBtn = document.getElementById("startVerbBtn");
const progress = document.getElementById("verbProgress");
const score = document.getElementById("verbScore");
const english = document.getElementById("englishSentence");
const portuguese = document.getElementById("portugueseSentence");
const hint = document.getElementById("verbHint");
const input = document.getElementById("verbAnswer");
const input2 = document.getElementById("verbAnswer2");
const checkBtn = document.getElementById("checkVerbBtn");
const feedback = document.getElementById("verbFeedback");
const nextBtn = document.getElementById("nextVerbBtn");
const visibilityBtn = document.getElementById("verbVisibilityBtn");

const files = [
  "verbs-present.json",
  "verbs-present-extra.json",
  "verbs-preterite.json",
  "verbs-preterite-extra.json",
  "verbs-gerund.json",
  "verbs-gerund-extra.json",
  "verbs-participle.json",
  "verbs-participle-extra.json",
  "verbs-pronominal.json",
  "verbs-pronominal-extra.json",
  "verbs-future-preterite.json",
  "verbs-imperfect-subjunctive.json",
  "verbs-conditional.json"
];

Promise.all(files.map(file => fetch(file).then(res => res.json())))
  .then(groups => {
    questions = groups.flat();
    startBtn.disabled = false;
  })
  .catch(() => {
    feedback.textContent = "Could not load the exercises.";
  });

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

function isDoubleVerbQuestion(question) {
  return Array.isArray(question.correct);
}

function fillSentence(sentence, answers) {
  let result = sentence;
  answers.forEach(answer => {
    result = result.replace("___", answer);
  });
  return result;
}

function updateVerbHintVisibility() {
  hint.style.display = showVerbHint ? "block" : "none";
  visibilityBtn.textContent = showVerbHint
    ? "Ocultar verbo em português"
    : "Mostrar verbo em português";
}

function startGame() {
  const category = categorySelect.value;
  const pool = category === "all" ? questions : questions.filter(q => q.category === category);
  if (!pool.length) return;

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
    english.textContent = "Challenge complete!";
    portuguese.textContent = `You got ${correctCount} of ${targetCount} correct.`;
    hint.textContent = "";
    input.style.display = "none";
    input2.style.display = "none";
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

  const doubleQuestion = isDoubleVerbQuestion(current);
  hint.textContent = doubleQuestion
    ? current.verbs.map(verb => verb.toUpperCase()).join(" + ")
    : current.verb.toUpperCase();

  updateVerbHintVisibility();

  input.value = "";
  input.disabled = false;
  input.placeholder = doubleQuestion
    ? "1º verbo: pretérito imperfeito do subjuntivo"
    : "Type the Portuguese form...";

  input2.value = "";
  input2.disabled = false;
  input2.style.display = doubleQuestion ? "block" : "none";
  input2.placeholder = "2º verbo: futuro do pretérito";

  checkBtn.disabled = false;
  feedback.textContent = "";
  feedback.className = "verb-feedback";
  nextBtn.style.display = "none";
  input.focus();
}

function checkAnswer() {
  if (!current || !input.value.trim()) return;

  const doubleQuestion = isDoubleVerbQuestion(current);
  if (doubleQuestion && !input2.value.trim()) return;

  const userAnswers = doubleQuestion
    ? [input.value, input2.value]
    : [input.value];
  const correctAnswers = doubleQuestion
    ? current.correct
    : [current.correct];

  const isCorrect = userAnswers.every((answer, index) =>
    normalize(answer) === normalize(correctAnswers[index])
  );

  input.disabled = true;
  input2.disabled = true;
  checkBtn.disabled = true;

  if (isCorrect) {
    correctCount++;
    feedback.textContent = `✅ Correct! ${fillSentence(current.sentence, correctAnswers)}`;
    feedback.className = "verb-feedback success";
  } else if (doubleQuestion) {
    feedback.textContent = `❌ Incorrect. Correct answers: ${correctAnswers[0]} / ${correctAnswers[1]}`;
    feedback.className = "verb-feedback error";
  } else {
    feedback.textContent = `❌ Incorrect. Correct answer: ${current.correct}`;
    feedback.className = "verb-feedback error";
  }

  score.textContent = `Score: ${correctCount}`;
  nextBtn.style.display = "block";
}

startBtn.disabled = true;
startBtn.addEventListener("click", startGame);
checkBtn.addEventListener("click", checkAnswer);
nextBtn.addEventListener("click", showQuestion);
visibilityBtn.addEventListener("click", () => {
  showVerbHint = !showVerbHint;
  updateVerbHintVisibility();
});

updateVerbHintVisibility();

document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;

  if (game.style.display === "none") {
    startGame();
    return;
  }

  if (nextBtn.style.display !== "none") {
    showQuestion();
    return;
  }

  if (current && isDoubleVerbQuestion(current) && document.activeElement === input && !input2.value.trim()) {
    input2.focus();
    return;
  }

  checkAnswer();
});
