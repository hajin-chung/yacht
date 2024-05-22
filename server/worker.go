package main

import (
	"errors"
	"log"

	"github.com/vmihailenco/msgpack/v5"
)

type Message interface{}

type InMessage struct {
	Type string             `msgpack:"type"`
	Data msgpack.RawMessage `msgpack:"data,omitempty"`
}

type LockDiceData struct {
	Dice int `msgpack:"dice"`
}

type UnlockDiceData struct {
	Dice int `msgpack:"dice"`
}

type SelectScoreData struct {
	Selection int `msgpack:"selection"`
}

type OutMessage struct {
	Type  string      `msgpack:"type"`
	Data  interface{} `msgpack:"data,omitempty"`
	Error bool        `msgpack:"error"`
}

func (h *Hub) Worker() {
	var err error
	for packet := range h.In {
		inMessage := &InMessage{}
		err = msgpack.Unmarshal(packet.Message, inMessage)
		if err != nil {
			h.SendMessage(packet.Id, "error", nil, err)
			continue
		}

		switch inMessage.Type {
		case "ping":
			h.SendMessage(packet.Id, "ping", nil, nil)
		case "me":
			err = HandleMe(packet.Id)
		case "queue":
			err = HandleQueue(packet.Id)
		case "cancelQueue":
			err = HandleCancelQueue(packet.Id)
		case "gameState":
			err = HandleGameState(packet.Id)
		case "shake":
			err = HandleShake(packet.Id)
		case "encup":
			err = HandleEncup(packet.Id)
		case "decup":
			err = HandleDecup(packet.Id)
		case "roll":
			err = HandleRoll(packet.Id)
		case "lockDice":
			data := &LockDiceData{}
			err = msgpack.Unmarshal(inMessage.Data, data)
			if err != nil {
				break
			}
			err = HandleLockDice(packet.Id, data.Dice)
		case "unlockDice":
			data := &UnlockDiceData{}
			err = msgpack.Unmarshal(inMessage.Data, data)
			if err != nil {
				break
			}
			err = HandleUnlockDice(packet.Id, data.Dice)
		case "selectScore":
			data := &SelectScoreData{}
			err = msgpack.Unmarshal(inMessage.Data, data)
			if err != nil {
				break
			}
			err = HandleSelectScore(packet.Id, data.Selection)
		default:
			err = errors.New("unknown message type")
		}

		if err != nil {
			log.Printf("packet error: %s\n", err)
			h.SendMessage(packet.Id, "error", nil, err)
			continue
		}
	}
}

func (h *Hub) SendMessage(id string, messageType string, data interface{}, err error) {
	isError := false
	if err != nil {
		log.Printf("sending error: %s", err)
		isError = true
	}
	encoded, _ := msgpack.Marshal(OutMessage{
		Type:  messageType,
		Data:  data,
		Error: isError,
	})
	h.Out <- &Packet{Id: id, Message: encoded}
}

func (h *Hub) BroadcastMessage(ids []string, messageType string, data interface{}, err error) {
	for _, id := range ids {
		h.SendMessage(id, messageType, data, err)
	}
}

func HandleMe(userId string) error {
	status, err := GetUserStatus(userId)
	if err != nil {
		return err
	}

	if status == USER_PLAYING {
		gameId, err := GetUserGameId(userId)
		if err != nil {
			return err
		}
		hub.SendMessage(userId, "me", map[string]interface{}{
			"id":     userId,
			"status": status,
			"gameId": gameId,
		}, nil)
	} else {
		hub.SendMessage(userId, "me", map[string]interface{}{
			"id":     userId,
			"status": status,
		}, nil)
	}
	return nil
}
