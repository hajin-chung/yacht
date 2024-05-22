package main

import (
	"errors"
	"fmt"
	"math/rand"

	"github.com/vmihailenco/msgpack/v5"
)

type GameStatus string

const (
	GAME_PLAYING GameStatus = "PLAYING"
	GAME_DONE               = "DONE"
)

const (
	ACES          int = 0
	DEUCES            = 1
	THREES            = 2
	FOURS             = 3
	FIVES             = 4
	SIXES             = 5
	CHOICE            = 6
	FOUROFAKIND       = 7
	FULLHOUSE         = 8
	SMALLSTRAIGHT     = 9
	LARGESTRAIGHT     = 10
	YACHT             = 11
)

const SCORE_COUNT = 12
const MAX_ROLL = 3

type GameState struct {
	Id        string              `msgpack:"id"`
	PlayerIds []string            `msgpack:"playerIds"`
	Status    GameStatus          `msgpack:"status"`
	Selected  [][SCORE_COUNT]bool `msgpack:"selected"`
	Scores    [][SCORE_COUNT]int  `msgpack:"scores"`
	Turn      int                 `msgpack:"turn"`
	LeftRolls int                 `msgpack:"leftRolls"`
	InCup     bool                `msgpack:"inCup"`
	IsLocked  [5]bool             `msgpack:"isLocked"`
	Dice      [5]int              `msgpack:"dice"`
}

func (game *GameState) Next() {
	for i := 0; i < 5; i++ {
		game.IsLocked[i] = false
		game.Dice[i] = 0
	}
	game.LeftRolls = 3
	game.Turn++
	game.InCup = true

	if game.Turn == len(game.PlayerIds) * SCORE_COUNT {
		game.Status = GAME_DONE

		for _, playerId := range game.PlayerIds {
			SetUserStatus(playerId, USER_IDLE)
			RemoveUserGameId(playerId)
			hub.SendMessage(playerId, "gameEnd", map[string]interface{}{
				"gameId": game.Id,
			}, nil)
		}
	}
}

func (game *GameState) IsPlayersTurn(playerId string) bool {
	return game.PlayerIds[game.Turn%len(game.PlayerIds)] == playerId
}

func SetGameState(gameState *GameState) error {
	data, err := msgpack.Marshal(gameState)
	if err != nil {
		return err
	}
	_, err = rdb.Set(c, fmt.Sprintf("game:%s", gameState.Id), data, 0).Result()
	return err
}

func GetGameState(gameId string) (*GameState, error) {
	val, err := rdb.Get(c, fmt.Sprintf("game:%s", gameId)).Bytes()
	if err != nil {
		return nil, err
	}

	gameState := GameState{}
	err = msgpack.Unmarshal(val, &gameState)
	if err != nil {
		return nil, err
	}
	return &gameState, nil
}

func StartGame(playerIds []string) {
	selected := make([][12]bool, len(playerIds))
	scores := make([][12]int, len(playerIds))

	gameId := CreateId()
	gameState := &GameState{
		Id:        gameId,
		PlayerIds: playerIds,
		Status:    GAME_PLAYING,
		Selected:  selected,
		Scores:    scores,
		Turn:      0,
		InCup:     true,
		LeftRolls: MAX_ROLL,
		IsLocked:  [5]bool{},
		Dice:      [5]int{},
	}
	SetGameState(gameState)

	for _, playerId := range playerIds {
		SetUserStatus(playerId, USER_PLAYING)
		SetUserGameId(playerId, gameId)
		hub.SendMessage(playerId, "gameStart", map[string]interface{}{
			"gameId": gameId,
		}, nil)
	}
}

func HandleGameState(userId string) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	gameState, err := GetGameState(gameId)
	if err != nil {
		return err
	}
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

	game, err := GetGameState(gameId)
	if err != nil {
		return err
	}

	if !game.InCup {
		return errors.New("dice is not in cup")
	}
	if game.IsPlayersTurn(userId) {
		return errors.New("not in turn")
	}
	if game.LeftRolls <= 0 {
		return errors.New("no left rolls")
	}

	hub.BroadcastMessage(game.PlayerIds, "shake", nil, nil)
	return nil
}

func HandleEncup(userId string) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game, err := GetGameState(gameId)
	if err != nil {
		return err
	}

	if game.InCup {
		return errors.New("dice already in cup")
	}

	if game.IsPlayersTurn(userId) {
		return errors.New("not in turn")
	}

	if game.LeftRolls == 3 {
		return errors.New("dice not thrown")
	}

	if game.LeftRolls == 0 {
		return errors.New("no rolls left")
	}

	game.InCup = true
	err = SetGameState(game)
	if err != nil {
		return err
	}

	hub.BroadcastMessage(game.PlayerIds, "encup", nil, nil)

	return nil
}

func HandleDecup(userId string) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game, err := GetGameState(gameId)
	if err != nil {
		return err
	}

	if !game.InCup {
		return errors.New("dice already out cup")
	}

	if game.IsPlayersTurn(userId) {
		return errors.New("not in turn")
	}

	if game.LeftRolls == 3 {
		return errors.New("dice not thrown")
	}

	game.InCup = false
	err = SetGameState(game)
	if err != nil {
		return err
	}

	hub.BroadcastMessage(game.PlayerIds, "decup", nil, nil)
	return nil
}

// if current turn is user's turn
// has leftRolls
func HandleRoll(userId string) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game, err := GetGameState(gameId)
	if err != nil {
		return err
	}

	if !game.InCup {
		return errors.New("dice is not in cup")
	}
	if game.IsPlayersTurn(userId) {
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
	game.InCup = false
	err = SetGameState(game)
	if err != nil {
		return err
	}

	// send message
	hub.BroadcastMessage(game.PlayerIds, "roll", map[string]interface{}{
		"result": game.Dice,
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

	game, err := GetGameState(gameId)
	if err != nil {
		return err
	}

	if game.InCup {
		return errors.New("dice is in cup")
	}
	if game.IsPlayersTurn(userId) {
		return errors.New("not in turn")
	}
	if game.LeftRolls <= 0 {
		return errors.New("no left rolls")
	}
	if diceIndex < 0 || diceIndex >= 5 {
		return errors.New("dice out of bounds")
	}

	game.IsLocked[diceIndex] = true

	err = SetGameState(game)
	if err != nil {
		return err
	}

	hub.BroadcastMessage(game.PlayerIds, "lockDice", map[string]interface{}{
		"dice": diceIndex,
	}, nil)

	return nil
}

func HandleUnlockDice(userId string, diceIndex int) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game, err := GetGameState(gameId)
	if err != nil {
		return err
	}

	if game.InCup {
		return errors.New("dice is in cup")
	}
	if game.IsPlayersTurn(userId) {
		return errors.New("not in turn")
	}
	if game.LeftRolls <= 0 {
		return errors.New("no left rolls")
	}
	if diceIndex < 0 || diceIndex >= 5 {
		return errors.New("dice out of bounds")
	}

	game.IsLocked[diceIndex] = false

	err = SetGameState(game)
	if err != nil {
		return err
	}

	hub.BroadcastMessage(game.PlayerIds, "unlockDice", map[string]interface{}{
		"dice": diceIndex,
	}, nil)

	return nil
}

func HandleSelectScore(userId string, selection int) error {
	gameId, err := GetUserGameId(userId)
	if err != nil {
		return err
	}

	game, err := GetGameState(gameId)
	if err != nil {
		return err
	}
	if game.IsPlayersTurn(userId) {
		return errors.New("not in turn")
	}
	if selection < 0 || 12 <= selection {
		return errors.New("selection out of bounds")
	}
	if game.Selected[game.Turn%2][selection] == true {
		return errors.New("score already selected")
	}

	score := CalculateScore(game.Dice, selection)
	game.Selected[game.Turn%len(game.PlayerIds)][selection] = true
	game.Scores[game.Turn%len(game.PlayerIds)][selection] = score

	hub.BroadcastMessage(game.PlayerIds, "selectScore", map[string]interface{}{
		"playerId":  userId,
		"selection": selection,
		"score":     score,
	}, nil)

	game.Next()

	err = SetGameState(game)
	if err != nil {
		return err
	}

	return nil
}

func CalculateScore(dice [5]int, selection int) int {
	cnt := [7]int{0, 0, 0, 0, 0, 0}
	cntCount := [6]int{0, 0, 0, 0, 0, 0}
	var straight int = 0
	var maxStraight int = 0
	var sum int = 0
	var cntMax int = 0
	var maxCntEyes int = 0
	for _, eyes := range dice {
		cnt[eyes]++
		if cnt[eyes] > cntMax {
			cntMax = cnt[eyes]
			maxCntEyes = eyes
		}
		sum += eyes
	}

	for _, count := range cnt {
		if count > 0 {
			straight++

			if straight > maxStraight {
				maxStraight = straight
			}
		} else {
			straight = 0
		}

		cntCount[count]++
	}

	switch selection {
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
			return 4 * maxCntEyes
		}
	case FULLHOUSE:
		if cntCount[2] == 1 && cntCount[3] == 1 {
			return sum
		}
	case SMALLSTRAIGHT:
		if maxStraight >= 4 {
			return 15
		}
	case LARGESTRAIGHT:
		if maxStraight == 5 {
			return 30
		}
	case YACHT:
		if cntCount[5] == 1 {
			return 50
		}
	}

	return 0
}
