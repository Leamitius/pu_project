// -------------------------
// LOAD LEARNSETS
// -------------------------
function loadLearnsets() {
    fetch("/api.php?action=get_all_sets", {
        credentials: "include"
    })
        .then(res => {
            if (res.status === 401 || res.status === 403) {
                window.location.href = "/";
                return;
            }
            return res.json();
        })
        .then(data => {
            if (!data || data.status !== "success") return;

            const list = document.getElementById("learnset-list");
            list.innerHTML = "";
            document.getElementById("admin-content").classList.remove("d-none");


            data.data.forEach(ls => {
                const item = document.createElement("div");
                item.className =
                    "list-group-item d-flex justify-content-between align-items-center";

                item.innerHTML = `
                <div>
                    <strong>${ls.title}</strong><br>
                    <small class="text-muted">${ls.description ?? ""}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-primary me-1"
                        onclick='editLearnset(${JSON.stringify(ls)})'>✏️</button>
                    <button class="btn btn-sm btn-danger me-1"
                        onclick="deleteLearnset(${ls.learnset_id})">🗑</button>
                    <button class="btn btn-sm btn-success"
                        onclick="openLearnset('${ls.slug}')">➡</button>
                    <button class="btn btn-sm ${ls.state === "visible" ? "btn-warning" : "btn-secondary"} me-1"
                        onclick="toggleVisibility(${ls.learnset_id})">
                        ${ls.state === "visible" ? "👁️ sichtbar" : "🙈 versteckt"}
                    </button>


                </div>
            `;

                list.appendChild(item);
            });
        });
}


function toggleVisibility(learnsetId) {
    fetch("/api.php?action=toggle_visibility", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "learnset_id=" + encodeURIComponent(learnsetId)
    })
    .then(res => {
        if (!res.ok) {
            console.error("HTTP error", res.status);
        }
        return res.json();
    })
    .then(data => {
        console.log("toggle_visibility response:", data);
        if (data && data.status === "success") {
            loadLearnsets(); // Liste neu laden
        }
    })
    .catch(err => {
        console.error("Fetch error:", err);
    });
}



function handleGoogleLogin(response) {
    const formData = new FormData();
    formData.append("id_token", response.credential);

    fetch("/api.php?action=google_login", {
        method: "POST",
        body: formData,
        credentials: "include"
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                initAdmin();
            } else {
                alert("Login fehlgeschlagen");
            }
        });
}

function initAdmin() {
    document.getElementById("login-container").classList.add("d-none");
    document.getElementById("admin-content").classList.remove("d-none");
    loadLearnsets();
}


// function checkLogin() {
//     fetch("/api.php?action=me",{

//             credentials: "include"
//     })
//         .then(res => res.json())
//         .then(data => {
//             if (data.logged_in) {
//                 initAdmin();
//             }
//         });
// }

// checkLogin();

loadLearnsets()


// -------------------------
// OPEN LEARNSET
// -------------------------
function openLearnset(slug) {
    window.location.href = `/admin/learnset/${slug}`;
}

// -------------------------
// CREATE LEARNSET
// -------------------------
function createLearnset() {
    const formData = new FormData();
    formData.append("action", "create_learnset");
    formData.append("title", document.getElementById("title").value);
    formData.append("description", document.getElementById("description").value);

    fetch("/api.php?action=create_learnset", {
        method: "POST",
        body: formData,
        credentials: "include"
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                // 👉 DIREKT ÖFFNEN
                window.location.href = `/admin/learnset/${data.slug}`;
            }
        });
}

// -------------------------
// EDIT LEARNSET
// -------------------------
function editLearnset(ls) {
    document.getElementById("edit-id").value = ls.learnset_id;
    document.getElementById("edit-title").value = ls.title || "";
    document.getElementById("edit-description").value = ls.description || "";

    new bootstrap.Modal(
        document.getElementById("modal-edit-learnset")
    ).show();
}

function saveLearnsetEdit() {
    const formData = new FormData();
    formData.append("action", "update_learnset");
    formData.append("learnset_id", document.getElementById("edit-id").value);
    formData.append("title", document.getElementById("edit-title").value);
    formData.append("description", document.getElementById("edit-description").value);

    fetch("/api.php?action=update_learnset", {
        method: "POST",
        body: formData,
        credentials: "include"

    })
        .then(res => res.json())
        .then(() => loadLearnsets());
}

// -------------------------
// DELETE LEARNSET
// -------------------------
function deleteLearnset(id) {
    if (!confirm("Learnset wirklich löschen?")) return;

    fetch(`/api.php?action=delete_learnset&learnset_id=${id}`, {
        method: "POST",
        credentials: "include"
    })
        .then(res => res.json())
        .then(() => loadLearnsets());
}

// loadLearnsets();

// function logout() {
//     fetch("/api.php?action=logout", {
//         credentials: "include"
//     }).then(() => location.reload());
// }
