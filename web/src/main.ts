import { Yacht } from "./yacht";
import { fps } from "./constants";
import { initRapier } from "./rapier";
import { loadAssets } from "./assets";
import { initWebsocket, sendMessage, socket } from "./websocket";
import { hideLoading, showLoading } from "./ui";
import { di } from "./utils";

async function init() {
  showLoading();
  await loadAssets();
  await initRapier();
  initWebsocket();
  socket.addEventListener("open", () => {
    sendMessage("me")
  })
  await hideLoading();
}

async function main() {
  await init();

  di("game").classList.remove("hide");
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const yacht = new Yacht(canvas);
  // yacht.debug();

  setInterval(() => {
    yacht.update();
    yacht.draw();
  }, 1 / fps);
}

main();
