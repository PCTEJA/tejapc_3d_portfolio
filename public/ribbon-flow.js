import { ribbonShader } from "./ribbon-shader.js";

// One small WebGL context follows the active chapter's existing image.
// Three.js owns Work; this renderer avoids loading that library on Intro.
export function createRibbonFlow() {
  const canvas = document.createElement("canvas");
  canvas.className = "ribbon-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return { sync() {}, dispose() {} };
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const vertex = compile(gl.VERTEX_SHADER, "attribute vec2 position; varying vec2 vUv; void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}");
  const fragment = compile(gl.FRAGMENT_SHADER, `precision highp float; varying vec2 vUv;
    uniform sampler2D art; uniform vec4 crop; uniform float time; uniform float kind;
    ${ribbonShader}
    void main(){gl_FragColor=flowingRibbon(art,crop.xy+vUv*crop.zw,time,1.,kind);}`);
  const program = gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program,"position"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  const uniforms = Object.fromEntries(["crop","time","kind"].map(name=>[name,gl.getUniformLocation(program,name)]));
  let image, imageURL, ticket=0, frame=0, previous=0, time=0, ready=false, enabled=false, visible=false, dead=false;
  const mobile = matchMedia("((max-width: 760px) or ((max-width: 1024px) and (orientation: portrait)))");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function stop() { cancelAnimationFrame(frame); frame=0; previous=0; }
  function draw(now) {
    if (!enabled || !ready || !visible || dead) { stop(); return; }
    // Decorative material flow needs 24 fps, not a full-screen GPU pass at
    // every refresh on 120/144 Hz displays. Bound both cadence and pixel cost.
    if (previous && now-previous<1000/24) { frame=requestAnimationFrame(draw); return; }
    if (previous) time += Math.min((now-previous)/1000,.12);
    previous=now;
    gl.uniform1f(uniforms.time,time); gl.drawArrays(gl.TRIANGLES,0,6);
    frame=requestAnimationFrame(draw);
  }
  function renderState() {
    if (enabled && ready && visible && !dead) { if (!frame) frame=requestAnimationFrame(draw); }
    else stop();
  }
  function resize() {
    if (!image || !ready || dead) return;
    const rendered=image.classList.contains("ribbon-rendered");
    image.classList.remove("ribbon-rendered");
    const box=image.getBoundingClientRect(), parent=image.parentElement.getBoundingClientRect();
    const style=getComputedStyle(image);
    const ratio=Math.min(devicePixelRatio,1.5,Math.sqrt(1400000/Math.max(1,box.width*box.height)));
    canvas.style.left=`${box.left-parent.left+image.parentElement.scrollLeft}px`;
    canvas.style.top=`${box.top-parent.top+image.parentElement.scrollTop}px`;
    canvas.style.width=`${box.width}px`; canvas.style.height=`${box.height}px`;
    canvas.style.opacity=style.opacity; canvas.style.maskImage=style.maskImage;
    if(rendered) image.classList.add("ribbon-rendered");
    canvas.width=Math.max(1,Math.round(box.width*ratio)); canvas.height=Math.max(1,Math.round(box.height*ratio));
    gl.viewport(0,0,canvas.width,canvas.height);
    let x=1,y=1;
    if(style.objectFit==="cover") {
      const scale=Math.max(box.width/image.naturalWidth,box.height/image.naturalHeight);
      x=box.width/(image.naturalWidth*scale); y=box.height/(image.naturalHeight*scale);
    }
    const parts=style.objectPosition.split(" ").map(value=>parseFloat(value)/100);
    gl.uniform4f(uniforms.crop,(1-x)*(parts[0]??.5),(1-y)*(1-(parts[1]??.5)),x,y);
    gl.uniform1f(uniforms.time,time); gl.drawArrays(gl.TRIANGLES,0,6);
  }
  const sizeObserver=new ResizeObserver(resize);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;renderState();});
  visibility.observe(canvas);
  async function sync() {
    if(dead) return;
    enabled=document.documentElement.dataset.motionPaused!=="true" && document.documentElement.dataset.motionTraveling!=="true" && !document.hidden && !reduced.matches && !document.querySelector("#detail-dialog").open;
    const chapter=document.documentElement.dataset.activeChapter;
    const selector={home:mobile.matches?".hero-flow-placement img":".reference-intro-art img",experience:".experience-art",about:".about-art",contact:".contact-ribbon img"}[chapter];
    const next=selector?document.querySelector(selector):null;
    if (!next || !enabled) { stop(); image?.classList.remove("ribbon-rendered"); canvas.remove(); image=undefined; imageURL=undefined; ready=false; ticket++; sizeObserver.disconnect(); return; }
    if(next===image && imageURL===next.currentSrc) {renderState(); return;}
    const selection=++ticket;
    stop(); ready=false; image?.classList.remove("ribbon-rendered"); sizeObserver.disconnect(); canvas.remove();
    image=next;
    try {
      await next.decode();
      if(dead || selection!==ticket) return;
      imageURL=next.currentSrc;
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,next);
      gl.uniform1f(uniforms.kind,chapter==="home"&&!mobile.matches?1:chapter==="experience"?3:0);
      next.parentElement.append(canvas);
      canvas.dataset.chapter=chapter;
      ready=true; resize();
      next.classList.add("ribbon-rendered");
      sizeObserver.observe(next); renderState();
    } catch { if(selection===ticket) {ready=false;canvas.remove();next.classList.remove("ribbon-rendered");} }
  }
  function dispose() {dead=true;ticket++;stop();sizeObserver.disconnect();visibility.disconnect();image?.classList.remove("ribbon-rendered");canvas.remove();gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);window.removeEventListener("resize",sync);}
  canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();dispose();});
  window.addEventListener("resize",sync);
  return {sync,dispose};
}
