import { initYacht, yacht } from "./yacht";
import { initRapier } from "./rapier";
import { loadAssets } from "./assets";
import { initWebsocket, sendMessage, socket } from "./websocket";
import { di } from "./utils";
import { hideLoading, initView, showLoading } from "./view";
import { fps } from "./constants";

async function init() {
  showLoading();
  await loadAssets();
  await initRapier();
  initYacht();
  await hideLoading();
  initWebsocket();
  socket.addEventListener("open", () => {
    sendMessage("me");
  });
  initView();
}

async function main() {
  await init();

  di("game").classList.remove("hide");
  // yacht.debug();

  requestAnimationFrame(loop);
}

let lastTime: number | undefined;
let acc = 0;
function loop(currentTime: number) {
  requestAnimationFrame(loop);
  if (lastTime === undefined) {
    lastTime = currentTime;
    yacht.update();
    yacht.draw();
  } else {
    const delta = currentTime - lastTime;
    const calculatedFps = 1000 / delta;
    di("fps").innerText = `${calculatedFps.toPrecision(4)} | ${fps}`;
    lastTime = currentTime;

    acc += delta;
    while (acc > 1000 / fps) {
      acc -= 1000 / fps;
      yacht.step();
      yacht.update();
      yacht.draw();
    }
  }
}

main();
