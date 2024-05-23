import * as THREE from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import { rapier } from "./rapier";
import { cupX, cupY, generateRandomDicePose } from "./utils";
import { boardModel, cupModel, diceModel, groundTexture } from "./assets";
import { Keyframe, Pose, animate } from "./animation";

export class Cup {
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

    animate(this);

    const { translation, rotation } = this.pose;
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    this.rigidBody.setTranslation(translation, false);
    this.rigidBody.setRotation(rotation, false);
  }
}

export class Dice {
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
    const colliderDesc = rapier.ColliderDesc.cuboid(0.4, 0.4, 0.4)
      .setMass(2000)
      .setActiveEvents(rapier.ActiveEvents.COLLISION_EVENTS);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);
  }

  update() {
    if (this.simulate) {
      this.pose = {
        translation: this.rigidBody.translation(),
        rotation: this.rigidBody.rotation(),
      };
    }

    animate(this);

    const { translation, rotation } = this.pose;
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    this.collider.setTranslation(translation);
    this.collider.setRotation(rotation);
    this.rigidBody.setTranslation(translation, true);
    this.rigidBody.setRotation(rotation, true);

    if (!this.simulate) {
      this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, false);
      this.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, false);
    }
  }
}

export class Board {
  model: GLTF;
  constructor(scene: THREE.Scene) {
    this.model = boardModel;
    scene.add(this.model.scene);
  }
}

export class Ground {
  model: THREE.Mesh;
  collider: Collider;
  rigidBody: RigidBody;

  constructor(scene: THREE.Scene, world: World) {
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10);
    const material = new THREE.MeshStandardMaterial({ map: groundTexture });
    this.model = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), material);
    this.model.rotateX((Math.PI * 3) / 2);
    this.model.position.set(0, -2, 0);
    scene.add(this.model);

    const rigidBodyDesc = rapier.RigidBodyDesc.fixed()
    this.rigidBody = world.createRigidBody(rigidBodyDesc)
    this.rigidBody.setTranslation({ x: 0, y: -0.7, z: 0 }, false);
    const colliderDesc = rapier.ColliderDesc.cuboid(10, 1, 10);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);
  }
}
