// Traffic + pedestrians — cars follow the boulevard spline at fixed
// speeds, peds walk the sidewalks. The player car is the only free one.
// Seeded so the same seed rebuilds the same traffic.
import * as THREE from 'three';
import { makeRng } from './rng.js';
import { buildTrafficCar, buildScooter } from './vehicles.js';
import { buildCrowd, animateCrowd } from './people.js';

// The boulevard: two lanes each way along Z, x = -3.5 / +3.5.
const LANES = [
  { x: -3.4, dir: -1, speed: 9 }, { x: -1.1, dir: -1, speed: 11 },
  { x: 1.1, dir: 1, speed: 10 }, { x: 3.4, dir: 1, speed: 8 },
];

export class TrafficSystem {
  constructor(scene, rng) {
    this.scene = scene;
    this.rng = rng;
    this.cars = [];
    this.scooter = null;
    this.crowds = [];
  }

  spawn(count = 10) {
    const kinds = ['sedan', 'sedan', 'taxi', 'van', 'sedan'];
    for (let i = 0; i < count; i++) {
      const lane = this.rng.pick(LANES);
      const car = buildTrafficCar(this.rng, this.rng.pick(kinds));
      car.position.set(lane.x + this.rng.range(-0.3, 0.3), 0, this.rng.range(-170, 50));
      car.rotation.y = lane.dir === -1 ? Math.PI : 0;
      this.scene.add(car);
      this.cars.push({ obj: car, lane, speed: lane.speed * this.rng.range(0.8, 1.2) });
    }
    // Scooter weaving the right lane.
    this.scooter = buildScooter();
    this.scooter.position.set(4.6, 0, 18);
    this.scene.add(this.scooter);
    // Sidewalk crowds.
    for (const [x, z, w, d] of [[-11, -20, 6, 60], [11.5, -60, 5, 80], [-11, -120, 6, 50]]) {
      const crowd = buildCrowd(this.rng, 8, { x, z, w, d }, 0.7);
      this.scene.add(crowd.group);
      this.crowds.push(crowd);
    }
  }

  update(dt, frozen) {
    if (frozen) return;
    for (const c of this.cars) {
      c.obj.position.z += c.lane.dir * c.speed * dt;
      if (c.obj.position.z < -180) c.obj.position.z = 55;
      if (c.obj.position.z > 60) c.obj.position.z = -175;
    }
    if (this.scooter) {
      this.scooter.position.z -= 7 * dt;
      this.scooter.position.x = 4.6 + Math.sin(performance.now() / 900) * 0.7;
      if (this.scooter.position.z < -180) this.scooter.position.z = 55;
    }
    for (const crowd of this.crowds) animateCrowd(crowd, dt);
  }
}
