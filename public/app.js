"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const track = $("#panel-track");
const panels = $$(".panel");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobile = matchMedia("(max-width: 760px)");
let activePanel = 0;
let targetScroll = 0;
let scrollFrame = 0;
let ambientPaused = reducedMotion.matches;
let settleTimer;
let pointerDown = false;
let scrollTimestamp = 0;
let wheelStart = 0;

// Keep the document itself still. Wheel input becomes movement along the chapter rail.
// Small screens retain native horizontal swipe and can scroll tall chapter content vertically.
function animateScroll(now) {
  const elapsed = scrollTimestamp ? Math.min(now - scrollTimestamp, 64) : 16;
  scrollTimestamp = now;
  const distance = targetScroll - track.scrollLeft;
  if (Math.abs(distance) < 0.8 || reducedMotion.matches) {
    track.scrollLeft = targetScroll;
    scrollFrame = 0;
    scrollTimestamp = 0;
    return;
  }
  track.scrollLeft += distance * (1 - Math.exp(-elapsed / 85));
  scrollFrame = requestAnimationFrame(animateScroll);
}
function scrollToPosition(position, immediate = false) {
  targetScroll = Math.max(
    0,
    Math.min(position, track.scrollWidth - track.clientWidth),
  );
  if (immediate || reducedMotion.matches || mobile.matches) {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    track.scrollTo({
      left: targetScroll,
      behavior: immediate || reducedMotion.matches ? "instant" : "smooth",
    });
  } else if (!scrollFrame) scrollFrame = requestAnimationFrame(animateScroll);
}
function goToPanel(index, focus = false) {
  index = Math.max(0, Math.min(index, panels.length - 1));
  scrollToPosition(index * track.clientWidth);
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
          ? track.clientWidth
          : 1;
    const delta = (vertical ? event.deltaY : event.deltaX) * multiplier;
    if (!settleTimer) wheelStart = track.scrollLeft;
    if (!scrollFrame) targetScroll = track.scrollLeft;
    scrollToPosition(targetScroll + delta * 1.35);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      let destination = Math.round(targetScroll / track.clientWidth);
      const startChapter = Math.round(wheelStart / track.clientWidth);
      if (
        destination === startChapter &&
        Math.abs(targetScroll - wheelStart) > 45
      )
        destination += Math.sign(targetScroll - wheelStart);
      if (!pointerDown) scrollToPosition(destination * track.clientWidth);
      settleTimer = undefined;
    }, 240);
  },
  { passive: false },
);
track.addEventListener(
  "pointerdown",
  () => {
    pointerDown = true;
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    clearTimeout(settleTimer);
    settleTimer = undefined;
  },
  { passive: true },
);
window.addEventListener(
  "pointerup",
  () => {
    pointerDown = false;
  },
  { passive: true },
);
track.addEventListener(
  "scroll",
  () => {
    const position = track.scrollLeft / track.clientWidth;
    activePanel = Math.max(
      0,
      Math.min(panels.length - 1, Math.round(position)),
    );
    $("#chapter-progress").style.width =
      `${(position / (panels.length - 1)) * 100}%`;
    $("#page-number").textContent = String(activePanel + 1).padStart(2, "0");
    $("#previous-panel").disabled = activePanel === 0;
    $("#next-panel").disabled = activePanel === panels.length - 1;
    $$(".chapter-nav a, .primary-nav a").forEach((link) => {
      if (link.hash === `#${panels[activePanel].id}`)
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (ambientPaused) drawFlow(performance.now());
  },
  { passive: true },
);
$$('a[href^="#"]').forEach((link) =>
  link.addEventListener("click", (event) => {
    const index = panels.findIndex((panel) => `#${panel.id}` === link.hash);
    if (index < 0) return;
    event.preventDefault();
    goToPanel(index, link.classList.contains("skip-link"));
  }),
);
$("#previous-panel").addEventListener("click", () =>
  goToPanel(activePanel - 1),
);
$("#next-panel").addEventListener("click", () => goToPanel(activePanel + 1));
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

// Vector ribbons are composed from translucent satin bands and travelling highlights.
// Their paths are real geometry, so they stay crisp at every screen size.
function ribbonMarkup(id) {
  let paths = "";
  for (let i = 0; i < 24; i++) {
    const y = 50 + i * 4.2;
    paths += `<path d="M-80 ${y + 12} C180 ${y + 170},260 ${y - 124},530 ${y + 12} S870 ${y + 160},1110 ${y + 22} S1350 ${y - 20},1520 ${y + 52}" stroke="url(#${id}-color)" stroke-width="${7 + Math.sin((i / 24) * Math.PI) * 4}" opacity="${0.45 + Math.sin((i / 24) * Math.PI) * 0.5}"/>`;
    if (i % 5 === 0)
      paths += `<path d="M-80 ${y + 12} C180 ${y + 170},260 ${y - 124},530 ${y + 12} S870 ${y + 160},1110 ${y + 22} S1350 ${y - 20},1520 ${y + 52}" stroke="white" stroke-width="${i % 10 === 0 ? 2 : 0.7}" opacity=".65"/>`;
  }
  return `<svg class="ribbon-svg" viewBox="0 0 1440 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="${id}-color" x1="0" y1="0" x2="1" y2=".15"><stop stop-color="#ffad89"/><stop offset=".14" stop-color="#ed9be2"/><stop offset=".3" stop-color="#8e5bfc"/><stop offset=".43" stop-color="#c5b4ff"/><stop offset=".56" stop-color="#79dfff"/><stop offset=".68" stop-color="#6486ff"/><stop offset=".8" stop-color="#ac83ff"/><stop offset="1" stop-color="#bcefff"/></linearGradient><linearGradient id="${id}-shine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity=".8"/><stop offset=".5" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="#ab7aff" stop-opacity=".3"/></linearGradient></defs><g class="ribbon-group" fill="none">${paths}<path class="flow-glint" d="M-80 106 C180 276,260 -30,530 106 S870 266,1110 116 S1350 74,1520 146" stroke="white" stroke-width="2.5" opacity=".75"/></g></svg>`;
}
$(".hero-front-flow").innerHTML = ribbonMarkup("foreground");
$(".diagram-flow").innerHTML = ribbonMarkup("diagram");

const canvas = $("#flow-canvas");
const context = canvas.getContext("2d");
let flowWidth = 0;
let flowHeight = 0;
let flowFrame = 0;
let lastFrame = 0;
let flowTime = 0;
let lastFlowTime = 0;
function sizeCanvas() {
  flowWidth = canvas.clientWidth;
  flowHeight = canvas.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = flowWidth * dpr;
  canvas.height = flowHeight * dpr;
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFlow(performance.now());
}
function drawFlow(now) {
  if (!context || !flowWidth) return;
  if (!ambientPaused && lastFlowTime)
    flowTime += Math.min(now - lastFlowTime, 50) * 0.00022;
  lastFlowTime = now;
  const offset = track.scrollLeft;
  const step = mobile.matches ? 6 : 12;
  context.clearRect(0, 0, flowWidth, flowHeight);
  const palettes = [
    ["#fbbb91", "#ff9bbd", "#c389ff", "#8c69ff", "#83b6ff"],
    ["#75e5f1", "#35ceff", "#638bff", "#9568ff", "#f0b5e8"],
    ["#d5c9ff", "#9d92ff", "#76b6ff", "#9adaff", "#bea4ff"],
  ];
  for (let band = 0; band < 3; band++) {
    const base = flowHeight * (mobile.matches ? 0.76 : 0.71) + band * 19;
    const thickness = flowHeight * (0.087 + band * 0.012);
    const curve = (x, edge) => {
      const world = (x + offset) / flowWidth;
      return (
        base +
        Math.sin(world * 5.3 + 0.5 + band * 0.29 + Math.sin(flowTime) * 0.1) *
          flowHeight *
          0.2 +
        Math.sin(world * 9 - flowTime * 0.65 + band) * flowHeight * 0.025 +
        edge * thickness * (1 + Math.sin(world * 7 + band + flowTime) * 0.36)
      );
    };
    for (let stripe = 0; stripe < 22; stripe++) {
      const edge = stripe / 22 - 0.5;
      const gradient = context.createLinearGradient(
        0,
        0,
        flowWidth,
        flowHeight * 0.3,
      );
      palettes[band].forEach((color, index) =>
        gradient.addColorStop(index / 4, color),
      );
      context.beginPath();
      for (let x = -30; x <= flowWidth + 30; x += step) {
        const y = curve(x, edge);
        if (x === -30) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      for (let x = flowWidth + 30; x >= -30; x -= step)
        context.lineTo(x, curve(x, edge + 0.061));
      context.closePath();
      context.globalAlpha = 0.56 + Math.sin((stripe / 22) * Math.PI) * 0.32;
      context.fillStyle = gradient;
      context.fill();
      if (stripe < 3 || stripe === 8 || stripe === 19) {
        context.globalAlpha = stripe === 8 ? 0.28 : 0.48;
        context.strokeStyle = "white";
        context.lineWidth = stripe === 8 ? 4 : 0.65;
        context.stroke();
      }
    }
  }
  context.globalAlpha = 1;
}
function frame(now) {
  if (!ambientPaused && !document.hidden && now - lastFrame > 32) {
    drawFlow(now);
    lastFrame = now;
  }
  if (!ambientPaused && !document.hidden)
    flowFrame = requestAnimationFrame(frame);
}
function updateMotion() {
  document.body.classList.toggle("motion-paused", ambientPaused);
  $("#motion-toggle").setAttribute("aria-pressed", String(ambientPaused));
  $("#motion-toggle").setAttribute(
    "aria-label",
    ambientPaused ? "Resume ambient animation" : "Pause ambient animation",
  );
  $("#motion-toggle span").textContent = ambientPaused ? "▷" : "Ⅱ";
  cancelAnimationFrame(flowFrame);
  lastFlowTime = 0;
  if (!ambientPaused && !document.hidden)
    flowFrame = requestAnimationFrame(frame);
  else drawFlow(performance.now());
}
$("#motion-toggle").addEventListener("click", () => {
  ambientPaused = !ambientPaused;
  updateMotion();
});
reducedMotion.addEventListener("change", (event) => {
  ambientPaused = event.matches;
  updateMotion();
});
document.addEventListener("visibilitychange", updateMotion);
new ResizeObserver(() => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  targetScroll = activePanel * track.clientWidth;
  track.scrollLeft = targetScroll;
  sizeCanvas();
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
  return `<div class="diagram-flow" aria-hidden="true">${ribbonMarkup("diagram-" + key)}</div><button class="document-stack pipeline-node" data-stage="input" aria-label="Explore ${data ? "forecasting inputs" : "user questions"}"><span class="paper paper-back"></span><span class="paper paper-middle"></span><span class="paper paper-front"><span class="paper-label">${data ? "WEATHER + ENERGY" : "THE INTERFACE"}</span><b>${data ? "Signals for<br>a better forecast." : "Curiosity,<br>in conversation."}</b><i></i><i></i><i></i><i></i><span class="paper-footer">01 / INPUT</span></span><span class="node-caption">${data ? "Connected data" : "A visitor’s question"}</span></button><button class="ai-engine pipeline-node" data-stage="engine" aria-label="Explore ${data ? "forecasting models" : "the language model"}"><span class="engine-inner"><svg><use href="#${data ? "i-data" : "i-ai"}"/></svg><strong>${data ? "ML" : "LLM"}</strong><span>${data ? "FORECASTING" : "CONVERSATION"}</span><i class="engine-status">${data ? "LEARNING PATTERNS" : "CONNECTING IDEAS"}</i></span><span class="node-caption">${data ? "Patterns become predictions" : "Context + intelligence"}</span></button><button class="structured-card pipeline-node" data-stage="output" aria-label="Explore ${data ? "solar predictions" : "assistant responses"}"><span class="structured-title">${data ? "Solar forecast" : "Useful answers"} <span>✓</span></span>${(data ? ["Weather", "Generation", "Patterns", "Prediction", "Planning"] : ["Experience", "Skills", "Research", "Projects", "Connections"]).map((label, i) => `<span class="data-row"><b>${["◇", "▦", "↗", "▤", "▧"][i]}</b> ${label} <i></i></span>`).join("")}<span class="node-caption">${data ? "Energy, understood" : "A more personal experience"}</span></button><div class="output-formats">${(data ? ["Forecasts", "Research", "Insights", "Planning"] : ["Answers", "Context", "Discovery", "Connect"]).map((label, i) => `<span><b>${["↗", "◇", "▦", "✳"][i]}</b> ${label}</span>`).join("")}</div>`;
}
function selectProject(key) {
  if (!projects[key]) return;
  selectedProject = key;
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
  if (!reducedMotion.matches)
    $("#project-visual").animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 450, easing: "ease-out" },
    );
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

sizeCanvas();
updateMotion();
const initialPanel = panels.findIndex(
  (panel) => `#${panel.id}` === location.hash,
);
if (initialPanel >= 0) {
  activePanel = initialPanel;
  requestAnimationFrame(() =>
    scrollToPosition(initialPanel * track.clientWidth, true),
  );
}
