(() => {
  "use strict";

  const DATA_FILES = [
    "verbs-es-present-1.json",
    "verbs-es-present-2.json",
    "verbs-es-present-3.json",
    "verbs-es-present-4.json"
  ];
  const EXPECTED_TOTAL = 200;

  const $ = id => document.getElementById(id);
  const setup = $("setup");
  const game = $("game");
  const regularVerbs = $("regularVerbs");
  const irregularVerbs = $("irregularVerbs");
  const questionCount = $("questionCount");
  const availableCount = $("availableCount");
  const startBtn = $("startVerbBtn");
  const loadStatus = $("verbLoadStatus");
  const progress = $("verbProgress");
  const score = $("verbScore");
  const english = $("englishSentence");
  const spanish = $("spanishSentence");
  const hint = $("verbHint");
  const input = $("verbAnswer");
  const checkBtn = $("checkVerbBtn");
  const feedback = $("verbFeedback");
  const nextBtn = $("nextVerbBtn");
  const restartBtn = $("restartVerbBtn");
  const pronounceBtn = $("pronounceVerbBtn");
  const audioStatus = $("verbAudioStatus");
  const visibilityBtn = $("verbVisibilityBtn");

  let questions = [];
  let queue = [];
  let current = null;
  let asked = 0;
  let correctCount = 0;
  let targetCount = 20;
  let answered = false;
  let showInfinitive = true;
  const recordedAudio = new Audio();
  recordedAudio.preload = "none";

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function normalizeAnswer(value) {
    // Ignore case, surrounding spaces and accidental final punctuation,
    // but DO NOT ignore accents: these are part of Spanish conjugation.
    return value.trim().toLocaleLowerCase("es")
      .replace(/[.!?¡¿]+$/g, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function getPool() {
    return questions.filter(q =>
      (q.type === "regular" && regularVerbs.checked) ||
      (q.type === "irregular" && irregularVerbs.checked)
    );
  }

  function updateAvailableCount() {
    const size = getPool().length;
    availableCount.textContent = size
      ? `${size} frases disponibles`
      : "Selecciona al menos un tipo de verbo.";
    questionCount.max = String(Math.max(size, 1));
    if (size && Number(questionCount.value) > size) questionCount.value = String(size);
    startBtn.disabled = size === 0;
  }

  async function loadExercises() {
    startBtn.disabled = true;
    loadStatus.textContent = "Cargando ejercicios...";

    try {
      const groups = await Promise.all(DATA_FILES.map(async file => {
        const response = await fetch(file, { cache: "no-store" });
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error(`${file}: formato incorrecto`);
        for (const q of data) {
          if (
            !q || q.category !== "present" ||
            !["regular", "irregular"].includes(q.type) ||
            !["sentence", "verb", "correct", "english"].every(key => typeof q[key] === "string" && q[key].trim()) ||
            (q.sentence.match(/___/g) || []).length !== 1
          ) {
            throw new Error(`${file}: hay una pregunta incompleta`);
          }
        }
        return data;
      }));

      questions = groups.flat().map((q, index) => ({ ...q, audioId: index + 1 }));
      const unique = new Set(questions.map(q => q.sentence));
      if (questions.length !== EXPECTED_TOTAL || unique.size !== EXPECTED_TOTAL) {
        throw new Error(`Se esperaban ${EXPECTED_TOTAL} frases diferentes, pero hay ${questions.length} (${unique.size} únicas).`);
      }

      loadStatus.textContent = "";
      updateAvailableCount();
      startBtn.disabled = false;
    } catch (error) {
      console.error("No se pudieron cargar los ejercicios:", error);
      loadStatus.textContent = "❌ No se pudieron cargar las preguntas. Actualiza la página e inténtalo de nuevo.";
      loadStatus.style.color = "#d64545";
    }
  }

  function updateHintVisibility() {
    hint.style.display = showInfinitive ? "inline-block" : "none";
    visibilityBtn.textContent = showInfinitive ? "Ocultar infinitivo" : "Mostrar infinitivo";
    visibilityBtn.setAttribute("aria-pressed", String(showInfinitive));
  }

  function completedSentence(question) {
    return question.sentence.replace("___", question.correct);
  }

  function stopSpeech() {
    recordedAudio.pause();
    recordedAudio.removeAttribute("src");
    recordedAudio.load();
  }

  function speakCurrentSentence() {
    if (!current) return;
    audioStatus.textContent = "";
    stopSpeech();

    // Static Spanish-language recordings are hosted with the site,
    // so students never need installed system voices or browser TTS.
    recordedAudio.src = `audio/es-present/${String(current.audioId).padStart(4, "0")}.mp3`;
    recordedAudio.load();
    const playback = recordedAudio.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(error => {
        if (error && error.name === "AbortError") return;
        audioStatus.textContent = "No se ha podido reproducir el audio. Comprueba tu conexión e inténtalo de nuevo.";
      });
    }
  }

  function startGame() {
    if (startBtn.disabled || !questions.length) return;
    const pool = getPool();
    if (!pool.length) return;

    const wanted = Number.parseInt(questionCount.value, 10);
    targetCount = Math.min(Math.max(Number.isFinite(wanted) ? wanted : 20, 1), pool.length);
    questionCount.value = String(targetCount);
    queue = shuffle(pool).slice(0, targetCount);
    asked = 0;
    correctCount = 0;
    current = null;
    answered = false;

    setup.style.display = "none";
    game.style.display = "block";
    input.style.display = "block";
    checkBtn.style.display = "block";
    visibilityBtn.style.display = "inline-block";
    restartBtn.style.display = "none";
    showQuestion();
  }

  function showQuestion() {
    stopSpeech();
    pronounceBtn.style.display = "none";
    audioStatus.textContent = "";
    nextBtn.style.display = "none";
    feedback.textContent = "";
    feedback.className = "verb-feedback";

    if (asked >= targetCount) {
      current = null;
      english.textContent = "¡Reto completado!";
      spanish.textContent = `Has acertado ${correctCount} de ${targetCount} preguntas (${Math.round(correctCount * 100 / targetCount)} %).`;
      hint.textContent = "";
      hint.style.display = "none";
      progress.textContent = `${targetCount} / ${targetCount}`;
      input.style.display = "none";
      checkBtn.style.display = "none";
      visibilityBtn.style.display = "none";
      restartBtn.style.display = "block";
      restartBtn.focus();
      return;
    }

    current = queue[asked];
    asked += 1;
    answered = false;
    progress.textContent = `${asked} / ${targetCount}`;
    score.textContent = `Aciertos: ${correctCount}`;
    english.textContent = `English: ${current.english}`;
    spanish.textContent = current.sentence;
    hint.textContent = current.verb.toLocaleUpperCase("es");
    updateHintVisibility();

    input.value = "";
    input.disabled = false;
    input.style.display = "block";
    checkBtn.disabled = false;
    checkBtn.style.display = "block";
    input.focus();
  }

  function checkAnswer() {
    if (!current || answered) return;
    const answer = normalizeAnswer(input.value);
    if (!answer) {
      feedback.textContent = "Escribe una forma verbal antes de comprobar.";
      feedback.className = "verb-feedback error";
      input.focus();
      return;
    }

    const correct = normalizeAnswer(current.correct);
    answered = true;
    input.disabled = true;
    checkBtn.disabled = true;

    if (answer === correct) {
      correctCount += 1;
      feedback.textContent = `✅ ¡Correcto! ${completedSentence(current)}`;
      feedback.className = "verb-feedback success";
    } else {
      feedback.textContent = `❌ La forma correcta es «${current.correct}». ${completedSentence(current)}`;
      feedback.className = "verb-feedback error";
    }

    score.textContent = `Aciertos: ${correctCount}`;
    pronounceBtn.style.display = "block";
    nextBtn.style.display = "block";
    nextBtn.focus();
  }

  startBtn.addEventListener("click", startGame);
  regularVerbs.addEventListener("change", updateAvailableCount);
  irregularVerbs.addEventListener("change", updateAvailableCount);
  checkBtn.addEventListener("click", checkAnswer);
  nextBtn.addEventListener("click", showQuestion);
  restartBtn.addEventListener("click", () => {
    stopSpeech();
    game.style.display = "none";
    setup.style.display = "block";
    startBtn.focus();
  });
  pronounceBtn.addEventListener("click", speakCurrentSentence);
  visibilityBtn.addEventListener("click", () => {
    showInfinitive = !showInfinitive;
    updateHintVisibility();
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" || game.style.display === "none") return;
    if (event.target === pronounceBtn || event.target === visibilityBtn) return;
    event.preventDefault();
    if (!current && restartBtn.style.display !== "none") {
      restartBtn.click();
    } else if (answered) {
      showQuestion();
    } else {
      checkAnswer();
    }
  });

  loadExercises();
})();
