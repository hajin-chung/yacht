package main

import (
	"errors"
	"fmt"

	"github.com/vmihailenco/msgpack/v5"
)

type Message interface{}

type InMessage struct {
	Type string `msgpack:"type"`
}

type OutMessage struct {
	Type  string `msgpack:"type"`
	Error bool   `msgpack:"error"`
}

type InPingMessage struct {
	InMessage
}

type OutErrorMessage struct {
	OutMessage
}

func (h *Hub) Worker() {
	for packet := range h.In {
		inMessage := &InMessage{}
		err := msgpack.Unmarshal(packet.Message, inMessage)
		if err != nil {
			h.handleError(packet.Id, err)
			continue
		}

		outMessage, err := h.handleInMessage(packet.Id, inMessage)
		if err != nil {
			h.handleError(packet.Id, err)
			continue
		}
		buffer, err := msgpack.Marshal(&outMessage)
		if err != nil {
			h.handleError(packet.Id, err)
			continue
		}
		h.Out <- &Packet{Id: packet.Id, Message: buffer}
	}
}

func (h *Hub) handleInMessage(id string, inMessage *InMessage) (*OutMessage, error) {
	var msg Message
	switch inMessage.Type {
	case "ping":
		msg = &InPingMessage{}
	default:
		return nil, errors.New(fmt.Sprintf("unknown message type: %s", inMessage.Type))
	}

	err :=msgpack.Unmarshal()
}

func (h *Hub) handleError(id string, err error) {
	msg := OutErrorMessage{
		OutMessage: OutMessage{
			Type:  "error",
			Error: true,
		},
	}
	buffer, err := msgpack.Marshal(&msg)
	h.Out <- &Packet{Id: id, Message: buffer}
}
