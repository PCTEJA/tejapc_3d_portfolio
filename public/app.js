"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const track = $("#panel-track");
const panels = $$(".panel");
const root = document.documentElement;
const chapterProgress = $("#chapter-progress");
const pageNumber = $("#page-number");
const previousPanel = $("#previous-panel");
const nextPanel = $("#next-panel");
const chapterLinks = $$(".chapter-nav a, .primary-nav a");
const motionToggle = $("#motion-toggle");
const journeyFlowBridge = $(".journey-flow-bridge");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobile = matchMedia("((max-width: 760px) or ((max-width: 1024px) and (orientation: portrait)))");
let activePanel = 0;
let renderedPanel = -1;
let trackWidth = track.clientWidth;
let maxScroll = Math.max(0, track.scrollWidth - trackWidth);
let targetScroll = 0;
let scrollFrame = 0;
let ambientPaused = reducedMotion.matches;
let settleTimer;
let pointerDown = false;
let scrollTimestamp = 0;
let wheelStart = 0;

function stopScrollAnimation() {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  scrollTimestamp = 0;
}

function syncChapterPosition() {
  const position = Math.max(
    0,
    Math.min(panels.length - 1, track.scrollLeft / (trackWidth || 1)),
  );
  const progress = position / Math.max(1, panels.length - 1);
  chapterProgress.style.transform = `scaleX(${progress})`;
  root.style.setProperty("--journey-progress", progress.toFixed(4));
  const transition = Math.max(0, Math.min(1, position));
  const bridgeOpacity = position > 0 && position < 1 ? Math.pow(Math.sin(transition * Math.PI), 2) : 0;
  root.style.setProperty("--flow-bridge-opacity", bridgeOpacity.toFixed(3));
  journeyFlowBridge.style.opacity = bridgeOpacity.toFixed(3);
  journeyFlowBridge.style.transform = `translate3d(${(0.5 - transition) * 12}%, ${(0.5 - transition) * 28}px, 0)`;
  activePanel = Math.round(position);
  // Navigation and ambient state only change when crossing into a chapter.
  if (renderedPanel === activePanel) return;
  renderedPanel = activePanel;
  root.dataset.activeChapter = panels[activePanel].id;
  panels.forEach((panel, index) => {
    panel.classList.toggle("is-active", index === activePanel);
    panel.inert = index !== activePanel;
  });
  pageNumber.textContent = String(activePanel + 1).padStart(2, "0");
  previousPanel.disabled = activePanel === 0;
  nextPanel.disabled = activePanel === panels.length - 1;
  chapterLinks.forEach((link) => {
    if (link.hash === `#${panels[activePanel].id}`)
      link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.dispatchEvent(new CustomEvent("portfolio:chapter", { detail: panels[activePanel].id }));
}

// Keep the document itself still. Wheel input becomes movement along the chapter rail.
// Small screens retain native horizontal swipe and can scroll tall chapter content vertically.
// Chapter navigation stops requesting frames once it reaches its destination.
function animateScroll(now) {
  const elapsed = scrollTimestamp ? Math.min(now - scrollTimestamp, 64) : 16;
  scrollTimestamp = now;
  const distance = targetScroll - track.scrollLeft;
  if (Math.abs(distance) < 0.8 || reducedMotion.matches || document.hidden) {
    track.scrollLeft = targetScroll;
    scrollFrame = 0;
    scrollTimestamp = 0;
    syncChapterPosition();
    return;
  }
  const step = distance * (1 - Math.exp(-elapsed / 85));
  // Browsers may round scroll offsets to whole pixels. Always reach the target
  // instead of scheduling frames forever for a sub-pixel remainder.
  track.scrollLeft +=
    Math.sign(distance) * Math.min(Math.abs(distance), Math.max(1, Math.abs(step)));
  scrollFrame = requestAnimationFrame(animateScroll);
}
function scrollToPosition(position, immediate = false) {
  targetScroll = Math.max(0, Math.min(position, maxScroll));
  if (immediate || reducedMotion.matches || mobile.matches || document.hidden) {
    stopScrollAnimation();
    track.scrollTo({
      left: targetScroll,
      behavior:
        immediate || reducedMotion.matches || document.hidden ? "instant" : "smooth",
    });
    syncChapterPosition();
  } else if (!scrollFrame) scrollFrame = requestAnimationFrame(animateScroll);
}
function goToPanel(index, focus = false) {
  index = Math.max(0, Math.min(index, panels.length - 1));
  clearTimeout(settleTimer);
  settleTimer = undefined;
  scrollToPosition(index * trackWidth);
  history.replaceState(null, "", `#${panels[index].id}`);
  if (focus) panels[index].focus({ preventScroll: true });
}
track.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey || event.metaKey || $("#detail-dialog").open) return;
    const panel = event.target.closest(".panel");
    const vertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
    if (
      panel &&
      getComputedStyle(panel).overflowY === "auto" &&
      panel.scrollHeight > panel.clientHeight + 2 &&
      vertical
    ) {
      const canScroll =
        event.deltaY > 0
          ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2
          : panel.scrollTop > 2;
      if (canScroll) return;
    }
    event.preventDefault();
    const multiplier =
      event.deltaMode === 1
        ? 24
        : event.deltaMode === 2
          ? trackWidth
          : 1;
    const delta = (vertical ? event.deltaY : event.deltaX) * multiplier;
    if (!settleTimer) wheelStart = track.scrollLeft;
    if (!scrollFrame) targetScroll = track.scrollLeft;
    scrollToPosition(targetScroll + delta * 1.35);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      let destination = Math.round(targetScroll / trackWidth);
      const startChapter = Math.round(wheelStart / trackWidth);
      if (
        destination === startChapter &&
        Math.abs(targetScroll - wheelStart) > 45
      )
        destination += Math.sign(targetScroll - wheelStart);
      if (!pointerDown) scrollToPosition(destination * trackWidth);
      settleTimer = undefined;
    }, 240);
  },
  { passive: false },
);
track.addEventListener(
  "pointerdown",
  () => {
    pointerDown = true;
    stopScrollAnimation();
    clearTimeout(settleTimer);
    settleTimer = undefined;
  },
  { passive: true },
);
const releasePointer = () => {
  pointerDown = false;
};
window.addEventListener("pointerup", releasePointer, { passive: true });
window.addEventListener("pointercancel", releasePointer, { passive: true });
track.addEventListener("scroll", syncChapterPosition, { passive: true });
$$('a[href^="#"]').forEach((link) =>
  link.addEventListener("click", (event) => {
    const index = panels.findIndex((panel) => `#${panel.id}` === link.hash);
    if (index < 0) return;
    event.preventDefault();
    goToPanel(index, link.classList.contains("skip-link"));
  }),
);
previousPanel.addEventListener("click", () => goToPanel(activePanel - 1));
nextPanel.addEventListener("click", () => goToPanel(activePanel + 1));
window.addEventListener("keydown", (event) => {
  if (
    $("#detail-dialog").open ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.target.closest(
      'input, textarea, select, [role="tablist"], [contenteditable="true"], #assistant-panel',
    )
  )
    return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    goToPanel(activePanel + (event.key === "ArrowRight" ? 1 : -1));
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    goToPanel(event.key === "Home" ? 0 : panels.length - 1);
  }
});
window.addEventListener("hashchange", () => {
  const index = panels.findIndex((panel) => `#${panel.id}` === location.hash);
  if (index >= 0) goToPanel(index);
});

// The motion layer shares this state, including visibility and OS preferences.
function updateMotion() {
  const paused = ambientPaused || reducedMotion.matches || document.hidden;
  root.dataset.motionPaused = String(paused);
  document.body.classList.toggle("motion-paused", paused);
  motionToggle.setAttribute("aria-pressed", String(ambientPaused));
  motionToggle.setAttribute(
    "aria-label",
    ambientPaused ? "Resume ambient animation" : "Pause ambient animation",
  );
  $("span", motionToggle).textContent = ambientPaused ? "▷" : "Ⅱ";
  document.dispatchEvent(new CustomEvent("portfolio:motion"));
  if (document.hidden) {
    clearTimeout(settleTimer);
    settleTimer = undefined;
    pointerDown = false;
    if (scrollFrame) scrollToPosition(targetScroll, true);
  }
}
motionToggle.addEventListener("click", () => {
  ambientPaused = !ambientPaused;
  updateMotion();
});
reducedMotion.addEventListener("change", (event) => {
  ambientPaused = event.matches;
  if (event.matches && scrollFrame) scrollToPosition(targetScroll, true);
  updateMotion();
});
document.addEventListener("visibilitychange", updateMotion);
new ResizeObserver(() => {
  const width = track.clientWidth;
  maxScroll = Math.max(0, track.scrollWidth - width);
  if (width === trackWidth) return;
  trackWidth = width;
  clearTimeout(settleTimer);
  settleTimer = undefined;
  scrollToPosition(activePanel * trackWidth, true);
}).observe($("#journey"));

const projects = {
  ai: {
    title: "AI Document Extraction",
    heading: "From documents<br>to <em>usable data.</em>",
    description:
      "Turning unstructured documents into validated, structured data with AI and cloud services.",
    role: "MLOps Engineer",
    focus: "AI · Cloud · Automation",
    tags: ["Gemini", "OCR", "FastAPI", "Cloud Run"],
    next: "data",
    nextLabel: "DATA ENGINEERING",
    nextTitle: "Forecasting a cleaner future",
    nextDescription: "Machine learning meets renewable energy.",
    detail:
      "<p>A document-processing workflow that brings together OCR, generative AI, and cloud services to turn unstructured information into structured data.</p><h3>From source to system</h3><p>Documents enter an extraction pipeline. OCR makes their contents readable, Gemini helps interpret the information, and a FastAPI service makes the structured output available to downstream applications.</p><h3>The engineering focus</h3><p>Clear data contracts, validation, and a cloud-native deployment on Google Cloud Run connect the model to a practical application.</p>",
    stages: {
      input: [
        "Documents in",
        "Invoices, receipts, and forms contain useful information in many different layouts. OCR makes that information available for extraction.",
      ],
      engine: [
        "Intelligence at work",
        "Gemini interprets document content. The pipeline maps the extracted fields into a consistent schema and validates the results.",
      ],
      output: [
        "Ready for what’s next",
        "Structured records become usable JSON, CSV, or database inputs. FastAPI connects the pipeline to other applications.",
      ],
    },
  },
  data: {
    title: "Industrial Solar Forecasting",
    heading: "Better forecasts.<br><em>Brighter futures.</em>",
    description:
      "Connecting weather, historical generation, and machine learning to forecast solar power at industrial scale.",
    role: "Research · Data Science",
    focus: "Energy · ML · Forecasting",
    tags: ["Python", "Time series", "Weather data", "Random Forest"],
    next: "fullstack",
    nextLabel: "FULL STACK",
    nextTitle: "Intelligence, part of the experience",
    nextDescription: "A portfolio that can tell its own story.",
    detail:
      "<p>A machine learning-based photovoltaic forecasting system developed for large-scale solar power generation in the Russian power system.</p><h3>Connecting the data</h3><p>Retrospective metering records and weather information provide complementary signals. Data preprocessing and feature engineering turn those inputs into a consistent foundation for forecasting.</p><h3>Research into practice</h3><p>The work explores forecasting algorithms and evaluation for real-world solar generation, with related research in Random Forest prediction and renewable energy planning.</p>",
    link: "https://doi.org/10.3390/rs12203420",
    linkLabel: "Read the publication",
    stages: {
      input: [
        "Weather meets generation data",
        "Historical power generation and weather observations are brought together to create the forecasting dataset.",
      ],
      engine: [
        "Learning the patterns",
        "Machine learning models connect weather conditions with expected solar generation. Cross-validation and parameter tuning guide model evaluation.",
      ],
      output: [
        "Forecasts for planning",
        "Predicted generation makes the data useful for energy planning. Explore the linked publication for the research methodology and findings.",
      ],
    },
  },
  fullstack: {
    title: "Full-Stack LLM Integration",
    heading: "Intelligence, built<br>into the <em>experience.</em>",
    description:
      "Connecting an interactive portfolio to a conversational assistant that makes professional experience easier to explore.",
    role: "Full-Stack Developer",
    focus: "Experience · APIs · AI",
    tags: ["JavaScript", "Node.js", "Express", "OpenAI"],
    next: "ai",
    nextLabel: "AI & MLOPS",
    nextTitle: "From documents to usable data",
    nextDescription: "A connected, cloud-native extraction workflow.",
    detail:
      "<p>This portfolio brings a responsive interface and a conversational assistant together. Visitors can explore the work visually or ask questions about experience, skills, and research.</p><h3>From interface to API</h3><p>A JavaScript frontend sends questions to an Express backend. The server provides résumé context to the language model and returns a response to the conversation.</p><h3>Built around the visitor</h3><p>Clear navigation, accessible controls, and useful error states keep the experience understandable. API credentials remain on the server.</p>",
    link: "https://github.com/PCTEJA/",
    linkLabel: "Explore my GitHub",
    stages: {
      input: [
        "A visitor’s question",
        "The interface accepts questions about Teja’s background, technical skills, projects, and professional experience.",
      ],
      engine: [
        "Context becomes a conversation",
        "A Node.js and Express backend gives the language model résumé context and the visitor’s question.",
      ],
      output: [
        "An answer in the experience",
        "The response appears in the assistant. Open the sparkle button in the corner to try a conversation.",
      ],
    },
  },
};
let selectedProject = "ai";
const initialDiagram = $("#project-visual").innerHTML;
const arrow = '<svg aria-hidden="true"><use href="#i-up"/></svg>';
function alternateDiagram(key) {
  const data = key === "data";
  const labels = data
    ? ["forecasting inputs", "forecasting models", "solar predictions"]
    : ["user questions", "the language model", "assistant responses"];
  const description = data
    ? "Weather and generation data flow through a violet glass machine-learning processor into solar forecasts, research, insights and planning."
    : "A visitor’s question flows through a glass LLM processor into a portfolio assistant, with answers, context, discovery and connections.";
  return `<img class="reference-work-art" src="assets/reference-${key}-art.webp" width="1600" height="483" alt="${description}" decoding="async"><div class="scene-frame">${["input", "engine", "output"].map((stage, i) => `<button class="${["document-stack", "ai-engine", "structured-card"][i]} pipeline-node" data-stage="${stage}" aria-label="Explore ${labels[i]}"><span class="companion-stage-label"><small>0${i + 1} / ${stage.toUpperCase()}</small><strong>${projects[key].stages[stage][0]}</strong><span>Explore stage ↗</span></span></button>`).join("")}</div>`;
}
function selectProject(key) {
  if (!projects[key]) return;
  selectedProject = key;
  $("#work").classList.toggle("companion-project", key !== "ai");
  $("#project-visual").classList.add("reference-scene-active");
  $("#project-visual").classList.add("companion-scene");
  const project = projects[key];
  $$("[data-project]").forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.project === key));
    tab.tabIndex = tab.dataset.project === key ? 0 : -1;
  });
  $("#project-content").setAttribute("aria-labelledby", `tab-${key}`);
  $("#work-heading").innerHTML = project.heading.replace("<br>", "<br> ");
  $("#project-title").textContent = $("#context-title").textContent =
    project.title;
  $("#project-description").textContent = project.description;
  $("#context-role").textContent = project.role;
  $("#context-focus").textContent = project.focus;
  $("#context-stack").innerHTML =
    `${project.tags.slice(0, 2).join(" · ")}<br>${project.tags.slice(2).join(" · ")}`;
  $("#project-number").textContent =
    `/ 0${Object.keys(projects).indexOf(key) + 1}`;
  $("#project-tags").innerHTML = project.tags
    .map((tag) => `<span>${tag}</span>`)
    .join("");
  $("#project-visual").innerHTML =
    key === "ai" ? initialDiagram : alternateDiagram(key);
  $("#project-visual").setAttribute(
    "aria-label",
    `Interactive ${project.title} pipeline`,
  );
  $("#next-project small").textContent = `UP NEXT / ${project.nextLabel}`;
  $("#next-project strong").textContent = project.nextTitle;
  $("#next-project > span:nth-child(2) > span").textContent =
    project.nextDescription;
  document.dispatchEvent(new CustomEvent("portfolio:project", { detail: key }));
}
$$("[data-project]").forEach((tab) =>
  tab.addEventListener("click", () => selectProject(tab.dataset.project)),
);
$(".project-tabs").addEventListener("keydown", (event) => {
  if (
    ![
      "ArrowDown",
      "ArrowUp",
      "ArrowRight",
      "ArrowLeft",
      "Home",
      "End",
    ].includes(event.key)
  )
    return;
  event.preventDefault();
  const keys = Object.keys(projects);
  const current = keys.indexOf(selectedProject);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? keys.length - 1
        : (current +
            (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1) +
            keys.length) %
          keys.length;
  selectProject(keys[next]);
  $(`#tab-${keys[next]}`).focus({ preventScroll: true });
});
$$("[data-project-jump]").forEach((button) =>
  button.addEventListener("click", () => {
    selectProject(button.dataset.projectJump);
    goToPanel(1);
  }),
);
$("#next-project").addEventListener("click", () =>
  selectProject(projects[selectedProject].next),
);

const dialog = $("#detail-dialog");
let dialogOpener;
function showDetails(title, html) {
  dialogOpener = document.activeElement;
  $("#dialog-content").innerHTML = `<h2 id="dialog-title">${title}</h2>${html}`;
  dialog.showModal();
  dialog.scrollTop = 0;
  $("#close-dialog").focus();
  document.dispatchEvent(new CustomEvent("portfolio:dialog"));
}
$("#close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    (event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom)
  )
    dialog.close();
});
dialog.addEventListener("close", () =>
  dialogOpener?.focus({ preventScroll: true }),
);
$("#case-study-button").addEventListener("click", () => {
  const project = projects[selectedProject];
  showDetails(
    project.title,
    project.detail +
      `<div class="tags">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>` +
      (project.link
        ? `<a class="button button-primary" href="${project.link}" target="_blank" rel="noopener">${project.linkLabel} ${arrow}</a>`
        : '<p>Interested in the implementation? <a href="mailto:pcteja2000@gmail.com">Let’s talk about the work ↗</a></p>'),
  );
});
$("#project-visual").addEventListener("click", (event) => {
  const stage = event.target.closest("[data-stage]");
  if (!stage) return;
  const [title, description] =
    projects[selectedProject].stages[stage.dataset.stage];
  showDetails(
    title,
    `<p>${description}</p><div class="tags">${projects[selectedProject].tags.map((tag) => `<span>${tag}</span>`).join("")}</div>`,
  );
});
// Experience content follows the supplied résumé; the visual reference supplies
// the layout, while each company button selects its own role and evidence.
const experiences = {
  cotality: {
    tab: "experience-ai", number: "01", company: "TATA CONSULTANCY SERVICES", client: "Client: Cotality", dates: "2022 — 2025",
    title: "The systems behind<br><em>the impact.</em>", role: "Machine Learning<br>Operations Engineer",
    summary: "Turning unstructured documents into reliable, production-ready data.",
    highlights: [["i-file", "Extract with Gemini + OCR", "From unstructured documents to useful data."], ["i-check", "Validate structured outputs", "Quality checks to ensure reliable results."], ["i-cloud", "Deploy with FastAPI + Cloud Run", "Scalable, production-ready services."]],
    metrics: [["70%", "less manual data entry"], ["40%", "lower serving latency"]],
  },
  now: {
    tab: "experience-data", number: "02", company: "TATA CONSULTANCY SERVICES", client: "Client: NOW Pensions · UK", dates: "2020 — 2022",
    title: "Better foundations.<br><em>Reliable data.</em>", role: "Data Engineer",
    summary: "Moving millions of records through reliable production data pipelines.",
    highlights: [["i-data", "Build with Python + SQL", "Optimize queries and production pipelines."], ["i-check", "Migrate with Talend ETL", "Millions of records moved with zero data loss."], ["i-cloud", "Automate reliable releases", "CI/CD, Docker and Kubernetes deployments."]],
    metrics: [["10M+", "records processed"], ["30%", "shorter release cycles"]],
  },
  unt: {
    tab: "experience-teaching", number: "03", company: "UNIVERSITY OF NORTH TEXAS", client: "Graduate teaching · Denton, Texas", dates: "Oct 2025 — May 2026",
    title: "Make the complex<br><em>feel simple.</em>", role: "Graduate Teaching<br>Assistant",
    summary: "Helping students put Python, machine learning and AI into practice.",
    highlights: [["i-book", "Teach Python, ML + AI", "Connect the curriculum to practical learning."], ["i-code", "Review algorithms and code", "Give detailed, actionable technical feedback."], ["i-people", "Mentor with intention", "Weekly sessions for concepts and debugging."]],
    metrics: [["180+", "students supported"], ["50+", "technical assignments reviewed"]],
  },
  footlocker: {
    tab: "experience-fullstack", number: "04", company: "FOOT LOCKER", client: "Enterprise technology · USA", dates: "Jun 2026 — Present",
    title: "Connected systems.<br><em>Better experiences.</em>", role: "Software Engineering<br>Intern",
    summary: "Connecting interfaces, APIs and quality across retail systems.",
    highlights: [["i-code", "Build responsive experiences", "JavaScript interfaces for store and commerce."], ["i-cloud", "Connect back-end services", "REST APIs supporting orders and digital platforms."], ["i-check", "Validate the full stack", "Regression automation and cross-platform QE."]],
    metrics: [["REST", "connected services & APIs"], ["QE", "full-stack quality engineering"]],
  },
};
function selectExperience(key, reveal = false) {
  const entry = experiences[key];
  if (!entry) return;
  $("#experience-title").innerHTML = entry.title;
  $("#experience-role-title").innerHTML = entry.role;
  $("#experience-summary").textContent = entry.summary;
  $("#experience-company").textContent = entry.company;
  $("#experience-client").textContent = entry.client;
  $("#experience-dates").textContent = entry.dates;
  $("#experience-number").textContent = entry.number;
  $("#experience-content").setAttribute("aria-labelledby", entry.tab);
  $("#experience-highlights").innerHTML = entry.highlights.map(([icon, title, body]) => `<li><span class="icon-tile"><svg><use href="#${icon}"/></svg></span><span><strong>${title}</strong><small>${body}</small></span></li>`).join("");
  entry.metrics.forEach(([value, label], index) => {
    const id = index ? "two" : "one";
    $(`#experience-metric-${id}`).textContent = value;
    $(`#experience-metric-${id}-label`).textContent = label;
  });
  $$("[data-company]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.company === key)));
  $$("[data-experience]").forEach(button => {
    const active = button.dataset.experience === key;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.dispatchEvent(new CustomEvent("portfolio:experience"));
  if (reveal && mobile.matches) $("#experience").scrollTo({ top: $(".experience-sidebar").offsetHeight, behavior: reducedMotion.matches ? "instant" : "smooth" });
}
$$("[data-company]").forEach(button => button.addEventListener("click", () => selectExperience(button.dataset.company, true)));
$$("[data-experience]").forEach(button => button.addEventListener("click", () => selectExperience(button.dataset.experience)));
$(".experience-categories").addEventListener("keydown", event => {
  const tabs = $$("[data-experience]");
  const current = tabs.indexOf(event.target);
  if (current < 0 || !["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
  selectExperience(tabs[index].dataset.experience);
  tabs[index].focus({ preventScroll: true });
});
$("#about-teaching").addEventListener("click", () => { selectExperience("unt"); goToPanel(2); });

const publications = [
  ["Industrial Solar Forecasting System", "https://doi.org/10.3390/rs12203420"],
  [
    "Supreme Court Case Prediction using HCNN",
    "https://link.springer.com/article/10.1007/s10772-021-09820-4",
  ],
  [
    "Random Forest Solar Power Prediction",
    "https://doi.org/10.1109/SIBIRCON48586.2019.8958063",
  ],
  [
    "Renewable Energy Strategic Planning",
    "https://doi.org/10.1109/ICSTCEE49637.2020.9277484",
  ],
  [
    "Remote Microgrid Development",
    "https://doi.org/10.1109/ICSTCEE49637.2020.9276813",
  ],
];
const linkList = (links) =>
  `<div class="detail-list">${links.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}${arrow}</a>`).join("")}</div>`;
const details = {
  tcs: [
    "Engineering reliable ML systems",
    "<p>MLOps Engineer · Tata Consultancy Services · Chennai, India<br>August 2022 — Present</p><ul><li>Developed machine learning pipelines in Python for automated data handling and model training.</li><li>Implemented cloud-based solutions on Google Cloud Platform.</li><li>Improved the software development lifecycle through testing, automation, and performance optimization.</li><li>Collaborated on SDK development and received Best Team Member recognition.</li></ul>",
  ],
  intern: [
    "Personalization through engineering",
    "<p>Software Engineer Intern · TCS / AVIVA<br>February — June 2022</p><p>Developed a real-time video messaging model for personalized customer experiences, using natural language processing to generate insurance premium details tailored to customer needs.</p>",
  ],
  ural: [
    "Where research met the real world",
    "<p>Data Science Intern · Ural Federal University<br>June — August 2019 · Yekaterinburg, Russia</p><p>Led a solar generation prediction project for a power plant in Astrakhan. The work included K-fold cross-validation and parameter tuning to improve model performance.</p><p>The project received first place in the competition and a Diploma in the Energy Track.</p>",
  ],
  research: [
    "Curiosity, published.",
    "<p>Research spanning renewable energy, machine learning, natural language processing, and real-world forecasting.</p><h3>Selected publications</h3>" +
      linkList(publications) +
      `<a class="button button-primary" href="https://scholar.google.com/citations?user=mZGqviAAAAAJ&hl=en" target="_blank" rel="noopener">Google Scholar ${arrow}</a>`,
  ],
  certificates: [
    "Learning is part of the work.",
    linkList([
      [
        "Oracle Cloud Infrastructure 2023 · Application Integration Professional",
        "https://drive.google.com/file/d/1_AOLDGLTqOq90cfEAI-momwOuCo84f8c/view?usp=sharing",
      ],
      [
        "Machine Learning · Andrew Ng / Stanford / Coursera",
        "https://coursera.org/share/83bc69cadd8b41b12974863d20959261",
      ],
      [
        "Data Science Competition · HSE University",
        "https://coursera.org/share/91951b9a234d7a7f439c7763537272f2",
      ],
      [
        "Research Paper Presentation · ICAECT 2020",
        "https://drive.google.com/file/d/1Zd0nxcvsxDgN_6NRRKBWFbE6YRrWukXD/view?usp=sharing",
      ],
    ]) +
      "<h3>Recognition</h3><p>Two-time Best Team Member at TCS. Hackathon and Best Project Team recognition at Ural Federal University.</p>",
  ],
  gallery: [
    "Life & milestones.",
    '<p>A few moments from the journey.</p><div class="gallery-grid">' +
      [1, 2, 3, 6, 5, 9, 7, 8]
        .map(
          (number, index) =>
            `<a href="gallery/${number}.jpg" target="_blank" rel="noopener" aria-label="Open milestone photo ${index + 1}"><img src="gallery/${number}.jpg" loading="lazy" alt="Milestone from Teja’s academic and professional journey, photo ${index + 1}"></a>`,
        )
        .join("") +
      "</div>",
  ],
};
$$("[data-detail]").forEach((button) =>
  button.addEventListener("click", () =>
    showDetails(...details[button.dataset.detail]),
  ),
);
let toastTimer;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3200);
}
$("#copy-email").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("pcteja2000@gmail.com");
    toast("Email copied. Let’s make something meaningful.");
  } catch {
    toast("Email: pcteja2000@gmail.com");
  }
});
$("#year").textContent = new Date().getFullYear();

function setAssistant(open) {
  $("#assistant-panel").hidden = !open;
  $("#assistant-toggle").setAttribute("aria-expanded", String(open));
  if (open) $("#chat-input").focus({ preventScroll: true });
  else $("#assistant-toggle").focus({ preventScroll: true });
  if (open) document.dispatchEvent(new CustomEvent("portfolio:assistant"));
}
$("#assistant-toggle").addEventListener("click", () =>
  setAssistant($("#assistant-panel").hidden),
);
$("#assistant-close").addEventListener("click", () => setAssistant(false));
$("#assistant-panel").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    setAssistant(false);
  }
});
function chatMessage(message, role) {
  const bubble = document.createElement("p");
  bubble.className = `${role}-message`;
  bubble.textContent = message;
  $("#chat-messages").append(bubble);
  bubble.scrollIntoView({ block: "nearest" });
  return bubble;
}
$("#chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chat-input");
  const message = input.value.trim();
  if (!message || input.disabled) return;
  chatMessage(message, "user");
  input.value = "";
  input.disabled = true;
  $("#chat-form button").disabled = true;
  const responseBubble = chatMessage("Thinking…", "assistant");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Assistant unavailable");
    const result = await response.json();
    if (typeof result.response !== "string" || !result.response.trim())
      throw new Error("Empty response");
    responseBubble.textContent = result.response;
  } catch {
    responseBubble.textContent =
      "The AI assistant is unavailable right now. You can still explore my work and research, or reach me at pcteja2000@gmail.com.";
  } finally {
    clearTimeout(timeout);
    input.disabled = false;
    $("#chat-form button").disabled = false;
    if (!$("#assistant-panel").hidden) input.focus({ preventScroll: true });
    $("#chat-messages").scrollTop = $("#chat-messages").scrollHeight;
  }
});

updateMotion();
const initialPanel = panels.findIndex(
  (panel) => `#${panel.id}` === location.hash,
);
scrollToPosition(Math.max(0, initialPanel) * trackWidth, true);
