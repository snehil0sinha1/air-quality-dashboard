// Initialize Leaflet map
let map = L.map("map").setView([20.59, 78.96], 5); // Default center: India

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

// Initialize cluster groups
let allCluster = L.markerClusterGroup();
let searchCluster = L.markerClusterGroup();

map.addLayer(allCluster);
map.addLayer(searchCluster);

// Store all records globally
let allRecords = [];
let currentCityRecords = [];
let userMarker = null;

// Function to get AQI color
function getAQIColor(aqi) {
  if (aqi === null || isNaN(aqi)) return "gray";
  if (aqi <= 50) return "green";
  else if (aqi <= 100) return "yellow";
  else if (aqi <= 200) return "orange";
  else if (aqi <= 300) return "red";
  else if (aqi <= 400) return "purple";
  else return "black";
}

// Add marker to cluster group
function addMarker(record, clusterGroup) {
  let lat = parseFloat(record.latitude);
  let lon = parseFloat(record.longitude);
  let aqi =
    record.pollutant_avg !== null ? parseInt(record.pollutant_avg) : null;

  if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

  let marker = L.circleMarker([lat, lon], {
    color: getAQIColor(aqi),
    fillColor: getAQIColor(aqi),
    fillOpacity: 0.6,
    radius: 8,
  });

  marker.bindPopup(`
    <b>${record.city}</b> (${record.state})<br>
    Station: ${record.station || "N/A"}<br>
    Pollutant: ${record.pollutant_id || "N/A"}<br>
    AQI (avg): ${aqi !== null ? aqi : "N/A"}<br>
    Min: ${record.pollutant_min !== null ? record.pollutant_min : "N/A"}<br>
    Max: ${record.pollutant_max !== null ? record.pollutant_max : "N/A"}<br>
    Last Update: ${record.last_update || "N/A"}
  `);

  clusterGroup.addLayer(marker);
}

// Fetch all stations
async function fetchAllStations() {
  try {
    let response = await fetch("http://127.0.0.1:5000/airquality/all");
    let data = await response.json();
    if (data.records && data.records.length > 0) {
      allRecords = data.records;
      allRecords.forEach((record) => addMarker(record, allCluster));
    }
  } catch (err) {
    console.error("Error fetching all stations:", err);
  }
}

// Search city
async function searchCity(inputCity = null) {
  let city = inputCity || document.getElementById("searchBox").value.trim();
  if (!city) return alert("Enter a city name!");

  // Capitalize first letter of each word in city
  city = city
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  searchCluster.clearLayers();
  currentCityRecords = [];

  // Geocode city to normalize
  try {
    let geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
      )},India&format=json&addressdetails=1&limit=1`
    );
    let geoData = await geoRes.json();
    if (geoData && geoData.length > 0 && geoData[0].address) {
      city =
        geoData[0].address.city ||
        geoData[0].address.town ||
        geoData[0].address.village ||
        city;
    }
  } catch (err) {
    console.error("Geocoding error:", err);
  }

  try {
    let response = await fetch(
      `http://127.0.0.1:5000/airquality?city=${encodeURIComponent(city)}`
    );
    let data = await response.json();

    if (data.records && data.records.length > 0) {
      currentCityRecords = data.records;
      currentCityRecords.forEach((record) => addMarker(record, searchCluster));

      let first = currentCityRecords[0];
      map.setView([first.latitude, first.longitude], 12);
    } else {
      alert(`No data found for ${city}`);
    }
  } catch (err) {
    console.error("Backend fetch error:", err);
    alert(`Failed to fetch AQI for ${city}`);
  }
}

// Detect user location
function detectLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;

      // Add/update user marker
      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      })
        .bindPopup("<b>Your Location</b>")
        .addTo(map);

      try {
        let geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
        );
        let geoData = await geoRes.json();
        let city =
          geoData.address.city ||
          geoData.address.town ||
          geoData.address.village;

        if (city) await searchCity(city); // Load city data
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      }
    });
  }
}

// Pollutant filter
function applyPollutantFilter() {
  let pollutant = document.getElementById("pollutantFilter").value;
  let bounds = map.getBounds();

  allCluster.clearLayers();
  searchCluster.clearLayers();

  // Filter all stations
  allRecords
    .filter(
      (r) =>
        r.latitude &&
        r.longitude &&
        (pollutant === "all" || r.pollutant_id === pollutant) &&
        bounds.contains([r.latitude, r.longitude])
    )
    .forEach((record) => addMarker(record, allCluster));

  // Filter current city
  currentCityRecords
    .filter(
      (r) =>
        r.latitude &&
        r.longitude &&
        (pollutant === "all" || r.pollutant_id === pollutant) &&
        bounds.contains([r.latitude, r.longitude])
    )
    .forEach((record) => addMarker(record, searchCluster));

  // Keep user marker visible
  if (userMarker) userMarker.addTo(map);
}

// Update markers on map move/zoom
map.on("moveend", applyPollutantFilter);

// AQI Legend
let legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
  let div = L.DomUtil.create("div", "info legend");
  let ranges = [
    { limit: 50, label: "Good", color: "green" },
    { limit: 100, label: "Satisfactory", color: "yellow" },
    { limit: 200, label: "Moderate", color: "orange" },
    { limit: 300, label: "Poor", color: "red" },
    { limit: 400, label: "Very Poor", color: "purple" },
    { limit: 500, label: "Severe", color: "black" },
    { limit: null, label: "Unknown", color: "gray" },
  ];

  div.innerHTML = "<h4>AQI Levels</h4>";
  ranges.forEach((r) => {
    div.innerHTML += `<i style="background:${
      r.color
    }; width:18px; height:18px; display:inline-block; margin-right:5px;"></i> ${
      r.label
    } ${r.limit !== null ? `(0–${r.limit})` : ""}<br>`;
  });

  return div;
};
legend.addTo(map);

// Initialize
window.onload = async () => {
  await fetchAllStations();
  detectLocation();
};
