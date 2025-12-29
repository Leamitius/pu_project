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



fetch("api.php?action=get_all_sets")
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById("lernsets");

    data.data.forEach(ele => {
      // col
      const col = document.createElement("div");
      col.className = "col-md-4";

      // card
      const card = document.createElement("div");
      card.className = "card h-100 shadow-sm";

      // card body
      const body = document.createElement("div");
      body.className = "card-body";

      // title
      const title = document.createElement("h5");
      title.className = "card-title";
      title.textContent = ele.title; // z.B. "Lernset 2"

      // text
      const text = document.createElement("p");
      text.className = "card-text";
      text.textContent = ele.description;

      // button
      const btn = document.createElement("button");
      btn.className = "btn btn-primary";
      btn.textContent = "Öffnen";
      btn.onclick = () => openQuiz(ele.slug); // oder ele.id

      // zusammenbauen
      body.appendChild(title);
      body.appendChild(text);
      body.appendChild(btn);

      card.appendChild(body);
      col.appendChild(card);
      grid.appendChild(col);
    });
  });
