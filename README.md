# yacht

realtime 3d secure yacht dice game

## goals

- [x] basic 3d rendering structure
- [x] basic box rendering
- [x] basic ambient & directional light
- [x] basic cup rendering
- [x] dice texture
- [x] board texture
- [x] cup texture
- [x] client side 3d physics simulation
- [x] dice result detection
- [x] server side 3d physics simulation
- [x] sending server side simulated dice rotations to client side
- [x] match making
- [x] server side game logic
- [x] client side game logic
- [x] handle game end
- [x] dice select effect 
- [x] combination made effect
- [ ] authorization & authentication
- [ ] private & public room
- [ ] database management
- [ ] frontend stuff
- [ ] show calculated scores of current dice result

## server architecture 

the server is written in go and is a simple websocket server
every game data is stored in redis

### state

```typescript
type GameState = {
    "id": string,
    "playerIds": string[],
    "status": "PLAYING" | "DONE",

    // keep record of selected scores
    "selected": boolean[][],
    "scores": boolean[][]
    // num of current turn
    "turn": number,
    "leftRolls": number,

    // is dice in cup
    "inCup": boolean,

    // index of dice locked
    "isLocked": [boolean, boolean, boolean, boolean, boolean],

    // dice results
    "dice": [number, number, number, number, number]
}

type UserState = {
    id: string;
    status: "IDLE" | "QUEUE" | "PLAYING";
    gameId: string;
}
```

## messages

since we have to send position & rotation buffer which is quite big through websocket,
every message is in a binary using MessagePack for serialization and deserialization

### client sent messages

```typescript
{ "type": "ping" }

{ "type": "me" }

{ "type": "queue" }

{ "type": "cancelQueue" }

{ 
    "type": "createRoom", 
    "data": {
        "title": string, 
        "password": string | undefined 
    }
}

{ 
    "type": "joinRoom", 
    "data": {
        "roomId": string, 
        "password": string | undefined 
    }
}

{ "type": "gameState" }

{ "type": "shake" }

{ "type": "encup" }

{ "type": "decup" }

{ "type": "roll" }

{
    "type": "lockDice"
    "data": {
        "dice": number /* index of dice */
    }
}

{
    "type": "unlockDice"
    "data": {
        "dice": number /* index of dice */
    }
}

{
    "type": "selectScore"
    "data": {
        "selection": number /* score index */
    }
}
```

### server sent messages

```typescript
{ "type": "ping", "error": boolean }

{ 
    "type": "me", 
    "data": {
        "id": string,
        "status": string,
        "gameId": string | undefined
    }
}

{ "type": "queue", "error": boolean }

{ "type": "cancelQueue", "error": boolean }

{ 
    "type": "createRoom", 
    "data": {
        "title": string, 
    },
    "error": true | false
}

{ 
    "type": "joinRoom", 
    "data": {
        "roomId": string, 
    },
    "error": true | false
}

{ 
    "type": "gameState", 
    "data": {
        "state": GameState 
    },
    "error": true | false
}

{
    "type": "gameStart",
    "data": {
        "gameId": string
    },
    "error": true | false
}

{ "type": "shake", "error": true | false }

{ "type": "encup", "error": true | false }

{ "type": "decup", "error": true | false }

{ 
    "type": "roll", 
    "data": {
        "result": number[],
        "buffer": Float32Array 
    },
    "error": true | false
}

{
    "type": "lockDice"
    "data": {
        "dice": /* index of dice */
    },
    "error": true | false
}

{
    "type": "unlockDice"
    "data": {
        "dice": /* index of dice */
    },
    "error": true | false
}

{
    "type": "selectScore"
    "data": {
        "playerId": /* player id */
        "selection": /* score name */
        "score": /* score number */
    },
    "error": true | false
}

{
    "type": "gameEnd",
    "data": {
        "gameId": string
    },
    "error": true | false
}

{
    "type": "error",
    "error": true | false
}
```
