import { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import { cupX, cupY } from "./constants";
import { randomDicePosition } from "./utils";
import * as THREE from "three";
import { rapier } from "./rapier";
import { boardModel, cupModel, diceModel, groundTexture } from "./assets";
import { Frame, rollAnimation, shakeAnimation, Animation, generateResult, generateLock, generateEncup, generateCupReset, generateCupMove } from "./animation";
import { Callback } from "./types";

class Dice {
  world: World;
  num: number;
  rigidBody: RigidBody;
  collider: Collider;
  model: THREE.Group<THREE.Object3DEventMap>;
  scene: THREE.Scene;
  animations: Animation[] = [];

  simulate: boolean = true;
  isLock: boolean = false;
  result: number = 1;

  constructor(
    world: World,
    scene: THREE.Scene,
    num: number,
  ) {
    this.world = world;
    this.scene = scene;
    this.num = num;
    const pos = randomDicePosition();
    const rigidBodyDesc = rapier.RigidBodyDesc.dynamic().setTranslation(
      pos.x, pos.y, pos.z
    );
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = rapier.ColliderDesc.cuboid(0.4, 0.4, 0.4).setMass(
      10
    );
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    this.model = diceModel.scene.clone();
    scene.add(this.model);
  }

  step() {
    if (this.animations.length === 0) {
      if (this.simulate) {
        const translation = this.rigidBody.translation();
        const rotation = this.rigidBody.rotation();
        this.model.position.set(translation.x, translation.y, translation.z);
        this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
      return
    }

    const animation = this.animations[0];
    if (animation.frames.length === 0) {
      if (animation.callback) animation.callback();
      this.animations.shift();
    } else {
      const frame = animation.frames.shift()!;
      if (frame.translation) {
        this.model.position.set(
          frame.translation.x,
          frame.translation.y,
          frame.translation.z
        );
      }
      if (frame.rotation) {
        this.model.quaternion.set(
          frame.rotation.x,
          frame.rotation.y,
          frame.rotation.z,
          frame.rotation.w,
        );
      }
    }
  }

  setState(isLock: boolean, result: number) {
    this.isLock = isLock;
    this.result = result;
  }

  showResult() {
    this.simulate = false;
    if (this.isLock) this.lock();
    else this.unlock();
  }

  encup() {
    const currentFrame: Frame = {
      translation: this.model.position,
      rotation: this.model.quaternion,
    }
    const frames = generateEncup(currentFrame, this.result);
    this.animations.push({
      frames,
      callback: () => this.simulate = true,
    })

    const pos = randomDicePosition();
    this.rigidBody.setTranslation(pos, false);
  }

  lock() {
    this.simulate = false;
    this.isLock = true;
    const currentFrame: Frame = {
      translation: this.model.position,
      rotation: this.model.quaternion,
    }
    const frames = generateLock(currentFrame, this.result, this.num);
    this.animations.push({ frames })
  }

  unlock() {
    this.simulate = false;
    this.isLock = false;
    const currentFrame: Frame = {
      translation: this.model.position,
      rotation: this.model.quaternion,
    }
    const frames = generateResult(currentFrame, this.result, this.num);
    this.animations.push({ frames: frames });
  }

  onMouseEnter() {
  }

  onMouseLeave() {
  }

  onClick() {
  }
}

class Cup {
  rigidBody: RigidBody;
  cupCollider: Collider;
  topCollider: Collider;
  model: THREE.Group<THREE.Object3DEventMap>;
  shakeCount: number = 0;
  animations: Animation[] = [];

  constructor(world: World, scene: THREE.Scene) {
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

  step() {
    const translation = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

    if (this.animations.length === 0) return

    const animation = this.animations[0];
    if (animation.frames.length === 0) {
      if (animation.callback) animation.callback();
      this.animations.shift();
    } else {
      const frame = animation.frames.shift()!;
      if (frame.translation) {
        this.rigidBody.setTranslation(frame.translation, false);
      }
      if (frame.rotation) {
        this.rigidBody.setRotation(frame.rotation, false);
      }
    }
  }

  roll(callback: Callback) {
    this.animations.push({
      frames: rollAnimation,
      callback: () => {
        callback();
        this.move();
      },
    })
  }

  shake(callback?: Callback) {
    this.animations.push({
      frames: [...shakeAnimation],
      callback,
    })
  }

  move() {
    const currentFrame: Frame = {
      translation: this.model.position,
      rotation: this.model.quaternion,
    };
    const frames = generateCupMove(currentFrame);
    this.animations.push({ frames })
  }

  reset(callback?: Callback) {
    const currentFrame: Frame = {
      translation: this.model.position,
      rotation: this.model.quaternion,
    }
    const frames = generateCupReset(currentFrame);
    this.animations.push({
      frames,
      callback,
    })
  }
}

class Board {
  constructor(scene: THREE.Scene) {
    scene.add(boardModel.scene);
  }
}

class Ground {
  model: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10);
    const material = new THREE.MeshStandardMaterial({ map: groundTexture });
    this.model = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), material);
    this.model.rotateX((Math.PI * 3) / 2);
    this.model.position.set(0, -2, 0);
    scene.add(this.model);
  }
}

export { Dice, Cup, Board, Ground };
