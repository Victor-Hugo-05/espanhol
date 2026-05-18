let data = [];
let current = null;

const card = document.getElementById("card");

// vamos criar UI dinamicamente
const container = document.querySelector(".container");

// INPUT
const input = document.createElement("input");
input.type = "text";
input.placeholder = "Escribe en español...";
input.id = "answerInput";

// BOTÃO CHECK
const checkBtn = document.createElement("button");
checkBtn.textContent = "✔ Verificar";

// BOTÃO NEXT
const nextBtn = document.createElement("button");
nextBtn.textContent = "➡ Siguiente";
nextBtn.style.display = "none";

// FEEDBACK
const feedback = document.createElement("div");
feedback.style.marginTop = "15px";
feedback.style.fontWeight = "bold";

// adicionar elementos na tela
container.appendChild(input);
container.appendChild(checkBtn);
container.appendChild(feedback);
container.appendChild(nextBtn);

// URL da planilha
const URL = "https://docs.google.com/spreadsheets/d/16txR-uMm-5p0ZdVVW-A099DFwSnBl-iijjEUNqkZtd0/gviz/tq?tqx=out:csv";

// carregar CSV
fetch(URL)
  .then(res => res.text())
  .then(text => {
    data = parseCSV(text).slice(1);
    data = data.filter(row => row.length >= 2 && row[1]);

    console.log("Dados carregados:", data);

    showRandomWord();
  });


// parser robusto
function parseCSV(text) {
  return text
    .trim()
    .split("\n")
    .map(row =>
      row
        .split(",")
        .map(cell =>
          cell
            .replace(/^"|"$/g, "")
            .replace(/""/g, '"')
            .trim()
        )
    );
}


// mostrar palavra em português
function showRandomWord() {
  const randomIndex = Math.floor(Math.random() * data.length);
  current = data[randomIndex];

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
  }

  nextBtn.style.display = "block";
};


// próxima palavra
nextBtn.onclick = () => {
  showRandomWord();
};

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;

  if (nextBtn.style.display !== "none") {
    nextBtn.click();
  } else {
    checkBtn.click();
  }
});