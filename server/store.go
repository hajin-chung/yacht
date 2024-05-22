package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/storage/redis/v3"
)

var Store *session.Store

func InitStore() {
	log.Println("Initializing store")
	storage := redis.New(redis.Config{
		Addrs: []string{os.Getenv("REDIS_ADDR")},
	})
	Store = session.New(session.Config{Storage: storage})
}
