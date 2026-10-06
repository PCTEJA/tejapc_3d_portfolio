import * as THREE from "./vendor/three.module.min.js";
import { ribbonShader } from "./ribbon-shader.js";

// PNG masters are the surfaces: image-based relief, not invented geometry.
const artwork = {
  ai: "assets/reference-work-art.png",
  data: "assets/reference-data-art.png",
  fullstack: "assets/reference-fullstack-art.png",
};

export function createProjectScene(host, onFailure) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);
  const canvas = renderer.domElement;
  canvas.className = "scene-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
  camera.position.z = 4;
  const geometry = new THREE.PlaneGeometry(2, 2, 180, 60);
  const material = new THREE.MeshBasicMaterial({ toneMapped: false });
  const surface = new THREE.Mesh(geometry, material);
  surface.visible = false;
  scene.add(surface);
  const uniforms = {
    uPointer: { value: new THREE.Vector2() },
    uLift: { value: new THREE.Vector4() },
    uTime: { value: 0 },
    uMotion: { value: 0 },
  };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = `uniform float uTime; uniform float uMotion;\n${ribbonShader}\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
      #ifdef USE_MAP
        diffuseColor *= flowingRibbon(map, vMapUv, uTime, uMotion, 2.);
      #endif
    `);
    shader.vertexShader = `
      uniform vec2 uPointer;
      uniform vec4 uLift;
      uniform float uTime;
      uniform float uMotion;
      float region(float x, float a, float b) {
        return smoothstep(a, a + .035, x) * (1. - smoothstep(b - .035, b, x));
      }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      // Faces and lettering move together. Blend through intervening space;
      // pin captions and outer edges to the original image coordinates.
      float vertical = smoothstep(.13, .23, uv.y) * (1. - smoothstep(.92, 1., uv.y));
      vec4 masks = vec4(region(uv.x, .015, .32), region(uv.x, .335, .55),
                        region(uv.x, .58, .815), region(uv.x, .845, .99)) * vertical;
      float objects = min(1., dot(masks, vec4(1.)));
      float edge = smoothstep(0., .035, uv.x) * (1. - smoothstep(.965, 1., uv.x));
      float ribbon = (1. - objects) * vertical * edge;
      float depth = dot(masks, vec4(.7, 1., .8, .55));
      transformed.z += depth * .12;
      transformed.x += uPointer.x * depth * .009 * uMotion;
      transformed.y += (dot(masks, uLift) + uPointer.y * depth * .012
                       + sin(uv.x * 10. - uTime * .8) * ribbon * .007) * uMotion;
    `);
  };
  const toolbar = document.createElement("div");
  toolbar.className = "scene-toolbar";
  toolbar.innerHTML = '<span>EXPLORE THE FLOW</span><button type="button" class="scene-replay" aria-label="Replay project flow">Replay flow ↻</button>';
  const replay = toolbar.querySelector("button");
  const textures = new Map();
  const loader = new THREE.TextureLoader();
  const pointer = new THREE.Vector2();
  let sourceImage, revision = 0, time = 0, last = 0, replayTime = -10;
  let hover = -1, visible = false, requested = false, running = false, disposed = false;

  function render() { if (!disposed && surface.visible) renderer.render(scene, camera); }
  function draw(now) {
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    time += dt;
    const easing = 1 - Math.exp(-dt * 9);
    uniforms.uPointer.value.lerp(pointer, easing);
    uniforms.uTime.value = time;
    for (let i = 0; i < 4; i++) {
      const pass = time - replayTime - i * .32;
      const wave = pass > 0 && pass < 1.2 ? Math.sin(pass / 1.2 * Math.PI) * .04 : 0;
      const focused = hover === i || (hover === 2 && i === 3);
      const target = (focused ? .035 : 0) + wave;
      const current = uniforms.uLift.value.getComponent(i);
      uniforms.uLift.value.setComponent(i, THREE.MathUtils.lerp(current, target, easing));
    }
    render();
  }
  function sync() {
    if (disposed) return;
    const next = requested && visible && surface.visible && !document.hidden;
    replay.disabled = !requested;
    toolbar.querySelector("span").textContent = requested ? "EXPLORE THE FLOW" : "MOTION PAUSED";
    if (next === running) return;
    running = next;
    last = 0;
    uniforms.uMotion.value = running ? 1 : 0;
    renderer.setAnimationLoop(running ? draw : null);
    if (!running) render();
  }
  function resize() {
    if (disposed || !sourceImage) return;
    const bounds = sourceImage.getBoundingClientRect();
    const container = host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    canvas.style.left = `${bounds.left - container.left}px`;
    canvas.style.top = `${bounds.top - container.top}px`;
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    renderer.setSize(bounds.width, bounds.height, false);
    render();
  }
  function move(event) {
    if (!requested || event.pointerType === "touch") return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set(THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(1 - (event.clientY - bounds.top) / bounds.height * 2, -1, 1));
    hover = ["input", "engine", "output"].indexOf(event.target.closest("[data-stage]")?.dataset.stage);
  }
  function leave() { pointer.set(0, 0); hover = -1; }
  function focus(event) { if (requested) hover = ["input", "engine", "output"].indexOf(event.target.dataset.stage); }
  const replayFlow = () => { if (requested) replayTime = time; };
  const lost = event => { event.preventDefault(); onFailure(); };
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerleave", leave);
  host.addEventListener("focusin", focus);
  host.addEventListener("focusout", leave);
  replay.addEventListener("click", replayFlow);
  canvas.addEventListener("webglcontextlost", lost);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  observer.observe(canvas);
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  function loadTexture(url) {
    if (!textures.has(url)) textures.set(url, loader.loadAsync(url).then(texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if (disposed) texture.dispose();
      return texture;
    }));
    return textures.get(url);
  }
  return {
    async select(key) {
      const ticket = ++revision;
      host.classList.remove("scene-live");
      host.append(canvas, toolbar);
      canvas.dataset.project = key;
      canvas.dataset.texture = artwork[key];
      canvas.dataset.ready = "false";
      surface.visible = false;
      sync();
      if (sourceImage) resizer.unobserve(sourceImage);
      sourceImage = host.querySelector(".reference-work-art");
      resizer.observe(sourceImage);
      resize();
      try {
        const texture = await loadTexture(artwork[key]);
        if (disposed || ticket !== revision) return;
        material.map = texture;
        material.needsUpdate = true;
        surface.visible = true;
        hover = -1; pointer.set(0, 0);
        uniforms.uLift.value.set(0, 0, 0, 0);
        uniforms.uPointer.value.set(0, 0);
        uniforms.uMotion.value = 0;
        resize();
        canvas.dataset.ready = "true";
        host.classList.add("scene-live");
        sync();
      } catch {
        if (!disposed && ticket === revision) onFailure();
      }
    },
    highlight(stage) { hover = ["input", "engine", "output"].indexOf(stage); },
    setRunning(value) { requested = value; sync(); },
    dispose() {
      disposed = true; revision++;
      renderer.setAnimationLoop(null);
      observer.disconnect(); resizer.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focusin", focus);
      host.removeEventListener("focusout", leave);
      canvas.removeEventListener("webglcontextlost", lost);
      textures.forEach(promise => promise.then(texture => texture.dispose()).catch(() => {}));
      geometry.dispose(); material.dispose(); renderer.dispose();
      canvas.remove(); toolbar.remove(); host.classList.remove("scene-live");
    },
  };
}
