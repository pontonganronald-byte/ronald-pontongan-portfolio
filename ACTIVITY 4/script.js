var defaultCenter = [6.758348027047825, 125.3094713122876];
var map = null;
var markers = [];
var markerCount = null;
var savedPlaceCount = null;
var savedToggle = null;
var savedPanel = null;
var savedPlacesList = null;
var clearSavedButton = null;
var exportSavedButton = null;
var searchInput = null;
var searchResults = null;
var searchPanel = null;
var clearSearchButton = null;
var searchButton = null;
var layerToggle = null;
var layerMenu = null;
var tipBox = null;
var myLocationButton = null;
var toast = null;
var lastSearchTimestamp = 0;
var lastReverseLookupTimestamp = 0;
var myLocationLayer = null;
var nearbyPlacesEnabled = false;
var nearbyLayer = null;
var nearbyRequestController = null;
var nearbyDebounceTimer = null;
var defaultMarkers = [
    {
        name: "Davao del Sur State College",
        latitude: 6.75864,
        longitude: 125.30913,
        defaultMarker: true
    }
];
const MARKER_STORAGE_KEY = "favoritePlaceSavedMarkers";
const MAP_STORAGE_KEY = "favoritePlaceMapState";

function initializeMapApp() {
    if (!window.L || !document.getElementById("map")) {
        return;
    }

    if (map) {
        return;
    }

    markerCount = document.getElementById("markerCount");
    savedPlaceCount = document.getElementById("savedPlaceCount");
    savedToggle = document.getElementById("savedToggle");
    savedPanel = document.getElementById("savedPanel");
    savedPlacesList = document.getElementById("savedPlacesList");
    clearSavedButton = document.getElementById("clearSavedButton");
    exportSavedButton = document.getElementById("exportSavedButton");
    searchInput = document.getElementById("searchInput");
    searchResults = document.getElementById("searchResults");
    searchPanel = document.getElementById("searchPanel");
    clearSearchButton = document.getElementById("clearSearchButton");
    searchButton = document.getElementById("searchButton");
    layerToggle = document.getElementById("layerToggle");
    layerMenu = document.getElementById("layerMenu");
    tipBox = document.getElementById("tipBox");
    myLocationButton = document.getElementById("myLocationButton");
    toast = document.getElementById("toast");

    map = L.map("map", {
        zoomSnap: 0.25,
        preferCanvas: true,
        zoomControl: false
    }).setView(defaultCenter, 15);

    myLocationLayer = L.layerGroup().addTo(map);
    nearbyLayer = L.layerGroup().addTo(map);

    var mapLayer = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 22,
            maxNativeZoom: 19
        }
    );

    var esriStreetLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "Tiles © Esri",
            maxZoom: 22,
            maxNativeZoom: 19
        }
    );

    var satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
            maxZoom: 22,
            maxNativeZoom: 19,
            keepBuffer: 2
        }
    );

    var satelliteLabels = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
            attribution: "&copy; Esri",
            maxZoom: 22,
            maxNativeZoom: 19,
            pane: "overlayPane"
        }
    );

    var terrainLayer = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
            attribution: "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap",
            maxZoom: 22,
            maxNativeZoom: 17,
            subdomains: "abc"
        }
    );

    var layerMap = {
        map: mapLayer,
        satellite: satelliteLayer,
        terrain: terrainLayer
    };

    var activeLayer = "map";
    var activeLabelLayer = null;
    var osmTileErrorCount = 0;
    var osmFallbackShown = false;

    function switchToEsriStreetLayer() {
        if (!map.hasLayer(esriStreetLayer)) {
            map.removeLayer(mapLayer);
            map.addLayer(esriStreetLayer);
        }

        if (!osmFallbackShown) {
            osmFallbackShown = true;
            showToast("OpenStreetMap tiles are unavailable. Switched to Esri Street layer.");
        }
    }

    function handleOsmMapTileError() {
        osmTileErrorCount += 1;
        if (osmTileErrorCount >= 3 && !osmFallbackShown) {
            switchToEsriStreetLayer();
        }
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>\'\"]/g, function(character) {
            var entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;"
            };
            return entities[character];
        });
    }

    function createTealPinIcon() {
        return L.divIcon({
            className: "custom-pin",
            html: "<span class='pin-body'></span>",
            iconSize: [24, 28],
            iconAnchor: [12, 28],
            popupAnchor: [0, -22]
        });
    }

    function saveMapState() {
        try {
            var center = map.getCenter();
            localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify({
                lat: center.lat,
                lng: center.lng,
                zoom: map.getZoom(),
                layer: activeLayer
            }));
        } catch (error) {
            console.warn("Map state could not be saved.", error);
        }
    }

    function restoreMapState() {
        var savedState = null;

        try {
            savedState = JSON.parse(localStorage.getItem(MAP_STORAGE_KEY));
        } catch (error) {
            console.warn("Map state could not be restored.", error);
        }

        if (savedState && savedState.lat && savedState.lng) {
            map.setView([savedState.lat, savedState.lng], savedState.zoom || 15);
            if (savedState.layer && layerMap[savedState.layer]) {
                activeLayer = savedState.layer;
            }
        }
    }

    function updateLayerButtons(layerName) {
        var layerButtons = document.querySelectorAll(".layer-option[data-layer]");
        var preview = document.querySelector(".layer-toggle-preview");

        layerButtons.forEach(function(button) {
            button.classList.toggle("active", button.dataset.layer === layerName);
        });

        if (preview) {
            preview.className = "layer-toggle-preview preview-" + layerName;
        }
    }

    function setActiveLayer(name) {
        Object.keys(layerMap).forEach(function(key) {
            if (map.hasLayer(layerMap[key])) {
                map.removeLayer(layerMap[key]);
            }
        });

        if (map.hasLayer(esriStreetLayer)) {
            map.removeLayer(esriStreetLayer);
        }

        if (activeLabelLayer && map.hasLayer(activeLabelLayer)) {
            map.removeLayer(activeLabelLayer);
        }

        activeLabelLayer = null;

        if (name === "satellite") {
            map.addLayer(satelliteLayer);
            if (map.hasLayer(satelliteLabels)) {
                map.removeLayer(satelliteLabels);
            }
            map.addLayer(satelliteLabels);
            activeLabelLayer = satelliteLabels;
        } else if (name === "terrain") {
            map.addLayer(terrainLayer);
        } else {
            if (osmTileErrorCount >= 3) {
                map.addLayer(esriStreetLayer);
            } else {
                map.addLayer(mapLayer);
            }
        }

        activeLayer = name;
        updateLayerButtons(name);
        saveMapState();
    }

    mapLayer.on("tileerror", handleOsmMapTileError);

    satelliteLabels.on("tileerror", function() {
        if (map.hasLayer(satelliteLabels)) {
            map.removeLayer(satelliteLabels);
        }
        activeLabelLayer = null;
    });

    function showToast(message) {
        if (!toast) {
            return;
        }
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(showToast.timeoutId);
        showToast.timeoutId = setTimeout(function() {
            toast.classList.remove("visible");
        }, 2600);
    }

    function updateMarkerCount() {
        var count = markers.length;
        if (markerCount) {
            markerCount.textContent = String(count);
        }
        if (savedPlaceCount) {
            savedPlaceCount.textContent = String(count);
        }
    }

    function saveAllMarkers() {
        try {
            var payload = markers.map(function(marker) {
                var position = marker.getLatLng();
                return {
                    id: marker.markerId,
                    name: marker.placeName || "Unnamed location",
                    lat: position.lat,
                    lng: position.lng,
                    defaultMarker: Boolean(marker.defaultMarker)
                };
            });
            localStorage.setItem(MARKER_STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
            console.warn("Saved markers could not be stored.", error);
        }
    }

    function loadSavedMarkers() {
        var storedMarkers = [];

        try {
            storedMarkers = JSON.parse(localStorage.getItem(MARKER_STORAGE_KEY)) || [];
        } catch (error) {
            console.warn("Saved markers could not be loaded.", error);
        }

        markers = [];

        storedMarkers.forEach(function(item) {
            if (!item || !item.lat || !item.lng) {
                return;
            }

            addMarker(item.lat, item.lng, item.name || "Unnamed location", {
                persist: false,
                defaultMarker: Boolean(item.defaultMarker),
                id: item.id || ("saved-" + Date.now() + "-" + Math.random().toString(16).slice(2))
            });
        });

        var hasDefault = markers.some(function(marker) {
            return Boolean(marker.defaultMarker);
        });

        if (!hasDefault) {
            var defaultPlace = defaultMarkers[0];
            addMarker(defaultPlace.latitude, defaultPlace.longitude, defaultPlace.name, {
                persist: false,
                defaultMarker: true,
                id: "default-davao-state-college"
            });
        }

        updateMarkerCount();
        renderSavedPlaces();
    }

    function addMarker(latitude, longitude, name, options) {
        options = options || {};
        var marker = L.marker([latitude, longitude], {
            draggable: true,
            icon: createTealPinIcon()
        }).addTo(map);

        marker.markerId = options.id || ("marker-" + Date.now() + "-" + Math.random().toString(16).slice(2));
        marker.placeName = name || "Unnamed location";
        marker.defaultMarker = Boolean(options.defaultMarker);

        marker.bindPopup(buildMarkerPopup(marker), {
            maxWidth: 260,
            className: "marker-popup-container"
        });

        marker.on("popupopen", function(event) {
            var popup = event.popup;
            var popupSource = popup.getSource ? popup.getSource() : popup._source;
            if (!popupSource || popupSource !== marker) {
                return;
            }

            var popupElement = popup.getElement();
            if (!popupElement) {
                return;
            }

            var renameToggle = popupElement.querySelector("[data-action='rename']");
            var renameWrap = popupElement.querySelector(".rename-wrap");
            var saveRename = popupElement.querySelector("[data-action='save-rename']");
            var copyButton = popupElement.querySelector("[data-action='copy']");
            var deleteButton = popupElement.querySelector("[data-action='delete']");

            if (renameToggle) {
                renameToggle.addEventListener("click", function() {
                    if (renameWrap) {
                        renameWrap.classList.toggle("visible");
                        var input = renameWrap.querySelector("input");
                        if (input) {
                            input.value = marker.placeName || "Unnamed location";
                            input.focus();
                        }
                    }
                });
            }

            if (saveRename) {
                saveRename.addEventListener("click", function() {
                    var input = renameWrap.querySelector("input");
                    var newValue = input ? input.value.trim() : "";

                    if (!newValue) {
                        showToast("Please enter a name before saving.");
                        return;
                    }

                    marker.placeName = newValue;
                    popup.setContent(buildMarkerPopup(marker));
                    saveAllMarkers();
                    renderSavedPlaces();
                    marker.openPopup();
                });
            }

            if (copyButton) {
                copyButton.addEventListener("click", function() {
                    var position = marker.getLatLng();
                    var text = position.lat.toFixed(5) + ", " + position.lng.toFixed(5);

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text)
                            .then(function() {
                                showToast("Coordinates copied.");
                            })
                            .catch(function() {
                                showToast("Copy failed. Please copy manually.");
                            });
                    } else {
                        showToast("Clipboard access is unavailable.");
                    }
                });
            }

            if (deleteButton) {
                deleteButton.addEventListener("click", function() {
                    map.removeLayer(marker);
                    markers = markers.filter(function(item) {
                        return item !== marker;
                    });

                    if (!markers.some(function(item) {
                        return Boolean(item.defaultMarker);
                    })) {
                        var defaultPlace = defaultMarkers[0];
                        addMarker(defaultPlace.latitude, defaultPlace.longitude, defaultPlace.name, {
                            persist: false,
                            defaultMarker: true,
                            id: "default-davao-state-college"
                        });
                    }

                    saveAllMarkers();
                    renderSavedPlaces();
                    updateMarkerCount();
                });
            }
        });

        marker.on("dragend", function() {
            saveAllMarkers();
            renderSavedPlaces();
        });

        if (options.persist !== false) {
            saveAllMarkers();
        }

        markers.push(marker);
        updateMarkerCount();
        renderSavedPlaces();
        return marker;
    }

    function buildMarkerPopup(marker) {
        var position = marker.getLatLng();
        var safeName = escapeHtml(marker.placeName || "Unnamed location");
        var googleMapsUrl = "https://www.google.com/maps?q=" + position.lat + "," + position.lng;
        var directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + position.lat + "," + position.lng;
        return [
            '<div class="marker-popup">',
            '<div class="popup-name">' + safeName + '</div>',
            '<div class="popup-coords">Lat: ' + position.lat.toFixed(5) + '<br>Lng: ' + position.lng.toFixed(5) + '</div>',
            '<div class="rename-wrap">',
            '<input type="text" value="' + safeName + '" aria-label="Rename this place">',
            '<button type="button" data-action="save-rename">Save</button>',
            '</div>',
            '<div class="popup-actions">',
            '<button type="button" class="action-button" data-action="rename">Rename</button>',
            '<button type="button" class="action-button" data-action="copy">Copy coordinates</button>',
            '<button type="button" class="action-button" data-action="delete">Delete this marker</button>',
            '<a class="action-link" href="' + googleMapsUrl + '" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>',
            '<a class="action-link" href="' + directionsUrl + '" target="_blank" rel="noopener noreferrer">Directions</a>',
            '</div>',
            '</div>'
        ].join("");
    }

    function renderSavedPlaces() {
        if (!savedPlacesList) {
            return;
        }
        savedPlacesList.innerHTML = "";

        markers.forEach(function(marker) {
            var row = document.createElement("div");
            row.className = "saved-place-row";

            var titleButton = document.createElement("button");
            titleButton.type = "button";
            titleButton.className = "saved-place-name";
            titleButton.textContent = marker.placeName || "Unnamed location";
            titleButton.addEventListener("click", function() {
                map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 1.1 });
                marker.openPopup();
            });

            var deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "saved-place-delete";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete place";
            deleteButton.addEventListener("click", function(event) {
                event.stopPropagation();
                if (marker.defaultMarker) {
                    showToast("This default place stays on the map.");
                    return;
                }

                map.removeLayer(marker);
                markers = markers.filter(function(item) {
                    return item !== marker;
                });
                saveAllMarkers();
                renderSavedPlaces();
                updateMarkerCount();
            });

            row.appendChild(titleButton);
            row.appendChild(deleteButton);
            savedPlacesList.appendChild(row);
        });
    }

    if (savedToggle) {
        savedToggle.addEventListener("click", function() {
            savedPanel.classList.toggle("open");
        });
    }

    if (clearSavedButton) {
        clearSavedButton.addEventListener("click", function() {
            if (!markers.length) {
                showToast("There are no saved places yet.");
                return;
            }

            var confirmed = window.confirm("Clear all saved places?");
            if (!confirmed) {
                return;
            }

            markers.forEach(function(marker) {
                map.removeLayer(marker);
            });

            markers = [];
            var defaultPlace = defaultMarkers[0];
            addMarker(defaultPlace.latitude, defaultPlace.longitude, defaultPlace.name, {
                persist: false,
                defaultMarker: true,
                id: "default-davao-state-college"
            });
            saveAllMarkers();
            renderSavedPlaces();
            updateMarkerCount();
        });
    }

    if (exportSavedButton) {
        exportSavedButton.addEventListener("click", function() {
            var payload = markers.map(function(marker) {
                var position = marker.getLatLng();
                return {
                    name: marker.placeName || "Unnamed location",
                    lat: position.lat,
                    lng: position.lng,
                    defaultMarker: Boolean(marker.defaultMarker)
                };
            });

            var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = "saved-places.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("Saved places exported.");
        });
    }

    function queueReverseLookup(latitude, longitude, marker) {
        var now = Date.now();
        var waitTime = 1000 - (now - lastReverseLookupTimestamp);

        if (waitTime > 0) {
            setTimeout(function() {
                queueReverseLookup(latitude, longitude, marker);
            }, waitTime);
            return;
        }

        lastReverseLookupTimestamp = Date.now();
        var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + latitude + "&lon=" + longitude + "&zoom=18&addressdetails=1";

        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error("Reverse geocoding failed");
                }
                return response.json();
            })
            .then(function(place) {
                var address = place.address || {};
                var name = place.name || address.road || address.village ||
                    address.town || address.city || "Unnamed location";
                var area = address.city || address.town || address.village ||
                    address.municipality || address.county || "";
                var locationText = area && area !== name ? name + ", " + area : name;

                marker.placeName = locationText;
                marker.setPopupContent(buildMarkerPopup(marker));
                saveAllMarkers();
                renderSavedPlaces();
            })
            .catch(function() {
                marker.placeName = marker.placeName || "Unnamed location";
                marker.setPopupContent(buildMarkerPopup(marker));
                showToast("Place lookup unavailable right now.");
            });
    }

    function hideSearchResults() {
        if (!searchResults) {
            return;
        }
        searchResults.innerHTML = "";
        searchResults.classList.remove("visible");
    }

    function renderSearchResults(results) {
        if (!searchResults) {
            return;
        }
        searchResults.innerHTML = "";

        results.forEach(function(result) {
            var item = document.createElement("button");
            item.type = "button";
            item.className = "search-result";

            var name = document.createElement("span");
            name.className = "search-name";
            name.textContent = result.name || result.display_name.split(",")[0] || "Place";

            var meta = document.createElement("span");
            meta.className = "search-meta";
            meta.textContent = result.display_name || "";

            item.appendChild(name);
            item.appendChild(meta);
            item.addEventListener("click", function() {
                var latitude = Number(result.lat);
                var longitude = Number(result.lon);
                hideSearchResults();
                map.flyTo([latitude, longitude], Math.max(map.getZoom(), 14), { duration: 1.2 });
                var searchMarker = addMarker(latitude, longitude, name.textContent, {
                    persist: true,
                    defaultMarker: false
                });
                searchMarker.openPopup();
            });

            searchResults.appendChild(item);
        });

        if (results.length) {
            searchResults.classList.add("visible");
        }
    }

    function handleSearch() {
        if (!searchInput) {
            return;
        }
        var query = searchInput.value.trim();
        if (!query) {
            showToast("Type a place name or coordinates to search.");
            return;
        }

        var coordinateMatch = query.match(/^\s*([-+]?\d+(?:\.\d+)?)\s*[, ]\s*([-+]?\d+(?:\.\d+)?)\s*$/);
        if (coordinateMatch) {
            var latitude = Number(coordinateMatch[1]);
            var longitude = Number(coordinateMatch[2]);

            if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
                map.flyTo([latitude, longitude], Math.max(map.getZoom(), 14), { duration: 1.2 });
                var coordinateMarker = addMarker(latitude, longitude, "Coordinates", {
                    persist: true,
                    defaultMarker: false
                });
                coordinateMarker.openPopup();
                hideSearchResults();
                return;
            }
        }

        if (Date.now() - lastSearchTimestamp < 1000) {
            showToast("Please wait a moment before searching again.");
            return;
        }

        lastSearchTimestamp = Date.now();
        searchResults.innerHTML = '<div class="search-state">Searching...</div>';
        searchResults.classList.add("visible");

        fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=" + encodeURIComponent(query), {
            headers: {
                "Accept-Language": "en"
            }
        })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error("Search request failed");
                }
                return response.json();
            })
            .then(function(results) {
                if (!results || !results.length) {
                    searchResults.innerHTML = '<div class="search-state">No results found.</div>';
                    showToast("No results found. Try another place or coordinates.");
                    return;
                }
                renderSearchResults(results);
            })
            .catch(function() {
                searchResults.innerHTML = '<div class="search-state">Search is temporarily unavailable.</div>';
                showToast("Search is unavailable right now. Please try again.");
            });
    }

    if (searchInput) {
        searchInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                handleSearch();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener("click", handleSearch);
    }

    if (clearSearchButton) {
        clearSearchButton.addEventListener("click", function() {
            searchInput.value = "";
            hideSearchResults();
            searchInput.focus();
        });
    }

    if (searchPanel) {
        document.addEventListener("click", function(event) {
            if (!searchPanel.contains(event.target)) {
                hideSearchResults();
            }
        });
    }

    if (layerToggle) {
        layerToggle.addEventListener("click", function() {
            layerMenu.classList.toggle("visible");
        });
    }

    var nearbyToggleButton = document.querySelector(".nearby-toggle");
    if (nearbyToggleButton) {
        nearbyToggleButton.addEventListener("click", function() {
            nearbyPlacesEnabled = !nearbyPlacesEnabled;
            nearbyToggleButton.classList.toggle("enabled", nearbyPlacesEnabled);
            if (nearbyPlacesEnabled) {
                showToast("Nearby places on");
                scheduleNearbyPlaces();
            } else {
                showToast("Nearby places off");
                nearbyLayer.clearLayers();
                if (nearbyRequestController) {
                    nearbyRequestController.abort();
                }
            }
        });
    }

    document.querySelectorAll(".layer-option[data-layer]").forEach(function(button) {
        button.addEventListener("click", function() {
            setActiveLayer(button.dataset.layer);
            if (layerMenu) {
                layerMenu.classList.remove("visible");
            }
        });
    });

    if (tipBox && tipBox.querySelector(".dismiss-tip")) {
        tipBox.querySelector(".dismiss-tip").addEventListener("click", function() {
            tipBox.classList.add("hidden");
        });
    }

    map.on("click", function() {
        if (tipBox) {
            tipBox.classList.add("hidden");
        }
    });

    if (myLocationButton) {
        myLocationButton.addEventListener("click", function() {
            if (!navigator.geolocation) {
                showToast("Geolocation is not available in this browser.");
                return;
            }

            myLocationButton.disabled = true;
            myLocationButton.textContent = "Locating...";

            navigator.geolocation.getCurrentPosition(function(position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                var accuracy = position.coords.accuracy || 30;

                myLocationLayer.clearLayers();
                var locationMarker = L.circleMarker([latitude, longitude], {
                    radius: 8,
                    color: "#ffffff",
                    weight: 3,
                    fillColor: "#2d7ef7",
                    fillOpacity: 1
                });
                var accuracyCircle = L.circle([latitude, longitude], {
                    radius: accuracy,
                    color: "#2d7ef7",
                    weight: 1.5,
                    fillColor: "#2d7ef7",
                    fillOpacity: 0.12,
                    interactive: false
                });

                var userLocation = L.layerGroup([accuracyCircle, locationMarker]);
                myLocationLayer.addLayer(userLocation);
                map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { duration: 1.2 });
                showToast("Showing your current location.");
                myLocationButton.disabled = false;
                myLocationButton.textContent = "My location";
            }, function(error) {
                var message = "Location access was denied or unavailable.";

                if (error && error.code === 1) {
                    message = "Location permission was denied. Please allow access to use this feature.";
                }

                showToast(message);
                myLocationButton.disabled = false;
                myLocationButton.textContent = "My location";
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
    }

    function scheduleNearbyPlaces() {
        if (!nearbyPlacesEnabled || map.getZoom() < 16) {
            nearbyLayer.clearLayers();
            return;
        }

        clearTimeout(nearbyDebounceTimer);
        nearbyDebounceTimer = setTimeout(function() {
            loadNearbyPlaces();
        }, 800);
    }

    function loadNearbyPlaces() {
        if (!nearbyPlacesEnabled || map.getZoom() < 16) {
            nearbyLayer.clearLayers();
            return;
        }

        if (nearbyRequestController) {
            nearbyRequestController.abort();
        }

        var bounds = map.getBounds();
        var south = bounds.getSouth();
        var west = bounds.getWest();
        var north = bounds.getNorth();
        var east = bounds.getEast();
        var query = [
            "[out:json][timeout:15];",
            "node[\"name\"][\"amenity\"](" + south + "," + west + "," + north + "," + east + ");",
            "node[\"name\"][\"tourism\"](" + south + "," + west + "," + north + "," + east + ");",
            "node[\"name\"][\"historic\"](" + south + "," + west + "," + north + "," + east + ");",
            "out 100;"
        ].join("");

        nearbyRequestController = new AbortController();
        var timeoutId = setTimeout(function() {
            nearbyRequestController.abort();
        }, 15000);

        fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query), {
            signal: nearbyRequestController.signal
        })
            .then(function(response) {
                clearTimeout(timeoutId);
                if (response.status === 429) {
                    throw { status: 429 };
                }
                if (!response.ok) {
                    throw new Error("Nearby places request failed");
                }
                return response.json();
            })
            .then(function(data) {
                nearbyLayer.clearLayers();
                var placeNodes = (data.elements || []).slice(0, 100);

                placeNodes.forEach(function(element) {
                    var latitude = element.lat;
                    var longitude = element.lon;
                    var name = element.tags && element.tags.name ? element.tags.name : "Place";

                    if (!latitude || !longitude) {
                        return;
                    }

                    var nearbyMarker = L.circleMarker([latitude, longitude], {
                        radius: 6,
                        color: "#ffffff",
                        weight: 2,
                        fillColor: "#087f8c",
                        fillOpacity: 0.9
                    });

                    nearbyMarker.bindTooltip(name, {
                        direction: "top",
                        offset: [0, -8],
                        opacity: 0.95,
                        sticky: true
                    });
                    nearbyMarker.bindPopup("<b>" + escapeHtml(name) + "</b>");
                    nearbyLayer.addLayer(nearbyMarker);
                });
            })
            .catch(function(error) {
                clearTimeout(timeoutId);
                if (error && error.name === "AbortError") {
                    return;
                }
                if (error && error.status === 429) {
                    showToast("Places are busy, try again in a moment");
                    return;
                }
                showToast("Places are busy, try again in a moment");
            });
    }

    map.on("click", function(event) {
        var latitude = event.latlng.lat;
        var longitude = event.latlng.lng;
        var clickedMarker = addMarker(latitude, longitude, "Unnamed location", {
            persist: true,
            defaultMarker: false
        });

        clickedMarker.bindPopup("<b>Finding the place name...</b>").openPopup();
        queueReverseLookup(latitude, longitude, clickedMarker);
    });

    map.on("moveend zoomend", function() {
        saveMapState();
        if (nearbyPlacesEnabled) {
            scheduleNearbyPlaces();
        }
    });

    function refreshMapSize() {
        map.invalidateSize();
    }

    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.addLayer(mapLayer);
    restoreMapState();
    setActiveLayer(activeLayer);
    refreshMapSize();
    window.addEventListener("resize", refreshMapSize);

    loadSavedMarkers();

    if (savedPanel) {
        savedPanel.classList.add("open");
    }

    if (nearbyPlacesEnabled) {
        scheduleNearbyPlaces();
    }
}

document.addEventListener("DOMContentLoaded", initializeMapApp);
initializeMapApp();
