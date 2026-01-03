let currentQuestionIndex = 0;
let questions = [];
let selectedFeature = null;
let map;
let submitted;

let minimap;

// 🔁 EDIT THIS
const MAP_ID = "df542bd3de8453454abd37a7";
const ADM0_DATASET_ID = "6b8b5272-c783-4f1b-b539-2bdd3a508a14";

const DEFAULT_MAP_CENTER = { lat: 20, lng: 0 };
const DEFAULT_MAP_ZOOM = 2;
const pathParts = window.location.pathname.split("/").filter(Boolean);
let selectedCountryCode = null;
let answered = false;

let countries = {};
fetch("https://geolearnr.ch/countries_by_iso2.json")
    .then(res => res.json())
    .then(data => {
        countries = data;
        console.log(countries["DE"].names.en); // Germany
        console.log(countries["DE"].names.de); // Deutschland
    })
    .catch(err => console.warn("Could not load countries JSON:", err));

// expected: ["learnsets", "a"]
if (pathParts.length < 2 || pathParts[0] !== "learnsets") {
    console.error("Invalid learnset URL");
    document.body.innerHTML = "Learnset not found";
    throw new Error("Invalid URL");
}

let stats = {
    total: 0,
    correct: 0,
    wrong: [],
};


// submit answer on space
document.addEventListener("keydown", function (e) {
    if (e.key === " ") {
        e.preventDefault();
        if (submitted) {
            nextQuestion();
        } else {
            submitAnswer();
        }
    }
});

document.getElementById("submit-btn").addEventListener("click", function () {
    submitAnswer()
});

const slug = pathParts[1];

console.log("SLUG:", slug); // ✅ "a"
const STORAGE_KEY = `geolearnr_progress_${slug}`;

function saveProgress() {
    const data = {
        currentQuestionIndex,
        questions,
        stats
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearProgress() {
    localStorage.removeItem(STORAGE_KEY);
}


// ---------------- LOAD QUESTIONS ----------------
fetch(`/api.php?action=get_questions_by_slug&slug=${encodeURIComponent(slug)}`)
    .then(res => res.json())
    .then(data => {

        const savedRaw = localStorage.getItem(STORAGE_KEY);

        if (savedRaw) {
            showResumeDialog(JSON.parse(savedRaw), data.questions);
        } else {
            startNewGame(data.questions);
        }
    });
function startNewGame(freshQuestions) {
    questions = freshQuestions.sort(() => Math.random() - 0.5);
    currentQuestionIndex = 0;
    stats = { total: 0, correct: 0, wrong: [] };
    showQuestion(0);
}
function resumeGame(saved) {
    questions = saved.questions;
    stats = saved.stats;
    currentQuestionIndex = saved.currentQuestionIndex;
    showQuestion(currentQuestionIndex);
}


function updateProgressUI() {
    const el = document.getElementById("progress-indicator");
    if (!el) return;

    el.textContent =
        `Frage ${currentQuestionIndex + 1} / ${questions.length} · ` +
        `Richtig: ${stats.correct}`;
}



function showResumeDialog(saved, freshQuestions) {

    document.getElementById("quiz-page").classList.add("d-none");
    document.getElementById("analysis-page")?.classList.add("d-none");
    document.getElementById("minimap-container").classList.add("d-none");

    const page = document.getElementById("resume-page");
    page.classList.remove("d-none");

    document.getElementById("resume-info").innerHTML = `
        Frage <strong>${saved.currentQuestionIndex + 1}</strong>
        von <strong>${saved.questions.length}</strong><br>
        ✅ ${saved.stats.correct} richtig
    `;

    document.getElementById("resume-btn").onclick = () => {
        page.classList.add("d-none");
        document.getElementById("quiz-page").classList.remove("d-none");
        resumeGame(saved);
    };

    document.getElementById("restart-btn").onclick = () => {
        clearProgress();
        page.classList.add("d-none");
        document.getElementById("quiz-page").classList.remove("d-none");
        startNewGame(freshQuestions);
    };
}


// ---------------- SHOW QUESTION ----------------
function showQuestion(index) {
    const q = questions[index];
    if (!q) return;

    updateProgressUI();
    document.getElementById("minimap-container").classList.remove("d-none");



    document.getElementById("question-text").textContent = q.question_text || "";
    document.getElementById("answer-feedback").textContent = "";
    document.getElementById("answer-text").textContent = "";
    document.getElementById("submit-btn").classList.remove("d-none");
    document.getElementById("next-btn").classList.add("d-none");

    const img = document.getElementById("question-image");
    if (q.image) {
        img.src = q.image;
        img.classList.remove("d-none");
    } else {
        img.classList.add("d-none");
    }

    resetMapSelection();
    resetMapView();
}

function submitAnswer() {
    if (submitted) return;
    if (!selectedFeature) return;

    const q = questions[currentQuestionIndex];
    const selectedCode = selectedFeature.getProperty("iso_a2_eh");
    const correct = selectedCode === q.answer_country;

    const feedback = document.getElementById("answer-feedback");

    stats.total++;

    if (correct) {
        stats.correct++;

        feedback.textContent = "✅ Richtig!";
        feedback.className = "text-success fw-bold";

        setTimeout(() => {
            nextQuestion();
        }, 1000);

    } else {
        stats.wrong.push({
            question: q.question_text,
            correctCountry: q.answer_country,
            correctName: countries[q.answer_country]?.names?.de,
            selected: selectedCode,
            selectedName: countries[selectedCode]?.names?.de,
            image: q.image,              // ✅
            answer_text: q.answer_text   // ✅
        });


        feedback.textContent =
            `❌ Falsch – richtig wäre: ${countries[q.answer_country].names.de}`;
        document.getElementById("answer-text").textContent = q.answer_text;
        feedback.className = "text-danger fw-bold";

        document.getElementById("submit-btn").classList.add("d-none");
        document.getElementById("next-btn").classList.remove("d-none");
    }
    submitted = true
    saveProgress();

}


// ---------------- NEXT QUESTION ----------------
function nextQuestion() {
    submitted = false

    currentQuestionIndex++;
    saveProgress();


    if (currentQuestionIndex >= questions.length) {
        showEndAnalysis();
        return;
    }


    showQuestion(currentQuestionIndex);
}

function showEndAnalysis() {
    // remove style: overflow: hidden from body
    document.body.style.overflow = "auto";

    // Quiz-UI ausblenden
    document.getElementById("minimap-container").classList.add("d-none");
    document.getElementById("quiz-page").classList.add("d-none");

    clearProgress();

    // Analyse-Seite anzeigen
    const page = document.getElementById("analysis-page");
    page.classList.remove("d-none");

    const percent = Math.round((stats.correct / stats.total) * 100);

    // ---------------- SUMMARY ----------------
    document.getElementById("analysis-summary").innerHTML = `
        <p class="fs-5">
            <strong>${stats.correct}</strong> von
            <strong>${stats.total}</strong> richtig
            (<strong>${percent}%</strong>)
        </p>
    `;

    // ---------------- WRONG LIST ----------------
    const list = document.getElementById("analysis-wrong-list");
    list.innerHTML = "";

    stats.wrong.forEach(w => {

        const col = document.createElement("div");
        col.className = "col-12 col-md-6";

        let html = `
            <div class="analysis-card">
                <h5>${w.question}</h5>

                <p class="analysis-answer analysis-wrong">
                    ❌ Deine Antwort: ${w.selectedName}
                </p>

                <p class="analysis-answer analysis-correct">
                    ✅ Richtig: ${w.correctName}
                </p>
        `;

        if (w.image) {
            html += `<img src="${w.image}" alt="">`;
        }

        if (w.answer_text) {
            html += `
                <hr>
                <p>${w.answer_text}</p>
            `;
        }

        html += `</div>`;

        col.innerHTML = html;
        list.appendChild(col);
    });

    if (stats.wrong.length === 0) {
        list.innerHTML = `
            <div class="col-12">
                <p class="text-success fw-bold fs-4">
                    🎉 Perfekt! Keine falschen Antworten.
                </p>
            </div>
        `;
    }
}



// ---------------- MAP ----------------
function resetMapSelection() {
    if (selectedFeature) {
        map.data.overrideStyle(selectedFeature, {
            fillOpacity: 0,
            strokeWeight: 0
        });
    }
    selectedFeature = null;
}

function resetMapView() {
    if (!map) return;
    try {
        map.setCenter(DEFAULT_MAP_CENTER);
        map.setZoom(DEFAULT_MAP_ZOOM);
    } catch (e) {
        console.warn("Could not reset map view:", e);
    }
}


async function initMap() {
    map = new google.maps.Map(document.getElementById("minimap"), {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        mapId: MAP_ID,
        disableDefaultUI: true
    });

    map.data.loadGeoJson("/custom.geo.json");

    map.data.setStyle({
        fillOpacity: 0,
        strokeWeight: 0
    });

    map.data.addListener("click", (e) => {
        if (selectedFeature) {
            map.data.overrideStyle(selectedFeature, {
                fillOpacity: 0,
                strokeWeight: 0
            });
        }

        selectedFeature = e.feature;
        map.data.overrideStyle(selectedFeature, {
            fillOpacity: 0.5,
            strokeWeight: 2
        });
    });
}

window.initMap = initMap;
