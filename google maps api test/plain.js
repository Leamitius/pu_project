/* global google */
let map;
let infoWindow;
let datasetLayer;

// 🔁 EDIT THESE:
const MAP_ID = "df542bd3de8453454abd37a7"; // your vector map style ID
const DATASET_ID = "2fbcbdfb-695b-4fee-b813-b1fed4b6efe2"; // your dataset (table) ID
const ONLY_SHOW_SHAPES_WITH_SHAPEGROUP = ["CHE", "DEU"]; // filter example

// Simple HTML-escape to keep InfoWindow safe.


async function initMap() {
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    zoom: 6,
    center: { lat: 51.1657, lng: 10.4515 }, // Germany
    mapId: MAP_ID,
    disableDefaultUI: true,
    clickableIcons: false
  });

  infoWindow = new InfoWindow();

}

// Expose initMap for the callback in the script URL
window.initMap = initMap;
