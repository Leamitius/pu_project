

let lernsets;

fetch("https://pihezigo.myhostpoint.ch/lernset/api.php?action=get_all")
    .then(res => res.json())
    .then(data => {
        data.data.forEach(ele => {
            const grid = document.getElementById("grid");

            box = document.createElement("div");
            box.classList.add("box")

            text = document.createElement("p");
            text.innerHTML = ele.description;

box.appendChild(text);
            grid.appendChild(box);
        });
    })
   