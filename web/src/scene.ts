import * as THREE from "three";
import { $, fps } from "./utils";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { rapier } from "./rapier";
import { Board, Cup, Dice, Ground } from "./components";
import { World } from "@dimforge/rapier3d-compat";

export let scene: Scene;

class Scene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  controls?: OrbitControls;
  isDebug: boolean = false;
  lines?: THREE.LineSegments;

  cup: Cup;
  diceList: Dice[];
  board: Board;
  ground: Ground;
  world: World;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: $("#canvas"),
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 20, 0);
    this.camera.rotateX((Math.PI * 3) / 2);

    const light = new THREE.AmbientLight(0xeeeeff);
    this.scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffee, 2);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.8);
    this.scene.add(hemisphereLight);

    this.world = new rapier.World({ x: 0.0, y: -9.0, z: 0.0 });
    this.world.timestep = 1 / fps;

    this.cup = new Cup(this.scene, this.world);
    this.diceList = [];
    for (let i = 0; i < 5; i++) {
      this.diceList.push(new Dice(this.scene, this.world, i));
    }
    this.board = new Board(this.scene);
    this.ground = new Ground(this.scene);

    // this.debug();

    setInterval(this.loop.bind(this), 1000 / fps);
  }

  loop() {
    this.update();
    this.render();
  }

  update() {
    this.world.step();
    this.cup.update();
    this.diceList.forEach((dice) => dice.update());
  }

  render() {
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
}

export function initScene() {
  scene = new Scene();
}
