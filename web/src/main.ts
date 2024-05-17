import { initSocket } from "./websocket";
import { loadAssets } from "./assets";
import { hideLoading, initView, showIdle, showLoading } from "./view";
import { initRapier } from "./rapier";
import { initScene } from "./scene";
import { checkMobile } from "./mobile";

// init threejs
// init rapier
// init 3d objects
// start render loop!
async function init() {
  showLoading();

  checkMobile();
  initView();
  await loadAssets();
  await initRapier();
  initSocket();
  initScene();

  hideLoading();
  showIdle();
}

init();
