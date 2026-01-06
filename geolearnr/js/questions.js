let currentQuestionIndex = 0;
let questions = [];
let selectedFeature = null;
let map;
let submitted;
let wronganswer;
let answered = false;

let minimap;

// 🔁 EDIT THIS
const MAP_ID = "df542bd3de8453454abd37a7";
const ADM0_DATASET_ID = "6b8b5272-c783-4f1b-b539-2bdd3a508a14";

const DEFAULT_MAP_CENTER = { lat: 20, lng: 0 };
const DEFAULT_MAP_ZOOM = 2;

const pathParts = window.location.pathname.split("/").filter(Boolean);
let selectedCountryCode = null;

let countries = {};

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
        if (wronganswer) {
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
document.addEventListener("DOMContentLoaded", () => {
    fetch("https://geolearnr.ch/countries_by_iso2.json")
        .then(res => res.json())
        .then(data => {
            countries = data;
            console.log(countries["DE"].names.en); // Germany
            console.log(countries["DE"].names.de); // Deutschland
        })
        .catch(err => console.warn("Could not load countries JSON:", err));


    fetch(`/api.php?action=get_public_questions_by_slug&slug=${encodeURIComponent(slug)}`)
        .then(res => {
            if (res.status === 403) {
                window.location.href = "https://geolearnr.ch/learnsets";
                return;
            }
            if (res.status === 404) {
                window.location.href = "https://geolearnr.ch/learnsets";
                return;
            }
            return res.json();
        })
        .then(data => {
            if (!data || data.status !== "success") return;

            const savedRaw = localStorage.getItem(STORAGE_KEY);

            if (savedRaw) {
                showResumeDialog(JSON.parse(savedRaw), data.questions);
            } else {
                startNewGame(data.questions);
            }
        });
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
        `Question ${currentQuestionIndex + 1} / ${questions.length} · ` +
        `Correct: ${stats.correct}`;
}


function showResumeDialog(saved, freshQuestions) {

    document.getElementById("quiz-page").classList.add("d-none");
    document.getElementById("analysis-page")?.classList.add("d-none");
    document.getElementById("minimap-container").classList.add("d-none");

    const page = document.getElementById("resume-page");
    page.classList.remove("d-none");

    document.getElementById("resume-info").innerHTML = `
        Question <strong>${saved.currentQuestionIndex + 1}</strong>
        of <strong>${saved.questions.length}</strong><br>
        ✅ ${saved.stats.correct} correct
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

    // ➤ Mehrere richtige Länder erlauben
    const correctCountries = q.answer_country
        .split(",")
        .map(c => c.trim());

    const correct = correctCountries.includes(selectedCode);

    const feedback = document.getElementById("answer-feedback");

    stats.total++;

    if (correct) {
        stats.correct++;

        feedback.textContent = "✅ Correct!";
        feedback.className = "text-success fw-bold";

        setTimeout(() => {
            nextQuestion();
        }, 1000);

    } else {
        wronganswer = true;

        // ➤ Alle korrekten Ländernamen übersetzen
        const correctNames = correctCountries
            .map(code => countries[code]?.names?.en || countries[code]?.names?.de)
            .filter(Boolean)
            .join(", ");

        stats.wrong.push({
            question: q.question_text,
            correctCountry: correctCountries,   // jetzt Array
            correctName: correctNames,          // übersetzt
            selected: selectedCode,
            selectedName: countries[selectedCode]?.names?.de,
            image: q.image,
            answer_text: q.answer_text
        });

        feedback.textContent =
            `❌ Wrong – correct would be: ${correctNames}`;
        document.getElementById("answer-text").textContent = q.answer_text;
        feedback.className = "text-danger fw-bold";

        document.getElementById("submit-btn").classList.add("d-none");
        document.getElementById("next-btn").classList.remove("d-none");
    }

    submitted = true;
    saveProgress();
}



// ---------------- NEXT QUESTION ----------------
function nextQuestion() {
    wronganswer = false;
    submitted = false;

    currentQuestionIndex++;
    saveProgress();

    if (currentQuestionIndex >= questions.length) {
        showEndAnalysis();
        return;
    }

    showQuestion(currentQuestionIndex);
}

function showEndAnalysis() {
    document.body.style.overflow = "auto";

    // Quiz-UI ausblenden
    document.getElementById("minimap-container").classList.add("d-none");
    document.getElementById("quiz-page").classList.add("d-none");

    clearProgress();

    // Analyse-Seite anzeigen
    const page = document.getElementById("analysis-page");
    page.classList.remove("d-none");

    const percent = Math.round((stats.correct / stats.total) * 100);

    document.getElementById("analysis-summary").innerHTML = `
        <p class="fs-5">
            <strong>${stats.correct}</strong> of
            <strong>${stats.total}</strong> correct
            (<strong>${percent}%</strong>)
        </p>
    `;

    const list = document.getElementById("analysis-wrong-list");
    list.innerHTML = "";

    stats.wrong.forEach(w => {

        const col = document.createElement("div");
        col.className = "col-12 col-md-6";

        let html = `
            <div class="analysis-card">
                <h5>${w.question}</h5>

                <p class="analysis-answer analysis-wrong">
                    ❌ Your answer: ${w.selectedName}
                </p>

                <p class="analysis-answer analysis-correct">
                    ✅ Correct: ${Array.isArray(w.correctCountry)
                ? w.correctCountry.map(code => countries[code]?.names?.en || countries[code]?.names?.de).join(", ")
                : (countries[w.correctCountry]?.names?.en || countries[w.correctCountry]?.names?.de)}
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
                    🎉 Perfect! No wrong answers.
                </p>
            </div>
        `;
    }
}


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