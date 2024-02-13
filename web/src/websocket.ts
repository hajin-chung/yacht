import { decode, encode } from "messagepack";
import { formatJson, log } from "./utils";
import { GameState, UserState, handleCancelQueue, handleGameState, handleMe, handleQueue } from "./state";

export let socket: WebSocket;

export function initWebsocket() {
  socket = new WebSocket("ws://localhost:4434/ws");

  socket.addEventListener("open", () => {
    log("socket open")
  })

  socket.addEventListener("close", () => {
    log("socket closed")
  })

  socket.addEventListener("message", async (evt) => {
    const msg = await evt.data.arrayBuffer();
    const decoded = decode(msg)
    handleMessage(decoded)
    log(`recv: ${formatJson(decoded)}`)
  })

  socket.addEventListener("error", (evt) => {
    log(`socket error: ${JSON.stringify(evt)}`)
  })
}

export function sendMessage(type: string, data?: any) {
  const message = { type, data };
  const encoded = encode(message);
  socket.send(encoded)
}

function handleMessage(message: any) {
  if (typeof message.type !== "string") {
    log("unknown message type");
    return;
  }

  switch (message.type) {
    case "ping":
      log("recieved ping")
      break;
    case "me": {
      const data: UserState = message.data
      handleMe(data)
      break;
    }
    case "queue":
      handleQueue()
      break;
    case "cancelQueue":
      handleCancelQueue()
      break;
    case "gameStart":
      // TODO:
    case "gameState": {
      const data: GameState = message.data
      handleGameState(data)
      break;
    }
    default:
      // TODO: handle error
  }
}
