function openQuiz(slug) {
    window.location.href = `/learnsets/${slug}`;
}


document.addEventListener("DOMContentLoaded", () => {
    fetch("/api.php?action=get_public_learnsets")
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
                btn.textContent = "Open";
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
});