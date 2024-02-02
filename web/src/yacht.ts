import { World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
type RAPIER = typeof import("@dimforge/rapier3d-compat");

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

  constructor(
    rapier: RAPIER,
    canvas: HTMLCanvasElement,
    diceGltf: GLTF,
    cupGltf: GLTF,
    boardGltf: GLTF,
    groundTexture: THREE.Texture,
  ) {
    this.isDebug = false;
    this.world = new rapier.World({ x: 0, y: -8, z: 0 });
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
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
      const dice = new Dice(rapier, this.world, this.scene, diceGltf, i);
      this.diceList.push(dice);
    }

    this.cup = new Cup(rapier, this.world, this.scene, cupGltf);
    this.board = new Board(this.scene, boardGltf);
    this.ground = new Ground(rapier, this.world, this.scene, groundTexture);
  }

  update() {
    this.world.step();
    this.diceList.forEach((dice) => dice.update());
    this.cup.update();
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
}
