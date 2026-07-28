// 3D gradient descent on a loss surface (Three.js, loaded from CDN on demand)
import { h, demoPanel, slider, button, statRow, clamp, lerp } from './utils.js';
import { onLeave } from './app.js';

const CDN = 'https://esm.sh/three@0.163.0';

// Loss surface: gentle quadratic bowl + sinusoidal terrain
// Saddle at origin, local minima near (±0.8, ∓0.8)
const L  = (x, z) => 0.15 * (x * x + z * z) + Math.sin(2 * x) * Math.sin(2 * z) + 2;
const Lx = (x, z) => 0.3 * x + 2 * Math.cos(2 * x) * Math.sin(2 * z);
const Lz = (x, z) => 0.3 * z + 2 * Math.sin(2 * x) * Math.cos(2 * z);

const RANGE = 2.5;
const YS = 0.6;

export default async function mount(root) {
  let dead = false;
  let dispose = () => { dead = true; };
  onLeave(() => dispose());

  const ph = h('div', { class: 'demo', style: { textAlign: 'center', padding: '70px 20px' } }, [
    h('div', { style: { fontSize: '32px', marginBottom: '10px' } }, '\u{1F310}'),
    h('p', { style: { color: '#8b96a8', margin: '0' } }, 'Loading 3D engine…'),
  ]);
  root.appendChild(ph);

  let THREE, OrbitControls;
  try {
    [THREE, { OrbitControls }] = await Promise.all([
      import(CDN),
      import(CDN + '/examples/jsm/controls/OrbitControls.js'),
    ]);
  } catch {
    ph.querySelector('p').textContent = '3D engine could not load — check your connection.';
    ph.querySelector('p').style.color = '#ff7b9c';
    return;
  }
  if (dead) return;
  root.removeChild(ph);

  /* ---- scene ---- */
  const VH = 420;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);
  scene.fog = new THREE.FogExp2(0x0d1117, 0.04);

  const cam = new THREE.PerspectiveCamera(45, 1.5, 0.1, 100);
  cam.position.set(5, 4.5, 5);

  const ren = new THREE.WebGLRenderer({ antialias: true });
  ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const cvs = ren.domElement;
  cvs.style.cssText = 'width:100%;height:' + VH + 'px;display:block;border-radius:8px;cursor:grab';

  const wrap = h('div', { style: { position: 'relative' } }, [cvs]);

  function resize() {
    const w = wrap.clientWidth || 600;
    ren.setSize(w, VH, false);
    cam.aspect = w / VH;
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  requestAnimationFrame(() => { ro.observe(wrap); resize(); });

  const orb = new OrbitControls(cam, cvs);
  orb.target.set(0, 0.8, 0);
  orb.enableDamping = true;
  orb.dampingFactor = 0.08;
  orb.minDistance = 2.5;
  orb.maxDistance = 14;
  orb.maxPolarAngle = Math.PI * 0.48;
  orb.update();

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(4, 8, 3);
  scene.add(sun);

  /* ---- surface mesh ---- */
  const RES = 80;
  const geom = new THREE.PlaneGeometry(RANGE * 2, RANGE * 2, RES, RES);
  geom.rotateX(-Math.PI / 2);
  const pos = geom.attributes.position;
  let yMin = Infinity, yMax = -Infinity;

  for (let i = 0; i < pos.count; i++) {
    const y = L(pos.getX(i), pos.getZ(i)) * YS;
    pos.setY(i, y);
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }

  const cols = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = clamp((pos.getY(i) - yMin) / (yMax - yMin), 0, 1);
    let r, g, b;
    if (t < 0.3) {
      const u = t / 0.3;
      r = lerp(0.43, 0.31, u); g = lerp(0.55, 0.84, u); b = lerp(1.0, 0.77, u);
    } else if (t < 0.65) {
      const u = (t - 0.3) / 0.35;
      r = lerp(0.31, 1.0, u); g = lerp(0.84, 0.83, u); b = lerp(0.77, 0.47, u);
    } else {
      const u = (t - 0.65) / 0.35;
      r = lerp(1.0, 0.94, u); g = lerp(0.83, 0.53, u); b = lerp(0.47, 0.24, u);
    }
    cols[i * 3] = r; cols[i * 3 + 1] = g; cols[i * 3 + 2] = b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geom.computeVertexNormals();

  const sMat = new THREE.MeshPhongMaterial({
    vertexColors: true, side: THREE.DoubleSide,
    shininess: 30, transparent: true, opacity: 0.88,
  });
  const surf = new THREE.Mesh(geom, sMat);
  scene.add(surf);

  scene.add(new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
    wireframe: true, color: 0xffffff, transparent: true, opacity: 0.04,
  })));

  const grid = new THREE.GridHelper(RANGE * 2, 14, 0x444466, 0x222244);
  grid.position.y = yMin - 0.05;
  scene.add(grid);

  /* ---- ball ---- */
  const BR = 0.08;
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BR, 20, 20),
    new THREE.MeshPhongMaterial({ color: 0xffd479, emissive: 0xe3b341, emissiveIntensity: 0.35 }),
  );
  scene.add(ball);
  const bGlow = new THREE.PointLight(0xffd479, 0.5, 2.5);
  scene.add(bGlow);

  /* ---- trail ---- */
  const MT = 500;
  const tBuf = new Float32Array(MT * 3);
  const tGeom = new THREE.BufferGeometry();
  tGeom.setAttribute('position', new THREE.BufferAttribute(tBuf, 3));
  tGeom.setDrawRange(0, 0);
  const tLine = new THREE.Line(tGeom, new THREE.LineBasicMaterial({
    color: 0xe3b341, transparent: true, opacity: 0.6,
  }));
  scene.add(tLine);

  /* ---- gradient arrow ---- */
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 0.5, 0xff7b9c, 0.07, 0.05,
  );
  scene.add(arrow);

  /* ---- state ---- */
  let bx = 2, bz = 2, vx = 0, vz = 0;
  let lr = 0.05, mom = 0;
  let trail = [], running = false, steps = 0, timer = null;
  const stats = statRow(['Position', 'Loss', '|∇L|', 'Steps']);

  function sync() {
    const y = L(bx, bz) * YS;
    ball.position.set(bx, y + BR, bz);
    bGlow.position.set(bx, y + BR + 0.12, bz);

    const gx = Lx(bx, bz), gz = Lz(bx, bz), gl = Math.hypot(gx, gz);
    if (gl > 0.005) {
      arrow.position.set(bx, y + BR + 0.04, bz);
      arrow.setDirection(new THREE.Vector3(-gx, 0, -gz).normalize());
      arrow.setLength(Math.min(gl * 0.35, 1.0), 0.07, 0.05);
      arrow.visible = true;
    } else {
      arrow.visible = false;
    }

    trail.push({ x: bx, y: y + 0.005, z: bz });
    if (trail.length > MT) trail.shift();
    for (let i = 0; i < trail.length; i++) {
      tBuf[i * 3] = trail[i].x;
      tBuf[i * 3 + 1] = trail[i].y;
      tBuf[i * 3 + 2] = trail[i].z;
    }
    tGeom.attributes.position.needsUpdate = true;
    tGeom.setDrawRange(0, trail.length);

    stats.set('Position', '(' + bx.toFixed(2) + ', ' + bz.toFixed(2) + ')');
    stats.set('Loss', L(bx, bz).toFixed(4));
    stats.set('|∇L|', gl.toFixed(3));
    stats.set('Steps', String(steps));
  }

  function step() {
    const gx = Lx(bx, bz), gz = Lz(bx, bz);
    if (mom > 0) {
      vx = mom * vx - lr * gx;
      vz = mom * vz - lr * gz;
      bx += vx; bz += vz;
    } else {
      bx -= lr * gx; bz -= lr * gz;
    }
    bx = clamp(bx, -RANGE + 0.05, RANGE - 0.05);
    bz = clamp(bz, -RANGE + 0.05, RANGE - 0.05);
    steps++;
    sync();
  }

  function autoRun() {
    if (!running || dead) return;
    step();
    timer = setTimeout(() => requestAnimationFrame(autoRun), 40);
  }

  /* ---- click to place ---- */
  const rc = new THREE.Raycaster(), mp = new THREE.Vector2();
  let pDn = false, pMv = false;
  cvs.addEventListener('pointerdown', () => { pDn = true; pMv = false; });
  cvs.addEventListener('pointermove', () => { if (pDn) pMv = true; });
  cvs.addEventListener('pointerup', e => {
    if (pDn && !pMv) {
      const r = cvs.getBoundingClientRect();
      mp.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mp.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      rc.setFromCamera(mp, cam);
      const hits = rc.intersectObject(surf);
      if (hits.length) {
        bx = clamp(hits[0].point.x, -RANGE + 0.1, RANGE - 0.1);
        bz = clamp(hits[0].point.z, -RANGE + 0.1, RANGE - 0.1);
        vx = vz = 0; trail = []; steps = 0;
        tGeom.setDrawRange(0, 0);
        sync();
      }
    }
    pDn = false;
  });

  /* ---- render loop ---- */
  function animate() {
    if (dead) return;
    requestAnimationFrame(animate);
    orb.update();
    ren.render(scene, cam);
  }

  /* ---- controls ---- */
  const lrS = slider('Learning rate η', {
    min: 0.005, max: 0.3, step: 0.005, value: 0.05,
    fmt: v => v.toFixed(3),
  }, v => { lr = v; });

  const momS = slider('Momentum β', {
    min: 0, max: 0.95, step: 0.01, value: 0,
    fmt: v => v.toFixed(2),
  }, v => { mom = v; });

  const stepBtn = button('Step ▸', () => {
    running = false; runBtn.textContent = '▶ Auto';
    step();
  });

  const runBtn = button('▶ Auto', () => {
    running = !running;
    runBtn.textContent = running ? '⏸ Pause' : '▶ Auto';
    if (running) autoRun();
  });

  const resetBtn = button('Reset', () => {
    running = false; runBtn.textContent = '▶ Auto';
    clearTimeout(timer);
    bx = 2; bz = 2; vx = vz = 0;
    trail = []; steps = 0;
    tGeom.setDrawRange(0, 0);
    sync();
  }, true);

  /* ---- assemble ---- */
  root.appendChild(demoPanel(
    '3D loss landscape',
    'Orbit: drag · Place ball: click surface · Zoom: scroll',
    wrap,
    h('div', { class: 'controls' }, [lrS.el, momS.el, stepBtn, runBtn, resetBtn]),
    stats.el,
  ));

  sync();
  animate();

  dispose = () => {
    dead = true;
    running = false;
    clearTimeout(timer);
    ro.disconnect();
    orb.dispose();
    ren.dispose();
  };
}
