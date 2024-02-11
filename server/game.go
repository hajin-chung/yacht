package main

import "log"

// TODO: game
// handle gameState, shake, lockDice, unlockDice, roll, selectScore,
// gameStart, gameEnd
type GameStatus string

const (
	GAME_PLAYING GameStatus = "PLAYING"
	GAME_DONE               = "DONE"
)

type Score uint8

const (
	ACES          Score = 0
	DEUCES              = 1
	THREES              = 2
	FOURS               = 3
	FIVES               = 4
	SIXES               = 5
	CHOICE              = 6
	FOUROFAKIND         = 7
	FULLHOUSE           = 8
	SMALLSTRAIGHT       = 9
	LARGESTRAIGHT       = 10
	YACHT               = 11
)

type GameState struct {
	Id         string        `msgpack:"id"`
	PlayerId   [2]string     `msgpack:"playerId"`
	Status     GameStatus    `msgpack:"status"`
	Scores     [2][12]uint16 `msgpack:"scores"`
	Turn       uint8         `msgpack:"turn"`
	LeftRolls  uint8         `msgpack:"leftRolls"`
	LockedDice []uint8       `msgpack:"lockedDice"`
	Dice       []uint8       `msgpack:"dice"`
}

var games map[string]*GameState
var players map[string]string

func InitGame() {
	log.Println("Initializing game")
	games = map[string]*GameState{}
	players = map[string]string{}
}

func StartGame(player1Id string, player2Id string) {
	gameId := CreateId()
	gameState := &GameState{
		Id:       gameId,
		PlayerId: [2]string{player1Id, player2Id},
		Status:   GAME_PLAYING,
		Scores: [2][12]uint16{
			{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
			{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
		},
		Turn:       1,
		LeftRolls:  3,
		LockedDice: []uint8{},
		Dice:       []uint8{},
	}
	games[gameId] = gameState
	SetUserStatus(player1Id, USER_PLAYING)
	SetUserStatus(player2Id, USER_PLAYING)
	SetUserGameId(player1Id, gameId)
	SetUserGameId(player2Id, gameId)
	hub.SendMessage(player1Id, "gameState", map[string]interface{}{
		"state": gameState,
	}, nil)
	hub.SendMessage(player2Id, "gameState", map[string]interface{}{
		"state": gameState,
	}, nil)
}
