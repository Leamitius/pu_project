document.addEventListener("DOMContentLoaded", () => {

    fetch("/api.php?action=me", { credentials: "include" })
        .then(res => res.json())
        .then(data => {

            if (data.logged_in) {
                document.getElementById("userDropdown").classList.remove("d-none");
                document.getElementById("loginBtn").classList.add("d-none");

                if (data.name) {
                    document.getElementById("navUsername").textContent = data.name;
                }

                if (data.picture) {
                    const img = document.getElementById("navAvatar");
                    img.src = data.picture;
                    img.classList.remove("d-none");
                }

            } else {
                document.getElementById("userDropdown").classList.add("d-none");
                document.getElementById("loginBtn").classList.remove("d-none");
            }
        });

});


function logout() {
    fetch("/api.php?action=logout", {
        credentials: "include"
    }).then(() => {
        window.location.href = "/";
    });
}
