let scene, camera, renderer, container, lines;
let angle4D = 0;
let speed4D = 0.005, speed3Dx = 0.005, speed3Dy = 0.002, d = 3;

let scrollFactor = 1;
let sprites = [];

function initTesseract() {
  const canvas = document.getElementById('tesseract-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  container = new THREE.Group();
  container.scale.set(0.7, 0.7, 0.7);
  scene.add(container);

  const pts = [];
  [-1, 1].forEach(x =>
    [-1, 1].forEach(y =>
      [-1, 1].forEach(z =>
        [-1, 1].forEach(w =>
          pts.push(new THREE.Vector4(x, y, z, w))
        ))));

  const edges = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      let diff = 0;
      ['x', 'y', 'z', 'w'].forEach(c => {
        if (pts[i][c] !== pts[j][c]) diff++;
      });
      if (diff === 1) edges.push([i, j]);
    }
  }

  const pos = new Float32Array(edges.length * 2 * 3);
  const colors = new Float32Array(edges.length * 2 * 3);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  lines = new THREE.LineSegments(geom, new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9
  }));
  container.add(lines);

  initTesseract.pts = pts;
  initTesseract.edges = edges;
  initTesseract.pos = pos;
  initTesseract.colors = colors;

  
  const techLogos = [
  'images/react.png',
  'images/python.png',
  'images/js.png',
  'images/html.webp',
  'images/css.png',
  'images/type.png',
  'images/sharp.png',
  'images/threee.png'
  ];

  const radius = 3.2;

  techLogos.forEach((src, i) => {
    const tex = new THREE.TextureLoader().load(src, () => renderer.render(scene, camera));
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.85,
      alphaTest: 0.05
    });

    const sprite = new THREE.Sprite(spriteMat);
    const angle = (i / techLogos.length) * Math.PI * 2;

sprite.position.set(
  Math.cos(angle) * radius,
  Math.sin(angle) * radius,
  0.1 
);

    sprite.scale.set(0.5, 0.5, 0.5);

    scene.add(sprite);
    sprites.push({ sprite, angle });
  });

  animateTesseract();
}



let lastMouseX = 0;
let lastMouseY = 0;

document.addEventListener('wheel', (e) => {
  scrollFactor += e.deltaY * -0.001;
  scrollFactor = Math.max(0.2, Math.min(1.5, scrollFactor)); 
});

function rotate4D(v, a) {
  const x = v.x * Math.cos(a) - v.y * Math.sin(a);
  const y = v.x * Math.sin(a) + v.y * Math.cos(a);
  const z = v.z * Math.cos(a) - v.w * Math.sin(a);
  const w = v.z * Math.sin(a) + v.w * Math.cos(a);
  return new THREE.Vector4(x, y, z, w);
}

function animateTesseract() {
  requestAnimationFrame(animateTesseract);
  angle4D += speed4D * scrollFactor;
  const time = performance.now() * 0.001;

  const projected = initTesseract.pts.map(v => {
    const rv = rotate4D(v, angle4D);
    const f = d / (d - rv.w);
    return new THREE.Vector3(rv.x * f, rv.y * f, rv.z * f);
  });

  for (let i = 0; i < initTesseract.edges.length; i++) {
    const edge = initTesseract.edges[i];
    const p1 = projected[edge[0]];
    const p2 = projected[edge[1]];
    initTesseract.pos.set([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z], i * 6);

    const phase = time + i * 0.3;
    const minBrightness = 0.2;
    const r = ((Math.sin(phase * 9) + 1) / 2) * (1 - minBrightness) + minBrightness;
    const g = ((Math.sin(phase * 9 + 1) + 1) / 2) * (1 - minBrightness) + minBrightness;
    const b = ((Math.sin(phase * 9 + 2) + 1) / 2) * (1 - minBrightness) + minBrightness;

    for (let j = 0; j < 2; j++) {
      const idx = (i * 2 + j) * 3;
      initTesseract.colors[idx] = r;
      initTesseract.colors[idx + 1] = g;
      initTesseract.colors[idx + 2] = b;
    }
  }

  
const orbitSpeedBase = 0.0015;
const orbitSpeed = Math.max(0.0005, orbitSpeedBase * scrollFactor); 

sprites.forEach((item) => {
  item.angle += orbitSpeed;
  const radius = 3.2;
  const x = Math.cos(item.angle) * radius;
  const y = Math.sin(item.angle) * radius;
  item.sprite.position.set(x, y, item.sprite.position.z);
});


  lines.geometry.attributes.position.needsUpdate = true;
  lines.geometry.attributes.color.needsUpdate = true;
  container.rotation.x += speed3Dx;
  container.rotation.y += speed3Dy;
  renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', initTesseract);