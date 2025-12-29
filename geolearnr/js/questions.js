const pathParts = window.location.pathname.split("/").filter(Boolean);

// expected: ["learnsets", "a"]
if (pathParts.length < 2 || pathParts[0] !== "learnsets") {
    console.error("Invalid learnset URL");
    document.body.innerHTML = "Learnset not found";
    throw new Error("Invalid URL");
}

const slug = pathParts[1];

console.log("SLUG:", slug); // ✅ "a"


let currentQuestionIndex = 0;
let questions = [];

fetch(`/api.php?action=get_questions_by_slug&slug=${encodeURIComponent(slug)}`)
    .then(res => res.json())
    .then(data => {
        if (data.status !== "success") return;

        questions = data.questions;

        // document.getElementById("title").textContent = data.learnset.title;
        // document.getElementById("description").textContent = data.learnset.description;

        showQuestion(0);
    });

function showQuestion(index) {
    const q = questions[index];
    if (!q) return;

    document.getElementById("question-text").textContent = q.question_text;

    // OPTIONAL: Bild (falls später vorhanden)
    const img = document.getElementById("question-image");

    if (q.image) {
        img.src = "https://geolearnr.ch"+q.image;
        console.log(q)
        img.classList.remove("d-none");
    } else {
        img.classList.add("d-none");
    }
}


let minimap;
let selectedFeature = null;

// 🔁 EDIT THIS
const MAP_ID = "df542bd3de8453454abd37a7";
const ADM0_DATASET_ID = "6b8b5272-c783-4f1b-b539-2bdd3a508a14";


async function initMap() {
    map = new google.maps.Map(document.getElementById("minimap"), {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapId: MAP_ID,
        disableDefaultUI: true,
        clickableIcons: false
    });

    // Load GeoJSON
    map.data.loadGeoJson('https://geolearnr.ch/custom.geo.json');

    // Default style
    map.data.setStyle({
        fillColor: '#FF0000',
        fillOpacity: 0.0,
        strokeColor: '#FF0000',
        strokeWeight: 0
    });

    // Click listener
    map.data.addListener('click', (event) => {
        const feature = event.feature;

        // Reset previous selection
        if (selectedFeature && selectedFeature !== feature) {
            map.data.overrideStyle(selectedFeature, {
                fillOpacity: 0.0,
                strokeWeight: 0
            });
        }

        // Toggle selection
        if (selectedFeature === feature) {
            // Deselect if clicked again
            map.data.overrideStyle(feature, { fillOpacity: 0.0, strokeWeight: 0 });
            selectedFeature = null;
        } else {
            // Highlight new feature
            map.data.overrideStyle(feature, { fillOpacity: 0.5, strokeWeight: 3 });
            selectedFeature = feature;
            console.log(feature.Fg.iso_a2_eh)
        }
    });
    // pickRandomCountry();
}


window.initMap = initMap;
