// People for Solara Bay — a NEW jointed ped construction.
// The old doll complaint was shape, not colour: round head on a square
// body, straight stick limbs. These peds are built from pivots:
// pelvis -> torso -> shoulders -> upper arm -> ELBOW -> forearm,
// hips -> thigh -> KNEE -> shin. Joints bend, proportions vary
// (tall/thin, short/stocky, long legs, broad shoulders), so silhouettes
// differ at a glance. Walk poses swing arms and legs in opposition.
import * as THREE from 'three';
import { makeRng } from './rng.js';

const SKINS = [0xc98e6a, 0x8a5a3a, 0xe8b88a, 0x6a4230, 0xd9a077];
const SHIRTS = [0xe84a5a, 0x2fae6e, 0x3a7bd5, 0xf2c14e, 0x9b59b6, 0xecf0f1, 0x1abc9c, 0xe67e22, 0x34495e, 0xff2e88, 0x16a085, 0xc0392b];
const PANTS = [0x2c3e50, 0x5d4037, 0x7f8c8d, 0x1a1a2e, 0x4a6741, 0x8e44ad, 0xd5dbdb, 0x2e4053];
const HAIR = [0x1a1a1a, 0x3a2410, 0x6a4a1a, 0x888888, 0xd8c8a0];

function mat(color, rough = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
}
function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  return m;
}
function limb(r, len, material) {
  // Tapered cylinder limb with a sphere joint cap — reads as a limb, not a stick.
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, len, 8), material);
  cyl.position.y = -len / 2; cyl.castShadow = true;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), material);
  cap.castShadow = true;
  g.add(cyl, cap);
  g.userData.len = len;
  return g;
}

// Body-plan variants: distinct silhouettes, not just recolours.
const BUILDS = [
  { name: 'tall-thin', height: 1.92, shoulder: 0.40, torso: 0.62, leg: 0.95, waist: 0.30 },
  { name: 'average', height: 1.76, shoulder: 0.46, torso: 0.58, leg: 0.85, waist: 0.34 },
  { name: 'stocky', height: 1.66, shoulder: 0.54, torso: 0.60, leg: 0.74, waist: 0.42 },
  { name: 'long-legs', height: 1.84, shoulder: 0.44, torso: 0.52, leg: 0.98, waist: 0.32 },
  { name: 'short', height: 1.58, shoulder: 0.42, torso: 0.54, leg: 0.70, waist: 0.32 },
];

// Build one pedestrian. Returns { group, joints, build }.
// joints: shoulderL/R, elbowL/R, hipL/R, kneeL/R, head, torso — pose them.
export function buildPed(rng, opts = {}) {
  const build = opts.build || rng.pick(BUILDS);
  const skin = mat(opts.skin ?? rng.pick(SKINS), 0.7);
  const shirt = mat(opts.shirt ?? rng.pick(SHIRTS));
  const pants = mat(opts.pants ?? rng.pick(PANTS));
  const hairM = mat(opts.hair ?? rng.pick(HAIR), 0.95);

  const g = new THREE.Group();
  const s = build.height / 1.76; // overall scale from the average build
  const joints = {};

  // Pelvis + hips.
  const pelvis = box(build.waist, 0.16, 0.22, pants);
  pelvis.position.y = build.leg + 0.08;
  g.add(pelvis);

  // Torso: slightly tapered box (wider at shoulders), shirt colour.
  const torso = box(build.shoulder, build.torso, 0.24, shirt);
  torso.position.y = build.leg + 0.16 + build.torso / 2;
  g.add(torso);
  joints.torso = torso;

  // Head: sphere (not a cube) + hair cap; optional cap/hat.
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), skin);
  skull.castShadow = true;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM);
  hair.position.y = 0.02; hair.castShadow = true;
  head.add(skull, hair);
  head.position.y = build.leg + 0.16 + build.torso + 0.13;
  g.add(head);
  joints.head = head;
  if (opts.hat === 'cap' || rng.chance(0.3)) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.13, 0.06, 10), mat(rng.pick(SHIRTS), 0.9));
    cap.position.y = head.position.y + 0.09; cap.castShadow = true;
    const brim = box(0.16, 0.02, 0.12, cap.material);
    brim.position.set(0, head.position.y + 0.07, 0.13);
    g.add(cap, brim);
  } else if (opts.hat === 'straw' || rng.chance(0.12)) {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.03, 12), mat(0xe8d8a0, 0.95));
    hat.position.y = head.position.y + 0.10; hat.castShadow = true;
    g.add(hat);
  }

  // Arms: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand.
  function arm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * build.shoulder * 0.52, build.leg + 0.16 + build.torso - 0.06, 0);
    const upper = limb(0.055, 0.30, shirt);
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.30;
    const fore = limb(0.048, 0.28, skin);
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skin);
    hand.position.y = -0.30; hand.castShadow = true;
    elbow.add(hand);
    upper.add(elbow);
    g.add(shoulder);
    return { shoulder, elbow };
  }
  const armL = arm(-1), armR = arm(1);
  joints.shoulderL = armL.shoulder; joints.elbowL = armL.elbow;
  joints.shoulderR = armR.shoulder; joints.elbowR = armR.elbow;

  // Legs: hip pivot -> thigh -> knee pivot -> shin + shoe.
  function leg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * build.waist * 0.28, build.leg + 0.06, 0);
    const thighLen = build.leg * 0.52;
    const thigh = limb(0.075, thighLen, pants);
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -thighLen;
    const shin = limb(0.062, build.leg * 0.48, pants);
    knee.add(shin);
    const shoe = box(0.11, 0.07, 0.26, mat(0x1a1a1a, 0.6));
    shoe.position.set(0, -build.leg * 0.48 - 0.03, 0.05);
    knee.add(shoe);
    thigh.add(knee);
    g.add(hip);
    return { hip, knee };
  }
  const legL = leg(-1), legR = leg(1);
  joints.hipL = legL.hip; joints.kneeL = legL.knee;
  joints.hipR = legR.hip; joints.kneeR = legR.knee;

  // Optional bag / accessory sells the silhouette.
  if (rng.chance(0.3)) {
    const bag = box(0.16, 0.22, 0.07, mat(rng.pick(SHIRTS), 0.9));
    bag.position.set(build.shoulder * 0.5, build.leg + 0.3, -0.16);
    g.add(bag);
  }

  g.scale.setScalar(s);
  g.userData.build = build.name;
  return { group: g, joints, build };
}

// Walk-cycle pose: phase 0..1. Arms/legs swing in opposition, knees bend
// on the backswing, elbows stay slightly bent — a walking person, not a doll.
export function poseWalk(ped, phase, speed = 1) {
  const a = Math.sin(phase * Math.PI * 2) * 0.55 * speed;
  const b = Math.sin(phase * Math.PI * 2 + Math.PI) * 0.55 * speed;
  ped.joints.hipL.rotation.x = a;
  ped.joints.hipR.rotation.x = b;
  ped.joints.kneeL.rotation.x = Math.max(0, -Math.sin(phase * Math.PI * 2 + 0.6)) * 0.7;
  ped.joints.kneeR.rotation.x = Math.max(0, -Math.sin(phase * Math.PI * 2 + Math.PI + 0.6)) * 0.7;
  ped.joints.shoulderL.rotation.x = b * 0.8;
  ped.joints.shoulderR.rotation.x = a * 0.8;
  ped.joints.elbowL.rotation.x = -0.35 - Math.max(0, b) * 0.3;
  ped.joints.elbowR.rotation.x = -0.35 - Math.max(0, a) * 0.3;
  ped.joints.torso.rotation.y = Math.sin(phase * Math.PI * 2) * 0.06;
}

// Standing idle: slight arm hang, one knee soft.
export function poseIdle(ped, t) {
  ped.joints.shoulderL.rotation.x = Math.sin(t * 0.8) * 0.03;
  ped.joints.shoulderR.rotation.x = -Math.sin(t * 0.8) * 0.03;
  ped.joints.elbowL.rotation.x = -0.15;
  ped.joints.elbowR.rotation.x = -0.15;
  ped.joints.hipL.rotation.x = 0.02; ped.joints.hipR.rotation.x = -0.02;
  ped.joints.kneeL.rotation.x = 0.05; ped.joints.kneeR.rotation.x = 0.05;
}

// Downed enemy: a whole ped laid flat on its back, limbs splayed, one arm
// bent over the chest — clearly a body on the ground, not a marker.
// Wrapped: the outer group sets the heading on the ground, the inner group
// lays the body flat, so the pose survives any heading.
// Bright shirt + pale pants so it reads against dark asphalt, plus a red
// ring under the body — the game marks a downed enemy.
export function buildDownedEnemy(rng) {
  const ped = buildPed(rng, { shirt: 0xc0392b, pants: 0x95a5a6 });
  const j = ped.joints;
  j.hipL.rotation.x = -0.4; j.hipR.rotation.x = 0.5;
  j.kneeL.rotation.x = 0.5; j.kneeR.rotation.x = 0.25;
  j.shoulderL.rotation.z = 1.2; j.shoulderR.rotation.z = -0.9;
  j.elbowL.rotation.x = -1.1; j.elbowR.rotation.x = -0.4;
  j.head.rotation.z = 0.5;
  const inner = new THREE.Group();
  inner.rotation.x = -Math.PI / 2 + 0.06;
  inner.add(ped.group);
  const outer = new THREE.Group();
  outer.add(inner);
  outer.position.y = 0.22;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.15, 32),
    new THREE.MeshBasicMaterial({ color: 0xe74c3c, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  outer.add(ring);
  return outer;
}

// The player: third-person, jacket + armed, seen from behind.
export function buildPlayer(rng) {
  const ped = buildPed(rng, {
    build: BUILDS[1], shirt: 0x1f6f5c, pants: 0x2c3e50, skin: 0xc98e6a, hat: 'cap',
  });
  // Rifle slung across the back.
  const rifle = new THREE.Group();
  const barrel = box(0.05, 0.05, 0.85, mat(0x1a1a1a, 0.5));
  const stock = box(0.06, 0.12, 0.25, mat(0x3a2410, 0.7));
  stock.position.z = 0.4;
  rifle.add(barrel, stock);
  rifle.position.set(0.1, 1.45, -0.2);
  rifle.rotation.z = 0.6;
  ped.group.add(rifle);
  return ped;
}

// A crowd: N jointed peds scattered in a rect, each with its own build,
// phase and walk/idle behaviour. Returns { group, peds } for animation.
export function buildCrowd(rng, count, area, walking = 0.6) {
  const group = new THREE.Group();
  const peds = [];
  for (let i = 0; i < count; i++) {
    const ped = buildPed(rng);
    ped.group.position.set(
      area.x + rng.range(-area.w / 2, area.w / 2),
      0,
      area.z + rng.range(-area.d / 2, area.d / 2),
    );
    ped.group.rotation.y = rng.range(0, Math.PI * 2);
    const walkingPed = rng.chance(walking);
    group.add(ped.group);
    peds.push({ ped, phase: rng.next(), speed: rng.range(0.7, 1.3), walking: walkingPed, t: rng.next() * 10 });
  }
  return { group, peds };
}

export function animateCrowd(crowd, dt) {
  for (const p of crowd.peds) {
    p.phase += dt * 0.9 * p.speed;
    if (p.walking) {
      poseWalk(p.ped, p.phase, 0.9);
      p.ped.group.position.x += Math.sin(p.ped.group.rotation.y) * dt * 0.5 * p.speed;
      p.ped.group.position.z += Math.cos(p.ped.group.rotation.y) * dt * 0.5 * p.speed;
    } else {
      p.t += dt;
      poseIdle(p.ped, p.t);
    }
  }
}
