"use strict";

// Progressive enhancement: the portfolio remains usable if 3D cannot load.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const visual = document.querySelector("#project-visual");
  const animations = new Set();
  const byElement = new WeakMap();
  let scene;
  let loading;
  let failed = false;
  let project = "ai";
  let ribbonFlow, ribbonLoading;
  let travelTimer;
  const allowed = () => !reduce.matches && root.dataset.motionPaused !== "true";

  document.querySelectorAll(".chapter-art").forEach(art => {
    const frame = document.createElement("div");
    frame.className = "chapter-art-frame";
    frame.setAttribute("aria-hidden", "true");
    art.before(frame);
    frame.append(art);
  });

  function reveal(selector, scope = document) {
    if (!allowed()) return;
    scope.querySelectorAll(selector).forEach((element, index) => {
      byElement.get(element)?.cancel();
      const animation = element.animate([
        { opacity: 0.25, transform: "translate3d(0, -18px, 0) scale(.985)" },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
      ], { duration: 650, delay: Math.min(index * 65, 260), easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
      animations.add(animation);
      byElement.set(element, animation);
      animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    });
  }

  async function syncScene() {
    if (!ribbonFlow && !reduce.matches) {
      if (!ribbonLoading) ribbonLoading = import("./ribbon-flow.js")
        .then(({ createRibbonFlow }) => { ribbonFlow = createRibbonFlow(); return ribbonFlow.sync(); })
        .catch(() => {});
    }
    ribbonFlow?.sync();
    const work = root.dataset.activeChapter === "work";
    if (!scene && work && !reduce.matches && !failed) {
      if (!loading) loading = import("./project-scene.js")
        .then(({ createProjectScene }) => {
          scene = createProjectScene(visual, () => {
            failed = true;
            scene?.dispose();
            scene = undefined;
          });
          scene.select(project);
        }).catch(() => { failed = true; });
      await loading;
    }
    scene?.setRunning(work && allowed() && root.dataset.motionTraveling !== "true" && !document.querySelector("#detail-dialog").open);
  }

  document.querySelector("#panel-track").addEventListener("scroll", () => {
    if (root.dataset.motionTraveling !== "true") {
      root.dataset.motionTraveling = "true";
      ribbonFlow?.sync();
      scene?.setRunning(false);
    }
    clearTimeout(travelTimer);
    travelTimer = setTimeout(() => {
      root.dataset.motionTraveling = "false";
      syncScene();
    }, 140);
  }, { passive: true });

  document.addEventListener("portfolio:chapter", () => {
    reveal(".hero-copy > *, .hero-projects, .project-heading, .project-bottom, .next-project, .experience-content > h2, .experience-role, .experience-metric, .about-editorial-heading, .about-person, .about-story, .about-principles li, .about-facts, .contact-panel > h2, .contact-panel > p, .contact-actions", document.querySelector(".panel.is-active"));
    syncScene();
  });
  document.addEventListener("portfolio:project", (event) => {
    project = event.detail;
    scene?.select(project);
    reveal(".project-heading > *, .project-context, .project-bottom > *, .next-project");
    syncScene();
  });
  document.addEventListener("portfolio:experience", () => reveal("#experience-title, #experience-role-title, #experience-summary, #experience-highlights li, .experience-metric"));
  document.addEventListener("portfolio:dialog", () => {
    reveal("#detail-dialog");
    syncScene();
  });
  document.querySelector("#detail-dialog").addEventListener("close", syncScene);
  document.addEventListener("portfolio:assistant", () => reveal("#assistant-panel"));
  document.addEventListener("portfolio:motion", () => {
    if (!allowed()) {
      animations.forEach(animation => animation.cancel());
      document.querySelectorAll(".panel").forEach(panel => {
        panel.style.removeProperty("--pointer-x");
        panel.style.removeProperty("--pointer-y");
      });
    }
    syncScene();
  });

  // Event-driven parallax, with CSS interpolation. No idle JS loop outside 3D.
  document.querySelectorAll(".panel").forEach(panel => {
    panel.addEventListener("pointermove", event => {
      if (!allowed() || !finePointer.matches) return;
      const bounds = panel.getBoundingClientRect();
      panel.style.setProperty("--pointer-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 18}px`);
      panel.style.setProperty("--pointer-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 12}px`);
    }, { passive: true });
    panel.addEventListener("pointerleave", () => {
      panel.style.setProperty("--pointer-x", "0px");
      panel.style.setProperty("--pointer-y", "0px");
    });
  });

  // Bounded click feedback also works for keyboard activation and touch.
  document.addEventListener("click", event => {
    const control = event.target.closest("button, a.button, .chapter-nav a");
    if (!control || control.disabled || !allowed()) return;
    const animation = control.animate([
      { scale: "1" }, { scale: ".95", offset: .25 }, { scale: "1.025", offset: .7 }, { scale: "1" },
    ], { duration: 390, easing: "cubic-bezier(.2,.8,.2,1)" });
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    const stage = control.dataset.stage;
    if (stage) scene?.highlight(stage);
  });
  window.addEventListener("pagehide", () => {
    scene?.setRunning(false);
    ribbonFlow?.dispose(); ribbonFlow=undefined; ribbonLoading=undefined;
  });
  window.addEventListener("pageshow", syncScene);
  reveal(".hero-copy > *, .hero-projects", document.querySelector("#home"));
  syncScene();
})();
