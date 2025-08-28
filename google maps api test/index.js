/* global google */
let map;

// 🔁 EDIT THESE:
const MAP_ID = "df542bd3de8453454abd37a7"; // your vector map style ID
const ADM1 = "2fbcbdfb-695b-4fee-b813-b1fed4b6efe2"; // your dataset (table) ID
const ADM2 = "9316deaa-6aa3-4164-9f8a-3eec71cb2a54";

// Country codes per layer
const ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM1 = ["DEU", "CHE"];
const ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM2 = ["", ""];

// Styles
const styleDefault = {
    fillColor: "green",
    fillOpacity: 0.5,
    strokeColor: "white",
    strokeWeight: 1,
};
const styleHidden = {
    fillOpacity: 0,
    strokeOpacity: 0,
};
const styleDisabled = {
    fillColor: "gray",
    fillOpacity: 0.1,
    strokeColor: "darkgray",
    strokeWeight: 1,
};

// Track disabled feature IDs
const disabledFeatures = new Set();
let shapePool = [];
let currentTarget = null;

// 🔹 Load static JSON files with metadata only (no geometry)
async function loadShapeData(url, allowedGroups, datasetId) {
    const res = await fetch(url);
    const data = await res.json();

    for (const attrs of data) {
        const id = datasetId + ":" + attrs.shapeID;
        if (allowedGroups.includes(attrs.shapeGroup)) {
            shapePool.push({ id, name: attrs.shapeName });
        }
    }
}

// 🔹 Pick a random region to click
function chooseNewTarget() {
    if (!shapePool.length) {
        console.warn("Shape pool is empty!");
        document.getElementById("target").textContent = "No regions available!";
        return;
    }
    const random = shapePool[Math.floor(Math.random() * shapePool.length)];
    currentTarget = random;
    console.log(`🎯 Click: ${random.name}`);
    document.getElementById("target").textContent = `Find: ${random.name}`;
}

// 🔹 Shared style logic
function makeStyleFn(allowedShapeGroups) {
    return (params) => {
        const feature = params.feature;
        const attrs = feature?.datasetAttributes || {};
        const id = feature.datasetId + ":" + attrs.shapeID;

        if (!allowedShapeGroups.includes(attrs.shapeGroup)) {
            return styleHidden; // Not in allowed list → hide
        }
        if (disabledFeatures.has(id)) {
            return styleDisabled; // Already disabled → gray
        }
        return styleDefault; // Default green
    };
}

// 🔹 Add click interactivity
function addClickHandler(layer, allowedShapeGroups) {
    layer.addListener("mousemove", (e) => {
        map.getDiv().style.cursor = e.features?.length ? "pointer" : "";
    });

    layer.addListener("click", (e) => {
        if (!e.features?.length) return;

        const f = e.features[0];
        const attrs = f.datasetAttributes || {};
        const id = f.datasetId + ":" + attrs.shapeID;

        if (!allowedShapeGroups.includes(attrs.shapeGroup)) return;

        // ✅ If correct region clicked
        if (currentTarget && id === currentTarget.id) {
            console.log(`✅ Correct! You found ${currentTarget.name}`);

            disabledFeatures.add(id); // mark as disabled
            shapePool = shapePool.filter((s) => s.id !== id); // remove from pool

            layer.style = layer.style; // refresh rendering
            chooseNewTarget(); // next target
        } else {
            console.log(`❌ Incorrect. Try again!`, attrs.shapeName, id);
        }
    });
}

// 🔹 Initialize map
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: { lat: 30.137154, lng: -20.576124 },
        zoom: 3,
        mapId: MAP_ID,
        disableDefaultUI: true,
        clickableIcons: false,
    });

    const adm1 = map.getDatasetFeatureLayer(ADM1);
    const adm2 = map.getDatasetFeatureLayer(ADM2);

    adm1.style = makeStyleFn(ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM1);
    adm2.style = makeStyleFn(ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM2);

    addClickHandler(adm1, ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM1);
    addClickHandler(adm2, ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM2);

    map.addListener("mousemove", () => {
        map.getDiv().style.cursor = "";
    });

    // 🔹 Load ADM1 + ADM2 metadata first
    await loadShapeData("stripedadm1.json", ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM1, ADM1);
    await loadShapeData("stripedadm2.json", ONLY_SHOW_SHAPES_WITH_SHAPEGROUP_ADM2, ADM2);

    chooseNewTarget();
}

window.initMap = initMap;
