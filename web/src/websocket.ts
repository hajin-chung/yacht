import { encode, decode } from "@msgpack/msgpack";
import {
  RollData,
  DiceSelectData,
  SelectScoreData,
  UserState,
  GameState,
  SelectScorePayload,
} from "./types";
import {
  handleCancelQueue,
  handleDecup,
  handleEncup,
  handleGameStart,
  handleGameState,
  handleLockDice,
  handleMe,
  handleQueue,
  handleRoll,
  handleShake,
  handleUnlockDice,
  handleSelectScore,
} from "./controller";
import { formatJson } from "./utils";

export let socket: WebSocket;

export function initSocket() {
  socket = new WebSocket(`${import.meta.env.VITE_WEBSOCKET_URL}/ws`);
  socket.addEventListener("open", () => {
    sendMessage("me");
  });

  socket.addEventListener("message", async (e) => {
    const msg = await e.data.arrayBuffer();
    const decoded = decode(msg);
    console.log(`recv ${formatJson(decoded)}`);
    // TODO:  handle error
    handleMessage(decoded);
  });
}

function handleMessage(message: any) {
  if (typeof message.type !== "string") {
    console.log("unknown message type");
    return;
  }

  switch (message.type) {
    case "ping":
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
    case "encup":
      handleEncup();
      break;
    case "decup":
      handleDecup();
      break;
    case "roll": {
      const data: RollData = message.data;
      handleRoll(data);
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
    case "selectScore": {
      const data: SelectScoreData = message.data;
      handleSelectScore(data.playerId, data.selection, data.score);
      break;
    }
    default:
    // TODO: handle error
  }
}

export function sendMessage(type: "me"): void;
export function sendMessage(type: "queue"): void;
export function sendMessage(type: "queue"): void;
export function sendMessage(type: "cancelQueue"): void;
export function sendMessage(type: "gameState"): void;
export function sendMessage(type: "shake"): void;
export function sendMessage(type: "encup"): void;
export function sendMessage(type: "decup"): void;
export function sendMessage(type: "roll"): void;
export function sendMessage(type: "lockDice", data: DiceSelectData): void;
export function sendMessage(type: "unlockDice", data: DiceSelectData): void;
export function sendMessage(type: "selectScore", data: SelectScorePayload): void;

export function sendMessage(type: string, data?: any) {
  const message = { type, data };
  const encoded = encode(message);
  socket.send(encoded);
  console.log(`send ${formatJson(message)}`);
}
