// Sky + clouds for Solara Bay (three r160).
// Tier 0 gradient dome (zenith -> horizon, sun glow) + Tier 2 billboard
// clouds (flattened sphere clusters + soft sprites, slow drift, fog:false).
// One sun direction drives the dome, the directional light and the fog:
// fog colour === horizon colour at every preset.
import * as THREE from 'three';
import { makeRng } from './rng.js';
import { cloudPuffTexture } from './textures.js';

// Two frozen presets: noon (bright blue, high white sun) and golden hour
// (warm amber, low sun). The cover is noon; the chase is golden hour.
export const SKY_PRESETS = {
  noon: {
    zenith: 0x2f7fe0, mid: 0x7ec0f2, horizon: 0xcfe8f7,
    sunColor: 0xffffff, sunIntensity: 3.0, sunElevation: 62, sunAzimuth: 35,
    hemiSky: 0xbfdcff, hemiGround: 0x8a7a5a, hemiIntensity: 0.9,
    fog: 0xcfe8f7, fogNear: 120, fogFar: 420, exposure: 1.05,
    cloudTint: 0xffffff, cloudOpacity: 0.95,
  },
  golden: {
    zenith: 0x6a4a9e, mid: 0xe88a5a, horizon: 0xffc98a,
    sunColor: 0xffc27a, sunIntensity: 2.8, sunElevation: 14, sunAzimuth: -58,
    hemiSky: 0xffb98a, hemiGround: 0x5a4038, hemiIntensity: 1.0,
    fog: 0xffc98a, fogNear: 100, fogFar: 380, exposure: 1.1,
    cloudTint: 0xffd9b0, cloudOpacity: 0.9,
  },
  nightMarket: {
    zenith: 0x0d1530, mid: 0x1d2c55, horizon: 0x3a2c55,
    sunColor: 0x8fa8ff, sunIntensity: 0.5, sunElevation: -12, sunAzimuth: 20,
    hemiSky: 0x2a3a6a, hemiGround: 0x1a1410, hemiIntensity: 0.5,
    fog: 0x2a2340, fogNear: 60, fogFar: 260, exposure: 1.0,
    cloudTint: 0x8a90b0, cloudOpacity: 0.5,
  },
};

function sunDir(preset) {
  const el = (preset.sunElevation * Math.PI) / 180;
  const az = (preset.sunAzimuth * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az),
  ).normalize();
}

export class Sky {
  constructor(scene, rngSeed = 5) {
    this.scene = scene;
    this.rng = makeRng(rngSeed);
    this.clouds = [];
    this.cloudPuff = cloudPuffTexture();

    // Gradient dome: BackSide sphere, 3-stop gradient + sun glow.
    this.domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        zenith: { value: new THREE.Color(0x2f7fe0) },
        mid: { value: new THREE.Color(0x7ec0f2) },
        horizon: { value: new THREE.Color(0xcfe8f7) },
        sunDir: { value: new THREE.Vector3(0, 1, 0) },
        sunColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        varying vec3 vDir; uniform vec3 zenith; uniform vec3 mid; uniform vec3 horizon;
        uniform vec3 sunDir; uniform vec3 sunColor;
        void main(){
          float h = clamp(vDir.y, -0.05, 1.0);
          vec3 col = mix(horizon, mid, smoothstep(0.0, 0.22, h));
          col = mix(col, zenith, smoothstep(0.2, 0.75, h));
          float g = pow(max(dot(normalize(vDir), normalize(sunDir)), 0.0), 18.0);
          col += sunColor * g * 0.55;
          float disc = smoothstep(0.9993, 0.9997, dot(normalize(vDir), normalize(sunDir)));
          col += sunColor * disc * 1.2;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 20), this.domeMat);
    this.dome.renderOrder = -1;
    scene.add(this.dome);

    // Sun billboard: soft glow sprite at the sun direction.
    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.cloudPuff, color: 0xfff2c8, transparent: true, opacity: 0.9,
      fog: false, depthWrite: false,
    }));
    this.sunSprite.scale.set(90, 90, 1);
    scene.add(this.sunSprite);

    this.buildClouds();
  }

  buildClouds() {
    // 11 clusters on 2 layers: high/slow/dim, low/faster/brighter.
    // Each cluster is 3-6 flattened white spheres + 2 soft sprites:
    // big, fluffy, clearly visible from the ground.
    const geo = new THREE.SphereGeometry(1, 12, 8);
    for (let i = 0; i < 11; i++) {
      const high = i < 4;
      const cluster = new THREE.Group();
      const n = 3 + Math.floor(this.rng.next() * 4);
      const spread = high ? this.rng.range(18, 30) : this.rng.range(12, 22);
      for (let j = 0; j < n; j++) {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffffff, roughness: 1, metalness: 0,
          transparent: true, opacity: 0.92, flatShading: true, fog: false,
        });
        const puff = new THREE.Mesh(geo, mat);
        const s = this.rng.range(5, 11);
        puff.scale.set(s * 1.6, s * 0.55, s);
        puff.position.set(this.rng.range(-spread, spread), this.rng.range(-1.5, 2.5), this.rng.range(-8, 8));
        cluster.add(puff);
      }
      for (let j = 0; j < 2; j++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this.cloudPuff, transparent: true, opacity: 0.32, fog: false, depthWrite: false,
        }));
        sp.scale.set(spread * 1.5, spread * 0.55, 1);
        sp.position.set(this.rng.range(-spread, spread), 0, 0);
        cluster.add(sp);
      }
      cluster.position.set(
        this.rng.range(-260, 260),
        high ? this.rng.range(95, 130) : this.rng.range(60, 90),
        this.rng.range(-320, -60),
      );
      cluster.userData.drift = high ? 0.6 : 1.4;
      this.scene.add(cluster);
      this.clouds.push(cluster);
    }
  }

  // Apply one preset: dome colours, sun position, fog, exposure, cloud tint.
  // Returns the sun direction so the caller can place the directional light.
  applyPreset(name, renderer) {
    const p = SKY_PRESETS[name];
    const dir = sunDir(p);
    this.domeMat.uniforms.zenith.value.setHex(p.zenith);
    this.domeMat.uniforms.mid.value.setHex(p.mid);
    this.domeMat.uniforms.horizon.value.setHex(p.horizon);
    this.domeMat.uniforms.sunDir.value.copy(dir);
    this.domeMat.uniforms.sunColor.value.setHex(p.sunColor);
    this.sunSprite.position.copy(dir).multiplyScalar(700);
    this.sunSprite.material.color.setHex(p.sunColor);
    this.sunSprite.material.opacity = p.sunElevation > 0 ? 0.9 : 0.0;
    this.scene.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar);
    this.scene.background = null; // dome is the background
    if (renderer) renderer.toneMappingExposure = p.exposure;
    for (const c of this.clouds) {
      c.traverse((o) => {
        if (o.isMesh) o.material.color.setHex(p.cloudTint);
        if (o.isSprite) o.material.color.setHex(p.cloudTint);
      });
    }
    return { dir, preset: p };
  }

  update(dt) {
    // Slow wind drift with wrap-around; never regenerate per frame.
    for (const c of this.clouds) {
      c.position.x += c.userData.drift * dt;
      if (c.position.x > 300) c.position.x = -300;
    }
  }
}
