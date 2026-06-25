// Three.js Solar System with Planet Info

let scene, camera, renderer, controls;
let sun, planets = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* -------------------------------------------------
   Planet data – each entry becomes a clickable planet.
   Edit the title/description to match your own work.
   ------------------------------------------------- */
const planetData = [
  { name: "Mercury", radius: 0.3, distance: 5, color: 0x888888,
    info: { title: "Cosmology", desc: "Study of the origin, evolution, and eventual fate of the universe." } },
  { name: "Venus",   radius: 0.5, distance: 7, color: 0xffcc66,
    info: { title: "Early Universe", desc: "Investigating conditions and physics shortly after the Big Bang." } },
  { name: "Earth",   radius: 0.55, distance: 10, color: 0x4a90e2,
    info: { title: "Large-Scale Structure", desc: "Exploring the cosmic web of galaxies, clusters, and dark‑matter filaments." } },
  { name: "Mars",    radius: 0.4, distance: 15, color: 0xc1440e,
    info: { title: "Numerical Methods", desc: "Developing algorithms to simulate physical systems and solve differential equations." } },
  { name: "Jupiter", radius: 1.2, distance: 22, color: 0xf4a460,
    info: { title: "Machine Learning in Physics", desc: "Applying ML techniques to analyze astronomical data and model complex systems." } },
  { name: "Saturn",  radius: 1.0, distance: 28, color: 0xf9c74f,
    info: { title: "Observational Data", desc: "Working with telescope data, photometry, and image processing for astrophysics." } },
  { name: "Uranus",  radius: 0.9, distance: 34, color: 0x7fbfff,
    info: { title: "Astrophysics & Code", desc: "Bridging theoretical physics with practical software tools for research." } },
  { name: "Neptune", radius: 0.85, distance: 40, color: 0x4b9cd3,
    info: { title: "Code & Notes", desc: "Sharing code snippets, tutorials, and computational notebooks for scientific work." } }
];

/* -------------------------------------------------
   Initialise Three.js scene, camera, renderer, lights, etc.
   ------------------------------------------------- */
function init() {
  // ----- Scene -----
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // ----- Camera -----
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 40);

  // ----- Renderer -----
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById('container').appendChild(renderer.domElement);

  // ----- Controls (orbit/zoom/pan) -----
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 15;
  controls.maxDistance = 80;

  // ----- Lighting -----
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 2, 100);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  // ----- Sun (central emissive sphere) -----
  const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);

  // ----- Planets + optional orbit rings -----
  planetData.forEach((data, index) => {
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: data.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = data.distance;                // start on +X axis
    mesh.userData = { index };                      // store array index for click handling
    scene.add(mesh);
    planets.push({ mesh, data, angle: Math.random() * Math.PI * 2 });

    // Orbit ring (thin, slightly transparent)
    const orbitGeometry = new THREE.RingGeometry(data.distance - 0.05, data.distance + 0.05, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x555555,
      side: THREE.DoubleSide,
      opacity: 0.3,
      transparent: true
    });
    const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitMesh.rotation.x = Math.PI / 2;              // lay flat in X‑Z plane
    scene.add(orbitMesh);
  });

  // ----- Starfield (10 000 points) -----
  const starsGeometry = new THREE.BufferGeometry();
  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // ----- Event listeners -----
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('pointerdown', onPointerDown);

  // ----- Start animation loop -----
  animate();
}

/* -------------------------------------------------
   Window resize handler
   ------------------------------------------------- */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* -------------------------------------------------
   Click / tap handler – uses a ray‑caster to see which planet was hit
   ------------------------------------------------- */
function onPointerDown(event) {
  // Normalise mouse coordinates to [-1, +1]
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    const index = intersected.userData.index;
    showPlanetInfo(index);
  }
}

/* -------------------------------------------------
   Update the info panel with the clicked planet’s data
   ------------------------------------------------- */
function showPlanetInfo(index) {
  const data = planetData[index];
  document.getElementById('info-title').textContent = data.name;
  document.getElementById('info-description').innerHTML = `<strong>${data.info.title}</strong><br>${data.info.desc}`;
}

/* -------------------------------------------------
   Animation loop – update planet positions & render
   ------------------------------------------------- */
function animate() {
  requestAnimationFrame(animate);

  // Orbit each planet (speed ∝ 1/√distance, a rough Kepler‑3 approximation)
  planets.forEach(p => {
    const speed = 0.01 / Math.sqrt(p.data.distance);
    p.angle += speed;
    p.mesh.position.x = Math.cos(p.angle) * p.data.distance;
    p.mesh.position.z = Math.sin(p.angle) * p.data.distance;
    // Spin on its own axis
    p.mesh.rotation.y += 0.01;
  });

  controls.update();
  renderer.render(scene, camera);
}

/* -------------------------------------------------
   Kick everything off
   ------------------------------------------------- */
init();
