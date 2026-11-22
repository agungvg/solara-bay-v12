// City for Solara Bay — sunlit buildings, palm-lined boulevard, a BIG
// Ferris wheel on the skyline, the pier, street props. Buildings are warm
// sunlit facades (never near-black towers): the bright daytime grade.
import * as THREE from 'three';
import { makeRng } from './rng.js';
import { facadeTexture, brickTexture, grassTexture } from './textures.js';

function mat(color, rough = 0.85, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}

// One palm: curved trunk + fanned fronds (flattened, drooping planes).
// Fronds fan outward and droop — the wide palm read from image 3.
export function buildPalm(rng, height = 9) {
  const palm = new THREE.Group();
  const trunkMat = mat(0x7a5230, 0.95, 0);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, height, 7), trunkMat);
  trunk.position.y = height / 2;
  trunk.rotation.z = rng.range(-0.06, 0.06);
  trunk.castShadow = true;
  palm.add(trunk);
  const frondMat = mat(0x2fae6e, 0.9, 0);
  const frondMat2 = mat(0x37c878, 0.9, 0);
  const n = 9;
  for (let i = 0; i < n; i++) {
    // Narrow, drooping fronds: a palm reads from fanned thin blades,
    // not flat green paddles.
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.9, 1, 4), i % 2 ? frondMat : frondMat2);
    // Bend the plane downward along its length for the droop.
    const pos = frond.geometry.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      pos.setZ(v, -Math.pow((y + 1.45) / 2.9, 2) * 1.2);
    }
    frond.geometry.computeVertexNormals();
    frond.material.side = THREE.DoubleSide;
    frond.castShadow = true;
    const pivot = new THREE.Group();
    pivot.position.y = height;
    pivot.rotation.y = (i / n) * Math.PI * 2 + rng.range(-0.15, 0.15);
    frond.rotation.x = -Math.PI / 2 + rng.range(0.85, 1.15);
    frond.position.set(0, 0.15, 1.3);
    pivot.add(frond);
    palm.add(pivot);
  }
  // Coconuts.
  for (let i = 0; i < 3; i++) {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(0x6a4a22, 0.9, 0));
    nut.position.set(rng.range(-0.3, 0.3), height - 0.25, rng.range(-0.3, 0.3));
    nut.castShadow = true;
    palm.add(nut);
  }
  return palm;
}

// The Ferris wheel: BIG (44 m), rim + spokes + cabins, slow rotation.
// Sits on the skyline so the cover reads "beachfront amusement pier".
export function buildFerrisWheel() {
  const wheel = new THREE.Group();
  const white = mat(0xf4f2ec, 0.5, 0.2);
  const accent = mat(0xffb347, 0.5, 0.2);
  const R = 22;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.55, 10, 48), white);
  rim.castShadow = true;
  wheel.add(rim);
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(R - 2.2, 0.35, 8, 40), accent);
  wheel.add(rim2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, R, 6), white);
    spoke.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0);
    spoke.rotation.z = a + Math.PI / 2;
    spoke.castShadow = true;
    wheel.add(spoke);
    // Cabin: small coloured gondola hanging at the rim.
    const cabin = new THREE.Group();
    cabin.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
    const cabMat = mat([0xff2e88, 0x2fae6e, 0x3a7bd5, 0xffb347][i % 4], 0.6, 0.1);
    cabin.add(box(2.2, 1.8, 1.8, cabMat));
    cabin.add(box(2.3, 0.2, 1.9, white, 0, 1.0, 0));
    wheel.add(cabin);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 14), accent);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  // A-frame legs.
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, R + 4, 8), white);
    leg.position.set(s * 7, -(R / 2) - 2, 0);
    leg.rotation.z = s * 0.32;
    leg.castShadow = true;
    wheel.add(leg);
  }
  wheel.userData.spin = rim; // rotate the rim group slowly in the loop
  return wheel;
}

// A sunlit building: warm facade texture, lit windows, roof detail.
// kind: 'tower' | 'stepped' | 'curved' | 'low'.
export function buildBuilding(rng, kind, w, h, d) {
  const g = new THREE.Group();
  const warm = ['#f2c98a', '#e8a56a', '#dfe8f2', '#f7e8c8', '#e8b4a0', '#cfe0e8'];
  const base = rng.pick(warm);
  const lit = rng.pick(['#ffe9a8', '#ffd27a', '#bfe8ff']);
  const facade = new THREE.MeshStandardMaterial({ map: facadeTexture(base, lit, rng.int(1, 9999)), roughness: 0.85 });
  if (kind === 'curved') {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.55, w * 0.62, h, 20), facade);
    tower.position.y = h / 2; tower.castShadow = true; tower.receiveShadow = true;
    g.add(tower);
  } else if (kind === 'stepped') {
    let y = 0, ww = w, dd = d;
    for (let i = 0; i < 3; i++) {
      const tier = box(ww, h / 3, dd, facade, 0, y + h / 6, 0);
      g.add(tier);
      y += h / 3; ww *= 0.78; dd *= 0.78;
    }
  } else {
    g.add(box(w, h, d, facade, 0, h / 2, 0));
    // Roof plant / AC boxes.
    g.add(box(w * 0.3, 1.2, d * 0.3, mat(0x8a8a8a, 0.9, 0), w * 0.2, h + 0.6, 0));
  }
  // Ground-floor shopfront: awning + glass.
  g.add(box(w * 0.9, 3.2, 0.4, new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.15, metalness: 0.6 }), 0, 1.6, d / 2 + 0.1));
  return g;
}

// Build the whole city block set. Road runs along Z at x in [-7, 7];
// buildings west (x < -12); beach east (x > 10, in beach.js).
// Returns { group, ferris, palms }.
export function buildCity(rng) {
  const group = new THREE.Group();
  const palms = [];

  // Ground: big warm-grey plaza + grass strips.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(-40, -0.05, -60);
  ground.receiveShadow = true;
  group.add(ground);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(90, 260),
    new THREE.MeshStandardMaterial({ color: 0xb8a88e, roughness: 0.95 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(-40, 0, -60);
  plaza.receiveShadow = true;
  group.add(plaza);

  // Sidewalks.
  for (const x of [-9.5, 9.5]) {
    const walk = box(5, 0.18, 260, mat(0xcbbfa5, 0.95, 0), x, 0.09, -60);
    group.add(walk);
  }

  // Buildings: two rows west of the boulevard, varied heights/kinds.
  const kinds = ['tower', 'stepped', 'curved', 'low'];
  for (let row = 0; row < 2; row++) {
    const xBase = row === 0 ? -24 : -52;
    let z = 55;
    while (z > -190) {
      const w = rng.range(14, 22), d = rng.range(12, 18);
      const h = rng.range(12, row === 0 ? 34 : 58);
      const b = buildBuilding(rng, rng.pick(kinds), w, h, d);
      b.position.set(xBase + rng.range(-3, 3), 0, z);
      b.rotation.y = rng.chance(0.2) ? Math.PI / 2 : 0;
      group.add(b);
      z -= d + rng.range(6, 14);
    }
  }
  // A couple of bright towers across the bay for the skyline.
  for (const [x, z, h] of [[120, -160, 48], [150, -90, 62], [95, -220, 40]]) {
    const b = buildBuilding(rng, 'tower', 18, h, 16);
    b.position.set(x, 0, z);
    group.add(b);
  }

  // Palms lining both sides of the boulevard every ~13 m. The east row
  // starts north of the cover camera (z < -10) so no palm crowds the lens.
  for (let z = 50; z > -180; z -= 13) {
    for (const x of [-10.5, 10.5]) {
      if (x > 0 && z > -10) continue;
      if (rng.chance(0.85)) {
        const p = buildPalm(rng, rng.range(7.5, 10.5));
        p.position.set(x + rng.range(-0.6, 0.6), 0, z + rng.range(-2, 2));
        group.add(p);
        palms.push(p);
      }
    }
  }

  // Ferris wheel on the beach at the end of the boulevard, centred in
  // the cover frame — clear of the yacht's bearing and clear of the HUD.
  const ferris = buildFerrisWheel();
  ferris.position.set(27, 24, -98);
  ferris.scale.setScalar(1.25);
  group.add(ferris);

  // Pier jutting into the ocean (east), with lamps.
  const pier = new THREE.Group();
  pier.add(box(8, 1.2, 60, mat(0x8a6a44, 0.9, 0), 0, 0.4, 0));
  for (let z = -26; z <= 26; z += 13) {
    for (const x of [-3.4, 3.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.4, 6), mat(0x2c2c2c, 0.6, 0.4));
      post.position.set(x, 2.2, z); post.castShadow = true;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffdf80, emissiveIntensity: 1.6 }));
      lamp.position.set(x, 4.0, z);
      pier.add(post, lamp);
    }
  }
  pier.position.set(62, 0.4, -95);
  pier.rotation.y = Math.PI / 2;
  group.add(pier);

  // Street props: lamps along the boulevard, hydrants, benches.
  for (let z = 45; z > -175; z -= 26) {
    for (const x of [-8.6, 8.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 5.2, 6), mat(0x2c2c34, 0.5, 0.6));
      post.position.set(x, 2.6, z); post.castShadow = true;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffdf80, emissiveIntensity: 1.2 }));
      lamp.position.set(x, 5.4, z);
      group.add(post, lamp);
    }
  }
  for (let i = 0; i < 6; i++) {
    const bench = box(2.0, 0.12, 0.6, mat(0x7a5230, 0.9, 0), -9.2, 0.5, -10 - i * 28);
    group.add(bench);
  }

  return { group, ferris, palms };
}
