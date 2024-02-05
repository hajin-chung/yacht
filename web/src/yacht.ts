import { World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fps } from "./constants";
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
      const dice = new Dice(rapier, this.world, this.scene, diceGltf, i);
      this.diceList.push(dice);
    }

    this.cup = new Cup(rapier, this.world, this.scene, cupGltf);
    this.board = new Board(rapier, this.world, this.scene, boardGltf);
    this.ground = new Ground(this.scene, groundTexture);
  }

  update() {
    this.diceList.forEach((dice) => dice.update());
    this.cup.update();
    this.world.step();

    if (this.cup.didRoll && !this.cup.didMove && this.cup.frames.length === 0) {
      this.cup.move();

      this.world.removeCollider(this.cup.topCollider, false);
      this.world.removeCollider(this.cup.cupCollider, false);

      for (let i = 0; i < this.diceList.length; i++) {
        const dice = this.diceList[i];
        this.getRotations();
        dice.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        dice.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
        dice.rigidBody.resetForces(true);
        dice.rigidBody.resetTorques(true);
        dice.rigidBody.addForce({ x: -0.6, y: -0.1, z: 0.1 }, true);
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

  rotationBuffer(): number[] {
    const rotations: number[] = [];
    for (let i = 0; i < this.diceList.length; i++) {
      const rotation = this.diceList[i].rigidBody.rotation();
      rotations.push(rotation.x);
      rotations.push(rotation.y);
      rotations.push(rotation.z);
      rotations.push(rotation.w);
    }
    return rotations;
  }

  translationBuffer(): number[] {
    const translations: number[] = [];
    for (let i = 0; i < this.diceList.length; i++) {
      const translation = this.diceList[i].rigidBody.translation();
      translations.push(translation.x);
      translations.push(translation.y);
      translations.push(translation.z);
    }
    return translations;
  }

  getRotations() {
    // const num = this.diceList.length;
    // const translations = this.translationBuffer();
    // const rotations = this.rotationBuffer();
    // getRotations(num, translations, rotations);
  }
}
