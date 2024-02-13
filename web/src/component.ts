import { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import { cupX, cupY } from "./constants";
import { random, vectorAdd } from "./utils";
import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Frame,
  moveAnimation,
  rollAnimation,
  shakeAnimation,
} from "./animation";
import { rapier } from "./rapier";
import { boardModel, cupModel, diceModel, groundTexture } from "./assets";
type RAPIER = typeof import("@dimforge/rapier3d-compat");

class Component {
  constructor() { }

  draw() { }
}

class Dice extends Component {
  world: World;
  num: number;
  rigidBody: RigidBody;
  collider: Collider;
  model: THREE.Group<THREE.Object3DEventMap>;

  constructor(
    world: World,
    scene: THREE.Scene,
    num: number,
  ) {
    super();

    this.world = world;
    this.num = num;
    const rigidBodyDesc = rapier.RigidBodyDesc.dynamic().setTranslation(
      cupX + 0.8 * random(),
      cupY + 1.5 + 0.4 * random(),
      0.8 * random(),
    );
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = rapier.ColliderDesc.cuboid(0.4, 0.4, 0.4).setMass(
      0.5,
    );
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    this.model = diceModel.scene.clone();
    scene.add(this.model);
  }

  update(showAnimation: boolean) {
    if (showAnimation) {
      return;
    }
    const translation = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
}

class Cup extends Component {
  rigidBody: RigidBody;
  cupCollider: Collider;
  topCollider: Collider;
  model: THREE.Group<THREE.Object3DEventMap>;
  frames: Frame[] = [];
  shake: boolean = false;
  shouldRoll: boolean = false;
  didRoll: boolean = false;
  didMove: boolean = false;

  constructor(world: World, scene: THREE.Scene) {
    super();

    const geometry: any = (cupModel.scene.children[0].children[0] as any).geometry;
    const vertex: Float32Array = geometry.attributes.position.array;
    const index: Uint32Array = Uint32Array.from(geometry.index.array);

    const rigidBodyDesc = rapier.RigidBodyDesc.dynamic()
      .lockTranslations()
      .lockRotations()
      .setTranslation(cupX, cupY, 0);
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = rapier.ColliderDesc.trimesh(vertex, index);
    const topColliderDesc = rapier.ColliderDesc.cuboid(2, 0.1, 2);
    topColliderDesc.setTranslation(0, 3.1, 0);
    this.cupCollider = world.createCollider(colliderDesc, this.rigidBody);
    this.topCollider = world.createCollider(topColliderDesc, this.rigidBody);

    this.model = cupModel.scene;
    scene.add(this.model);
  }

  update() {
    const translation = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

    if (!this.shouldRoll && this.shake && this.frames.length === 0) {
      this.frames.push(...shakeAnimation);
    }

    if (!this.didRoll && this.shouldRoll && this.frames.length === 0) {
      this.frames.push(...rollAnimation);
      this.shouldRoll = false;
      this.didRoll = true;
    }

    if (this.frames.length !== 0) {
      const frame = this.frames.pop();
      if (frame?.translation !== undefined) {
        this.rigidBody.setTranslation(
          vectorAdd(this.rigidBody.translation(), frame.translation),
          true,
        );
      }
      if (frame?.rotation !== undefined)
        this.rigidBody.setRotation(frame.rotation, true);
    }
  }

  startShake() {
    this.shake = true;
  }

  stopShake() {
    this.shake = false;
  }

  roll() {
    this.shouldRoll = true;
  }

  move() {
    this.didMove = true;
    this.frames.push(...moveAnimation);
  }
}

class Board extends Component {
  constructor(scene: THREE.Scene) {
    super();
    scene.add(boardModel.scene);
  }
}

class Ground extends Component {
  model: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    super();

    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10);
    const material = new THREE.MeshStandardMaterial({ map: groundTexture });
    this.model = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), material);
    this.model.rotateX((Math.PI * 3) / 2);
    this.model.position.set(0, -2, 0);
    scene.add(this.model);
  }
}

export { Component, Dice, Cup, Board, Ground };
