let allData = [];
let data = [];
let current = null;
let currentIndex = 0;
let initialTrainingCount = 0;

const STUDENTS = [
  {
    name: "Yan Marques",
    sheetId: "16txR-uMm-5p0ZdVVW-A099DFwSnBl-iijjEUNqkZtd0"
  }
];

const card = document.getElementById("card");

// vamos criar UI dinamicamente
const container = document.querySelector(".container");

// CONFIGURAÇÃO DO TREINO
const setup = document.createElement("div");
setup.className = "training-setup";

const studentLabel = document.createElement("label");
studentLabel.htmlFor = "studentSelect";
studentLabel.textContent = "Selecionar aluno";

const studentSelect = document.createElement("select");
studentSelect.id = "studentSelect";

const placeholderOption = document.createElement("option");
placeholderOption.value = "";
placeholderOption.textContent = "Escolha um aluno";
studentSelect.appendChild(placeholderOption);

STUDENTS.forEach(student => {
  const option = document.createElement("option");
  option.value = student.sheetId;
  option.textContent = student.name;
  studentSelect.appendChild(option);
});

const setupLabel = document.createElement("label");
setupLabel.htmlFor = "vocabularyCount";
setupLabel.textContent = "Quantos vocabulários você quer treinar?";

const countInput = document.createElement("input");
countInput.type = "number";
countInput.id = "vocabularyCount";
countInput.min = "1";
countInput.placeholder = "Carregando...";
countInput.disabled = true;

const startBtn = document.createElement("button");
startBtn.textContent = "Iniciar treino";
startBtn.disabled = true;
startBtn.className = "start-btn";

setup.appendChild(studentLabel);
setup.appendChild(studentSelect);
setup.appendChild(setupLabel);
setup.appendChild(countInput);
setup.appendChild(startBtn);

// INPUT
const input = document.createElement("input");
input.type = "text";
input.placeholder = "Escribe en español...";
input.id = "answerInput";
input.style.display = "none";

// BOTÃO CHECK
const checkBtn = document.createElement("button");
checkBtn.textContent = "✔ Verificar";
checkBtn.style.display = "none";
checkBtn.className = "check-btn";

// BOTÃO NEXT
const nextBtn = document.createElement("button");
nextBtn.textContent = "➡ Siguiente";
nextBtn.style.display = "none";
nextBtn.className = "next-btn";

// FEEDBACK
const feedback = document.createElement("div");
feedback.style.marginTop = "15px";
feedback.style.fontWeight = "bold";

// adicionar elementos na tela
container.appendChild(setup);
container.appendChild(input);
container.appendChild(checkBtn);
container.appendChild(feedback);
container.appendChild(nextBtn);

card.textContent = "Selecione um aluno";

function loadSheet(sheetId) {
  card.textContent = "Loading...";
  feedback.textContent = "";
  allData = [];
  countInput.value = "";
  countInput.placeholder = "Carregando...";
  countInput.disabled = true;
  startBtn.disabled = true;

  const script = document.createElement("script");
  script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:handleSheetResponse`;
  script.onerror = showLoadError;
  document.body.appendChild(script);
}

function handleSheetResponse(response) {
  if (!response || response.status !== "ok" || !response.table) {
    showLoadError();
    return;
  }

  allData = response.table.rows
    .slice(1)
    .map(row => [
      row.c?.[0]?.v?.toString().trim() || "",
      row.c?.[1]?.v?.toString().trim() || ""
    ])
    .filter(row => row[0] && row[1]);

  console.log("Dados carregados:", allData);

  if (allData.length === 0) {
    showLoadError("Nenhum vocabulário foi encontrado na planilha.");
    return;
  }

  card.textContent = `${allData.length} vocabulários disponíveis`;
  countInput.max = allData.length;
  countInput.value = allData.length;
  countInput.placeholder = `1 a ${allData.length}`;
  countInput.disabled = false;
  startBtn.disabled = false;
  countInput.focus();
}

function showLoadError(message = "Não foi possível carregar a planilha.") {
  card.textContent = "Erro ao carregar";
  feedback.textContent = message;
  feedback.style.color = "red";
}

function startTraining() {
  const requestedCount = Number(countInput.value);

  if (!Number.isInteger(requestedCount) || requestedCount < 1) {
    feedback.textContent = "Digite uma quantidade válida.";
    feedback.style.color = "red";
    countInput.focus();
    return;
  }

  const count = Math.min(requestedCount, allData.length);

  data = shuffle([...allData]).slice(0, count);
  currentIndex = 0;
  initialTrainingCount = count;

  setup.style.display = "none";
  input.style.display = "block";
  checkBtn.style.display = "block";

  showNextWord();
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items;
}

// mostrar palavra em português
function showNextWord() {
  if (currentIndex >= data.length) {
    card.textContent = "Treino finalizado!";
    input.style.display = "none";
    checkBtn.style.display = "none";
    nextBtn.style.display = "none";
    feedback.textContent = `Você concluiu ${initialTrainingCount} vocabulários em ${data.length} tentativas.`;
    feedback.style.color = "green";
    setup.style.display = "block";
    startBtn.textContent = "Treinar novamente";
    countInput.focus();
    return;
  }

  current = data[currentIndex];
  currentIndex += 1;

  card.textContent = current[1]; // português

  input.value = "";
  input.disabled = false;

  feedback.textContent = "";
  nextBtn.style.display = "none";

  checkBtn.disabled = false;
  input.focus();
}


// verificar resposta
checkBtn.onclick = () => {
  if (!current) return;

  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = current[0].trim().toLowerCase();

  input.disabled = true;
  checkBtn.disabled = true;

  if (userAnswer === correctAnswer) {
    feedback.textContent = "✅ Correcto!";
    feedback.style.color = "green";
  } else {
    feedback.textContent = `❌ Incorrecto! Respuesta correcta: ${current[0]}`;
    feedback.style.color = "red";
    data.push(current);
  }

  nextBtn.style.display = "block";
};


// próxima palavra
nextBtn.onclick = () => {
  showNextWord();
};

studentSelect.onchange = () => {
  if (!studentSelect.value) {
    card.textContent = "Selecione um aluno";
    countInput.value = "";
    countInput.placeholder = "Selecione um aluno";
    countInput.disabled = true;
    startBtn.disabled = true;
    return;
  }

  loadSheet(studentSelect.value);
};

startBtn.onclick = () => {
  startTraining();
};

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  if (setup.style.display !== "none") {
    startBtn.click();
    return;
  }

  if (nextBtn.style.display !== "none") {
    nextBtn.click();
  } else {
    checkBtn.click();
  }
});
