# yacht

realtime 3d secure yacht dice game

# goals

- [x] basic 3d rendering structure
- [x] basic box rendering
- [x] basic ambient & directional light
- [x] basic cup rendering
- [x] dice texture
- [x] board texture
- [x] cup texture
- [x] client side 3d physics simulation
- [ ] authorization & authentication
- [ ] match making
- [ ] private & public room
- [ ] server side game logic
- [ ] database management
- [ ] dice result detection
- [ ] client side game logic
- [ ] server side 3d physics simulation
- [ ] sending server side simulated dice rotations to client side
- [ ] various game effects
- [ ] frontend stuff

# server architecture 

1. implement basic websocket hub.
2. try docker, k8s, rabbitMQ, ...

for database seperate user and game datas

one sqlite3 user db and redis for game data

# game state

```typescript
{
    "id": string,
    "playerId": [string, string],
    "status": "PLAYING" | "DONE",
    "scores": [
        [number],
        [number],
    ],

    // index of player in turn
    "turn": number,
    "leftRolls": number,

    // index of dice locked
    "lockedDice": [number],

    // dice results
    "dice": [number]
}
```

# messages

## client sent messages

```typescript
{ "type": "ping" }

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
        "dice": /* index of dice */
    }
}

{
    "type": "unlockDice"
    "data": {
        "dice": /* index of dice */
    }
}

{
    "type": "selectScore"
    "data": {
        "selection": /* score name */
    }
}
```

## server sent messages

1. json messages

```typescript
{ "type": "ping", "error": true | false }

{ "type": "queue", "error": true | false }

{ "type": "cancelQueue", "error": true | false }

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
    }
}

{ "type": "shake", "error": true | false }

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
        "state": GameState
    },
    "error": true | false
}

{
    "type": "gameStart",
    "data": {
        "state": GameState,
    },
    "error": true | false
}

{
    "type": "gameEnd",
    "data": {
        "state": GameState,
    },
    "error": true | false
}

{
    "type": "error",
    "error": true | false
}
```

2. binary messages

for type "roll" message send float32 buffer of rolling animation 
followed by `n` dice results in float32
