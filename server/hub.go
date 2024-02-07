package main

import "log"

type Message struct {
	Id      string
	Content interface{}
}

type Socket interface {
	Read() (interface{}, error)
	Write(interface{}) error
	Close()
	Type() string
}

type Hub struct {
	Sockets map[string]map[Socket]bool
	In      chan *Message
	Out     chan *Message
}

var hub Hub

func InitHub() {
	hub = Hub{
		Sockets: map[string]map[Socket]bool{},
		In:      make(chan *Message),
		Out:     make(chan *Message),
	}

	go hub.SocketWriter()
	go hub.Worker()
}

func (h *Hub) Add(id string, socket Socket) {
	if h.Sockets[id] == nil {
		h.Sockets[id] = map[Socket]bool{}
	}
	h.Sockets[id][socket] = true
	go h.SocketReader(id, socket)
}

func (h *Hub) Remove(id string, socket Socket) {
	if h.Sockets[id] == nil {
		return
	}

	socket.Close()
	delete(h.Sockets[id], socket)
}

func (h *Hub) SocketReader(id string, socket Socket) {
	for {
		if socket == nil {
			log.Printf("ERR SocketReader Socket is nil for id: %s", id)
			return
		}

		content, err := socket.Read()
		if err != nil {
			log.Printf("ERR SocketReader: %s", err)
			h.Remove(id, socket)
			return
		} else {
			h.In <- &Message{Id: id, Content: content}
		}
	}
}

func (h *Hub) SocketWriter() {
	for message := range h.Out {
		for socket := range h.Sockets[message.Id] {
			err := socket.Write(message.Content)
			if err != nil {
				log.Printf("ERR SocketWriter: %s", err)
				h.Remove(message.Id, socket)
			}
		}
	}
}
