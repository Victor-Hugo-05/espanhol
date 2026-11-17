(() => {
  "use strict";

  // Todos os exercícios dos dois desafios anteriores, sem perder os tempos verbais.
  const DATA_FILES = [
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
    "verbs-present-subjunctive.json",
    "verbs-imperfect-subjunctive.json",
    "verbs-conditional.json",
    "verbs-imperative.json",
    "irregular-verbs-1.json",
    "irregular-verbs-2.json",
    "irregular-verbs-3.json",
    "irregular-verbs-4.json",
    "irregular-verbs-5.json",
    "irregular-verbs-6.json"
  ];

  const IRREGULAR_TENSES = {
    presente: "present",
    preterito_perfeito: "preterite",
    imperfeito_subjuntivo: "imperfect_subjunctive",
    futuro_subjuntivo: "futuro_subjuntivo",
    futuro_presente: "futuro_presente",
    futuro_preterito: "future_preterite"
  };

  // Classificação pelo infinitivo, não pela origem do arquivo.
  // Assim, "beber"/"comer" continuam regulares mesmo no banco antigo,
  // e "fazer"/"ser"/"ter" continuam irregulares em qualquer exercício.
  const IRREGULAR_LEMMAS = new Set((
    "ser estar ter haver ir vir fazer dizer trazer pôr poder querer saber dar ver ler crer " +
    "ouvir pedir medir sentir mentir dormir servir vestir ferir seguir conseguir perseguir " +
    "preferir repetir competir impedir despedir cair sair atrair distrair construir destruir " +
    "possuir caber valer manter obter conter deter entreter propor supor compor repor impor " +
    "dispor expor perder conhecer reconhecer agradecer esquecer nascer crescer descer " +
    "corrigir dirigir exigir atingir proteger eleger cobrir descobrir abrir escrever " +
    "descrever inscrever morrer rir sorrir"
  ).split(" "));

  const $ = id => document.getElementById(id);
  const setup = $("setup"), game = $("game");
  const regularVerbs = $("regularVerbs"), irregularVerbs = $("irregularVerbs");
  const categorySelect = $("categorySelect"), questionCount = $("questionCount");
  const availableCount = $("availableCount"), loadStatus = $("verbLoadStatus");
  const startBtn = $("startVerbBtn"), progress = $("verbProgress"), score = $("verbScore");
  const english = $("englishSentence"), portuguese = $("portugueseSentence");
  const tenseHint = $("tenseHint"), hint = $("verbHint");
  const input = $("verbAnswer"), input2 = $("verbAnswer2");
  const checkBtn = $("checkVerbBtn"), feedback = $("verbFeedback");
  const pronounceBtn = $("pronounceVerbBtn"), nextBtn = $("nextVerbBtn");
  const restartBtn = $("restartVerbBtn"), visibilityBtn = $("verbVisibilityBtn");

  let questions = [], queue = [], current = null;
  let asked = 0, correctCount = 0, targetCount = 20;
  let answered = false, showInfinitive = true;

  // Links antigos para a página de irregulares abrem o jogo unificado filtrado.
  const params = new URLSearchParams(window.location.search);
  if (params.get("tipo") === "irregulares") regularVerbs.checked = false;

  function normalizeAnswer(text) {
    return text.trim().toLocaleLowerCase("pt-BR")
      .replace(/[.!?]+$/g, "").trim().replace(/\s+/g, " ");
  }

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function isIrregularVerb(verb) {
    return IRREGULAR_LEMMAS.has(String(verb || "").toLocaleLowerCase("pt-BR").replace(/-se$/, ""));
  }

  function adaptQuestion(question, file) {
    const fromIrregularCollection = file.startsWith("irregular-verbs-");
    const verbs = Array.isArray(question.verbs) ? question.verbs : [question.verb];
    const correct = Array.isArray(question.correct) ? question.correct : [question.correct];
    const category = fromIrregularCollection
      ? IRREGULAR_TENSES[question.tense]
      : question.category;
    if (!category || !verbs.every(v => typeof v === "string" && v) ||
        !correct.every(v => typeof v === "string" && v) ||
        verbs.length !== correct.length || !question.sentence ||
        (question.sentence.match(/___/g) || []).length !== correct.length) {
      throw new Error(`Exercício inválido em ${file}`);
    }
    return {
      ...question,
      category,
      type: (fromIrregularCollection || verbs.some(isIrregularVerb)) ? "irregular" : "regular"
    };
  }

  function getPool() {
    return questions.filter(q =>
      (categorySelect.value === "all" || q.category === categorySelect.value) &&
      ((q.type === "regular" && regularVerbs.checked) ||
       (q.type === "irregular" && irregularVerbs.checked))
    );
  }

  function updateAvailableCount() {
    const count = getPool().length;
    availableCount.textContent = count
      ? `${count} frases disponíveis`
      : "Nenhuma frase disponível para os filtros selecionados.";
    questionCount.max = String(Math.max(count, 1));
    if (count && Number(questionCount.value) > count) questionCount.value = String(count);
    startBtn.disabled = count === 0;
  }

  async function loadExercises() {
    startBtn.disabled = true;
    loadStatus.textContent = "Carregando exercícios...";
    const results = await Promise.allSettled(DATA_FILES.map(async file => {
      const response = await fetch(file, { cache: "no-store" });
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
      const group = await response.json();
      if (!Array.isArray(group)) throw new Error(`${file}: formato inválido`);
      return group.map(question => adaptQuestion(question, file));
    }));

    const failed = [];
    questions = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;
      failed.push(DATA_FILES[index]);
      console.error("Erro ao carregar", DATA_FILES[index], result.reason);
      return [];
    });

    loadStatus.textContent = failed.length
      ? `⚠️ Não foi possível carregar: ${failed.join(", ")}`
      : "";
    loadStatus.style.color = failed.length ? "#b36b00" : "#666";
    if (!questions.length) {
      loadStatus.textContent = "❌ Nenhum exercício pôde ser carregado.";
    }
    updateAvailableCount();
  }

  function isDouble(question) {
    return Array.isArray(question.correct);
  }

  function completedSentence(question) {
    const answers = Array.isArray(question.correct) ? question.correct : [question.correct];
    return answers.reduce((sentence, answer) => sentence.replace("___", answer), question.sentence);
  }

  function canSpeak() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function speakCurrentSentence() {
    if (!current || !canSpeak()) return;
    const utterance = new SpeechSynthesisUtterance(completedSentence(current));
    utterance.lang = "pt-BR";
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang.toLowerCase() === "pt-br")
      || voices.find(v => v.lang.toLowerCase().startsWith("pt")) || null;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function updateHintVisibility() {
    hint.style.display = showInfinitive ? "inline-block" : "none";
    visibilityBtn.textContent = showInfinitive ? "Ocultar infinitivo" : "Mostrar infinitivo";
    visibilityBtn.setAttribute("aria-pressed", String(showInfinitive));
  }

  function startGame() {
    const pool = getPool();
    if (!pool.length || startBtn.disabled) return;
    const requested = Number.parseInt(questionCount.value, 10);
    targetCount = Math.min(Math.max(Number.isFinite(requested) ? requested : 20, 1), pool.length);
    queue = shuffle(pool).slice(0, targetCount);
    asked = 0;
    correctCount = 0;
    current = null;
    answered = false;
    setup.style.display = "none";
    game.style.display = "block";
    visibilityBtn.style.display = "inline-block";
    restartBtn.style.display = "none";
    showQuestion();
  }

  function showQuestion() {
    if (canSpeak()) window.speechSynthesis.cancel();
    pronounceBtn.style.display = "none";
    nextBtn.style.display = "none";
    feedback.textContent = "";
    feedback.className = "verb-feedback";

    if (asked >= targetCount) {
      current = null;
      english.textContent = "Desafio concluído!";
      portuguese.textContent = `Você acertou ${correctCount} de ${targetCount} perguntas (${Math.round(100 * correctCount / targetCount)}%).`;
      tenseHint.textContent = "";
      hint.textContent = "";
      hint.style.display = "none";
      input.style.display = "none";
      input2.style.display = "none";
      checkBtn.style.display = "none";
      visibilityBtn.style.display = "none";
      restartBtn.style.display = "block";
      restartBtn.focus();
      return;
    }

    current = queue[asked++];
    answered = false;
    progress.textContent = `${asked} / ${targetCount}`;
    score.textContent = `Acertos: ${correctCount}`;
    english.textContent = current.english + (current.category === "imperative"
      ? ` · Forma pedida: ${current.person}` : "");
    portuguese.textContent = current.sentence;
    tenseHint.textContent = current.tenseLabel || "";
    const verbs = Array.isArray(current.verbs) ? current.verbs : [current.verb];
    hint.textContent = verbs.map(v => v.toLocaleUpperCase("pt-BR")).join(" + ");
    updateHintVisibility();

    input.value = "";
    input.disabled = false;
    input.style.display = "block";
    input.placeholder = isDouble(current) ? "1º verbo: imperfeito do subjuntivo" : "Digite a forma conjugada...";
    input2.value = "";
    input2.disabled = false;
    input2.style.display = isDouble(current) ? "block" : "none";
    input2.placeholder = "2º verbo: futuro do pretérito";
    checkBtn.style.display = "block";
    checkBtn.disabled = false;
    input.focus();
  }

  function checkAnswer() {
    if (!current || answered) return;
    const userAnswers = isDouble(current) ? [input.value, input2.value] : [input.value];
    if (userAnswers.some(v => !v.trim())) {
      feedback.textContent = "Preencha todas as respostas antes de verificar.";
      feedback.className = "verb-feedback error";
      return;
    }
    const correctAnswers = Array.isArray(current.correct) ? current.correct : [current.correct];
    const allCorrect = userAnswers.every((answer, i) =>
      normalizeAnswer(answer) === normalizeAnswer(correctAnswers[i]));

    answered = true;
    input.disabled = true;
    input2.disabled = true;
    checkBtn.disabled = true;
    if (allCorrect) correctCount++;
    feedback.textContent = allCorrect
      ? `✅ Correto! ${completedSentence(current)}`
      : `❌ Resposta correta: ${correctAnswers.join(" / ")}. ${completedSentence(current)}`;
    feedback.className = allCorrect ? "verb-feedback success" : "verb-feedback error";
    score.textContent = `Acertos: ${correctCount}`;
    pronounceBtn.style.display = canSpeak() ? "block" : "none";
    nextBtn.style.display = "block";
    nextBtn.focus();
  }

  startBtn.addEventListener("click", startGame);
  [regularVerbs, irregularVerbs, categorySelect].forEach(el =>
    el.addEventListener("change", updateAvailableCount));
  checkBtn.addEventListener("click", checkAnswer);
  nextBtn.addEventListener("click", showQuestion);
  pronounceBtn.addEventListener("click", speakCurrentSentence);
  visibilityBtn.addEventListener("click", () => {
    showInfinitive = !showInfinitive;
    updateHintVisibility();
  });
  restartBtn.addEventListener("click", () => {
    game.style.display = "none";
    setup.style.display = "block";
    updateAvailableCount();
    startBtn.focus();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" || game.style.display === "none") return;
    if (event.target === pronounceBtn || event.target === visibilityBtn) return;
    event.preventDefault();
    if (!current && restartBtn.style.display !== "none") {
      restartBtn.click();
    } else if (answered) {
      showQuestion();
    } else if (isDouble(current) && event.target === input && !input2.value.trim()) {
      input2.focus();
    } else {
      checkAnswer();
    }
  });
  loadExercises();
})();
