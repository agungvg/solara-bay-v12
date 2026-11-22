// Beach + ocean + marina for Solara Bay.
// The yacht is the environment priority: BIG (26 m), CLOSE to the cover
// camera, white hull + teal stripe, tall mast + a full white sail, people
// on deck — unmistakably a luxury yacht, not a speck at the horizon.
// Beach: sand, umbrellas, towels, sunbathers; ocean: animated water plane.
import * as THREE from 'three';
import { makeRng } from './rng.js';
import { sandTexture, waterTexture } from './textures.js';
import { buildPed, poseIdle } from './people.js';

function mat(color, rough = 0.6, metal = 0.1) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}

// --- The yacht. Hull: tapered white body with a pointed bow, teal waterline
// stripe, wood deck, two-deck superstructure with a dark window band, tall
// mast + big triangular sail, radar arch, railings, deck guests.
export function buildYacht(rng) {
  const yacht = new THREE.Group();
  const white = mat(0xf7f5ef, 0.35, 0.25);
  const teal = mat(0x1e7f9e, 0.4, 0.3);
  const wood = mat(0x9a6a38, 0.8, 0);
  const glass = mat(0x10222e, 0.12, 0.9);

  // Hull: main slab + pointed bow wedge + stern.
  const hull = box(7.2, 2.6, 20, white, 0, 1.4, 0);
  yacht.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(3.6, 7, 4), white);
  bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4;
  bow.scale.set(1, 1, 0.72);
  bow.position.set(0, 1.4, -13.2);
  bow.castShadow = true;
  yacht.add(bow);
  // Teal waterline stripe along the hull (thick, high-contrast).
  yacht.add(box(7.3, 0.9, 19.6, teal, 0, 0.35, 0));
  const bowStripe = new THREE.Mesh(new THREE.ConeGeometry(3.65, 6.8, 4), teal);
  bowStripe.rotation.x = -Math.PI / 2; bowStripe.rotation.y = Math.PI / 4;
  bowStripe.scale.set(1, 1, 0.25);
  bowStripe.position.set(0, 0.35, -13.1);
  yacht.add(bowStripe);
  // Wood deck.
  yacht.add(box(6.8, 0.25, 19.4, wood, 0, 2.8, 0));
  // Superstructure: lower deck + window band + upper deck + bridge.
  yacht.add(box(5.6, 2.2, 9, white, 0, 4.0, 1.5));
  yacht.add(box(5.7, 0.9, 9.1, glass, 0, 4.3, 1.5));
  yacht.add(box(4.6, 1.8, 6, white, 0, 5.9, 1.0));
  yacht.add(box(4.7, 0.7, 6.1, glass, 0, 6.1, 1.0));
  yacht.add(box(4.0, 0.5, 3.5, white, 0, 7.0, 0.5));
  // Radar arch + mast (tall) + big sail.
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.16, 8, 20, Math.PI), white);
  arch.position.set(0, 7.3, 4.6);
  arch.castShadow = true;
  yacht.add(arch);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 21, 8), mat(0xd8d8d8, 0.4, 0.6));
  mast.position.set(0, 13.5, -3.5);
  mast.castShadow = true;
  yacht.add(mast);
  // Big white triangular sail, slightly bellied (two triangles).
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide });
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0); sailShape.lineTo(0, 17); sailShape.lineTo(7.5, 1.2); sailShape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), sailMat);
  sail.position.set(0.2, 6.5, -3.4);
  sail.castShadow = true;
  yacht.add(sail);
  const sail2 = sail.clone();
  sail2.rotation.y = Math.PI;
  sail2.position.set(-0.2, 6.5, -3.4);
  yacht.add(sail2);
  // Railings: thin posts + top rail around the deck edge.
  for (let z = -9; z <= 9; z += 3) {
    for (const x of [-3.4, 3.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 5), mat(0xcccccc, 0.4, 0.7));
      post.position.set(x, 3.35, z);
      yacht.add(post);
    }
  }
  // Deck guests: two jointed peds standing on deck + one sunbathing.
  // Stored on the group so the caller can counter-scale them if the
  // yacht itself is scaled up (a superyacht with normal-sized people).
  const guest1 = buildPed(rng, { shirt: 0xff2e88, pants: 0xecf0f1, hat: 'straw' });
  guest1.group.position.set(1.8, 2.9, 5.5);
  guest1.group.rotation.y = -0.6;
  poseIdle(guest1, 1.2);
  const guest2 = buildPed(rng, { shirt: 0x2fae6e, pants: 0x2c3e50 });
  guest2.group.position.set(-1.9, 2.9, -5.0);
  guest2.group.rotation.y = 2.4;
  poseIdle(guest2, 2.6);
  yacht.add(guest1.group, guest2.group);
  yacht.userData.guests = [guest1, guest2];
  // Sun loungers on the aft deck.
  for (const x of [-1.8, 1.8]) {
    yacht.add(box(0.9, 0.25, 2.2, mat(0xffb347, 0.8, 0), x, 3.05, 7.5));
  }
  // Name board on the stern.
  yacht.add(box(2.2, 0.6, 0.1, mat(0x1e7f9e, 0.5, 0.2), 0, 2.2, 10.05));
  return yacht;
}

// Small sailboat for depth (mid-ground, clearly smaller than the yacht).
export function buildSailboat() {
  const g = new THREE.Group();
  const white = mat(0xf7f5ef, 0.4, 0.2);
  g.add(box(2.2, 1.0, 6.5, white, 0, 0.6, 0));
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 4), white);
  bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4;
  bow.scale.set(1, 1, 0.5);
  bow.position.set(0, 0.6, -4.2);
  g.add(bow);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 8, 6), mat(0x888888, 0.4, 0.6));
  mast.position.y = 5;
  g.add(mast);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0); sailShape.lineTo(0, 6.5); sailShape.lineTo(3.2, 0.6); sailShape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide }));
  sail.position.set(0.1, 1.4, 0);
  g.add(sail);
  return g;
}

// Beach umbrella: bright striped cone + pole.
export function buildUmbrella(rng, color) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), mat(0xe8e0d0, 0.6, 0.2));
  pole.position.y = 1.3; pole.castShadow = true;
  g.add(pole);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.8, 10), mat(color, 0.8, 0));
  canopy.position.y = 2.8; canopy.castShadow = true;
  g.add(canopy);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), mat(0xffffff, 0.6, 0));
  tip.position.y = 3.25;
  g.add(tip);
  return g;
}

// Build beach + ocean + marina. Returns { group, water, yacht }.
export function buildBeach(rng) {
  const group = new THREE.Group();

  // Sand: x from 10 to 34, z from +80 to -260. Narrow band so the yacht
  // anchors just offshore and reads big from the boulevard.
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(24, 340),
    new THREE.MeshStandardMaterial({ map: sandTexture(), roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(22, 0.02, -80);
  sand.receiveShadow = true;
  group.add(sand);

  // Ocean: x from 34 to 374.
  const waterMat = new THREE.MeshStandardMaterial({
    map: waterTexture(), roughness: 0.25, metalness: 0.35,
    color: 0x9fd4e8, transparent: true, opacity: 0.96,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(340, 400), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(204, 0.0, -80);
  water.receiveShadow = true;
  group.add(water);

  // Wet sand band at the waterline.
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(6, 340),
    new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.4, metalness: 0.1 }));
  wet.rotation.x = -Math.PI / 2;
  wet.position.set(33, 0.03, -80);
  wet.receiveShadow = true;
  group.add(wet);

  // Umbrellas + towels along the beach.
  const umbrellaColors = [0xff2e88, 0xffb347, 0x2fae6e, 0x3a7bd5, 0xff6a2a];
  for (let i = 0; i < 14; i++) {
    const u = buildUmbrella(rng, umbrellaColors[i % umbrellaColors.length]);
    u.position.set(rng.range(12, 30), 0, rng.range(30, -160));
    u.rotation.z = rng.range(-0.08, 0.08);
    group.add(u);
    // Towel beside it.
    const towel = box(1.0, 0.06, 2.0, mat(umbrellaColors[(i + 2) % umbrellaColors.length], 0.9, 0),
      u.position.x + rng.range(-1.5, 1.5), 0.08, u.position.z + rng.range(-1, 2));
    group.add(towel);
  }

  // Beach crowd: sunbathers + walkers on the sand (jointed peds).
  for (let i = 0; i < 16; i++) {
    const ped = buildPed(rng);
    ped.group.position.set(rng.range(12, 30), 0, rng.range(25, -150));
    ped.group.rotation.y = rng.range(0, Math.PI * 2);
    poseIdle(ped, rng.next() * 10);
    group.add(ped.group);
  }

  // THE yacht: anchored just offshore, angled to the cover camera,
  // scaled 1.5x (a 39 m superyacht) — placed WEST of the HUD crew
  // column so the whole hull + tall sail read, never hidden behind UI.
  const yacht = buildYacht(rng);
  yacht.position.set(42, 0, -62);
  yacht.rotation.y = 0.4;
  yacht.scale.setScalar(1.5);
  // Counter-scale the deck guests so they stay human-sized.
  for (const gp of yacht.userData.guests) gp.group.scale.setScalar(1 / 1.5);
  group.add(yacht);

  // Second yacht further out + sailboats for depth.
  const yacht2 = buildYacht(rng);
  yacht2.scale.setScalar(0.8);
  yacht2.position.set(95, 0, -120);
  yacht2.rotation.y = -0.4;
  group.add(yacht2);
  for (const [x, z, ry] of [[75, -70, 0.8], [120, -30, -0.6], [60, -160, 0.3]]) {
    const sb = buildSailboat();
    sb.position.set(x, 0, z);
    sb.rotation.y = ry;
    group.add(sb);
  }

  // Marina docks near the pier (small boats moored).
  for (let i = 0; i < 3; i++) {
    const dock = box(3, 0.5, 24, mat(0x8a6a44, 0.9, 0), 50 + i * 6, 0.3, -60 - i * 8);
    group.add(dock);
  }

  return { group, water, yacht };
}
