const pathParts = window.location.pathname.split("/").filter(Boolean);

const slug = pathParts[1];

let countries = {};

document.addEventListener("DOMContentLoaded", () => {

    fetch("https://geolearnr.ch/countries_by_iso2.json")
        .then(res => res.json())
        .then(data => {
            countries = data;
        })
        .catch(err => console.warn("Could not load countries JSON:", err));


    fetch(`/api.php?action=get_public_questions_by_slug&slug=${encodeURIComponent(slug)}`)
        .then(res => res.json())
        .then(data => {
            renderInfoPage(data.questions);
        })
        .catch(err => {
            console.error(err);
            document.getElementById("info-list").textContent =
                "Error loading questions.";
        });
});


function renderInfoPage(questions) {
    const list = document.getElementById("info-list");
    list.innerHTML = "";

    questions.forEach(q => {
        const countryName =
            countries[q.answer_country]?.names?.de ?? q.answer_country;



        const col = document.createElement("div");
        col.className = "col-12 col-md-6";

        let html = `
            <div class="info-card">
                <h5>${q.question_text}</h5>

                <p class="info-country">🌍 ${countryName}</p>

        `;

        if (q.image) {
            html += `<img src="${q.image}" alt="">`;
        }

        if (q.answer_text) {
            html += `
                <hr>
                <p>${q.answer_text}</p>
            `;
        }

        html += `</div>`;

        col.innerHTML = html;
        list.appendChild(col);
    });

    if (questions.length === 0) {
        list.innerHTML = `
            <p class="text-muted">No questions available.</p>
        `;
    }
}
