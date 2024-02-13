import { Yacht } from "./yacht";
import { fps } from "./constants";
import { initRapier } from "./rapier";
import { loadAssets } from "./assets";

async function init() {
  await loadAssets();
  await initRapier();
}

async function main() {
  await init();

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const yacht = new Yacht(canvas);
  // yacht.debug();

  setInterval(() => {
    yacht.update();
    yacht.draw();
  }, 1 / fps);

  document.addEventListener("keydown", (evt) => {
    if (evt.key === " ") yacht.cup.startShake();
  });

  document.addEventListener("keyup", (evt) => {
    if (evt.key === " ") yacht.cup.stopShake();
  });

  const shakeButton = document.getElementById("shake")!;
  shakeButton.onmousedown = () => yacht.cup.startShake();
  shakeButton.onmouseup = () => yacht.cup.stopShake();
  shakeButton.ontouchstart = () => yacht.cup.startShake();
  shakeButton.ontouchend = () => yacht.cup.stopShake();

  const rollButton = document.getElementById("roll")!;
  rollButton.onclick = () => yacht.cup.roll();
  rollButton.ontouchstart = () => yacht.cup.roll();
}

main();
