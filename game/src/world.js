// World — assembles the whole Solara Bay scene and stages the 4 shots.
// Layout: Strand Boulevard runs along Z at x in [-7, 7]. Beach + ocean
// east (x > 10), buildings west (x < -12), Ferris wheel north-west,
// yacht anchored close in at (42, 0, -38) so the cover reads marina.
// One shadow-casting sun (2048 map), FOV 38-40 long lens.
import * as THREE from 'three';
import { makeRng } from './rng.js';
import { Sky } from './sky.js';
import { buildCity } from './city.js';
import { buildBeach } from './beach.js';
import { buildHeroCar, buildPoliceCar, buildTank, buildHelicopter } from './vehicles.js';
import { buildCrowd, buildDownedEnemy, buildPlayer, poseWalk } from './people.js';
import { TrafficSystem } from './traffic.js';
import { awningTexture, roadTexture, neonSignTexture } from './textures.js';

function mat(color, rough = 0.85, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}

export class World {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.rng = makeRng(20261122);
    this.clock = new THREE.Clock();
    this.frozen = false;
    this.time = 0;

    // Lights: one sun (shadow caster) + hemisphere fill.
    this.sun = new THREE.DirectionalLight(0xffffff, 3.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1; this.sun.shadow.camera.far = 320;
    this.sun.shadow.camera.left = -90; this.sun.shadow.camera.right = 90;
    this.sun.shadow.camera.top = 90; this.sun.shadow.camera.bottom = -90;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.3;
    scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xbfdcff, 0x8a7a5a, 0.9);
    scene.add(this.hemi);
    // Warm fill from the CAMERA side (south-west, high): lights the
    // faces the camera actually sees — hero rear, yacht port side, road.
    this.fill = new THREE.DirectionalLight(0xffd9a8, 0.5);
    this.fill.position.set(-20, 60, 70);
    scene.add(this.fill, this.fill.target);

    this.sky = new Sky(scene);

    // Road: boulevard along Z, neon variant for the golden-hour chase.
    this.roadMat = null;
    this.buildRoad(false);

    const city = buildCity(this.rng);
    this.ferris = city.ferris;
    scene.add(city.group);
    const beach = buildBeach(this.rng);
    this.water = beach.water;
    this.yacht = beach.yacht;
    scene.add(beach.group);

    this.traffic = new TrafficSystem(scene, this.rng);
    this.traffic.spawn(12);

    // Hero car, police cars, tank, heli — staged per shot.
    this.hero = buildHeroCar();
    scene.add(this.hero);
    this.policeA = buildPoliceCar('CORAL-48');
    this.policeB = buildPoliceCar('KITE-1');
    scene.add(this.policeA, this.policeB);
    this.tank = buildTank();
    scene.add(this.tank);
    this.heli = buildHelicopter();
    scene.add(this.heli);

    // Player + market for the foot shot.
    this.player = buildPlayer(this.rng);
    scene.add(this.player.group);
    this.buildMarket();
    this.downed = buildDownedEnemy(this.rng);
    scene.add(this.downed);
    const marketCrowd = buildCrowd(this.rng, 14, { x: -20, z: -24, w: 16, d: 26 }, 0.5);
    scene.add(marketCrowd.group);
    this.marketCrowd = marketCrowd;
  }

  buildRoad(neon) {
    if (this.roadMat) {
      this.scene.remove(this.roadMat);
      this.roadMat.geometry.dispose();
    }
    const geo = new THREE.PlaneGeometry(14, 260);
    this.roadMat = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      map: roadTexture({ neon }), roughness: neon ? 0.45 : 0.85, metalness: neon ? 0.25 : 0,
    }));
    this.roadMat.rotation.x = -Math.PI / 2;
    this.roadMat.position.set(0, 0.05, -60);
    this.roadMat.receiveShadow = true;
    this.scene.add(this.roadMat);
  }

  setRoadTexture(tex) {
    this.roadMat.material.map = tex;
    this.roadMat.material.needsUpdate = true;
  }

  // Market stalls: striped awnings + crates + fruit boxes, west plaza.
  buildMarket() {
    const g = new THREE.Group();
    const rng = this.rng;
    const awnings = [0xff2e88, 0xffb347, 0x2fae6e, 0x3a7bd5];
    for (let i = 0; i < 6; i++) {
      const stall = new THREE.Group();
      const x = -16 - (i % 3) * 7, z = -14 - Math.floor(i / 3) * 12;
      stall.position.set(x, 0, z);
      stall.rotation.y = 0.35;
      // Counter + crates.
      stall.add(box(3.2, 1.0, 1.6, mat(0x7a5230, 0.9, 0), 0, 0.5, 0));
      for (let c = 0; c < 4; c++) {
        stall.add(box(0.6, 0.4, 0.5, mat([0xff6a2a, 0xf2c14e, 0x2fae6e, 0xe84a5a][c], 0.8, 0),
          -1.1 + c * 0.75, 1.2, 0));
      }
      // Striped awning on poles.
      const awn = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2),
        new THREE.MeshStandardMaterial({ map: awningTexture('#ffffff', '#ff2e88'), side: THREE.DoubleSide, roughness: 0.9 }));
      awn.rotation.x = -0.5;
      awn.position.set(0, 2.6, 0.2);
      awn.castShadow = true;
      stall.add(awn);
      for (const px of [-1.6, 1.6]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), mat(0x888888, 0.5, 0.6));
        pole.position.set(px, 1.3, 0.9);
        stall.add(pole);
      }
      g.add(stall);
    }
    // "FRUIT" neon sign over the market stalls, facing the boulevard.
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.1),
      new THREE.MeshStandardMaterial({
        map: neonSignTexture('FRUIT', '#ff2e88'),
        emissive: 0xffffff, emissiveMap: neonSignTexture('FRUIT', '#ff2e88'),
        emissiveIntensity: 0.9, roughness: 0.6,
      }));
    sign.position.set(-12, 5.2, -20);
    sign.rotation.y = 0.35;
    g.add(sign);
    this.scene.add(g);
    this.market = g;
  }

  // Apply a sky preset + matching lights.
  applySky(name) {
    const { dir, preset } = this.sky.applyPreset(name, this.renderer);
    this.sun.position.copy(dir).multiplyScalar(160);
    this.sun.target.position.set(0, 0, -40);
    this.sun.color.setHex(preset.sunColor);
    this.sun.intensity = preset.sunIntensity;
    this.hemi.color.setHex(preset.hemiSky);
    this.hemi.groundColor.setHex(preset.hemiGround);
    this.hemi.intensity = preset.hemiIntensity;
    // Fill follows the preset: strong + warm at golden hour, soft at noon.
    // Noon fill is 1.1 so camera-facing sides (yacht hull, hero rear)
    // read white, not shadow-grey.
    this.fill.intensity = name === 'golden' ? 1.5 : name === 'noon' ? 1.1 : 0.3;
    this.fill.color.setHex(name === 'golden' ? 0xffd9a8 : 0xffffff);
  }

  // Stage one of the 4 shots: positions, sky, camera. Returns nothing;
  // the caller reads the HUD state from shots.js.
  stage(shot) {
    // The golden-hour chase gets the wet neon-reflection road; the other
    // shots get the dry daytime asphalt.
    this.buildRoad(shot === 'chase');
    const H = this.hero, PA = this.policeA, PB = this.policeB;
    const T = this.tank, HL = this.heli;
    // Defaults: everything visible, hero on the boulevard, FOV 40, heli 1x.
    H.visible = true; PA.visible = true; PB.visible = true;
    T.visible = true; HL.visible = true;
    HL.scale.setScalar(1);
    this.camera.fov = 40;
    for (const c of this.traffic.cars) c.obj.visible = true;
    if (this.traffic.scooter) this.traffic.scooter.visible = true;
    this.player.group.visible = false;
    this.downed.visible = false;
    this.market.visible = false;

    if (shot === 'cover') {
      this.applySky('noon');
      // Wide cover lens (FOV 50) from behind-right of the hero, looking
      // north: road diagonal, beach + ocean on the right, the yacht near
      // the view axis and BIG, Ferris wheel on the left skyline.
      this.camera.fov = 50;
      H.position.set(2.5, 0, 0); H.rotation.y = 0.12;
      // Police car angled across the road, centre-frame, so its SIDE
      // (POLICE door lettering) faces the cover camera — not hidden
      // behind the minimap at the frame's edge.
      PA.position.set(3.5, 0, -8); PA.rotation.y = 0.6;
      PB.position.set(4.5, 0, -30); PB.rotation.y = -0.1;
      T.position.set(-2, 0, -45); T.rotation.y = 0.5;
      // Heli high over the road ahead, top-centre, clear of the yacht's sail.
      HL.position.set(15, 26, -39); HL.rotation.y = -0.4; HL.scale.setScalar(1.4);
      this.camera.position.set(4, 4.5, 20);
      this.camera.lookAt(16, 2, -40);
      this.traffic.scooter.position.set(5.5, 0, -2);
    } else if (shot === 'foot') {
      this.applySky('noon');
      this.market.visible = true;
      this.downed.visible = true;
      this.player.group.visible = true;
      this.player.group.position.set(-1.5, 0, 2);
      this.player.group.rotation.y = Math.PI + 0.35; // seen from behind, facing market
      // Downed enemy BIG in the foreground, body across the frame with
      // a red ring — left of the dialogue card, never under it.
      this.downed.position.set(-2.5, 0.22, 4);
      this.downed.rotation.y = 1.2;
      H.visible = false; T.visible = false; HL.visible = false;
      PA.visible = false; PB.visible = false;
      // No traffic in the market aisle: it would park on the shot.
      for (const c of this.traffic.cars) c.obj.visible = false;
      if (this.traffic.scooter) this.traffic.scooter.visible = false;
      // Camera pulled back + up so the player (seen from behind) sits in
      // the lower third, market ahead — not looking over their head.
      this.camera.position.set(3.5, 4.2, 14);
      this.camera.lookAt(-10, 1.0, -20);
    } else if (shot === 'chase') {
      this.applySky('golden');
      H.position.set(0.5, 0, 0); H.rotation.y = -0.08;
      // Police car angled across the road so its SIDE (POLICE door) faces
      // the chase camera, not just its rear.
      PA.position.set(-2, 0, -4); PA.rotation.y = 0.85;
      PB.position.set(5, 0, -30); PB.rotation.y = 0.1;
      T.position.set(2, 0, -55); T.rotation.y = -0.6;
      // Heli lower + fully framed (never cropped at the top edge).
      HL.position.set(8, 14, -35); HL.rotation.y = -0.5; HL.scale.setScalar(1.2);
      this.camera.position.set(4.5, 4.5, 16);
      this.camera.lookAt(-1, 1.0, -28);
      this.traffic.scooter.position.set(5.4, 0, 22);
    } else if (shot === 'meta') {
      this.applySky('noon');
      H.position.set(0.5, 0, 4);
      PA.position.set(-4.6, 0, -3);
      PB.position.set(4.8, 0, -26);
      T.visible = false; HL.visible = false;
      this.camera.position.set(-30, 95, 55);
      this.camera.lookAt(-10, 0, -60);
    }
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    if (this.frozen) return;
    this.time += dt;
    this.sky.update(dt);
    // Water shimmer: scroll the texture.
    if (this.water.material.map) this.water.material.map.offset.y += dt * 0.008;
    // Heli rotor spin + gentle bob.
    if (this.heli.userData.rotor) this.heli.userData.rotor.rotation.y += dt * 14;
    this.heli.position.y += Math.sin(this.time * 0.8) * dt * 0.35;
    // Ferris wheel slow turn.
    this.ferris.rotation.z += dt * 0.02;
    // Traffic + crowds.
    this.traffic.update(dt, false);
    if (this.marketCrowd) {
      for (const p of this.marketCrowd.peds) {
        p.phase += dt * 0.7 * p.speed;
        poseWalk(p.ped, p.phase, 0.7);
      }
    }
  }
}
