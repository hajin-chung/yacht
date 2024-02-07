package main

import (
	"encoding/json"
	"log"
)

func (h *Hub) Worker() {
	for message := range h.In {
		switch message.Content.(type) {
		case string:
			h.handleStringMessage(message)
		case []byte:
			h.handleBinaryMessage(message)
		default:
			log.Printf("ERR Worker: unkown message content type")
			continue
		}
	}
}

type MessageContent struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func (h *Hub) handleStringMessage(message *Message) {
	id := message.Id
	content, err := ParseContent(message.Content.(string))

	if err != nil {
		h.Out <- &Message{Id: id, Content: ErrorMessage}
		return
	}

	switch content.Type {
	case "ping":
		h.Out <- &Message{Id: id, Content: PingMessage}
	default:
		h.Out <- &Message{Id: id, Content: ErrorMessage}
	}
}

func (h *Hub) handleBinaryMessage(message *Message) {
	message.Content = message.Content.([]byte)
}

func ParseContent(content string) (*MessageContent, error) {
	data := &MessageContent{}
	err := json.Unmarshal([]byte(content), data)
	if err != nil {
		return nil, err
	}
	return data, err
}
