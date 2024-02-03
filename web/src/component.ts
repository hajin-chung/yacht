import { RigidBody, World } from "@dimforge/rapier3d-compat";
import { cupX, cupY } from "./constants";
import { random } from "./utils";
import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
type RAPIER = typeof import("@dimforge/rapier3d-compat");

class Component {
  constructor() { }

  update() { }

  draw() { }
}

class Dice extends Component {
  num: number;
  rigidBody: RigidBody;
  model: THREE.Group<THREE.Object3DEventMap>;

  constructor(
    rapier: RAPIER,
    world: World,
    scene: THREE.Scene,
    gltf: GLTF,
    num: number,
  ) {
    super();

    this.num = num;
    const rigidBodyDesc = rapier.RigidBodyDesc.dynamic().setTranslation(
      cupX + 0.8 * random(),
      cupY + 1.5 + 0.4 * random(),
      0.8 * random(),
    );
    this.rigidBody = world.createRigidBody(rigidBodyDesc);
    const colliderDesc = rapier.ColliderDesc.cuboid(0.4, 0.4, 0.4);
    world.createCollider(colliderDesc, this.rigidBody);

    this.model = gltf.scene.clone();
    scene.add(this.model);
  }

  update() {
    const translation = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
}

class Cup extends Component {
  rigidBody: RigidBody;
  model: THREE.Group<THREE.Object3DEventMap>;

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
    const topColliderDesc = rapier.ColliderDesc.cuboid(2, 0.1, 2)
    topColliderDesc.setTranslation(0, 3.1, 0);
    world.createCollider(colliderDesc, this.rigidBody);
    world.createCollider(topColliderDesc, this.rigidBody);

    this.model = gltf.scene;
    scene.add(this.model);
  }

  update() {
    const translation = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();
    this.model.position.set(translation.x, translation.y, translation.z);
    this.model.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
}

class Board extends Component {
  model: THREE.Group<THREE.Object3DEventMap>;

  constructor(rapier: RAPIER, world: World, scene: THREE.Scene, gltf: GLTF) {
    super();

    { rapier; world }
    // const wallH = 4;
    // const left = rapier.ColliderDesc.cuboid(2.67, wallH, 0.12).setTranslation(0, 0, -2.79);
    // const right = rapier.ColliderDesc.cuboid(2.67,wallH, 0.1).setTranslation(0, 0, 2.79);
    // const top = rapier.ColliderDesc.cuboid(0.1, wallH, 2.67).setTranslation(-2.79, 0, 0);
    // const bottom = rapier.ColliderDesc.cuboid(0.1, wallH, 2.67).setTranslation(2.79, 0, 0);
    // world.createCollider(left);
    // world.createCollider(right);
    // world.createCollider(top);
    // world.createCollider(bottom);

    this.model = gltf.scene;
    scene.add(this.model);
  }
}

class Ground extends Component {
  model: THREE.Mesh;

  constructor(
    rapier: RAPIER,
    world: World,
    scene: THREE.Scene,
    texture: THREE.Texture,
  ) {
    super();
    const colliderDesc = rapier.ColliderDesc.cuboid(10, 1, 10).setTranslation(
      0,
      -1,
      0,
    );
    world.createCollider(colliderDesc);

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
