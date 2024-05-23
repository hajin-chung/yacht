import * as THREE from "three";
import { $, fps, getMagnitude, minClamp } from "./utils";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { rapier } from "./rapier";
import { Board, Cup, Dice, Ground } from "./components";
import { World, EventQueue } from "@dimforge/rapier3d-compat";
import { isMouseDown, pointer } from "./view";
import { onCupClick, onDiceClick } from "./controller";
import { tickSound } from "./assets";

export let scene: Scene;

class Scene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;

  controls?: OrbitControls;
  isDebug: boolean = false;
  lines?: THREE.LineSegments;

  cup: Cup;
  diceList: Dice[];
  board: Board;
  ground: Ground;
  world: World;

  cupClicked: boolean = false;
  diceClicked: boolean[] = [false, false, false, false, false];

  eventQueue: EventQueue;
  mute: boolean = false;

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

    window.addEventListener(
      "resize",
      () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false,
    );

    this.raycaster = new THREE.Raycaster();

    this.camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
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

    this.world = new rapier.World({ x: 0.0, y: -16.0, z: 0.0 });
    this.world.timestep = 1 / fps;
    this.eventQueue = new rapier.EventQueue(true);

    this.cup = new Cup(this.scene, this.world);
    this.diceList = [];
    for (let i = 0; i < 5; i++) {
      this.diceList.push(new Dice(this.scene, this.world, i));
    }
    this.board = new Board(this.scene);
    this.ground = new Ground(this.scene, this.world);

    // this.debug();

    setInterval(this.loop.bind(this), 1000 / fps);
  }

  loop() {
    this.update();
    this.render();
  }

  update() {
    this.world.step(this.eventQueue);
    this.cup.update();
    this.diceList.forEach((dice) => dice.update());

    if (isMouseDown) {
      this.raycaster.setFromCamera(pointer, this.camera);

      this.diceList.forEach((dice, idx) => {
        const intersects = this.raycaster.intersectObject(dice.model);
        if (intersects.length > 0 && this.diceClicked[idx] === false) {
          onDiceClick(idx);
          this.diceClicked[idx] = true;
        }
      });

      const intersects = this.raycaster.intersectObject(this.cup.model);
      if (intersects.length > 0 && this.cupClicked === false) {
        onCupClick();
        this.cupClicked = true;
      }
    } else {
      this.cupClicked = false;
      this.diceClicked = [false, false, false, false, false];
    }
  }

  render() {
    console.log(this.mute);
    if (!this.mute) {
      let playCount = 0;
      this.eventQueue.drainCollisionEvents((handle1, handle2, start) => {
        if (playCount > 5) return
        if (!start) return

        const body1 = this.world.getCollider(handle1).parent();
        const body2 = this.world.getCollider(handle2).parent();
        const body = body1 || body2
        if (!body) return

        const tick = tickSound.cloneNode(true) as HTMLAudioElement;
        tick.volume = minClamp(getMagnitude(body.linvel()), 0.1);
        tick.play();
        playCount++;
      })
    }

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
