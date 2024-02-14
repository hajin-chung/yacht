import { World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fps } from "./constants";
import { rapier } from "./rapier";
import { GameState, state } from "./state";
import { RollData, sendMessage } from "./websocket";
import { Frame } from "./animation";

export let yacht: Yacht;

export function initYacht() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  yacht = new Yacht(canvas);
}

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

  diceRollFrames: Frame[] = [];
  pressingShake: boolean = false;

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(4, 10, 4);
    this.scene.add(directionalLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.5);
    this.scene.add(hemisphereLight);

    this.diceList = [];
    for (let i = 0; i < 5; i++) {
      const dice = new Dice(this.world, this.scene, i);
      this.diceList.push(dice);
    }

    this.cup = new Cup(this.world, this.scene);
    this.board = new Board(this.scene);
    this.ground = new Ground(this.scene);

    document.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        this.pressingShake = true;
      }
    })

    document.addEventListener("keyup", (e) => {
      if (e.key === " ") {
        this.pressingShake = false;
      }
    })
  }

  update() {
    this.diceList.forEach((dice) => dice.step());
    this.cup.step();
    this.world.step();

    if (!state.game) return
    if (!state.user) return
    if (state.game.playerId[state.game.turn % 2] !== state.user.id) return
    console.log(this.pressingShake)
    if (this.pressingShake && this.cup.frame.length === 0) {
      sendMessage("shake")
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

  updateState(state: GameState) {
  }

  shake() {
    this.cup.shakeCount++;
  }

  roll(data: RollData) {
    this.cup.roll();
  }
}
