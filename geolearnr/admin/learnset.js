let currentLearnsetId;
let questions = [];

const pathParts = window.location.pathname.split("/").filter(Boolean);
console.log(pathParts)
// expected: ["learnsets", "a"]
if (pathParts.length < 3 || pathParts[1] !== "learnset") {
    console.error("Invalid learnset URL");
    document.body.innerHTML = "Learnset not found";
    throw new Error("Invalid URL");
}

const slug = pathParts[2];
console.log(slug)

if (!slug) {
    alert("No slug provided");
}


document.getElementById("learnset-title").textContent =
    "Lade Learnset...";


fetch(`/api.php?action=get_questions_by_slug&slug=${slug}`)
    .then(res => res.json())
    .then(data => {
        if (data.status !== "success") return;

        document.getElementById("learnset-title").textContent =
            data.learnset.title;
        currentLearnsetId = data.learnset.learnset_id;


        questions = data.questions;
        renderQuestions();
    });


function renderQuestions() {
    const list = document.getElementById("question-list");
    list.innerHTML = "";

    questions.forEach(q => {
        const item = document.createElement("div");
        item.className = "list-group-item";

        item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
            <strong>${q.question_text}</strong><br>
            <small class="text-muted">${q.answer_country}</small><br>
            ${q.image ? `<img src="${q.image}" class="img-fluid mt-2" style="max-height:120px">` : ""}
            </div>
            <div>
            <button class="btn btn-sm btn-primary" onclick="editQuestion(${q.question_id})">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${q.question_id})">🗑️</button>
            </div>
        </div>
        `;


        list.appendChild(item);
    });
}

function openEditQuestionForm(q) {
    // TODO: Popup mit Frage editieren
}

function editQuestion(id) {
    const q = questions.find(x => x.question_id == id);
    if (!q) return;

    const form = `
    <div class="border p-3">
      <input id="edit-text" class="form-control mb-2" value="${q.question_text}">
      <input id="edit-answer" class="form-control mb-2" value="${q.answer_country}">

      ${q.image ? `
        <div class="mb-2">
          <img src="${q.image}" class="img-fluid mb-2" style="max-height:150px"><br>
          <input type="checkbox" id="remove-image"> Bild entfernen
        </div>
      ` : ""}

      <input type="file" id="edit-image" class="form-control mb-2">

      <button class="btn btn-success" onclick="saveEdit(${id})">Speichern</button>
      <button class="btn btn-secondary ms-2" onclick="renderQuestions()">Abbrechen</button>
    </div>
  `;

    document.getElementById("question-list").innerHTML = form;
}


function saveEdit(id) {
    const text = document.getElementById("edit-text").value;
    const answer = document.getElementById("edit-answer").value;
    const imageFile = document.getElementById("edit-image").files[0];
    const removeImage = document.getElementById("remove-image")?.checked ? 1 : 0;

    const formData = new FormData();
    formData.append("action", "update_question");
    formData.append("question_id", id);
    formData.append("position", 0);
    formData.append("question_text", text);
    formData.append("answer_country", answer);
    formData.append("remove_image", removeImage);

    if (imageFile) {
        formData.append("image", imageFile);
    }
    console.log({
  id,
  text,
  answer,
  removeImage
});

    fetch("/api.php?action=update_question", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(() => loadQuestions());
}


function deleteQuestion(id) {
    fetch(`/api.php?action=delete_question&question_id=${id}`, {
        method: "POST"
    })
        .then(res => res.json())
        .then(() => loadQuestions());
}

function showAddQuestionForm() {
    const form = `
        <div class="border p-3 mb-3">
        <input id="new-text" class="form-control mb-2" placeholder="Frage">
        <input id="new-answer" class="form-control mb-2" placeholder="Antwort-Land">
        <input type="file" id="new-image" class="form-control mb-2">
        <button class="btn btn-success" onclick="addQuestion()">Hinzufügen</button>
        </div>
        `;
    document.getElementById("question-list").insertAdjacentHTML("afterbegin", form);
}

function addQuestion() {
    const text = document.getElementById("new-text").value;
    const answer = document.getElementById("new-answer").value;
    const image = document.getElementById("new-image").files[0];

    const formData = new FormData();
    formData.append("action", "add_question");
    formData.append("learnset_id", currentLearnsetId);
    formData.append("position", 0);
    formData.append("question_text", text);
    formData.append("answer_country", answer);

    if (image) {
        formData.append("image", image);
    }

    fetch("/api.php?action=add_question", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            loadQuestions();
        });
}


function loadQuestions() {
    fetch(`/api.php?action=get_questions_by_slug&slug=${slug}`)
        .then(res => res.json())
        .then(data => {
            questions = data.questions;
            renderQuestions();
        });
}
