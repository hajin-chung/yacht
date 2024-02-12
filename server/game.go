package main

import (
	"errors"
	"log"
	"math/rand"
)

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

const MAX_TURN = 2 * 12

type GameState struct {
	Id        string      `msgpack:"id"`
	PlayerId  [2]string   `msgpack:"playerId"`
	Status    GameStatus  `msgpack:"status"`
	Selected  [2][12]bool `msgpack:"Selected"`
	Scores    [2][12]int  `msgpack:"scores"`
	Turn      uint8       `msgpack:"turn"`
	LeftRolls uint8       `msgpack:"leftRolls"`
	IsLocked  [5]bool     `msgpack:"isLocked"`
	Dice      [5]int      `msgpack:"dice"`
}

func (game *GameState) Next() {
	for i := 0; i < 5; i++ {
		game.IsLocked[i] = false
		game.Dice[i] = 0
	}
	game.LeftRolls = 3
	game.Turn++

	if game.Turn == MAX_TURN {
		game.Status = GAME_DONE

		SetUserStatus(game.PlayerId[0], USER_IDLE)
		SetUserStatus(game.PlayerId[1], USER_IDLE)
		RemoveUserGameId(game.PlayerId[0])
		RemoveUserGameId(game.PlayerId[1])

		hub.SendMessage(game.PlayerId[0], "gameEnd", map[string]interface{}{
			"gameId": game.Id,
		}, nil)
		hub.SendMessage(game.PlayerId[1], "gameEnd", map[string]interface{}{
			"gameId": game.Id,
		}, nil)
	}
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
		Id:        gameId,
		PlayerId:  [2]string{player1Id, player2Id},
		Status:    GAME_PLAYING,
		Selected:  [2][12]bool{},
		Scores:    [2][12]int{},
		Turn:      0,
		LeftRolls: 3,
		IsLocked:  [5]bool{},
		Dice:      [5]int{},
	}
	games[gameId] = gameState

	SetUserStatus(player1Id, USER_PLAYING)
	SetUserStatus(player2Id, USER_PLAYING)
	SetUserGameId(player1Id, gameId)
	SetUserGameId(player2Id, gameId)

	hub.SendMessage(player1Id, "gameStart", map[string]interface{}{
		"gameId": gameId,
	}, nil)
	hub.SendMessage(player2Id, "gameStart", map[string]interface{}{
		"gameId": gameId,
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
		game.Dice[i] = int(result[resultIdx])
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

func HandleLockDice(userId string, diceIndex int) error {
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
	if diceIndex < 0 || diceIndex >= 5 {
		return errors.New("dice out of bounds")
	}

	game.IsLocked[diceIndex] = true

	hub.SendMessage(game.PlayerId[0], "lockDice", map[string]interface{}{
		"dice": diceIndex,
	}, nil)
	hub.SendMessage(game.PlayerId[1], "lockDice", map[string]interface{}{
		"dice": diceIndex,
	}, nil)

	return nil
}

func HandleUnlockDice(userId string, diceIndex int) error {
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
	if diceIndex < 0 || diceIndex >= 5 {
		return errors.New("dice out of bounds")
	}

	game.IsLocked[diceIndex] = false

	hub.SendMessage(game.PlayerId[0], "unlockDice", map[string]interface{}{
		"dice": diceIndex,
	}, nil)
	hub.SendMessage(game.PlayerId[1], "unlockDice", map[string]interface{}{
		"dice": diceIndex,
	}, nil)

	return nil
}

func HandleSelectScore(userId string, selection int) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game := games[gameId]
	if game.PlayerId[game.Turn%2] != userId {
		return errors.New("not in turn")
	}
	if selection < 0 || 12 <= selection {
		return errors.New("selection out of bounds")
	}
	if game.Selected[game.Turn%2][selection] == true {
		return errors.New("score already selected")
	}

	score := CalculateScore(game.Dice, selection)
	game.Selected[game.Turn%2][selection] = true
	game.Scores[game.Turn%2][selection] = score

	hub.SendMessage(game.PlayerId[0], "selectScore", map[string]interface{}{
		"selection": selection,
	}, nil)
	hub.SendMessage(game.PlayerId[1], "selectScore", map[string]interface{}{
		"selection": selection,
	}, nil)

	game.Next()

	return nil
}

func CalculateScore(dice [5]int, selection int) int {
	cnt := [7]int{0, 0, 0, 0, 0, 0}
	cntCount := [6]int{0, 0, 0, 0, 0, 0}
	straight := 0
	sum := 0
	cntMax := 0
	maxEyes := 0
	for _, eyes := range dice {
		cnt[eyes]++
		if cnt[eyes] > cntMax {
			cntMax = cnt[eyes]
			maxEyes = eyes
		}
		sum += eyes
	}

	for _, count := range cnt {
		if count > 0 {
			straight++
		} else {
			straight = 0
		}

		cntCount[count]++
	}

	switch Score(selection) {
	case ACES:
		return cnt[1]
	case DEUCES:
		return cnt[2] * 2
	case THREES:
		return cnt[3] * 3
	case FOURS:
		return cnt[4] * 4
	case FIVES:
		return cnt[5] * 5
	case SIXES:
		return cnt[6] * 6
	case CHOICE:
		return sum
	case FOUROFAKIND:
		if cntMax >= 4 {
			return 4 * maxEyes
		}
	case FULLHOUSE:
		if cntCount[2] == 1 && cntCount[3] == 1 {
			return sum
		}
	case SMALLSTRAIGHT:
		if straight >= 4 {
			return 15
		}
	case LARGESTRAIGHT:
		if straight == 5 {
			return 30
		}
	case YACHT:
		if cntCount[5] == 1 {
			return 50
		}
	}

	return 0
}
