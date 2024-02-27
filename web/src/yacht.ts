import { World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fps } from "./constants";
import { rapier } from "./rapier";
import { Frame } from "./animation";
import { DiceResult, IsLocked, state } from "./controller";
import { di } from "./utils";
import { sendMessage } from "./websocket";

export let yacht: Yacht;

export function initYacht() {
  const canvas = di("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  yacht = new Yacht(canvas);

  /** */
  document.addEventListener("keydown", (e) => {
    const key = parseInt(e.key) - 1;
    if (0 <= key && key < 5) {
      if (state.game!.isLocked[key]) sendMessage("unlockDice", { dice: key });
      else sendMessage("lockDice", { dice: key });
    }
  })
}

type DiceState = "RESULT" | "CUP";

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

  diceState: DiceState = "CUP";

  constructor(
    canvas: HTMLCanvasElement,
  ) {
    this.isDebug = false;

    this.world = new rapier.World({ x: 0.0, y: -16.0, z: 0.0 });
    this.world.timestep = 1 / (fps / 2) ; 

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
  }

  reset() {
    this.diceState = "CUP";
    this.cup.reset(() => {
      this.diceList.forEach((dice) => dice.encup())
    });
  }

  showResult(isLocked: IsLocked, result: DiceResult) {
    this.diceState = "RESULT";
    for (let i = 0; i < 5; i++) {
      const dice = this.diceList[i]
      dice.setState(isLocked[i], result[i]);
      dice.showResult();
    }
    this.cup.move();
  }

  encup() {
    this.diceState = "CUP";
    this.cup.reset(() => {
      this.diceList.forEach((dice) => {
        if (!dice.isLock) dice.encup();
      })
    });
  }

  update() {
    this.diceList.forEach((dice) => dice.step());
    this.cup.step();
  }

  step() {
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

  shake() {
    this.cup.shake();
  }

  roll(buffer: Float32Array, diceNum: number, isLocked: IsLocked, result: DiceResult) {
    this.cup.roll(() => {
      const diceFrames: Frame[][] = [];
      for (let i = 0; i < diceNum; i++) diceFrames.push([]);
      for (let i = 0; i < buffer.length / (7 * diceNum); i++) {
        for (let j = 0; j < diceNum; j++) {
          const start = i * 7 * diceNum + 7 * j;
          diceFrames[j].push({
            translation: { x: buffer[start], y: buffer[start + 1], z: buffer[start + 2] },
            rotation: { x: buffer[start + 3], y: buffer[start + 4], z: buffer[start + 5], w: buffer[start + 6] },
          })
        }
      }
      let frameIdx = 0;
      for (let i = 0; i < 5; i++) {
        const dice = this.diceList[i];
        dice.setState(isLocked[i], result[i])
        if (!isLocked[i]) {
          if (frameIdx === 0) {
            dice.animations.push({
              frames: diceFrames[frameIdx],
              callback: () => this.showResult(isLocked, result)
            })
          } else dice.animations.push({ frames: diceFrames[frameIdx] })
          frameIdx++;
        }
      }
    });
  }
}
