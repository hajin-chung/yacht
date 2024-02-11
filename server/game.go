package main

import (
	"errors"
	"log"
	"math/rand"
)

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
	Id        string        `msgpack:"id"`
	PlayerId  [2]string     `msgpack:"playerId"`
	Status    GameStatus    `msgpack:"status"`
	Scores    [2][12]uint16 `msgpack:"scores"`
	Turn      uint8         `msgpack:"turn"`
	LeftRolls uint8         `msgpack:"leftRolls"`
	IsLocked  [5]bool       `msgpack:"isLocked"`
	Dice      [5]uint16     `msgpack:"dice"`
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
		Turn:      0,
		LeftRolls: 3,
		IsLocked:  [5]bool{},
		Dice:      [5]uint16{},
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

func HandleGameState(userId string) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	gameState := games[gameId]
	hub.SendMessage(userId, "gameState", map[string]interface{}{
		"state": gameState,
	}, nil)
	return nil
}

func HandleShake(userId string) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game := games[gameId]

	if game.PlayerId[game.Turn%2] != userId {
		return errors.New("not in turn")
	}
	if game.LeftRolls <= 0 {
		return errors.New("no left rolls")
	}

	hub.SendMessage(game.PlayerId[0], "shake", nil, nil)
	hub.SendMessage(game.PlayerId[1], "shake", nil, nil)
	return nil
}

// if current turn is user's turn
// has leftRolls
func HandleRoll(userId string) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game := games[gameId]
	if game.PlayerId[game.Turn%2] != userId {
		return errors.New("not in turn")
	}
	if game.LeftRolls <= 0 {
		return errors.New("no left rolls")
	}

	freeDice := 0
	for _, isLocked := range game.IsLocked {
		if !isLocked {
			freeDice++
		}
	}

	if freeDice == 0 {
		return errors.New("no free dice")
	}

	result := []int32{}
	for i := 0; i < freeDice; i++ {
		result = append(result, int32(rand.Intn(6))+1)
	}

	buffer, err := GenerateSimulation(freeDice, result)
	if err != nil {
		return err
	}

	// update game state
	game.LeftRolls--
	resultIdx := 0
	for i := 0; i < 5; i++ {
		if game.IsLocked[i] {
			continue
		}
		game.Dice[i] = uint16(result[resultIdx])
		resultIdx++
	}

	// send message
	hub.SendMessage(game.PlayerId[0], "roll", map[string]interface{}{
		"result": result,
		"buffer": buffer,
	}, nil)
	hub.SendMessage(game.PlayerId[1], "roll", map[string]interface{}{
		"result": result,
		"buffer": buffer,
	}, nil)

	// TODO: free buffer

	return nil
}
