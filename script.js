let sentences = [];
let acertos = 0;
let total = 0;

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const nextBtn = document.getElementById("nextBtn");

// NOVO
let selectedOption = null;
let currentQuestion = null;

// carregar JSON
fetch("sentences.json")
  .then(res => res.json())
  .then(data => {
    sentences = data;
    loadRandomQuestion();
  });

// embaralhar array
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function loadRandomQuestion() {
// reset
  nextBtn.style.display = "none";
  submitBtn.disabled = false;
  submitBtn.style.opacity = "1";
  submitBtn.style.background = ""; // Remove a cor fixa para voltar ao gradiente do CSS
  submitBtn.textContent = "🚀 Enviar";

  const randomIndex = Math.floor(Math.random() * sentences.length);
  currentQuestion = sentences[randomIndex];

  // mostra frase com blank
  questionEl.textContent = currentQuestion.sentence;

  optionsEl.innerHTML = "";
  selectedOption = null;

  // embaralhar opções
  const shuffledOptions = shuffle([...currentQuestion.options]);

  shuffledOptions.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;

    btn.onclick = () => {
      // limpa seleção anterior
      document.querySelectorAll(".options button").forEach(b => {
        b.classList.remove("selected");
      });

      btn.classList.add("selected");
      selectedOption = option;
      questionEl.textContent = currentQuestion.sentence.replace("___", selectedOption);
    };

    optionsEl.appendChild(btn);
  });
}

// BOTÃO ENVIAR
const submitBtn = document.createElement("button");
submitBtn.id = "submitBtn";
submitBtn.textContent = "🚀 Enviar";

submitBtn.onclick = () => {
  if (!selectedOption) {
    alert("Escolhe uma opção primeiro!");
    return;
  }

  total++;

  questionEl.textContent = currentQuestion.sentence.replace("___", currentQuestion.correct);

  const buttons = document.querySelectorAll(".options button");

  buttons.forEach(btn => {
    // ADICIONE ESTA LINHA ABAIXO:
    btn.classList.remove("selected"); 

    if (btn.textContent === currentQuestion.correct) {
      btn.classList.add("correct");
    } else if (btn.textContent === selectedOption) {
      btn.classList.add("wrong");
    }
    btn.disabled = true;
  });

  // FEEDBACK VISUAL NO BOTÃO
  if (selectedOption === currentQuestion.correct) {
    submitBtn.textContent = "✔️ Correto!";
    submitBtn.style.background = "#4CAF50"; // Verde
    acertos++;
  } else {
    submitBtn.textContent = `❌ Errado!`;
    submitBtn.style.background = "#e74c3c"; // Vermelho
  }

  document.getElementById("score").textContent = `Placar: ${acertos} / ${total}`;

  submitBtn.disabled = true;
  submitBtn.style.opacity = "1"; // Mantém a cor viva para o feedback
  nextBtn.style.display = "block"; 
};

// adiciona botão na tela
document.querySelector(".container").insertBefore(submitBtn, nextBtn);

// próxima pergunta
nextBtn.addEventListener("click", loadRandomQuestion);