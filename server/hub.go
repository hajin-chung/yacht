package main

import "log"

type Message struct {
	Id      string
	Content string
}

type Socket interface {
	Read() (string, error)
	Write(content string) error
	Close()
	Type() string
	Info()
}

type Hub struct {
	Sockets map[string]map[Socket]bool

	// every message passing internally should be done via go channels
	// incomming message
	In chan *Message
	// outgoing message
	Out chan *Message
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
	socket.Info()

	log.Printf("ADD %s %s", socket.Type(), id)
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
	log.Printf("SocketReader %s %+v", id, socket)
	socket.Info()
	for {
		if socket == nil {
			log.Printf("ERR Socket is nil for id: %s", id)
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
		log.Printf("SocketWriter new message to write")
		for socket := range h.Sockets[message.Id] {
			err := socket.Write(message.Content)
			if err != nil {
				log.Printf("ERR SocketWriter: %s", err)
				h.Remove(message.Id, socket)
			}
		}
	}
}

func (h *Hub) Worker() {
	for message := range h.In {
		log.Printf("RECV %s: %s", message.Id, message.Content)
	}
}
