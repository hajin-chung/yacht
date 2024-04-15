import { initView } from "./view";
import { initSocket } from "./websocket";

function init() {
  initSocket();
  initView();
}

init();
