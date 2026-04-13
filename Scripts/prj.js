const JSON_PATH = "Jasons/prj.json";

let allProjects   = [];
let allCategories = [];
let activeFilters = new Set();
let leafletMap    = null;

fetch(JSON_PATH)
  .then(res => res.json())
  .then(data => {
    allProjects   = data.projects   || [];
    allCategories = data.categories || [];
    buildFilters();
    renderGrid(getSortedProjects(allProjects));
    if (data.footer) {
      const el = document.getElementById("footerTxt");
      if (el) el.textContent = data.footer;
    }
  })
  .catch(err => console.error("Failed to load prj.json:", err));

/* ================================================
   SORTING
   ================================================ */
function getSortedProjects(projects) {
  const featured = projects
    .filter(p => p.featured > 0)
    .sort((a, b) => a.featured - b.featured);
  const rest = projects.filter(p => !p.featured || p.featured === 0);
  return [...featured, ...rest];
}

/* ================================================
   FILTERS
   ================================================ */
function buildFilters() {
  const container = document.getElementById("filterBtns");
  container.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn" + (activeFilters.size === 0 ? " active" : "");
  allBtn.textContent = "All";
  allBtn.addEventListener("click", () => {
    activeFilters.clear();
    buildFilters();
    renderGrid(getSortedProjects(allProjects));
  });
  container.appendChild(allBtn);

  allCategories.forEach(cat => {
    const testSet = new Set([...activeFilters, cat]);
    const wouldMatch = allProjects.filter(p =>
      [...testSet].every(f => p.categories.includes(f))
    );
    if (wouldMatch.length === 0) return;

    const btn = document.createElement("button");
    btn.className = "filter-btn" + (activeFilters.has(cat) ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      if (activeFilters.has(cat)) activeFilters.delete(cat);
      else activeFilters.add(cat);
      buildFilters();
      renderGrid(getSortedProjects(getFiltered()));
    });
    container.appendChild(btn);
  });
}

function getFiltered() {
  if (activeFilters.size === 0) return allProjects;
  return allProjects.filter(p =>
    [...activeFilters].every(f => p.categories.includes(f))
  );
}

/* ================================================
   RENDER GRID
   ================================================ */
function renderGrid(projects) {
  const grid      = document.getElementById("projectGrid");
  const moreBtn   = document.getElementById("showMoreBtn");
  const moreLabel = document.getElementById("showMoreLabel");

  Array.from(grid.children).forEach(child => {
    if (child !== moreBtn) child.remove();
  });
  moreBtn.classList.remove("expanded");

  const top  = projects.slice(0, 3);
  const rest = projects.slice(3);

  top.forEach(p => grid.insertBefore(makeCard(p), moreBtn));
  rest.forEach(p => {
    const card = makeCard(p);
    card.classList.add("prj-hidden");
    grid.insertBefore(card, moreBtn);
  });

  if (rest.length === 0) {
    moreBtn.style.visibility = "hidden";
  } else {
    moreBtn.style.visibility = "visible";
    moreLabel.textContent = "＋ More Projects (" + rest.length + ")";
  }
}

/* ================================================
   PROJECT CARD
   ================================================ */
function makeCard(project) {
  const card = document.createElement("div");
  card.className = "prj-card";
  card.dataset.id = project.id;

  if (project.featured > 0) {
    const badge = document.createElement("div");
    badge.className = "prj-badge";
    badge.textContent = "Featured";
    card.appendChild(badge);
  }

  // Small "Map" indicator if the project has an interactive map
  if (project.leaflet || project.mapEmbed || project.htmlEmbed) {
    const mapBadge = document.createElement("div");
    mapBadge.className = "prj-map-badge";
    mapBadge.textContent = project.leaflet ? "Live Map" : project.htmlEmbed ? "Interactive" : "Map";
    card.appendChild(mapBadge);
  }

  if (project.thumbnail) {
    const img = document.createElement("img");
    img.src = project.thumbnail;
    img.alt = project.title;
    img.className = "prj-thumb";
    card.appendChild(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "prj-thumb-placeholder";
    ph.textContent = "No image";
    card.appendChild(ph);
  }

  const info = document.createElement("div");
  info.className = "prj-info";
  info.innerHTML =
    "<h3>" + project.title + "</h3>" +
    "<span class='prj-cat'>" + project.categories.join(" · ") + "</span>";
  card.appendChild(info);

  card.addEventListener("click", () => showDetail(project));
  return card;
}

/* ================================================
   DETAIL OVERLAY
   ================================================ */
function showDetail(project) {
  const overlay = document.getElementById("detailOverlay");
  const content = document.getElementById("detailContent");

  // Highlight selected card
  document.querySelectorAll(".prj-card").forEach(c => c.classList.remove("selected"));
  const match = document.querySelector(".prj-card[data-id='" + project.id + "']");
  if (match) match.classList.add("selected");

  // Destroy previous Leaflet instance if any
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  content.innerHTML = "";

  const inner = document.createElement("div");
  inner.className = "detail-inner";

  /* --- TOP: text body --- */
  const body = document.createElement("div");
  body.className = "detail-body";
  body.innerHTML = "<h2>" + project.title + "</h2>";

  const tagsDiv = document.createElement("div");
  tagsDiv.className = "detail-tags";
  project.categories.forEach(cat => {
    const tag = document.createElement("span");
    tag.className = "detail-tag";
    tag.textContent = cat;
    tagsDiv.appendChild(tag);
  });
  body.appendChild(tagsDiv);

  const desc = document.createElement("p");
  desc.textContent = project.description;
  body.appendChild(desc);

  if (project.link) {
    const a = document.createElement("a");
    a.href = project.link;
    a.target = "_blank";
    a.className = "detail-link";
    a.textContent = "View Project →";
    body.appendChild(a);
  }

  inner.appendChild(body);

  /* --- BOTTOM: media (full width) --- */
  const mediaWrap = document.createElement("div");
  mediaWrap.className = "detail-media";

  if (project.leaflet) {
    const mapDiv = document.createElement("div");
    mapDiv.id = "leafletMap";
    mapDiv.className = "detail-map";
    mapDiv.style.width = "100%";
    mapDiv.style.height = "580px";
    mediaWrap.appendChild(mapDiv);
  } else if (project.mapEmbed) {
    // ArcGIS StoryMap or other iframe embed — full width, tall
    const frame = document.createElement("iframe");
    frame.src = project.mapEmbed;
    frame.className = "detail-map";
    frame.allowFullscreen = true;
    frame.style.width = "100%";
    frame.style.height = "580px";
    frame.style.border = "none";
    frame.style.display = "block";
    mediaWrap.appendChild(frame);
  } else if (project.htmlEmbed) {
    const frame = document.createElement("iframe");
    frame.src = project.htmlEmbed;
    frame.className = "detail-map";
    frame.style.width = "100%";
    frame.style.height = "580px";
    frame.style.border = "none";
    frame.style.display = "block";
    mediaWrap.appendChild(frame);
  } else if (project.image) {
    mediaWrap.classList.add("is-image");
    const img = document.createElement("img");
    img.src = project.image;
    img.alt = project.title;
    img.className = "detail-img";
    mediaWrap.appendChild(img);
  } else {
    mediaWrap.classList.add("is-image");
    const ph = document.createElement("div");
    ph.className = "detail-img-placeholder";
    ph.textContent = "No image";
    mediaWrap.appendChild(ph);
  }

  inner.appendChild(mediaWrap);
  content.appendChild(inner);

  // Open overlay
  overlay.setAttribute("aria-hidden", "false");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  // Init Leaflet AFTER overlay transition completes (300ms matches CSS transition)
  if (project.leaflet) {
    setTimeout(() => {
      const cfg = project.leaflet;

      const mapEl = document.getElementById("leafletMap");
      console.log("Map div found:", mapEl, "offsetHeight:", mapEl ? mapEl.offsetHeight : "N/A");

      leafletMap = L.map("leafletMap", { preferCanvas: true }).setView(
        cfg.center || [52.0447, -114.0719],
        cfg.zoom   || 6
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(leafletMap);

      if (Array.isArray(cfg.markers)) {
        cfg.markers.forEach(m => {
          const marker = L.marker(m.latlng).addTo(leafletMap);
          if (m.popup) marker.bindPopup(m.popup);
        });
      }

      requestAnimationFrame(() => {
        leafletMap.invalidateSize();
        console.log("invalidateSize called, map size:", leafletMap.getSize());

        if (Array.isArray(cfg.shapefiles) && cfg.shapefiles.length > 0) {
          cfg.shapefiles.forEach((shpCfg, i) => {
            loadShapefileFromPath(shpCfg.path, shpCfg.label || shpCfg.path, i, cfg.shapefiles.length);
          });
        }
      });
    }, 350);
  }
}

/* ================================================
   SHAPEFILE — auto-load from path
   ================================================ */

const LAYER_COLORS = [
  "#2d6a3f", "#a85c1a", "#1a5fa8", "#8b2da8",
  "#a8172d", "#1a8ba8", "#6b7a1a", "#a8681a"
];

function loadShapefileFromPath(path, label, colorIdx, total) {
  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error("Could not fetch " + path);
      return res.json();
    })
    .then(geojson => {
      const color = LAYER_COLORS[colorIdx % LAYER_COLORS.length];

      const layer = L.geoJSON(geojson, {
        style: {
          color:       color,
          weight:      2,
          opacity:     0.9,
          fillColor:   color,
          fillOpacity: 0.18
        },
        pointToLayer: (feature, latlng) =>
          L.circleMarker(latlng, {
            radius:      6,
            color:       color,
            weight:      2,
            fillColor:   color,
            fillOpacity: 0.7
          }),
        onEachFeature: (feature, lyr) => {
          if (feature.properties) {
            const rows = Object.entries(feature.properties)
              .map(([k, v]) =>
                `<tr>
                  <td style="padding:2px 8px 2px 0;color:#555;font-size:0.78rem;white-space:nowrap">${k}</td>
                  <td style="font-size:0.78rem">${v ?? ""}</td>
                </tr>`)
              .join("");
            lyr.bindPopup(
              `<strong style="font-size:0.82rem">${label}</strong><table style="margin-top:4px">${rows}</table>`,
              { maxWidth: 300 }
            );
          }
        }
      }).addTo(leafletMap);

      // After the last layer loads, fit the map to all layers combined
      if (colorIdx === total - 1) {
        try {
          const allLayers = [];
          leafletMap.eachLayer(l => { if (l.getBounds) allLayers.push(l); });
          if (allLayers.length > 0) {
            const combined = allLayers.reduce(
              (bounds, l) => bounds.extend(l.getBounds()),
              allLayers[0].getBounds()
            );
            leafletMap.fitBounds(combined, { padding: [24, 24] });
          }
        } catch(_) {}
      }
    })
    .catch(err => console.error("Shapefile load error (" + path + "):", err));
}

function closeDetail() {
  const overlay = document.getElementById("detailOverlay");
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.querySelectorAll(".prj-card").forEach(c => c.classList.remove("selected"));
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }
}

document.getElementById("detailClose").addEventListener("click", closeDetail);

// Close on overlay background click
document.getElementById("detailOverlay").addEventListener("click", e => {
  if (e.target === document.getElementById("detailOverlay")) closeDetail();
});

// Close on Escape key
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeDetail();
});

/* ================================================
   SHOW MORE BUTTON
   ================================================ */
document.getElementById("showMoreBtn").addEventListener("click", () => {
  const grid       = document.getElementById("projectGrid");
  const btn        = document.getElementById("showMoreBtn");
  const label      = document.getElementById("showMoreLabel");
  const isExpanded = btn.classList.contains("expanded");

  if (!isExpanded) {
    grid.querySelectorAll(".prj-hidden").forEach(c => c.classList.remove("prj-hidden"));
    label.textContent = "－ Show Less";
    btn.classList.add("expanded");
  } else {
    const allCards = Array.from(grid.querySelectorAll(".prj-card:not(#showMoreBtn)"));
    allCards.slice(3).forEach(c => c.classList.add("prj-hidden"));
    label.textContent = "＋ More Projects (" + (allCards.length - 3) + ")";
    btn.classList.remove("expanded");
  }
});
