import { initYacht, yacht } from "./yacht";
import { fps } from "./constants";
import { initRapier } from "./rapier";
import { loadAssets } from "./assets";
import { initWebsocket, sendMessage, socket } from "./websocket";
import { di } from "./utils";
import { hideLoading, showLoading } from "./view";

async function init() {
  showLoading();
  await loadAssets();
  await initRapier();
  initYacht();
  initWebsocket();
  socket.addEventListener("open", () => {
    sendMessage("me")
  })
  await hideLoading();
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
