import { World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fps } from "./constants";
import { rapier } from "./rapier";
import { Frame } from "./animation";

export let yacht: Yacht;

export function initYacht() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  yacht = new Yacht(canvas);
}

type YachtStage = "SHAKE" | "ROLL" | "RESULT";

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

  diceRollFrames: Frame[][] = [];
  pressingShake: boolean = false;
  stage: YachtStage;

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

    this.stage = "SHAKE";
  }

  showDice(isLocked: [boolean, boolean, boolean, boolean, boolean]) {
    for (let i = 0; i < 5; i++) {
      if (isLocked[i]) {
        // this.diceList[i].showLock();
      } else {
        this.diceList[i].remove();
        const dice = new Dice(this.world, this.scene, i);
        this.diceList[i] = dice;
      }
    }
  }

  update() {
    if (this.stage === "ROLL") {
      if (this.diceRollFrames.length === 0 || this.diceRollFrames[0].length === 0) {
        this.stage = "RESULT";
        return;
      }

      let frameIdx = 0;
      for (let i = 0; i < 5; i++) {
        const dice = this.diceList[i];
        if (dice.isLock) continue;

        const frame = this.diceRollFrames[frameIdx].shift()!;
        dice.setFrame(frame);

        frameIdx++;
      }
    } else if (this.stage === "SHAKE") {
      this.diceList.forEach((dice) => dice.step());
    } else if (this.stage === "RESULT") {
      // show result;
    }
    this.cup.step();
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
    this.cup.shakeCount++;
  }

  roll(buffer: Float32Array, diceNum: number, result: number[]) {
    this.cup.roll();
    this.cup.callback = () => {
      this.diceRollFrames = [];
      for (let i = 0; i < diceNum; i++) this.diceRollFrames.push([]);
      for (let i = 0; i < buffer.length / (7 * diceNum); i++) {
        for (let j = 0; j < diceNum; j++) {
          const start = i * 7 * diceNum + 7 * j;
          this.diceRollFrames[j].push({
            translation: { x: buffer[start], y: buffer[start + 1], z: buffer[start + 2] },
            rotation: { x: buffer[start + 3], y: buffer[start + 4], z: buffer[start + 5], w: buffer[start + 6] },
          })
        }
      }
      this.stage = "ROLL";
    }
  }
}
