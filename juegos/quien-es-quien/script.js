const characters = [
  { name: "Daniel", image: "assets/characters/daniel.png", hair: "negro", eyes: "marrones", accessory: "ninguno", feature: "cejas gruesas" },
  { name: "Lucas", image: "assets/characters/lucas.png", hair: "rubio", eyes: "azules", accessory: "ninguno", feature: "pelo rizado" },
  { name: "Sofía", image: "assets/characters/sofia.png", hair: "pelirrojo", eyes: "verdes", accessory: "ninguno", feature: "labios rojos" },
  { name: "Carlos", image: "assets/characters/carlos.png", hair: "negro", eyes: "marrones", accessory: "gorra", feature: "bigote" },
  { name: "Julia", image: "assets/characters/julia.png", hair: "rubio", eyes: "azules", accessory: "pendientes", feature: "moño" },
  { name: "Antonio", image: "assets/characters/antonio.png", hair: "blanco", eyes: "marrones", accessory: "gafas", feature: "bigote" },
  { name: "Pedro", image: "assets/characters/pedro.png", hair: "castaño", eyes: "marrones", accessory: "ninguno", feature: "barba" },
  { name: "Laura", image: "assets/characters/laura.png", hair: "negro", eyes: "marrones", accessory: "gafas", feature: "pelo corto" },
  { name: "Felipe", image: "assets/characters/felipe.png", hair: "pelirrojo", eyes: "marrones", accessory: "ninguno", feature: "pecas" },
  { name: "Amanda", image: "assets/characters/amanda.png", hair: "negro", eyes: "marrones", accessory: "diadema", feature: "pendientes" },
  { name: "Bruno", image: "assets/characters/bruno.png", hair: "rubio", eyes: "azules", accessory: "ninguno", feature: "bigote" },
  { name: "Marcelo", image: "assets/characters/marcelo.png", hair: "negro", eyes: "marrones", accessory: "sombrero", feature: "perilla" },
  { name: "Tereza", image: "assets/characters/tereza.png", hair: "blanco", eyes: "marrones", accessory: "gafas", feature: "moño" },
  { name: "Rafael", image: "assets/characters/rafael.png", hair: "sin pelo", eyes: "marrones", accessory: "ninguno", feature: "barba" },
  { name: "Isabela", image: "assets/characters/isabela.png", hair: "castaño", eyes: "marrones", accessory: "boina", feature: "pelo largo" },
  { name: "Vicente", image: "assets/characters/vicente.png", hair: "blanco", eyes: "marrones", accessory: "ninguno", feature: "barba" },
  { name: "Thiago", image: "assets/characters/thiago.png", hair: "negro", eyes: "marrones", accessory: "gafas", feature: "pelo corto" },
  { name: "Beatriz", image: "assets/characters/beatriz.png", hair: "castaño", eyes: "marrones", accessory: "sombrero", feature: "pendientes" }
];

const questions = [
  "¿Tiene gafas?",
  "¿Tiene sombrero, gorra o boina?",
  "¿Tiene el pelo rubio?",
  "¿Tiene el pelo negro?",
  "¿Tiene el pelo blanco?",
  "¿Tiene ojos azules?",
  "¿Tiene ojos verdes?",
  "¿Tiene barba o bigote?",
  "¿Tiene pendientes?",
  "¿Tiene pecas?",
  "¿Tiene el pelo corto?",
  "¿No tiene pelo?"
];

const state = {
  setupPlayer: 1,
  currentPlayer: 1,
  secrets: { 1: null, 2: null },
  down: { 1: new Set(), 2: new Set() }
};

const els = {
  setupScreen: document.querySelector("#setupScreen"),
  setupTitle: document.querySelector("#setupTitle"),
  setupHint: document.querySelector("#setupHint"),
  setupGrid: document.querySelector("#setupGrid"),
  privacyScreen: document.querySelector("#privacyScreen"),
  privacyTitle: document.querySelector("#privacyTitle"),
  privacyText: document.querySelector("#privacyText"),
  continueBtn: document.querySelector("#continueBtn"),
  gameScreen: document.querySelector("#gameScreen"),
  turnTitle: document.querySelector("#turnTitle"),
  passTurnBtn: document.querySelector("#passTurnBtn"),
  board1: document.querySelector("#board1"),
  board2: document.querySelector("#board2"),
  player1Area: document.querySelector(".player-one"),
  player2Area: document.querySelector(".player-two"),
  questionsList: document.querySelector("#questionsList"),
  secretPeek: document.querySelector("#secretPeek"),
  secretContent: document.querySelector("#secretContent"),
  guessDialog: document.querySelector("#guessDialog"),
  guessPlayer: document.querySelector("#guessPlayer"),
  guessOptions: document.querySelector("#guessOptions"),
  resultDialog: document.querySelector("#resultDialog"),
  resultEyebrow: document.querySelector("#resultEyebrow"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  restartFromResult: document.querySelector("#restartFromResult"),
  newGameBtn: document.querySelector("#newGameBtn")
};

function card(person, options = {}) {
  const button = document.createElement("button");
  button.className = `character-card${options.down ? " down" : ""}`;
  button.type = "button";
  button.setAttribute("aria-label", person.name);
  button.innerHTML = `
    <span class="portrait">
      <img src="${person.image}" alt="${person.name}" draggable="false">
    </span>
    <span class="card-name sr-only">${person.name}</span>
  `;
  return button;
}

function renderSetup() {
  els.setupGrid.innerHTML = "";
  els.setupTitle.textContent = `Jugador ${state.setupPlayer}: elige tu personaje secreto`;
  els.setupHint.textContent = "El otro jugador debe mirar hacia otro lado. Pulsa una carta para guardarla en secreto.";

  characters.forEach((person, index) => {
    const node = card(person);
    node.addEventListener("click", () => chooseSecret(index));
    els.setupGrid.append(node);
  });
}

function chooseSecret(index) {
  state.secrets[state.setupPlayer] = index;
  if (state.setupPlayer === 1) {
    state.setupPlayer = 2;
    els.setupScreen.classList.add("hidden");
    els.privacyTitle.textContent = "Que mire el Jugador 2";
    els.privacyText.textContent = "El personaje del Jugador 1 ya está oculto.";
    els.privacyScreen.classList.remove("hidden");
  } else {
    state.currentPlayer = 1;
    els.setupScreen.classList.add("hidden");
    els.privacyTitle.textContent = "Empieza la partida";
    els.privacyText.textContent = "Los dos personajes secretos están guardados. Empieza el Jugador 1.";
    els.privacyScreen.classList.remove("hidden");
  }
}

function startGameOrNextSetup() {
  els.privacyScreen.classList.add("hidden");
  if (state.secrets[2] === null) {
    els.setupScreen.classList.remove("hidden");
    renderSetup();
  } else {
    els.gameScreen.classList.remove("hidden");
    renderGame();
  }
}

function renderGame() {
  renderBoard(1, els.board1);
  renderBoard(2, els.board2);
  renderTurn();
  els.questionsList.innerHTML = questions.map((q) => `<p class="question">${q}</p>`).join("");
}

function renderTurn() {
  els.turnTitle.textContent = `Jugador ${state.currentPlayer}`;
  els.player1Area.classList.toggle("hidden", state.currentPlayer !== 1);
  els.player2Area.classList.toggle("hidden", state.currentPlayer !== 2);
}

function renderBoard(player, target) {
  target.innerHTML = "";
  characters.forEach((person, index) => {
    const node = card(person, { down: state.down[player].has(index) });
    node.addEventListener("click", () => {
      if (state.down[player].has(index)) {
        state.down[player].delete(index);
      } else {
        state.down[player].add(index);
      }
      renderBoard(player, target);
    });
    target.append(node);
  });
}

function showSecret(player) {
  if (player !== state.currentPlayer) return;
  const secretIndex = state.secrets[player];
  els.secretContent.innerHTML = "";
  els.secretContent.append(card(characters[secretIndex]));
  els.secretPeek.classList.remove("hidden");
}

function hideSecret() {
  els.secretPeek.classList.add("hidden");
  els.secretContent.innerHTML = "";
}

function openGuess(player) {
  if (player !== state.currentPlayer) return;
  els.guessPlayer.textContent = `Jugador ${player}`;
  els.guessOptions.innerHTML = "";
  characters.forEach((person, index) => {
    const node = card(person);
    node.addEventListener("click", () => resolveGuess(player, index));
    els.guessOptions.append(node);
  });
  els.guessDialog.showModal();
}

function resolveGuess(player, index) {
  const opponent = player === 1 ? 2 : 1;
  const correct = state.secrets[opponent] === index;
  els.guessDialog.close();
  els.resultEyebrow.textContent = `Jugador ${player}`;
  els.resultTitle.textContent = correct ? "¡Correcto!" : "No era ese personaje";
  els.resultText.textContent = correct
    ? `Has descubierto a ${characters[index].name}. Jugador ${player} gana la partida.`
    : `${characters[index].name} no es el personaje secreto. Podéis seguir jugando.`;
  els.resultDialog.showModal();
}

function resetGame() {
  state.setupPlayer = 1;
  state.currentPlayer = 1;
  state.secrets = { 1: null, 2: null };
  state.down = { 1: new Set(), 2: new Set() };
  els.gameScreen.classList.add("hidden");
  els.privacyScreen.classList.add("hidden");
  els.setupScreen.classList.remove("hidden");
  hideSecret();
  if (els.guessDialog.open) els.guessDialog.close();
  if (els.resultDialog.open) els.resultDialog.close();
  renderSetup();
}

function passTurn() {
  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  els.gameScreen.classList.add("hidden");
  els.privacyTitle.textContent = `Que mire el Jugador ${state.currentPlayer}`;
  els.privacyText.textContent = "El tablero anterior está oculto. Cuando esté listo, continúa.";
  els.privacyScreen.classList.remove("hidden");
}

document.querySelectorAll("[data-secret]").forEach((button) => {
  const player = Number(button.dataset.secret);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    showSecret(player);
  });
  button.addEventListener("touchstart", (event) => {
    event.preventDefault();
    showSecret(player);
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") showSecret(player);
  });
});

document.addEventListener("pointerup", hideSecret);
document.addEventListener("pointercancel", hideSecret);
document.addEventListener("touchend", hideSecret);
document.addEventListener("touchcancel", hideSecret);
document.addEventListener("keyup", hideSecret);

document.querySelectorAll("[data-guess]").forEach((button) => {
  button.addEventListener("click", () => openGuess(Number(button.dataset.guess)));
});

els.continueBtn.addEventListener("click", startGameOrNextSetup);
els.passTurnBtn.addEventListener("click", passTurn);
els.newGameBtn.addEventListener("click", resetGame);
els.restartFromResult.addEventListener("click", resetGame);

renderSetup();
