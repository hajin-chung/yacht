import { createSignal } from "solid-js";
import msgpack from "messagepack";

const SOCKET_OPEN = "OPEN";
const SOCKET_CLOSE = "CLOSE";

const [socketStatus, setSocketStatus] = createSignal(SOCKET_CLOSE);
export { socketStatus };

export let socket: WebSocket;

export async function initWebsocket() {
  socket = new WebSocket("ws://localhost:4434/ws");

  socket.addEventListener("open", () => {
    setSocketStatus(SOCKET_OPEN)
    log("socket open")
  })

  socket.addEventListener("close", () => {
    setSocketStatus(SOCKET_CLOSE)
    log("socket closed")
  })

  socket.addEventListener("message", async (evt) => {
    const msg = await evt.data.arrayBuffer();
    const decoded = formatJson(msgpack.decode(msg))
    log(`recv: ${decoded}`)
  })

  socket.addEventListener("error", (evt) => {
    log(`socket error: ${JSON.stringify(evt)}`)
  })
}

function log(msg: string) {
  console.log(msg);
}

function formatJson(json: any) {
  let formattedJson = JSON.stringify(json, null, 2);

  formattedJson = formattedJson.replace(/(\[[\d,\s]+?\])/g, function(match) {
    return match.replace(/\s+/g, ' ');
  });

  return formattedJson;
}
