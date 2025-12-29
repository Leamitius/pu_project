// -------------------------
// LOAD LEARNSETS
// -------------------------
function loadLearnsets() {
    fetch("/api.php?action=get_all_sets")
        .then(res => res.json())
        .then(data => {
            if (data.status !== "success") return;

            const list = document.getElementById("learnset-list");
            list.innerHTML = "";

            data.data.forEach(ls => {
                const item = document.createElement("div");
                item.className = "list-group-item d-flex justify-content-between align-items-center";

                item.innerHTML = `
                  <span>${ls.title}</span>
                  <button class="btn btn-primary btn-sm" onclick="openLearnset('${ls.slug}')">
                    Öffnen
                  </button>
                `;
                list.appendChild(item);
            });
        });
}

function openLearnset(slug) {
    window.location.href = `/admin/learnset/${slug}`;
}


loadLearnsets();