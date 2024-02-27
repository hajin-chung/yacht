import { decode, encode } from "messagepack";
import {
  GameState,
  UserState,
  handleCancelQueue,
  handleGameStart,
  handleGameState,
  handleLockDice,
  handleMe,
  handleQueue,
  handleRoll,
  handleSelectScore,
  handleShake,
  handleUnlockDice,
} from "./controller";

export let socket: WebSocket;

export function initWebsocket() {
  socket = new WebSocket("ws://localhost:4434/ws");

  socket.addEventListener("open", () => {
    console.log("socket open");
  });

  socket.addEventListener("close", () => {
    console.log("socket closed");
  });

  socket.addEventListener("message", async (evt) => {
    const msg = await evt.data.arrayBuffer();
    const decoded = decode(msg);
    console.log("recv", decoded);
    handleMessage(decoded);
  });

  socket.addEventListener("error", (evt) => {
    console.log(`socket error: ${JSON.stringify(evt)}`);
  });
}

export function sendMessage(type: string, data?: any) {
  const message = { type, data };
  const encoded = encode(message);
  socket.send(encoded);
}

export type RollData = {
  result: number[];
  buffer: Float32Array;
};

export type SelectScoreData = {
  selection: number;
};

export type DiceSelectData = {
  dice: number;
};

function handleMessage(message: any) {
  if (typeof message.type !== "string") {
    console.log("unknown message type");
    return;
  }

  switch (message.type) {
    case "ping":
      console.log("recieved ping");
      break;
    case "me": {
      const data: UserState = message.data;
      handleMe(data);
      break;
    }
    case "queue":
      handleQueue();
      break;
    case "cancelQueue":
      handleCancelQueue();
      break;
    case "gameStart":
      const gameId: string = message.data.gameId;
      handleGameStart(gameId);
      break;
    case "gameState": {
      const data: GameState = message.data.state;
      handleGameState(data);
      break;
    }
    case "shake":
      handleShake();
      break;
    case "roll": {
      const data: RollData = message.data;
      handleRoll(data);
      break;
    }
    case "selectScore": {
      // const data: SelectScoreData = message.data
      handleSelectScore();
      break;
    }
    case "lockDice": {
      const data: DiceSelectData = message.data;
      handleLockDice(data.dice);
      break;
    }
    case "unlockDice": {
      const data: DiceSelectData = message.data;
      handleUnlockDice(data.dice);
      break;
    }
    default:
    // TODO: handle error
  }
}
