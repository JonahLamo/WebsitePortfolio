const JSON_PATH = "Jasons/index.json";

fetch(JSON_PATH)
  .then(res => res.json())
  .then(data => {
    populateAbout(data);
    populateExperience(data);
    populateSkills(data);
    populateContact(data);
    populateFooter(data);
  })
  .catch(err => console.error("Failed to load JSON:", err));

/* ---- ABOUT ---- */
function populateAbout(data) {
  const heading = document.getElementById("aboutHeading");
  if (heading && data.aboutHeading) heading.textContent = data.aboutHeading;

  const basic = document.getElementById("aboutBasic");
  if (basic && data.basicInfo) basic.textContent = data.basicInfo;

  const container = document.getElementById("photoScroll");
  if (!container) return;

  const photos = Array.isArray(data.photos) && data.photos.length > 0 ? data.photos : null;
  if (!photos) return;

  container.innerHTML = "";
  const startIndex = Math.floor(Math.random() * photos.length);

  photos.forEach((src, i) => {
    const slide = document.createElement("div");
    slide.classList.add("carousel-slide");
    if (i === startIndex) slide.classList.add("active");
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Photo " + (i + 1);
    slide.appendChild(img);
    container.appendChild(slide);
  });

  const prev = document.createElement("button");
  prev.className = "carousel-btn prev";
  prev.setAttribute("aria-label", "Previous photo");
  prev.innerHTML = "&#8249;";

  const next = document.createElement("button");
  next.className = "carousel-btn next";
  next.setAttribute("aria-label", "Next photo");
  next.innerHTML = "&#8250;";

  container.appendChild(prev);
  container.appendChild(next);

  const dotsRow = document.createElement("div");
  dotsRow.className = "carousel-dots";
  photos.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "carousel-dot" + (i === startIndex ? " active" : "");
    dot.setAttribute("aria-label", "Go to photo " + (i + 1));
    dotsRow.appendChild(dot);
  });
  container.parentElement.appendChild(dotsRow);

  let current = startIndex;
  const slides = container.querySelectorAll(".carousel-slide");
  const dots   = dotsRow.querySelectorAll(".carousel-dot");

  function goTo(index) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = (index + photos.length) % photos.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }

  prev.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));
  setInterval(() => goTo(current + 1), 4000);
}

/* ---- EXPERIENCE ---- */
function populateExperience(data) {
  buildExpList(document.getElementById("eduList"), data.exp?.edu);
  buildExpList(document.getElementById("workList"), data.exp?.work);

  const resumeBtn = document.getElementById("resumeBtn");
  if (resumeBtn && data.resumeUrl) {
    resumeBtn.href = data.resumeUrl;
    resumeBtn.setAttribute("download", "");
  }
}

function buildExpList(listEl, items) {
  if (!listEl || !items) return;
  items.forEach(item => {
    const li = document.createElement("li");
    const title   = typeof item === "object" ? item.title   : item;
    const details = typeof item === "object" ? item.details : null;

    if (!details) {
      li.textContent = title;
      listEl.appendChild(li);
      return;
    }

    const btn = document.createElement("button");
    btn.classList.add("exp-toggle");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `${title} <span class="skill-arrow">▸</span>`;

    const panel = document.createElement("p");
    panel.classList.add("exp-details");
    panel.textContent = details;
    panel.setAttribute("hidden", "");

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      const arrow = btn.querySelector(".skill-arrow");
      if (expanded) {
        panel.setAttribute("hidden", "");
        arrow.textContent = "▸";
      } else {
        panel.removeAttribute("hidden");
        arrow.textContent = "▾";
      }
    });

    li.appendChild(btn);
    li.appendChild(panel);
    listEl.appendChild(li);
  });
}

/* ---- SKILLS ---- */
function populateSkills(data) {
  const grid = document.getElementById("skillsGrid");
  if (!grid || !data.skills) return;

  Object.entries(data.skills).forEach(([category, items]) => {
    const col = document.createElement("div");
    col.classList.add("skill-col");

    const btn = document.createElement("button");
    btn.classList.add("skill-toggle");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `${capitalize(category)} <span class="skill-arrow">▸</span>`;

    const ul = document.createElement("ul");
    ul.classList.add("skill-list");
    ul.setAttribute("hidden", "");
    items.forEach(skill => {
      const li = document.createElement("li");
      li.textContent = skill;
      ul.appendChild(li);
    });

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      const arrow = btn.querySelector(".skill-arrow");
      if (expanded) {
        ul.setAttribute("hidden", "");
        arrow.textContent = "▸";
      } else {
        ul.removeAttribute("hidden");
        arrow.textContent = "▾";
      }
    });

    col.appendChild(btn);
    col.appendChild(ul);
    grid.appendChild(col);
  });
}

/* ---- CONTACT ---- */
function populateContact(data) {
  const area = document.getElementById("contactArea");
  if (!area) return;

  if (data.contactIntro) {
    const intro = document.createElement("p");
    intro.textContent = data.contactIntro;
    intro.style.marginBottom = "16px";
    intro.style.fontSize = "1rem";
    intro.style.color = "#3a3a3a";
    area.appendChild(intro);
  }

  /* Use a div wrapper — CSS handles layout via .contact-area descendants */
  area.insertAdjacentHTML("beforeend", `
    <div>
      <label for="contactName">Name</label>
      <input type="text" id="contactName" placeholder="Your name" />
      <label for="contactEmail">Email</label>
      <input type="email" id="contactEmail" placeholder="your@email.com" />
      <label for="contactMsg">Message</label>
      <textarea id="contactMsg" rows="4" placeholder="Say hello..."></textarea>
      <button id="contactSend">Send Message</button>
    </div>
  `);

  const sendBtn = document.getElementById("contactSend");
  if (sendBtn) {
    const emailTo = data.contactEmail || "";
    sendBtn.addEventListener("click", () => {
      const name    = document.getElementById("contactName").value;
      const email   = document.getElementById("contactEmail").value;
      const message = document.getElementById("contactMsg").value;
      const subject = encodeURIComponent("Portfolio Contact from " + name);
      const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
    });
  }
}

/* ---- FOOTER ---- */
function populateFooter(data) {
  const foot = document.getElementById("footerTxt");
  if (foot && data.footer) foot.textContent = data.footer;
}

/* ---- HELPERS ---- */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
