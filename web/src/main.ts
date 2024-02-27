import { initYacht, yacht } from "./yacht";
import { fps } from "./constants";
import { initRapier } from "./rapier";
import { loadAssets } from "./assets";
import { initWebsocket, sendMessage, socket } from "./websocket";
import { di } from "./utils";
import { hideLoading, initView, showLoading } from "./view";

async function init() {
  showLoading();
  await loadAssets();
  await initRapier();
  initYacht();
  await hideLoading();
  initWebsocket();
  socket.addEventListener("open", () => {
    sendMessage("me")
  })
  initView();
}

async function main() {
  await init();

  di("game").classList.remove("hide");
  // yacht.debug();

  setInterval(() => {
    yacht.update();
    yacht.draw();
  }, 1 / fps);
}

main();
