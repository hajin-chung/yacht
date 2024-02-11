package main

import "log"

type Packet struct {
	Id      string
	Message []byte
}

type Socket interface {
	Read() ([]byte, error)
	Write([]byte) error
	Close()
	Type() string
}

type Hub struct {
	Sockets map[string]map[Socket]bool
	In      chan *Packet
	Out     chan *Packet
}

var hub Hub

func InitHub() {
	log.Println("Initializing hub")
	hub = Hub{
		Sockets: map[string]map[Socket]bool{},
		In:      make(chan *Packet),
		Out:     make(chan *Packet),
	}

	go hub.SocketWriter()
	go hub.Worker()
}

func (h *Hub) Add(id string, socket Socket) {
	if h.Sockets[id] == nil {
		h.Sockets[id] = map[Socket]bool{}
	}
	h.Sockets[id][socket] = true
	log.Printf("new socket: %s\n", id)
	go h.SocketReader(id, socket)

	status, err := GetUserStatus(id)
	if err != nil {
		log.Printf("error while getting user status on adding socket: %s", err)
	} else {
		log.Printf("user %s status: %s", id, status)
	}
}

func (h *Hub) Remove(id string, socket Socket) {
	if h.Sockets[id] == nil {
		return
	}

	socket.Close()
	delete(h.Sockets[id], socket)
	if len(h.Sockets[id]) == 0 {
		delete(h.Sockets, id)
	}
}

func (h *Hub) SocketReader(id string, socket Socket) {
	for {
		if socket == nil {
			log.Printf("ERR SocketReader Socket is nil for id: %s", id)
			return
		}

		message, err := socket.Read()
		if err != nil {
			log.Printf("ERR SocketReader: %s", err)
			h.Remove(id, socket)
			return
		} else {
			log.Printf("RECV (%s): %s", id, message)
			h.In <- &Packet{Id: id, Message: message}
		}
	}
}

func (h *Hub) SocketWriter() {
	for packet := range h.Out {
		for socket := range h.Sockets[packet.Id] {
			err := socket.Write(packet.Message)
			if err != nil {
				log.Printf("ERR SocketWriter: %s", err)
				h.Remove(packet.Id, socket)
			}
		}
	}
}
