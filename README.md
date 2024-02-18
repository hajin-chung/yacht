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
- [ ] authorization & authentication
- [ ] private & public room
- [ ] database management
- [ ] client side game logic
- [ ] various game effects
- [ ] frontend stuff

## server architecture 

1. implement basic websocket hub.
2. try docker, k8s, rabbitMQ, ...

for database seperate user and game datas

one sqlite3 user db and redis for game data

### game state

```typescript
{
    "id": string,
    "playerId": [string, string],
    "status": "PLAYING" | "DONE",
    "selected": [
        boolean[],
        boolean[],
    ],
    "scores": [
        number[],
        number[],
    ],

    // num of current turn
    "turn": number,
    "leftRolls": number,

    // index of dice locked
    "isLocked": [boolean, boolean, boolean, boolean, boolean],

    // dice results
    "dice": [number, number, number, number, number]
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
        "selection": /* score name */
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

### client implementations

based on user state there are largely three status IDLE, QUEUE, PLAYING
so handle that.

when user is in PLAYING state handle game related messages
if current turn is the player's turn,
the player can either roll, shake, lockDice, unlockDice, selectScore.
if roll update stage to ROLL, if shake, lockDice or unlockDice broadcast and 
if selectScore update turn.
else if current turn is not the player's,
just show roll, shake, lockDice, unlockDice animations

SHAKE -> ROLL -> RESULT

in RESULT player can lock, unlock,  
