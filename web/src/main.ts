import { initSocket } from "./websocket";
import { loadAssets } from "./assets";
import { hideLoading, initView, showIdle, showLoading } from "./view";
import { initRapier } from "./rapier";

// init threejs
// init rapier
// init 3d objects
// start render loop!
async function init() {
  showLoading();

  initView();
  await loadAssets();
  await initRapier();
  initSocket();

  hideLoading();
  showIdle();
}

init();
