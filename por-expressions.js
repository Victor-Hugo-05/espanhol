let allQuestions = [];
let questions = [];
let currentIndex = 0;
let score = 0;
let answered = false;

const explanations = {
  "por que": '"Por que" means "why" and asks for a reason.',
  "por causa de": '"Por causa de" means "because of" and introduces the cause.',
  "por isso": '"Por isso" means "so / that’s why" and introduces a consequence.',
  "por exemplo": '"Por exemplo" means "for example".',
  "por favor": '"Por favor" means "please".',
  "por enquanto": '"Por enquanto" means "for now / for the time being".',
  "por acaso": '"Por acaso" often means "by any chance / happen to".',
  "por último": '"Por último" means "lastly / finally".',
  "por outro lado": '"Por outro lado" means "on the other hand" and introduces a contrast.',
  "por aí": '"Por aí" can mean "around here/there" or an unspecified place.'
};

const setup = document.getElementById('setup');
const game = document.getElementById('game');
const result = document.getElementById('result');
const questionCount = document.getElementById('questionCount');
const startBtn = document.getElementById('startPorBtn');
const nextBtn = document.getElementById('nextPorBtn');
const progress = document.getElementById('porProgress');
const scoreEl = document.getElementById('porScore');
const questionEl = document.getElementById('porQuestion');
const optionsEl = document.getElementById('porOptions');
const feedbackEl = document.getElementById('porFeedback');

fetch('por-expressions.json')
  .then(response => {
    if (!response.ok) throw new Error('Could not load questions.');
    return response.json();
  })
  .then(data => {
    allQuestions = data;
    startBtn.disabled = false;
  })
  .catch(() => {
    setup.innerHTML = '<p>Could not load the exercise questions.</p>';
  });

startBtn.disabled = true;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function explanationFor(answer) {
  const normalized = normalize(answer);
  if (normalized.startsWith('por causa d')) return explanations['por causa de'];
  return explanations[normalized] || '';
}

function startGame() {
  const requested = Math.max(5, Math.min(100, Number(questionCount.value) || 20));
  questionCount.value = requested;
  questions = shuffle(allQuestions).slice(0, requested);
  currentIndex = 0;
  score = 0;
  setup.style.display = 'none';
  result.style.display = 'none';
  game.style.display = 'block';
  renderQuestion();
}

function renderQuestion() {
  answered = false;
  const item = questions[currentIndex];
  progress.textContent = `${currentIndex + 1} / ${questions.length}`;
  scoreEl.textContent = `Score: ${score}`;
  questionEl.textContent = item.question;
  feedbackEl.textContent = '';
  feedbackEl.className = 'por-feedback';
  nextBtn.style.display = 'none';
  optionsEl.innerHTML = '';

  shuffle(item.options).forEach(option => {
    const button = document.createElement('button');
    button.textContent = option;
    button.addEventListener('click', () => checkAnswer(button, option));
    optionsEl.appendChild(button);
  });
}

function checkAnswer(selectedButton, selectedOption) {
  if (answered) return;
  answered = true;
  const item = questions[currentIndex];
  const correct = normalize(selectedOption) === normalize(item.answer);

  [...optionsEl.children].forEach(button => {
    button.disabled = true;
    if (normalize(button.textContent) === normalize(item.answer)) {
      button.classList.add('correct');
    }
  });

  if (correct) {
    score++;
    selectedButton.classList.add('correct');
    feedbackEl.textContent = `✅ Correct! ${explanationFor(item.answer)}`;
    feedbackEl.classList.add('success');
  } else {
    selectedButton.classList.add('wrong');
    feedbackEl.textContent = `❌ The answer is “${item.answer}”. ${explanationFor(item.answer)}`;
    feedbackEl.classList.add('error');
  }

  scoreEl.textContent = `Score: ${score}`;
  nextBtn.textContent = currentIndex === questions.length - 1 ? 'See result' : '➡ Next';
  nextBtn.style.display = 'block';
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) {
    finishGame();
  } else {
    renderQuestion();
  }
}

function finishGame() {
  game.style.display = 'none';
  result.style.display = 'block';
  const percent = Math.round((score / questions.length) * 100);
  result.innerHTML = `
    <h2>Finished! 🎉</h2>
    <p>You got <strong>${score}/${questions.length}</strong> (${percent}%).</p>
    <button id="restartPorBtn">Try again</button>
  `;
  document.getElementById('restartPorBtn').addEventListener('click', () => {
    result.style.display = 'none';
    setup.style.display = 'block';
  });
}

startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', nextQuestion);
