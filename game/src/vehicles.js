// Vehicles for Solara Bay — silhouette-first low-poly builds.
// Hero car: long confident masses (roof arch, sloped hood, fender flares,
// tumblehome greenhouse). Police car: black-and-white with a big POLICE
// door texture on BOTH sides so the lettering reads at a glance, light
// bar, push bar. Plus traffic cars, a scooter, a tank roadblock and a
// helicopter with a searchlight cone.
import * as THREE from 'three';
import { makeRng } from './rng.js';
import { policeDoorTexture } from './textures.js';

function mat(color, rough = 0.5, metal = 0.25) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function wheel(r = 0.36, w = 0.28) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 18), mat(0x141414, 0.9, 0));
  tyre.rotation.z = Math.PI / 2; tyre.castShadow = true;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 12), mat(0xc8c8cc, 0.3, 0.8));
  hub.rotation.z = Math.PI / 2;
  g.add(tyre, hub);
  return g;
}

// --- Hero car: Rukan Pelo GT, orange sports car, 62% dented. ---
// S-curve side body: low nose, arched roof, flared fenders over big wheels.
export function buildHeroCar() {
  const car = new THREE.Group();
  const paint = mat(0xff6a2a, 0.32, 0.45);
  const dark = mat(0x14161c, 0.4, 0.4);
  const glass = mat(0x101c28, 0.12, 0.9);

  // Main body: long low slab with a sloped nose (wedge via rotated box).
  const body = box(1.98, 0.52, 4.7, paint, 0, 0.55, 0);
  car.add(body);
  const nose = box(1.9, 0.34, 0.9, paint, 0, 0.42, -2.35);
  nose.rotation.x = 0.28;
  car.add(nose);
  // Greenhouse: tumblehome cabin, narrower than the body, arched roof.
  const cabin = box(1.55, 0.42, 2.1, glass, 0, 0.98, 0.25);
  cabin.rotation.x = -0.06;
  car.add(cabin);
  const roof = box(1.5, 0.1, 1.7, paint, 0, 1.22, 0.25);
  car.add(roof);
  // White centre stripe over hood + roof + trunk.
  const stripe = box(0.34, 0.03, 4.4, mat(0xf4f2ec, 0.4, 0.2), 0, 0.83, -0.1);
  car.add(stripe);
  // Fender flares: slightly wider boxes over each wheel.
  for (const [x, z] of [[-0.95, -1.55], [0.95, -1.55], [-0.95, 1.55], [0.95, 1.55]]) {
    car.add(box(0.22, 0.3, 0.95, paint, x, 0.62, z));
  }
  // Headlights (emissive) + grille + rear spoiler + tail lights.
  for (const x of [-0.62, 0.62]) {
    const lamp = box(0.42, 0.1, 0.08, new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffe9a0, emissiveIntensity: 1.4 }), x, 0.55, -2.82);
    car.add(lamp);
  }
  car.add(box(1.1, 0.12, 0.06, dark, 0, 0.42, -2.82));
  const spoiler = box(1.8, 0.06, 0.3, dark, 0, 0.92, 2.28);
  car.add(spoiler);
  for (const x of [-0.6, 0.6]) {
    car.add(box(0.5, 0.09, 0.06, new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xaa0000, emissiveIntensity: 0.8 }), x, 0.6, 2.36));
  }
  // Dented panels: darker, slightly rotated patches + a bent fender.
  const dent = box(0.7, 0.3, 0.9, mat(0xb34a1a, 0.6, 0.2), -0.99, 0.6, 0.9);
  dent.rotation.z = 0.08;
  car.add(dent);
  const dent2 = box(0.5, 0.22, 0.6, mat(0xc2521e, 0.6, 0.2), 0.9, 0.85, -1.2);
  dent2.rotation.x = -0.1;
  car.add(dent2);
  // Wheels: big, low-profile, set wide.
  for (const [x, z] of [[-0.98, -1.55], [0.98, -1.55], [-0.98, 1.55], [0.98, 1.55]]) {
    const w = wheel(0.38, 0.3);
    w.position.set(x, 0.38, z);
    car.add(w);
  }
  // Exhausts.
  for (const x of [-0.3, 0.3]) car.add(box(0.12, 0.12, 0.2, mat(0x888888, 0.3, 0.9), x, 0.35, 2.4));
  car.userData.length = 4.8;
  return car;
}

// --- Police car: black-and-white KPD interceptor, SIDE lettering. ---
// The door texture is a plane on each side of the car, big and flat, so
// POLICE reads at a glance from the chase camera. Light bar + push bar.
export function buildPoliceCar(unit = 'CORAL-48') {
  const car = new THREE.Group();
  const black = mat(0x14161c, 0.35, 0.5);
  const white = mat(0xf4f2ec, 0.4, 0.3);
  const glass = mat(0x0e1822, 0.12, 0.9);

  const body = box(1.92, 0.62, 4.6, black, 0, 0.6, 0);
  car.add(body);
  const cabin = box(1.6, 0.55, 2.3, glass, 0, 1.12, 0.1);
  car.add(cabin);
  const roof = box(1.62, 0.08, 2.2, white, 0, 1.42, 0.1);
  car.add(roof);
  // White doors: the canvas POLICE texture on a plane each side.
  const doorTex = policeDoorTexture(unit);
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.4, metalness: 0.2 });
  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.05), doorMat);
    door.position.set(side * 0.98, 0.72, 0.1);
    door.rotation.y = side * Math.PI / 2;
    door.castShadow = true;
    car.add(door);
    // White front fender panel.
    car.add(box(0.04, 0.5, 0.9, white, side * 0.97, 0.62, -1.75));
  }
  // Hood + trunk stay black; white roof band already on.
  // Light bar: red left / blue right, emissive.
  const bar = box(1.3, 0.12, 0.3, black, 0, 1.52, 0.1);
  car.add(bar);
  const red = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1010, emissiveIntensity: 2.2 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x2040ff, emissive: 0x1020ff, emissiveIntensity: 2.2 });
  car.add(box(0.55, 0.12, 0.32, red, -0.32, 1.52, 0.1));
  car.add(box(0.55, 0.12, 0.32, blue, 0.32, 1.52, 0.1));
  // Push bar: two verticals + crossbar at the nose.
  for (const x of [-0.55, 0.55]) car.add(box(0.09, 0.55, 0.09, black, x, 0.55, -2.38));
  car.add(box(1.2, 0.09, 0.09, black, 0, 0.72, -2.38));
  car.add(box(1.2, 0.09, 0.09, black, 0, 0.4, -2.38));
  // Headlights + grille.
  for (const x of [-0.6, 0.6]) {
    car.add(box(0.4, 0.12, 0.06, new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffe9a0, emissiveIntensity: 1.2 }), x, 0.62, -2.32));
  }
  // "911" on the rear quarter.
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35),
    new THREE.MeshStandardMaterial({ map: policeDoorTexture('911'), roughness: 0.4 }));
  rear.position.set(0, 0.62, 2.32);
  car.add(rear);
  for (const [x, z] of [[-0.95, -1.5], [0.95, -1.5], [-0.95, 1.5], [0.95, 1.5]]) {
    const w = wheel(0.37, 0.28);
    w.position.set(x, 0.37, z);
    car.add(w);
  }
  car.userData.length = 4.7;
  return car;
}

// --- Traffic cars: varied colours / shapes, one builder, seeded variety.
export function buildTrafficCar(rng, kind = 'sedan') {
  const car = new THREE.Group();
  const paint = mat(rng.pick([0xc0392b, 0x2c3e50, 0xecf0f1, 0x7f8c8d, 0x8e44ad, 0x16a085, 0xd4a017, 0x5d6d7e]), 0.45, 0.3);
  const glass = mat(0x101c28, 0.15, 0.8);
  const tall = kind === 'van';
  const len = kind === 'van' ? 5.2 : kind === 'taxi' ? 4.5 : 4.3;
  car.add(box(1.85, tall ? 1.5 : 0.55, len, paint, 0, tall ? 1.0 : 0.58, 0));
  if (!tall) car.add(box(1.55, 0.5, 2.0, glass, 0, 1.05, 0.1));
  if (kind === 'taxi') {
    car.add(box(0.5, 0.14, 0.3, new THREE.MeshStandardMaterial({ color: 0xffd21a, emissive: 0xcc9900, emissiveIntensity: 0.7 }), 0, 1.38, 0.1));
  }
  for (const x of [-0.58, 0.58]) {
    car.add(box(0.38, 0.1, 0.06, new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffe9a0, emissiveIntensity: 0.9 }), x, 0.55, -len / 2 - 0.01));
  }
  for (const [x, z] of [[-0.92, -len / 2 + 0.8], [0.92, -len / 2 + 0.8], [-0.92, len / 2 - 0.8], [0.92, len / 2 - 0.8]]) {
    const w = wheel(0.35, 0.26);
    w.position.set(x, 0.35, z);
    car.add(w);
  }
  car.userData.length = len;
  return car;
}

// --- Scooter: small, pink, rider aboard (jointed ped, seated pose).
export function buildScooter() {
  const g = new THREE.Group();
  const pink = mat(0xff5a8a, 0.4, 0.3);
  g.add(box(0.5, 0.5, 1.1, pink, 0, 0.55, -0.3));
  g.add(box(0.45, 0.35, 0.9, pink, 0, 0.75, 0.45));
  const seat = box(0.42, 0.1, 0.7, mat(0x1a1a1a, 0.8, 0), 0, 0.85, 0.45);
  g.add(seat);
  const bar = box(0.06, 0.7, 0.06, mat(0x222222, 0.4, 0.6), 0, 1.0, -0.75);
  bar.rotation.x = -0.3;
  g.add(bar);
  g.add(box(0.55, 0.06, 0.06, mat(0x222222, 0.4, 0.6), 0, 1.3, -0.85));
  const head = box(0.2, 0.14, 0.1, new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffe9a0, emissiveIntensity: 1.2 }), 0, 0.7, -0.86);
  g.add(head);
  for (const z of [-0.75, 0.7]) {
    const w = wheel(0.28, 0.14);
    w.position.set(0, 0.28, z);
    g.add(w);
  }
  return g;
}

// --- Tank roadblock: olive, turret + barrel, parked across the road.
export function buildTank() {
  const g = new THREE.Group();
  const olive = mat(0x4a5a34, 0.7, 0.2);
  const dark = mat(0x2c341f, 0.7, 0.2);
  g.add(box(3.0, 0.9, 5.2, olive, 0, 0.75, 0));
  g.add(box(3.2, 0.5, 5.4, dark, 0, 0.35, 0));
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.7, 10), olive);
  turret.position.y = 1.5; turret.castShadow = true;
  g.add(turret);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.4, 8), dark);
  barrel.rotation.x = Math.PI / 2 - 0.08;
  barrel.position.set(0, 1.55, -2.6);
  barrel.castShadow = true;
  g.add(barrel);
  g.add(box(0.5, 0.3, 0.4, dark, 0, 1.95, 0.4));
  return g;
}

// --- Helicopter: big, low, searchlight cone + spotlight.
export function buildHelicopter() {
  const g = new THREE.Group();
  const navy = mat(0x1c2a44, 0.4, 0.5);
  const white = mat(0xf4f2ec, 0.4, 0.3);
  const glass = mat(0x0e1822, 0.1, 0.9);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), navy);
  body.scale.set(1, 0.85, 1.7); body.position.y = 0; body.castShadow = true;
  g.add(body);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), glass);
  cockpit.scale.set(1, 0.7, 0.9); cockpit.position.set(0, -0.15, 1.6);
  g.add(cockpit);
  g.add(box(1.6, 0.5, 1.2, white, 0, 0.75, 0.2));
  // Tail boom + fin + tail rotor.
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 4.2, 8), navy);
  boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.25, -4.2); boom.castShadow = true;
  g.add(boom);
  g.add(box(0.12, 1.1, 0.7, navy, 0, 0.7, -6.1));
  const tailRotor = box(0.08, 1.8, 0.18, white, -0.5, 0.4, -6.0);
  g.add(tailRotor);
  // Main rotor: two long blades on a mast.
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 8), white);
  mast.position.y = 1.5;
  g.add(mast);
  const rotor = new THREE.Group();
  rotor.position.y = 1.85;
  rotor.add(box(0.35, 0.06, 11.5, mat(0x222222, 0.4, 0.5)));
  rotor.add(box(11.5, 0.06, 0.35, mat(0x222222, 0.4, 0.5)));
  g.add(rotor);
  g.userData.rotor = rotor;
  // Skids.
  for (const x of [-0.9, 0.9]) g.add(box(0.12, 0.12, 3.2, white, x, -1.35, 0.3));
  // Searchlight cone: faint, narrow, short — a beam, not a white wedge.
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff2b0, transparent: true, opacity: 0.07,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 16, 20, 1, true), coneMat);
  cone.position.set(0, -9, 4);
  cone.rotation.x = Math.PI + 0.15;
  g.add(cone);
  const spot = new THREE.SpotLight(0xfff2b0, 60, 60, 0.5, 0.5, 1.2);
  spot.position.set(0, -1, 2);
  spot.target.position.set(0, -16, 8);
  g.add(spot, spot.target);
  return g;
}
