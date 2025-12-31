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
        submitAnswer()
    }
});

const slug = pathParts[1];

console.log("SLUG:", slug); // ✅ "a"

// ---------------- LOAD QUESTIONS ----------------
fetch(`/api.php?action=get_questions_by_slug&slug=${encodeURIComponent(slug)}`)
    .then(res => res.json())
    .then(data => {
        questions = data.questions;
        questions = questions.sort(() => Math.random() - 0.5);
        showQuestion(0);
    });

// ---------------- SHOW QUESTION ----------------
function showQuestion(index) {
    const q = questions[index];
    if (!q) return;

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
    if(submitted) return;
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
            correctName: countries[q.answer_country]?.names?.de ?? q.answer_country,
            selected: selectedCode,
            selectedName: countries[selectedCode]?.names?.de ?? selectedCode,
        });

        feedback.textContent =
            `❌ Falsch – richtig wäre: ${countries[q.answer_country].names.de}`;
        document.getElementById("answer-text").textContent = q.answer_text;
        feedback.className = "text-danger fw-bold";

        document.getElementById("submit-btn").classList.add("d-none");
        document.getElementById("next-btn").classList.remove("d-none");
    }
    submitted = true
}


// ---------------- NEXT QUESTION ----------------
function nextQuestion() {
        submitted = false

    currentQuestionIndex++;

    if (currentQuestionIndex >= questions.length) {
        showEndAnalysis();
        return;
    }


    showQuestion(currentQuestionIndex);
}

function showEndAnalysis() {
    const percent = Math.round((stats.correct / stats.total) * 100);

    document.getElementById("minimap-container").classList.add("d-none");
    document.getElementById("question-text").classList.add("d-none");
    document.getElementById("answer-feedback").classList.add("d-none");
    document.getElementById("answer-text").classList.add("d-none");
    document.getElementById("question-image").classList.add("d-none");
    document.getElementById("submit-btn").classList.add("d-none");
    document.getElementById("next-btn").classList.add("d-none");

    const end = document.getElementById("end-screen");
    end.classList.remove("d-none");

    let html = `
        <h2>📊 Auswertung</h2>
        <p><strong>${stats.correct}</strong> von <strong>${stats.total}</strong> richtig</p>
        <p><strong>${percent}%</strong> korrekt</p>
    `;

    if (stats.wrong.length > 0) {
        html += `<h4>❌ Falsch beantwortet:</h4><ul>`;
        stats.wrong.forEach(w => {
            html += `
                <li>
                    <strong>${w.question}</strong><br>
                    Deine Antwort: ${w.selectedName}<br>
                    Richtig: ${w.correctName}
                </li>
            `;
        });
        html += `</ul>`;
    } else {
        html += `<p class="text-success fw-bold">🎉 Alles richtig!</p>`;
    }

    end.innerHTML = html;
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
