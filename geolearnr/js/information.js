// QUIZ-DATEN
  const quizzes = {
    mathe: [
      "Addition & Subtraktion",
      "Multiplikation",
      "Bruchrechnung"
    ],
    info: [
      "HTML Basics",
      "JavaScript Grundlagen",
      "Algorithmen"
    ],
    geschichte: [
      "Antike",
      "Mittelalter",
      "Neuzeit"
    ]
  };

  function openQuiz(subject) {
    const modal = new bootstrap.Modal(document.getElementById('quizModal'));
    const title = document.getElementById('modalTitle');
    const list = document.getElementById('quizList');

    title.innerText = "Quizze – " + subject.toUpperCase();
    list.innerHTML = "";

    quizzes[subject].forEach(q => {
      const item = document.createElement("li");
      item.className = "list-group-item d-flex justify-content-between align-items-center";
      item.innerHTML = `
        ${q}
        <button class="btn btn-sm btn-success">Start</button>
      `;
      list.appendChild(item);
    });

    modal.show();
  }