package main

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

var rdb *redis.Client
var c = context.Background()

func InitRedis() {
	log.Println("Initializing redis")
	rdb = redis.NewClient(&redis.Options{
		Addr:     "127.0.0.1:6379",
		Password: "",
		DB:       0,
	})
}
