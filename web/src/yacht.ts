import { World } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Board, Cup, Dice, Ground } from "./component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { fps } from "./constants";
import { rapier } from "./rapier";
import { Frame, generateLock, generateResult } from "./animation";
import { IsLocked, state } from "./controller";

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

  showResult() {
    for (let i = 0; i < 5; i++) {
      const dice = this.diceList[i]
      const currentFrame: Frame = {
        translation: dice.model.position,
        rotation: dice.model.quaternion
      }
      if (!dice.isLock) {
        const frames = generateResult(currentFrame, state.game!.dice[i], i);
        dice.animate(frames);
      } else {
        const frames = generateLock(currentFrame, state.game!.dice[i], i);
        dice.animate(frames);
      }
    }
  }

  update() {
    this.diceList.forEach((dice) => dice.step());
    this.cup.step();
    this.world.step();

    if (this.stage === "ROLL") {
      const didRollEnd = this.diceList.reduce(
        (prev, curr) => prev && curr.frames.length === 0, true)
      if (didRollEnd) {
        this.showResult();
        this.stage = "RESULT";
      }
    } else if (this.stage === "RESULT") {
      // handle mouse events
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

  shake() {
    this.cup.shakeCount++;
  }

  roll(buffer: Float32Array, diceNum: number, isLocked: IsLocked) {
    this.cup.callback = () => {
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
      this.stage = "ROLL";
      let frameIdx = 0;
      for (let i = 0; i < 5; i++) {
        if (!isLocked[i]) {
          this.diceList[i].simulate = false;
          this.diceList[i].animate(diceFrames[frameIdx]);
          frameIdx++;
        }
      }
    }
    this.cup.roll();
  }
}
