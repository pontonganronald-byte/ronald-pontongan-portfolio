// =========================================================
// NEED FOR SPEED: NIGHT STREET RACING (Three.js r128)
// =========================================================

// Fail-safe check for Three.js library
if (typeof THREE === 'undefined') {
  alert('Error: Three.js library could not be loaded from CDN. Please check your internet connection.');
  throw new Error('THREE is not defined');
}

// ----- Core Gameplay Constants & Car Tuning -----
const ROAD_W = 10;
const LIMIT = ROAD_W / 2 - 1.15;
const LANES = [-3.75, -1.25, 1.25, 3.75];
const START_SPEED = 30;

// Car Roster (Generic high-performance machines with distinct tuning)
const CARS = [
  {
    id: 'coupe',
    name: 'STREET COUPE',
    category: 'Balanced Tuner',
    topSpeed: 95,      // Max speed
    accel: 1.25,       // Acceleration rate
    handling: 15.0,    // Lateral steering speed
    stats: { speed: 76, handling: 80, accel: 72 },
    spoiler: 'tuner',
    profile: 'coupe'
  },
  {
    id: 'muscle',
    name: 'MUSCLE GT',
    category: 'V8 Powerhouse',
    topSpeed: 108,
    accel: 1.55,
    handling: 12.2,
    stats: { speed: 92, handling: 62, accel: 94 },
    spoiler: 'ducktail',
    profile: 'muscle'
  },
  {
    id: 'hyper',
    name: 'HYPER RACER',
    category: 'Aero Prototype',
    topSpeed: 116,
    accel: 1.45,
    handling: 16.5,
    stats: { speed: 98, handling: 88, accel: 85 },
    spoiler: 'gt',
    profile: 'hyper'
  },
  {
    id: 'drift',
    name: 'DRIFT WAGON',
    category: 'Street Fighter',
    topSpeed: 92,
    accel: 1.25,
    handling: 18.0,
    stats: { speed: 70, handling: 96, accel: 72 },
    spoiler: 'lip',
    profile: 'drift'
  },
  {
    id: 'apex',
    name: 'MIDNIGHT APEX',
    category: 'Super Exotic',
    topSpeed: 105,
    accel: 1.50,
    handling: 16.0,
    stats: { speed: 88, handling: 86, accel: 88 },
    spoiler: 'aero',
    profile: 'apex'
  }
];

// Paint Finishes (High-vibrancy street racing finishes)
const PAINT_COLORS = [
  { name: 'Cyber Cyan', hex: 0x00f0ff, css: '#00f0ff' },
  { name: 'Neon Magenta', hex: 0xff007f, css: '#ff007f' },
  { name: 'Acid Lime', hex: 0x39ff14, css: '#39ff14' },
  { name: 'Sunset Orange', hex: 0xff5e00, css: '#ff5e00' },
  { name: 'Midnight Violet', hex: 0x9b5de5, css: '#9b5de5' },
  { name: 'Solar Yellow', hex: 0xffea00, css: '#ffea00' },
  { name: 'Stealth Black', hex: 0x181a24, css: '#181a24' },
  { name: 'Ultra White', hex: 0xf5f8ff, css: '#f5f8ff' }
];

// Traffic Palette
const TRAFFIC_COLORS = [0x223344, 0x992222, 0x116644, 0xcc8822, 0x444455, 0xdddddd, 0x771188];

// DOM Shortcuts & Safe Helpers
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const safeOn = (id, event, handler) => {
  const el = $(id);
  if (el) el.addEventListener(event, handler);
};

// ----- Graphics Quality State -----
let graphicsQuality = 'high'; // 'high' | 'low'

// ----- Scene & Renderer Setup -----
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060714);
scene.fog = new THREE.Fog(0x080b1a, 35, 230);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 400);

// Lighting Rig (Ensures scene and materials are always well-lit)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x5588cc, 0x111528, 0.65);
scene.add(hemiLight);

const moonLight = new THREE.DirectionalLight(0x99ccff, 0.8);
moonLight.position.set(15, 30, 20);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 1024;
moonLight.shadow.mapSize.height = 1024;
moonLight.shadow.camera.near = 10;
moonLight.shadow.camera.far = 120;
moonLight.shadow.camera.left = -25;
moonLight.shadow.camera.right = 25;
moonLight.shadow.camera.top = 25;
moonLight.shadow.camera.bottom = -25;
scene.add(moonLight);

// Garage Turntable Spotlight
const garageSpot = new THREE.SpotLight(0x00f0ff, 2.8, 30, Math.PI / 4, 0.35, 1.2);
garageSpot.position.set(0, 10, 0);
garageSpot.target.position.set(0, 0, 0);
scene.add(garageSpot);
scene.add(garageSpot.target);

// Garage Warm Rim Light
const garageRimLight = new THREE.PointLight(0xff007f, 1.8, 25);
garageRimLight.position.set(-4, 3, -3);
scene.add(garageRimLight);

function resize() {
  const w = window.innerWidth || 800;
  const h = window.innerHeight || 600;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// =========================================================
// PROCEDURAL TEXTURE GENERATORS (Canvas to Three.js Texture)
// =========================================================

function makeWindowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#080a14';
  ctx.fillRect(0, 0, 128, 256);

  const cols = 5, rows = 14;
  const w = 14, h = 10, padX = 11, padY = 8;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > 0.42) {
        const rand = Math.random();
        ctx.fillStyle = rand > 0.65 ? '#ffe596' : (rand > 0.35 ? '#00f0ff' : '#ff007f');
        ctx.fillRect(9 + col * (w + padX), 10 + r * (h + padY), w, h);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
const windowTexture = makeWindowTexture();

function makeNeonSignTexture(title, sub, c1, c2) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#070914';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = c1;
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, 480, 224);

  ctx.strokeStyle = c2;
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 460, 204);

  ctx.font = '900 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = c1;
  ctx.shadowColor = c1;
  ctx.shadowBlur = 24;
  ctx.fillText(title, 256, 105);
  ctx.fillText(title, 256, 105);

  if (sub) {
    ctx.font = '800 28px sans-serif';
    ctx.fillStyle = c2;
    ctx.shadowColor = c2;
    ctx.shadowBlur = 14;
    ctx.fillText(sub, 256, 175);
  }

  return new THREE.CanvasTexture(c);
}

const NEON_BILLBOARDS = [
  makeNeonSignTexture('NEON DRIFT', 'UNDERGROUND TOKYO', '#00f0ff', '#ff007f'),
  makeNeonSignTexture('NITRO 24/7', 'MAX BOOST FUEL', '#ffea00', '#ff0055'),
  makeNeonSignTexture('APEX TUNING', 'STREET PERFORMANCE', '#39ff14', '#00f0ff'),
  makeNeonSignTexture('CYBER CITY', 'MIDNIGHT SYNDICATE', '#ff007f', '#9b5de5'),
  makeNeonSignTexture('VORTEX RACING', 'NO SPEED LIMIT', '#00f0ff', '#ffea00')
];

// =========================================================
// SHARED MATERIALS
// =========================================================
const roadMat = new THREE.MeshStandardMaterial({
  color: 0x11131a,
  roughness: 0.28,
  metalness: 0.25
});

const asphaltGroundMat = new THREE.MeshStandardMaterial({
  color: 0x07080f,
  roughness: 0.85,
  metalness: 0.1
});

const guardrailMat = new THREE.MeshStandardMaterial({
  color: 0x8892a6,
  metalness: 0.85,
  roughness: 0.25
});

const reflectorMat = new THREE.MeshBasicMaterial({
  color: 0x00f0ff
});

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x08101a,
  roughness: 0.1,
  metalness: 0.9,
  transparent: true,
  opacity: 0.88
});

const wheelRubberMat = new THREE.MeshStandardMaterial({
  color: 0x121214,
  roughness: 0.9,
  metalness: 0.1
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xe6e9f0,
  metalness: 0.95,
  roughness: 0.12
});

const headlightMat = new THREE.MeshBasicMaterial({
  color: 0xe6faff
});

const taillightMat = new THREE.MeshBasicMaterial({
  color: 0xff0033
});

// =========================================================
// ENVIRONMENT BUILDING (Road, City, Lights, Guardrails)
// =========================================================

// Turntable Showroom Object
const turntableGroup = new THREE.Group();
const turntableBase = new THREE.Mesh(
  new THREE.CylinderGeometry(3.6, 3.8, 0.35, 32),
  new THREE.MeshStandardMaterial({ color: 0x161925, metalness: 0.8, roughness: 0.3 })
);
turntableBase.position.y = -0.175;
turntableBase.receiveShadow = true;

const turntableRing = new THREE.Mesh(
  new THREE.TorusGeometry(3.65, 0.05, 12, 32),
  new THREE.MeshBasicMaterial({ color: 0x00f0ff })
);
turntableRing.rotation.x = Math.PI / 2;
turntableRing.position.y = 0.01;

turntableGroup.add(turntableBase, turntableRing);
scene.add(turntableGroup);

// Road Surface (Wet Asphalt)
const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 450), roadMat);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0, -170);
road.receiveShadow = true;
scene.add(road);

// Surrounding Dark Ground
const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 450), asphaltGroundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.02, -170);
ground.receiveShadow = true;
scene.add(ground);

// Guardrails & Outer Road Markers
function buildGuardrailSide(x) {
  const g = new THREE.Group();
  const railGeo = new THREE.BoxGeometry(0.18, 0.35, 450);
  const rail = new THREE.Mesh(railGeo, guardrailMat);
  rail.position.set(x, 0.45, -170);
  g.add(rail);

  const edgeStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.02, 450),
    new THREE.MeshBasicMaterial({ color: 0x00e1ff })
  );
  edgeStripe.position.set(x > 0 ? x - 0.35 : x + 0.35, 0.02, -170);
  g.add(edgeStripe);

  const postGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
  const reflGeo = new THREE.BoxGeometry(0.22, 0.12, 0.25);
  for (let z = -390; z <= 50; z += 12) {
    const post = new THREE.Mesh(postGeo, guardrailMat);
    post.position.set(x, 0.25, z);
    const refl = new THREE.Mesh(reflGeo, reflectorMat);
    refl.position.set(x > 0 ? x - 0.06 : x + 0.06, 0.48, z);
    g.add(post, refl);
  }
  return g;
}
scene.add(buildGuardrailSide(-ROAD_W / 2 + 0.09));
scene.add(buildGuardrailSide(ROAD_W / 2 - 0.09));

// Moving Lane Dashes
const STRIPE_GAP = 12, STRIPE_COUNT = 16;
const stripes = [];
const stripeGeo = new THREE.BoxGeometry(0.18, 0.025, 4.2);
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

[-2.5, 0, 2.5].forEach(x => {
  for (let i = 0; i < STRIPE_COUNT; i++) {
    const s = new THREE.Mesh(stripeGeo, stripeMat);
    s.position.set(x, 0.02, -i * STRIPE_GAP);
    scene.add(s);
    stripes.push(s);
  }
});

// Street Lamps Along Road
const LAMP_GAP = 28, LAMP_COUNT = 10;
const streetLamps = [];
function makeStreetLamp(side) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333946, metalness: 0.8, roughness: 0.3 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6.5, 8), poleMat);
  pole.position.y = 3.25;
  g.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.12), poleMat);
  arm.position.set(side * -0.9, 6.4, 0);
  arm.rotation.z = side * 0.12;
  g.add(arm);

  const lampHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 0.4),
    new THREE.MeshBasicMaterial({ color: 0x9be8ff })
  );
  lampHead.position.set(side * -1.8, 6.2, 0);
  g.add(lampHead);

  return g;
}

[-1, 1].forEach(side => {
  for (let i = 0; i < LAMP_COUNT; i++) {
    const lamp = makeStreetLamp(side);
    lamp.userData.side = side;
    lamp.position.set(side * (ROAD_W / 2 + 1.2), 0, -i * LAMP_GAP);
    scene.add(lamp);
    streetLamps.push(lamp);
  }
});

// City Buildings & Neon Billboards
const BUILDINGS_COUNT = 18;
const buildings = [];
const bldgMat = new THREE.MeshStandardMaterial({
  color: 0x0c0f1c,
  roughness: 0.6,
  metalness: 0.3,
  map: windowTexture
});

function makeBuilding(side, zPos) {
  const g = new THREE.Group();
  const w = 9 + Math.random() * 8;
  const h = 18 + Math.random() * 32;
  const d = 10 + Math.random() * 8;

  const bldgMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bldgMat);
  bldgMesh.position.y = h / 2;
  bldgMesh.castShadow = true;
  bldgMesh.receiveShadow = true;
  g.add(bldgMesh);

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.15, 5, 6),
    new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff007f : 0x00f0ff })
  );
  antenna.position.set(0, h + 2.5, 0);
  g.add(antenna);

  if (Math.random() > 0.35) {
    const boardTex = NEON_BILLBOARDS[Math.floor(Math.random() * NEON_BILLBOARDS.length)];
    const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
    const board = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), boardMat);
    board.position.set(side * -w / 2.05, h * (0.4 + Math.random() * 0.3), 0);
    board.rotation.y = side * Math.PI / 2;
    g.add(board);
  }

  const xDist = side * (ROAD_W / 2 + 6 + w / 2 + Math.random() * 4);
  g.position.set(xDist, 0, zPos);
  g.userData.side = side;
  g.userData.w = w;
  return g;
}

[-1, 1].forEach(side => {
  for (let i = 0; i < BUILDINGS_COUNT; i++) {
    const b = makeBuilding(side, -i * 24 - Math.random() * 12);
    scene.add(b);
    buildings.push(b);
  }
});

// Distant City Skyline Silhouettes
const skylineGroup = new THREE.Group();
for (let i = -16; i <= 16; i++) {
  const skH = 40 + Math.random() * 65;
  const skW = 8 + Math.random() * 10;
  const skMesh = new THREE.Mesh(
    new THREE.BoxGeometry(skW, skH, 12),
    new THREE.MeshBasicMaterial({ color: 0x04060f })
  );
  skMesh.position.set(i * 12 + (Math.random() - 0.5) * 6, skH / 2 - 5, -260);
  skylineGroup.add(skMesh);
}
scene.add(skylineGroup);

// Speed Lines Streaks (Dynamic speed effect)
const SPEED_LINE_COUNT = 75;
const speedLinesGeo = new THREE.BufferGeometry();
const speedLinePositions = new Float32Array(SPEED_LINE_COUNT * 6);

for (let i = 0; i < SPEED_LINE_COUNT; i++) {
  const x = (Math.random() - 0.5) * 22;
  const y = 0.5 + Math.random() * 6.5;
  const z = -Math.random() * 90;
  const len = 3 + Math.random() * 5;

  const idx = i * 6;
  speedLinePositions[idx] = x;
  speedLinePositions[idx + 1] = y;
  speedLinePositions[idx + 2] = z;
  speedLinePositions[idx + 3] = x;
  speedLinePositions[idx + 4] = y;
  speedLinePositions[idx + 5] = z - len;
}
speedLinesGeo.setAttribute('position', new THREE.BufferAttribute(speedLinePositions, 3));
const speedLinesMat = new THREE.LineBasicMaterial({
  color: 0x00f0ff,
  transparent: true,
  opacity: 0
});
const speedLines = new THREE.LineSegments(speedLinesGeo, speedLinesMat);
scene.add(speedLines);

// Crash Sparks System
const SPARK_COUNT = 45;
const sparkGeo = new THREE.BufferGeometry();
const sparkPositions = new Float32Array(SPARK_COUNT * 3);
const sparkVelocities = [];
for (let i = 0; i < SPARK_COUNT; i++) {
  sparkPositions[i * 3] = 0;
  sparkPositions[i * 3 + 1] = -50;
  sparkPositions[i * 3 + 2] = 0;
  sparkVelocities.push(new THREE.Vector3());
}
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
const sparkMat = new THREE.PointsMaterial({
  color: 0xffea00,
  size: 0.28,
  transparent: true,
  opacity: 0
});
const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
scene.add(sparkPoints);

// =========================================================
// CAR BUILDER (Primitives-Based High-Detail Sports Cars)
// =========================================================

function buildWheel(radius = 0.38, width = 0.32) {
  const g = new THREE.Group();
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, wheelRubberMat);
  tire.castShadow = true;
  g.add(tire);

  const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.02, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, chromeMat);
  g.add(rim);

  const hubGeo = new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, width + 0.04, 8);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
  g.add(hub);

  return g;
}

function buildCarMesh(carDef, paintHex, isPlayer = false) {
  const g = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({
    color: paintHex,
    metalness: 0.82,
    roughness: 0.22
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x14161c,
    metalness: 0.7,
    roughness: 0.5
  });

  // 1. Lower Aerodynamic Skirts / Splitters
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.12, 3.9), trimMat);
  skirt.position.y = 0.22;
  skirt.castShadow = true;
  g.add(skirt);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.5), trimMat);
  splitter.position.set(0, 0.18, -2.05);
  g.add(splitter);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.15, 0.4), trimMat);
  diffuser.position.set(0, 0.22, 1.95);
  g.add(diffuser);

  // 2. Main Car Body & Hood (Profile Variations)
  let bodyW = 1.82, bodyH = 0.46, bodyL = 3.65;
  if (carDef.profile === 'muscle') {
    bodyW = 1.92; bodyH = 0.52; bodyL = 3.8;
  } else if (carDef.profile === 'hyper') {
    bodyW = 1.88; bodyH = 0.38; bodyL = 3.9;
  } else if (carDef.profile === 'drift') {
    bodyW = 1.85; bodyH = 0.48; bodyL = 3.85;
  }

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), paintMat);
  mainBody.position.y = 0.48;
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  g.add(mainBody);

  const hoodWedge = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.08, 0.26, 1.4), paintMat);
  hoodWedge.position.set(0, 0.52, -1.05);
  hoodWedge.rotation.x = -0.09;
  hoodWedge.castShadow = true;
  g.add(hoodWedge);

  if (carDef.profile === 'muscle') {
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.9), trimMat);
    scoop.position.set(0, 0.72, -0.9);
    g.add(scoop);
  }

  // 3. Cabin & Tinted Windows
  let cabW = 1.38, cabH = 0.45, cabL = 1.7, cabZ = 0.22;
  if (carDef.profile === 'hyper') {
    cabW = 1.25; cabH = 0.38; cabL = 1.6; cabZ = 0.1;
  } else if (carDef.profile === 'drift') {
    cabW = 1.38; cabH = 0.48; cabL = 2.1; cabZ = 0.38;
  }

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(cabW, cabH, cabL), glassMat);
  cabin.position.set(0, 0.88, cabZ);
  cabin.castShadow = true;
  g.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(cabW - 0.04, 0.08, cabL - 0.15), paintMat);
  roof.position.set(0, 1.12, cabZ);
  g.add(roof);

  // 4. Rear Spoiler Wings
  if (carDef.spoiler === 'gt') {
    const stanchionL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.2), trimMat);
    stanchionL.position.set(-0.6, 0.88, 1.65);
    const stanchionR = stanchionL.clone();
    stanchionR.position.x = 0.6;

    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.42), paintMat);
    wing.position.set(0, 1.08, 1.65);
    wing.rotation.x = 0.1;

    const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.45), trimMat);
    endplateL.position.set(-0.95, 1.08, 1.65);
    const endplateR = endplateL.clone();
    endplateR.position.x = 0.95;

    g.add(stanchionL, stanchionR, wing, endplateL, endplateR);
  } else if (carDef.spoiler === 'tuner' || carDef.spoiler === 'aero') {
    const stanchionL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.15), trimMat);
    stanchionL.position.set(-0.55, 0.78, 1.6);
    const stanchionR = stanchionL.clone();
    stanchionR.position.x = 0.55;

    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.05, 0.32), paintMat);
    wing.position.set(0, 0.9, 1.6);
    wing.rotation.x = 0.08;

    g.add(stanchionL, stanchionR, wing);
  } else if (carDef.spoiler === 'ducktail' || carDef.spoiler === 'lip') {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.2), trimMat);
    lip.position.set(0, 0.75, 1.78);
    lip.rotation.x = -0.25;
    g.add(lip);
  }

  // 5. Headlights & Taillights
  const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.05), headlightMat);
  headL.position.set(-0.68, 0.52, -1.84);
  const headR = headL.clone();
  headR.position.x = 0.68;
  g.add(headL, headR);

  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.09, 0.05), taillightMat);
  tailBar.position.set(0, 0.58, 1.84);
  g.add(tailBar);

  // 6. Wheels (Front steering group & rear wheels)
  const frontWheels = new THREE.Group();
  const wFL = buildWheel(0.38, 0.32);
  wFL.position.set(-0.95, 0.38, -1.18);
  const wFR = buildWheel(0.38, 0.32);
  wFR.position.set(0.95, 0.38, -1.18);
  frontWheels.add(wFL, wFR);
  g.add(frontWheels);
  g.userData.frontWheels = frontWheels;

  const wRL = buildWheel(0.38, 0.34);
  wRL.position.set(-0.96, 0.38, 1.18);
  const wRR = buildWheel(0.38, 0.34);
  wRR.position.set(0.96, 0.38, 1.18);
  g.add(wRL, wRR);

  // 7. Exhaust Pipes & Nitro Flames
  const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8), chromeMat);
  pipeL.rotation.x = Math.PI / 2;
  pipeL.position.set(-0.45, 0.25, 1.95);
  const pipeR = pipeL.clone();
  pipeR.position.x = 0.45;
  g.add(pipeL, pipeR);

  const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
  const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 8), flameMat);
  flameL.rotation.x = -Math.PI / 2;
  flameL.position.set(-0.45, 0.25, 2.3);
  flameL.visible = false;
  const flameR = flameL.clone();
  flameR.position.x = 0.45;
  g.add(flameL, flameR);
  g.userData.flames = [flameL, flameR];

  // 8. Player Special: Neon Underglow Strip
  if (isPlayer) {
    const underglowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 3.2),
      new THREE.MeshBasicMaterial({
        color: paintHex,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      })
    );
    underglowPlane.rotation.x = Math.PI / 2;
    underglowPlane.position.y = 0.04;
    g.add(underglowPlane);
    g.userData.underglow = underglowPlane;

    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const trailL = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 2.5), trailMat);
    trailL.rotation.x = Math.PI / 2;
    trailL.position.set(-0.68, 0.58, 3.1);
    const trailR = trailL.clone();
    trailR.position.x = 0.68;
    g.add(trailL, trailR);
    g.userData.trails = [trailL, trailR];
  }

  return g;
}

// Varied Traffic Bodies (Sedan, SUV, Sports, Truck)
function buildTrafficCar(colorHex) {
  const g = new THREE.Group();
  const typeRand = Math.random();
  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x161820, roughness: 0.8 });

  if (typeRand < 0.35) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.6), paintMat);
    body.position.y = 0.52;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.48, 1.8), glassMat);
    cab.position.set(0, 0.98, 0.2);
    g.add(body, cab);
  } else if (typeRand < 0.65) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 3.8), paintMat);
    body.position.y = 0.65;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2.2), glassMat);
    cab.position.set(0, 1.25, 0.35);
    g.add(body, cab);
  } else if (typeRand < 0.85) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.95, 1.4), paintMat);
    cab.position.set(0, 0.8, -1.1);
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.6, 2.7), darkMat);
    box.position.set(0, 1.2, 0.85);
    g.add(cab, box);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.44, 3.7), paintMat);
    body.position.y = 0.46;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.5), glassMat);
    cab.position.set(0, 0.85, 0.15);
    g.add(body, cab);
  }

  [[-0.95, -1.15], [0.95, -1.15], [-0.95, 1.15], [0.95, 1.15]].forEach(([wx, wz]) => {
    const w = buildWheel(0.38, 0.3);
    w.position.set(wx, 0.38, wz);
    g.add(w);
  });

  const fL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.05), headlightMat);
  fL.position.set(-0.65, 0.52, -1.82);
  const fR = fL.clone();
  fR.position.x = 0.65;
  g.add(fL, fR);

  const rL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.05), taillightMat);
  rL.position.set(-0.65, 0.55, 1.82);
  const rR = rL.clone();
  rR.position.x = 0.65;
  g.add(rL, rR);

  return g;
}

// =========================================================
// GAME STATE & CAR SELECTION
// =========================================================

let selectedCarIdx = 0;
let selectedColorIdx = 0;

let player = null;
let enemies = [];
let state = 'garage'; // 'garage' | 'play' | 'over'
let speed = START_SPEED;
let score = 0;
let spawnT = 1;
let best = 0;
let cameraShake = 0;

try {
  best = +localStorage.getItem('racing_best') || 0;
} catch (e) {}

if ($('best')) $('best').textContent = best;
if ($('final-best')) $('final-best').textContent = best;

// Build initial player car on turntable
function refreshPlayerCar() {
  if (player) {
    scene.remove(player);
  }
  const carDef = CARS[selectedCarIdx];
  const paint = PAINT_COLORS[selectedColorIdx];
  player = buildCarMesh(carDef, paint.hex, true);
  scene.add(player);

  if (state === 'garage') {
    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);
  }
}

// Update Garage UI Panels
function updateGarageUI() {
  const car = CARS[selectedCarIdx];
  if ($('car-name')) $('car-name').textContent = car.name;
  if ($('car-category')) $('car-category').textContent = car.category;

  if ($('stat-speed')) $('stat-speed').style.width = car.stats.speed + '%';
  if ($('stat-handling')) $('stat-handling').style.width = car.stats.handling + '%';
  if ($('stat-accel')) $('stat-accel').style.width = car.stats.accel + '%';

  const swatches = document.querySelectorAll('.swatch');
  swatches.forEach((sw, idx) => {
    sw.classList.toggle('active', idx === selectedColorIdx);
  });
}

// Build Color Swatches
function setupColorSwatches() {
  const container = $('palette-row');
  if (!container) return;
  container.innerHTML = '';
  PAINT_COLORS.forEach((p, idx) => {
    const sw = document.createElement('div');
    sw.className = 'swatch' + (idx === selectedColorIdx ? ' active' : '');
    sw.style.backgroundColor = p.css;
    sw.style.color = p.css;
    sw.title = p.name;
    sw.addEventListener('click', () => {
      selectedColorIdx = idx;
      refreshPlayerCar();
      updateGarageUI();
    });
    container.appendChild(sw);
  });
}

// Switch Cars
function selectCar(direction) {
  selectedCarIdx = (selectedCarIdx + direction + CARS.length) % CARS.length;
  refreshPlayerCar();
  updateGarageUI();
}

safeOn('btn-prev-car', 'click', () => selectCar(-1));
safeOn('btn-next-car', 'click', () => selectCar(1));

// Quality Setting Toggle
function setGraphicsQuality(mode) {
  graphicsQuality = mode;
  const btn = $('btn-graphics');
  if (btn) btn.textContent = 'GRAPHICS: ' + mode.toUpperCase();

  if (mode === 'low') {
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    moonLight.castShadow = false;
    speedLines.visible = false;
    garageSpot.visible = false;
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    moonLight.castShadow = true;
    speedLines.visible = true;
    garageSpot.visible = true;
  }
}

safeOn('btn-graphics', 'click', () => {
  setGraphicsQuality(graphicsQuality === 'high' ? 'low' : 'high');
});

// Spawning Traffic
function spawnEnemy() {
  const color = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
  const e = buildTrafficCar(color);
  e.position.set(LANES[Math.floor(Math.random() * LANES.length)], 0, -165);
  e.userData.k = 0.55 + Math.random() * 0.42;
  scene.add(e);
  enemies.push(e);
}

// Start Race Loop
function startGame() {
  enemies.forEach(e => scene.remove(e));
  enemies = [];
  speed = START_SPEED;
  score = 0;
  spawnT = 1;
  cameraShake = 0;

  player.position.set(0, 0, 0);
  player.rotation.set(0, 0, 0);

  turntableGroup.visible = false;
  garageSpot.visible = false;
  garageRimLight.visible = false;

  state = 'play';
  if ($('garage-overlay')) $('garage-overlay').classList.add('hidden');
  if ($('gameover-overlay')) $('gameover-overlay').classList.add('hidden');
  if ($('hud')) $('hud').classList.remove('hidden');
}

// Return to Garage
function returnToGarage() {
  enemies.forEach(e => scene.remove(e));
  enemies = [];
  state = 'garage';

  turntableGroup.visible = true;
  if (graphicsQuality === 'high') {
    garageSpot.visible = true;
  }
  garageRimLight.visible = true;

  player.position.set(0, 0, 0);
  player.rotation.set(0, 0, 0);

  camera.position.set(3.4, 1.6, 4.2);
  camera.lookAt(0, 0.65, 0);
  camera.fov = 60;
  camera.updateProjectionMatrix();

  if ($('gameover-overlay')) $('gameover-overlay').classList.add('hidden');
  if ($('garage-overlay')) $('garage-overlay').classList.remove('hidden');
  if ($('hud')) $('hud').classList.add('hidden');
  updateGarageUI();
}

// Crash Handling
function triggerCrash() {
  state = 'over';
  cameraShake = 0.7;

  sparkMat.opacity = 1;
  const pPos = player.position;
  for (let i = 0; i < SPARK_COUNT; i++) {
    sparkPositions[i * 3] = pPos.x;
    sparkPositions[i * 3 + 1] = 0.5;
    sparkPositions[i * 3 + 2] = pPos.z;
    sparkVelocities[i].set(
      (Math.random() - 0.5) * 14,
      Math.random() * 9 + 2,
      (Math.random() - 0.5) * 14
    );
  }
  sparkGeo.attributes.position.needsUpdate = true;

  const finalScore = Math.floor(score);
  if (finalScore > best) {
    best = finalScore;
    try { localStorage.setItem('racing_best', best); } catch (e) {}
  }

  if ($('best')) $('best').textContent = best;
  if ($('final-score')) $('final-score').textContent = finalScore;
  if ($('final-best')) $('final-best').textContent = best;

  setTimeout(() => {
    if ($('gameover-overlay')) $('gameover-overlay').classList.remove('hidden');
  }, 450);
}

// =========================================================
// INPUT CONTROLS (Keyboard & Mobile Touch)
// =========================================================

const keys = {};
let touchDir = 0;

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) {
    e.preventDefault();
  }

  if (state === 'garage') {
    if (k === 'arrowleft' || k === 'a') selectCar(-1);
    if (k === 'arrowright' || k === 'd') selectCar(1);
    if (k === 'enter' || k === ' ') startGame();
  } else if (state === 'over') {
    if (k === 'enter' || k === ' ') startGame();
  }
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// Safe Bindings for Action Buttons
safeOn('btn-start', 'click', startGame);
safeOn('btn-retry', 'click', startGame);
safeOn('btn-garage', 'click', returnToGarage);
safeOn('btn-to-garage', 'click', returnToGarage);

// Mobile Steer Buttons
[['btnL', -1], ['btnR', 1]].forEach(([id, d]) => {
  const btn = $(id);
  if (!btn) return;
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    touchDir = d;
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => {
    btn.addEventListener(ev, () => {
      if (touchDir === d) touchDir = 0;
    });
  });
});

function getSteerInput() {
  const left = keys['a'] || keys['arrowleft'];
  const right = keys['d'] || keys['arrowright'];
  return (right ? 1 : 0) - (left ? 1 : 0) || touchDir;
}

// =========================================================
// MAIN UPDATE LOOP
// =========================================================

function update(dt) {
  const currentCar = CARS[selectedCarIdx];

  speed = Math.min(currentCar.topSpeed, speed + currentCar.accel * dt);
  const dist = speed * dt;

  const steerDir = getSteerInput();
  player.position.x = clamp(
    player.position.x + steerDir * currentCar.handling * dt,
    -LIMIT,
    LIMIT
  );

  if (player.userData.frontWheels) {
    player.userData.frontWheels.rotation.y = steerDir * 0.35;
  }

  player.rotation.y += (-steerDir * 0.22 - player.rotation.y) * 0.2;
  player.rotation.z += (-steerDir * 0.08 - player.rotation.z) * 0.2;

  const isHighSpeed = speed > 65;
  if (player.userData.flames) {
    player.userData.flames.forEach(flame => {
      flame.visible = isHighSpeed;
      if (isHighSpeed) {
        const scale = 0.7 + Math.random() * 0.6 + (speed / currentCar.topSpeed) * 0.4;
        flame.scale.set(scale, scale, scale);
      }
    });
  }

  if (player.userData.trails) {
    const trailScale = clamp((speed - 40) / 60, 0.2, 1.8);
    player.userData.trails.forEach(tr => {
      tr.scale.y = trailScale;
      tr.visible = speed > 45;
    });
  }

  stripes.forEach(s => {
    s.position.z += dist;
    if (s.position.z > 12) s.position.z -= STRIPE_GAP * STRIPE_COUNT;
  });

  streetLamps.forEach(lamp => {
    lamp.position.z += dist;
    if (lamp.position.z > 15) {
      lamp.position.z -= LAMP_GAP * LAMP_COUNT;
    }
  });

  buildings.forEach(b => {
    b.position.z += dist;
    if (b.position.z > 25) {
      b.position.z -= BUILDINGS_COUNT * 24;
      b.position.x = b.userData.side * (ROAD_W / 2 + 6 + b.userData.w / 2 + Math.random() * 4);
    }
  });

  if (graphicsQuality === 'high') {
    const posAttr = speedLinesGeo.attributes.position;
    const posArr = posAttr.array;
    const speedIntensity = clamp((speed - 40) / (currentCar.topSpeed - 40), 0, 1);
    speedLinesMat.opacity = speedIntensity * 0.65;

    for (let i = 0; i < SPEED_LINE_COUNT; i++) {
      const zIdx = i * 6 + 2;
      const zEndIdx = i * 6 + 5;
      posArr[zIdx] += dist * 2.2;
      posArr[zEndIdx] += dist * 2.2;
      if (posArr[zIdx] > 10) {
        const newZ = -80 - Math.random() * 40;
        const len = 3 + speedIntensity * 7;
        posArr[zIdx] = newZ;
        posArr[zEndIdx] = newZ - len;
      }
    }
    posAttr.needsUpdate = true;
  }

  spawnT -= dt;
  if (spawnT <= 0) {
    spawnEnemy();
    spawnT = Math.max(0.42, 1.3 - speed / 100) * (0.65 + Math.random() * 0.7);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.position.z += dist * e.userData.k;

    if (e.position.z > 14) {
      scene.remove(e);
      enemies.splice(i, 1);
      continue;
    }

    const dx = Math.abs(e.position.x - player.position.x);
    const dz = Math.abs(e.position.z - player.position.z);
    if (dx < 1.75 && dz < 3.4) {
      triggerCrash();
      return;
    }
  }

  score += dist * 0.1;
  if ($('score')) $('score').textContent = Math.floor(score);

  const speedKmH = Math.round(speed * 3.6);
  if ($('speed')) $('speed').textContent = speedKmH;

  const maxKmH = currentCar.topSpeed * 3.6;
  const speedRatio = clamp(speedKmH / maxKmH, 0, 1);
  const strokeOffset = 157 * (1 - speedRatio);
  const speedoMeter = $('speedo-meter');
  if (speedoMeter) {
    speedoMeter.style.strokeDashoffset = strokeOffset;
  }
}

function updateSparks(dt) {
  if (sparkMat.opacity <= 0) return;
  sparkMat.opacity -= dt * 1.5;

  const posArr = sparkGeo.attributes.position.array;
  for (let i = 0; i < SPARK_COUNT; i++) {
    const idx = i * 3;
    const vel = sparkVelocities[i];
    vel.y -= 18 * dt;
    posArr[idx] += vel.x * dt;
    posArr[idx + 1] = Math.max(0.05, posArr[idx + 1] + vel.y * dt);
    posArr[idx + 2] += vel.z * dt;
  }
  sparkGeo.attributes.position.needsUpdate = true;
}

// Render Animation Loop
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (state === 'play') {
    update(dt);
  } else if (state === 'garage' && player) {
    player.rotation.y += dt * 0.75;
  }

  updateSparks(dt);

  if (state === 'garage') {
    camera.position.set(3.4, 1.6, 4.2);
    camera.lookAt(0, 0.65, 0);
    camera.fov = 60;
  } else {
    const currentCar = CARS[selectedCarIdx];
    const steerInput = state === 'play' ? getSteerInput() : 0;

    let camX = player.position.x * 0.55 + steerInput * 0.2;
    let camY = 3.9;
    let camZ = 7.6;

    if (cameraShake > 0) {
      camX += (Math.random() - 0.5) * cameraShake * 1.5;
      camY += (Math.random() - 0.5) * cameraShake * 1.5;
      cameraShake = Math.max(0, cameraShake - dt * 1.8);
    }

    camera.position.set(camX, camY, camZ);
    camera.lookAt(player.position.x * 0.35, 1.0, -16);

    const speedRatio = (speed - START_SPEED) / (currentCar.topSpeed - START_SPEED);
    camera.fov = 65 + clamp(speedRatio, 0, 1) * 16;
  }

  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// Initial Showroom Setup and Launch Loop
setupColorSwatches();
refreshPlayerCar();
updateGarageUI();
requestAnimationFrame(loop);