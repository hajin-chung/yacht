import * as THREE from "three";
import { $, cupX, cupY, fps, generateRandomDicePose } from "./utils";
import { GLTF } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { boardModel, cupModel, diceModel, groundTexture } from "./assets";
import { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import { rapier } from "./rapier";
import { Keyframe, Pose, interpolate } from "./animation";

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

class Cup {
  rigidBody: RigidBody;
  cupCollider: Collider;
  topCollider: Collider;
  model: THREE.Group<THREE.Object3DEventMap>;
  keyframes: Keyframe[] = [];
  step: number = 0;
  pose: Pose;

  constructor(scene: THREE.Scene, world: World) {
    this.model = cupModel.scene;
    scene.add(this.model);

    const geometry: any = (cupModel.scene.children[0].children[0] as any)
      .geometry;
    const vertex: Float32Array = new Float32Array(
      geometry.attributes.position.array,
    );
    for (let i = 0; i < vertex.length; i += 3) {
      if (vertex[i + 1] > 2) vertex[i + 1] = 10.0;
    }
    const index: Uint32Array = Uint32Array.from(geometry.index.array);

    const rigidBodyDesc = rapier.RigidBodyDesc.dynamic()
      .lockTranslations()
      .lockRotations()
      .setTranslation(cupX, cupY, 0);
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = rapier.ColliderDesc.trimesh(vertex, index);
    this.cupCollider = world.createCollider(colliderDesc, this.rigidBody);

    const topColliderDesc = rapier.ColliderDesc.cuboid(2, 0.1, 2);
    topColliderDesc.setTranslation(0, -0.1, 0);
    this.topCollider = world.createCollider(topColliderDesc, this.rigidBody);

    this.pose = {
      translation: { x: cupX, y: cupY, z: 0 },
      rotation: { w: 1, x: 0, y: 0, z: 0 },
    };
  }

  update() {
    this.pose = {
      translation: this.rigidBody.translation(),
      rotation: this.rigidBody.rotation(),
    };

    if (this.keyframes.length > 0) {
      const keyframe = this.keyframes[0];
      if (keyframe.type === "animate") {
        if (keyframe.steps < this.step) {
          this.step = 1;
          this.keyframes.splice(0, 1);
          if (keyframe.callback) keyframe.callback();
        } else {
          this.pose = interpolate(keyframe, this.step);
          this.step++;
        }
      } else if (keyframe.type === "continue") {
        this.keyframes[0] = {
          type: "animate",
          start: this.pose,
          end: keyframe.end,
          steps: keyframe.steps,
          callback: keyframe.callback,
        };
      } else if (keyframe.type === "pose") {
        this.pose = keyframe.pose;
        this.keyframes.splice(0, 1);
        if (keyframe.callback) keyframe.callback();
      } else if (keyframe.type === "wait") {
        if (keyframe.steps < this.step) {
          this.step = 1;
          this.keyframes.splice(0, 1);
          if (keyframe.callback) keyframe.callback();
        } else {
          this.step++;
        }
      }
    }

    const { translation, rotation } = this.pose;
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    this.rigidBody.setTranslation(translation, false);
    this.rigidBody.setRotation(rotation, false);
  }
}

class Dice {
  model: THREE.Group<THREE.Object3DEventMap>;
  rigidBody: RigidBody;
  collider: Collider;
  idx: number;
  keyframes: Keyframe[] = [];
  step: number = 0;
  simulate: boolean = true;
  pose: Pose;

  constructor(scene: THREE.Scene, world: World, idx: number) {
    this.model = diceModel.scene.clone(true);
    this.idx = idx;
    scene.add(this.model);

    this.pose = generateRandomDicePose(idx);
    const rigidBodyDesc = rapier.RigidBodyDesc.dynamic().setTranslation(
      this.pose.translation.x,
      this.pose.translation.y,
      this.pose.translation.z,
    );
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = rapier.ColliderDesc.cuboid(0.4, 0.4, 0.4).setMass(1000);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);
  }

  update() {
    if (this.simulate) {
      this.pose = {
        translation: this.rigidBody.translation(),
        rotation: this.rigidBody.rotation(),
      };
    }

    if (this.keyframes.length > 0) {
      const keyframe = this.keyframes[0];

      if (keyframe.type === "animate") {
        if (keyframe.steps < this.step) {
          this.step = 1;
          this.keyframes.splice(0, 1);
          if (keyframe.callback) keyframe.callback();
        } else {
          this.pose = interpolate(keyframe, this.step);
          this.step++;
        }
      } else if (keyframe.type === "continue") {
        this.keyframes[0] = {
          type: "animate",
          start: this.pose,
          end: keyframe.end,
          steps: keyframe.steps,
          callback: keyframe.callback,
        };
      } else if (keyframe.type === "pose") {
        this.pose = keyframe.pose;
        this.keyframes.splice(0, 1);
        if (keyframe.callback) keyframe.callback();
      } else if (keyframe.type === "wait") {
        if (keyframe.steps < this.step) {
          this.step = 1;
          this.keyframes.splice(0, 1);
          if (keyframe.callback) keyframe.callback();
        } else {
          this.step++;
        }
      }
    }

    const { translation, rotation } = this.pose;
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    this.collider.setTranslation(translation)
    this.collider.setRotation(rotation)
    this.rigidBody.setTranslation(translation, true);
    this.rigidBody.setRotation(rotation, true);

    if (!this.simulate) {
      this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, false);
      this.rigidBody.setAngvel({ x: 0, y: 0, z: 0}, false);
    }
  }
}

class Board {
  model: GLTF;
  constructor(scene: THREE.Scene) {
    this.model = boardModel;
    scene.add(this.model.scene);
  }
}

class Ground {
  model: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10);
    const material = new THREE.MeshStandardMaterial({ map: groundTexture });
    this.model = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), material);
    this.model.rotateX((Math.PI * 3) / 2);
    this.model.position.set(0, -2, 0);
    scene.add(this.model);
  }
}

export function initScene() {
  scene = new Scene();
}
