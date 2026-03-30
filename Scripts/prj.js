const JSON_PATH = "Jasons/prj.json";

let allProjects = [];
let activeFilter = "All";

fetch(JSON_PATH)
  .then(res => res.json())
  .then(data => {
    allProjects = data.projects || [];
    buildFilters(data.categories || []);
    renderGrids(allProjects);
  })
  .catch(err => console.error("Failed to load prj.json:", err));

/* ---- FILTERS ---- */
function buildFilters(categories) {
  const container = document.getElementById("filterBtns");
  const all = ["All", ...categories];

  all.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === "All" ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      activeFilter = cat;
      container.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filtered = cat === "All"
        ? allProjects
        : allProjects.filter(p => p.categories.includes(cat));

      renderGrids(filtered);
      clearDetail();
    });
    container.appendChild(btn);
  });
}

/* ---- RENDER GRIDS ---- */
function renderGrids(projects) {
  const grid      = document.getElementById("projectGrid");
  const moreBtn   = document.getElementById("showMoreBtn");
  const moreLabel = document.getElementById("showMoreLabel");

  // Remove all cards but keep the button
  Array.from(grid.children).forEach(child => {
    if (child !== moreBtn) child.remove();
  });

  // Reset to collapsed state
  moreBtn.classList.remove("expanded");

  const top  = projects.slice(0, 3);
  const rest = projects.slice(3);

  // Insert top 3 before the button
  top.forEach(p => grid.insertBefore(makeCard(p), moreBtn));

  // Insert extra cards (hidden) before the button
  rest.forEach(p => {
    const card = makeCard(p);
    card.classList.add("prj-hidden");
    grid.insertBefore(card, moreBtn);
  });

  // Update button label / visibility
  if (rest.length === 0) {
    moreBtn.style.visibility = "hidden";
  } else {
    moreBtn.style.visibility = "visible";
    moreLabel.textContent = "＋ More Projects (" + rest.length + ")";
  }
}

/* ---- PROJECT CARD ---- */
function makeCard(project) {
  const card = document.createElement("div");
  card.className = "prj-card";
  card.dataset.id = project.id;

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
    "<span class='prj-cat'>" + project.categories.join(", ") + "</span>";
  card.appendChild(info);

  card.addEventListener("click", () => {
    document.querySelectorAll(".prj-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    showDetail(project);
    document.getElementById("detailPanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  return card;
}

/* ---- DETAIL PANEL ---- */
function showDetail(project) {
  const panel = document.getElementById("detailPanel");
  panel.innerHTML = "";

  const inner = document.createElement("div");
  inner.className = "detail-inner";

  if (project.mapEmbed) {
    const frame = document.createElement("iframe");
    frame.src = project.mapEmbed;
    frame.style.cssText = "width:100%;height:160px;border:none;border-radius:8px;";
    frame.allowFullscreen = true;
    inner.appendChild(frame);
  } else if (project.image) {
    const img = document.createElement("img");
    img.src = project.image;
    img.alt = project.title;
    img.className = "detail-img";
    inner.appendChild(img);
  } else {
    const ph = document.createElement("div");
    ph.className = "detail-img-placeholder";
    ph.textContent = "No image";
    inner.appendChild(ph);
  }

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
  panel.appendChild(inner);
}

function clearDetail() {
  document.getElementById("detailPanel").innerHTML =
    "<p class='detail-placeholder'>Click a project to see more information here.</p>";
}

/* ---- SHOW MORE BUTTON ---- */
document.getElementById("showMoreBtn").addEventListener("click", () => {
  const grid       = document.getElementById("projectGrid");
  const btn        = document.getElementById("showMoreBtn");
  const label      = document.getElementById("showMoreLabel");
  const isExpanded = btn.classList.contains("expanded");

  if (!isExpanded) {
    // Reveal all hidden cards
    grid.querySelectorAll(".prj-hidden").forEach(c => c.classList.remove("prj-hidden"));
    label.textContent = "－ Show Less";
    btn.classList.add("expanded");
  } else {
    // Re-hide everything after the first 3
    const allCards = Array.from(grid.querySelectorAll(".prj-card:not(#showMoreBtn)"));
    allCards.slice(3).forEach(c => c.classList.add("prj-hidden"));
    label.textContent = "＋ More Projects (" + (allCards.length - 3) + ")";
    btn.classList.remove("expanded");
  }
});
