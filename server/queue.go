package main

import (
	"errors"
	"log"
	"time"
)

func InitQueue() {
	log.Println("Initializing queue")
	ticker := time.NewTicker(5 * time.Second)
	go MatchMaker(ticker)
}

func MatchMaker(ticker *time.Ticker) {
	for range ticker.C {
		queue, err := GetQueue()
		log.Printf("queue size: %d", len(queue))
		if err != nil {
			log.Printf("error while getting queue: %s", err)
		}

		if len(queue) < 2 {
			continue
		}

		for i := 0; i < len(queue); i += 2 {
			player1Id := queue[i]
			player2Id := queue[i+1]
			log.Printf("match making %s %s", player1Id, player2Id)
			RemoveUserQueue(player1Id)
			RemoveUserQueue(player2Id)

			StartGame([]string{player1Id, player2Id})
		}
	}
}

func HandleQueue(id string) error {
	status, err := GetUserStatus(id)
	if err != nil {
		return err
	}

	if status != USER_IDLE {
		return errors.New("user is not idle")
	}

	err = SetUserStatus(id, USER_QUEUE)
	if err != nil {
		return err
	}

	err = AddUserQueue(id)
	if err != nil {
		return err
	}

	hub.SendMessage(id, "queue", nil, nil)
	return nil
}

func HandleCancelQueue(id string) error {
	status, err := GetUserStatus(id)
	if err != nil {
		return err
	}

	if status != USER_QUEUE {
		return errors.New("user is not in queue")
	}

	err = SetUserStatus(id, USER_IDLE)
	if err != nil {
		return err
	}

	err = RemoveUserQueue(id)
	if err != nil {
		return err
	}

	hub.SendMessage(id, "cancelQueue", nil, nil)
	return nil
}
