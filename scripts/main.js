const urlGoogleSheetsCountyData =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQmSMF1E9fVbZKgkrB4TQj7gpk8najaEEcD8YtsOIUXLPAXMXoEzCT-Ao6E4xkXcY9vwBmClJLahT-2/pub?output=csv";

function getCountyData() {
  Papa.parse(urlGoogleSheetsCountyData, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      mapCountyData = results.data;

      let sheetColumns = Object.keys(mapCountyData[0]);

      geojsonCounties.features.map((geoJsonItem) => {
        let countyName = geoJsonItem.properties.NAME;
        let filteredCsvData = mapCountyData.filter(function (e) {
          return e.County === countyName;
        });

        sheetColumns.forEach((col, i) => {
          geoJsonItem.properties[col] = filteredCsvData[0][col];
        });
      });

      console.log(geojsonCounties)

      drawMap();
    },
  });
}

getCountyData();

function drawMap() {
  let map = L.map("map", {
    fullScreenControl: true,
    zoomSnap: 0.1,
  }).setView([40.2685, -82.849], 7.9);

  const fsControl = L.control.fullscreen();
  map.addControl(fsControl);

  map.on("enterFullscreen", function () {});
  map.on("exitFullscreen", function () {});

  let popupStyle = {
    closeButton: false,
  };

  function styleCounty(feature) {
    return {
      color: "#000000",
      fillColor: feature.properties["Color Code"],
      fillOpacity: 1,
      opacity: 1,
      weight: 0.5,
    };
  }

  function styleAreas(feature) {
    return {
      color: "#000000",
      opacity: 1,
      weight: 3,
    };
  }

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      color: "#000000",
      fillColor: "#222222",
      fillOpacity: 0.5,
      opacity: 1,
      weight: 1,
    });
  }

  let layerCounties;
  let colorVisited;
  let colorNotVisited;

  function resetHighlightCounties(e) {
    layerCounties.resetStyle(e.target);
  }

  function onEachFeatureCounties(feature, layer) {
    let tooltipContent = feature.properties.NAME;
    layer.bindTooltip(tooltipContent, {
      permanent: true,
      direction: "center",
      className: "tooltip-style",
    });

    let popupContent;
    let status = feature.properties["County Status"];

    if (status === "Completed") {
      colorVisited = feature.properties["Color Code"];

      popupContent =
      '<p class="popup-title">' +
      feature.properties.NAME +
      "</p>" +
      '<p class="popup-text">Geographic Political Area: ' +
      feature.properties["Geographic Political Area"] +
      "</p>" +
      '<p class="popup-text">Status: ' +
      feature.properties["County Status"] +
      "</p>" +
      '<p class="popup-text">Completion Date: ' +
      feature.properties["Month"] +
      " " +
      feature.properties["Date"] +
      "</p>";
    } else {
      colorNotVisited = feature.properties["Color Code"];

      popupContent =
      '<p class="popup-title">' +
      feature.properties.NAME +
      "</p>" +
      '<p class="popup-text">Geographic Political Area: ' +
      feature.properties["Geographic Political Area"] +
      "</p>" +
      '<p class="popup-text">Status: ' +
      feature.properties["County Status"] +
      "</p>" +
      '<p class="popup-text">Targeted Completion Date: ' +
      feature.properties["Targeted Completion Date"] +
      "</p>";
    }

    layer.bindPopup(popupContent, popupStyle);
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlightCounties,
    });
  }

  layerCounties = L.geoJSON(geojsonCounties, {
    style: styleCounty,
    onEachFeature: onEachFeatureCounties,
  }).addTo(map);

  layerAreas = L.geoJSON(geojsonAreas, {
    style: styleAreas,
  }).addTo(map);

  let legendCount = L.control({ position: "bottomright" });

  legendCount.onAdd = function (map) {
    let div = L.DomUtil.create("div", "info legend legend-sales");

    div.innerHTML =
      '<i style="background:' +
      colorVisited + 
      '"></i> ' +
      "Visited" +
      "<br>" +
      '<i style="background:' +
      colorNotVisited +
      '"></i> ' +
      "Not Visited" +
      "<br>";

    return div;
  };

  legendCount.addTo(map);
}
