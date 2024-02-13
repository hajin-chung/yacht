import { World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fps } from "./constants";
import { getSimulation } from "./api";
import { rapier } from "./rapier";

export class Yacht {
  world: World;
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  scene: THREE.Scene;

  diceList: Dice[];
  cup: Cup;
  board: Board;
  ground: Ground;

  isDebug: boolean;
  lines?: THREE.LineSegments;
  controls?: OrbitControls;

  showSimulation: boolean = false;
  animation: number[] = [];
  idx: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
  ) {
    this.isDebug = false;

    this.world = new rapier.World({ x: 0.0, y: -8.0, z: 0.0 });
    this.world.timestep = 1 / fps;

    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    this.renderer.setSize(canvas.width, canvas.height);

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 20, 0);
    this.camera.rotateX((Math.PI * 3) / 2);

    this.scene = new THREE.Scene();

    const light = new THREE.AmbientLight(0xeeeeff);
    this.scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffee, 2);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.8);
    this.scene.add(hemisphereLight);

    this.diceList = [];
    for (let i = 0; i < 5; i++) {
      const dice = new Dice(this.world, this.scene,i);
      this.diceList.push(dice);
    }

    this.cup = new Cup(this.world, this.scene);
    this.board = new Board(this.scene);
    this.ground = new Ground(this.scene);
  }

  update() {
    this.diceList.forEach((dice) => dice.update(this.showSimulation));
    this.cup.update();
    this.world.step();

    if (this.cup.didRoll && !this.cup.didMove && this.cup.frames.length === 0) {
      this.showSimulation = true;
      this.cup.move();

      this.world.removeCollider(this.cup.topCollider, false);
      this.world.removeCollider(this.cup.cupCollider, false);

      this.getSimulation();
      for (let i = 0; i < this.diceList.length; i++) {
        const dice = this.diceList[i];
        console.log(dice.rigidBody.translation());
        dice.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        dice.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        dice.rigidBody.resetForces(true);
        dice.rigidBody.resetTorques(true);
        dice.rigidBody.addForce({ x: -0.6, y: -0.1, z: 0.1 }, true);
      }
    }

    if (this.showSimulation) this.idx++;

    if (
      this.showSimulation &&
      this.animation.length !== 0 &&
      7 * this.diceList.length * this.idx < this.animation.length
    ) {
      for (let i = 0; i < this.diceList.length; i++) {
        const dice = this.diceList[i];
        const start = 7 * this.diceList.length * this.idx + 7 * i;
        dice.model.position.set(
          this.animation[start],
          this.animation[start + 1],
          this.animation[start + 2],
        );

        dice.model.quaternion.set(
          this.animation[start + 3],
          this.animation[start + 4],
          this.animation[start + 5],
          this.animation[start + 6],
        );
      }
    }
  }

  draw() {
    if (this.isDebug && this.controls) this.controls.update();
    if (this.isDebug && this.lines) {
      let buffers = this.world.debugRender();
      this.lines.geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(buffers.vertices, 3),
      );
      this.lines.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(buffers.colors, 4),
      );
    }

    this.renderer.render(this.scene, this.camera);
  }

  debug() {
    this.isDebug = true;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    let material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
    });
    let geometry = new THREE.BufferGeometry();
    this.lines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.lines);
  }

  getSimulation() {
    const num = this.diceList.length;
    getSimulation(num).then(
      (simulation) => (this.animation = simulation.buffer),
    );
  }
}
