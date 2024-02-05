import { RigidBodyDesc, World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { rollAnimation } from "./animation";
import { getRotations } from "./api";
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

  boardCollisionGroup: number;
  cupCollisionGroup: number;

  cupRolling: boolean;
  fetched: boolean;

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

    this.world = new rapier.World(
      { x: 0, y: -8, z: 0 },
    );
    this.world.timestep = 1 / fps;

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

    this.cupCollisionGroup = 0x00010001;
    this.boardCollisionGroup = 0x00020002;

    this.diceList = [];
    for (let i = 0; i < 5; i++) {
      const dice = new Dice(rapier, this.world, this.scene, diceGltf, i);
      dice.setCollisionGroup(this.cupCollisionGroup);
      this.diceList.push(dice);
    }

    this.cup = new Cup(rapier, this.world, this.scene, cupGltf);
    this.cup.setCollisionGroup(this.cupCollisionGroup);
    this.board = new Board(rapier, this.world, this.scene, boardGltf);
    this.board.setCollisionGroup(this.boardCollisionGroup);
    this.ground = new Ground(this.scene, groundTexture);

    // const testModel = diceGltf.scene.clone();
    // testModel.translateY(2);
    // this.scene.add(testModel);

    this.cupRolling = false;
    this.fetched = false;
  }

  update() {
    this.diceList.forEach((dice) => dice.update());
    this.cup.update();

    if (this.cupRolling && this.cup.rollFrames.length === 0)
      this.cupRolling = false;

    if (this.cupRolling && this.cup.rollFrames.length === rollAnimation.length / 2) {
      const num = this.diceList.length;
      const translations: number[] = [];
      const rotations: number[] = [];

      this.diceList.forEach((dice) => {
        const translation = dice.rigidBody.translation();
        translations.push(translation.x);
        translations.push(translation.y);
        translations.push(translation.z);

        const rotation = dice.rigidBody.rotation();
        rotations.push(rotation.w);
        rotations.push(rotation.x);
        rotations.push(rotation.y);
        rotations.push(rotation.z);

        dice.reset();
        dice.setCollisionGroup(this.boardCollisionGroup);

        dice.rigidBody.setTranslation(translation, false);
        dice.rigidBody.setRotation(rotation, false);
        dice.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, false);
        dice.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, false);
        dice.rigidBody.resetForces();
        dice.rigidBody.resetTorques();

        console.log(dice.rigidBody.linvel());
        console.log(dice.rigidBody.angvel());
        console.log(dice.rigidBody.isSleeping());
        console.log(dice.rigidBody.translation());
        console.log(dice.rigidBody.rotation());
        console.log(dice.rigidBody.mass());
        console.log(dice.rigidBody.nextTranslation());

        dice.rigidBody.addForce({ x: -0.6, y: -0.1, z: 0.1 }, false);
      })

      console.log(translations)
      console.log(rotations)

      this.fetched = true;
      getRotations(num, translations, rotations)
      //   .then((data) => {
      //   for (let i = 0; i < this.diceList.length; i++) {
      //     const diceBody = this.diceList[i].rigidBody;
      //     diceBody.setRotation({
      //       x: data.rotations[4 * i],
      //       y: data.rotations[4 * i + 1],
      //       z: data.rotations[4 * i + 2],
      //       w: data.rotations[4 * i + 3],
      //     }, false);
      //   }
      // })
    }

    if (this.fetched && !this.diceList[0].rigidBody.isSleeping()) {
      const dice = this.diceList[0].rigidBody;
      const t = dice.translation();
      const r = dice.rotation();
      console.log(`${t.x} ${t.y} ${t.z} ${r.x} ${r.y} ${r.z} ${r.w}`);
    }
    this.world.step();
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

  roll() {
    this.cup.roll();
    this.cupRolling = true;
  }
}
