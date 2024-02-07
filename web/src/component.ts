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
type RAPIER = typeof import("@dimforge/rapier3d-compat");

class Component {
  constructor() { }

  draw() { }
}

class Dice extends Component {
  rapier: RAPIER;
  world: World;
  num: number;
  rigidBody: RigidBody;
  collider: Collider;
  model: THREE.Group<THREE.Object3DEventMap>;

  constructor(
    rapier: RAPIER,
    world: World,
    scene: THREE.Scene,
    gltf: GLTF,
    num: number,
  ) {
    super();

    this.rapier = rapier;
    this.world = world;
    this.num = num;
    const rigidBodyDesc = rapier.RigidBodyDesc.dynamic().setTranslation(
      cupX + 0.8 * random(),
      cupY + 1.5 + 0.4 * random(),
      0.8 * random(),
    );
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = this.rapier.ColliderDesc.cuboid(0.4, 0.4, 0.4).setMass(
      0.5,
    );
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    this.model = gltf.scene.clone();
    scene.add(this.model);
  }

  update(showAnimation: boolean) {
    if (showAnimation) {
      return
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

  constructor(rapier: RAPIER, world: World, scene: THREE.Scene, gltf: GLTF) {
    super();

    const geometry: any = (gltf.scene.children[0].children[0] as any).geometry;
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

    this.model = gltf.scene;
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
  model: THREE.Group<THREE.Object3DEventMap>;
  leftCollider: Collider;
  rightCollider: Collider;
  topCollider: Collider;
  bottomCollider: Collider;
  groundCollider: Collider;

  constructor(rapier: RAPIER, world: World, scene: THREE.Scene, gltf: GLTF) {
    super();

    const wallW = 5.35;
    const wallH = 3.0;
    const wallD = 0.2;

    const friction = 0.5;
    const restitution = 0.6;

    const top = rapier.ColliderDesc.cuboid(wallW / 2.0, wallH, wallD / 2.0)
      .setTranslation(0.0, wallH / 2.0, -wallW / 2.0 - wallD / 2.0)
      .setFriction(friction)
      .setFrictionCombineRule(rapier.CoefficientCombineRule.Max)
      .setRestitution(restitution);
    const bottom = rapier.ColliderDesc.cuboid(wallW / 2.0, wallH, wallD / 2.0)
      .setTranslation(0.0, wallH / 2.0, wallW / 2.0 + wallD / 2.0)
      .setFriction(friction)
      .setFrictionCombineRule(rapier.CoefficientCombineRule.Max)
      .setRestitution(restitution);
    const left = rapier.ColliderDesc.cuboid(wallD / 2.0, wallH, wallW / 2.0)
      .setTranslation(-wallW / 2.0 - wallD / 2.0, wallH / 2.0, 0.0)
      .setFriction(friction)
      .setFrictionCombineRule(rapier.CoefficientCombineRule.Max)
      .setRestitution(restitution);
    const right = rapier.ColliderDesc.cuboid(wallD / 2.0, wallH, wallW / 2.0)
      .setTranslation(wallW / 2.0 + wallD / 2.0, wallH / 2.0, 0.0)
      .setFriction(friction)
      .setFrictionCombineRule(rapier.CoefficientCombineRule.Max)
      .setRestitution(restitution);
    const ground = rapier.ColliderDesc.cuboid(10.0, 1.0, 10.0)
      .setTranslation(0, -1.0, 0)
      .setFriction(friction)
      .setFrictionCombineRule(rapier.CoefficientCombineRule.Max)
      .setRestitution(restitution);

    this.leftCollider = world.createCollider(left);
    this.rightCollider = world.createCollider(right);
    this.topCollider = world.createCollider(top);
    this.bottomCollider = world.createCollider(bottom);
    this.groundCollider = world.createCollider(ground);

    this.model = gltf.scene;
    scene.add(this.model);
  }
}

class Ground extends Component {
  model: THREE.Mesh;

  constructor(scene: THREE.Scene, texture: THREE.Texture) {
    super();

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    this.model = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), material);
    this.model.rotateX((Math.PI * 3) / 2);
    this.model.position.set(0, -2, 0);
    scene.add(this.model);
  }
}

export { Component, Dice, Cup, Board, Ground };
