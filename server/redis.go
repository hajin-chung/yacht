package main

import (
	"context"
	"fmt"
	"log"
	"time"

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

type UserStatus string

const (
	USER_IDLE    UserStatus = "IDLE"
	USER_QUEUE              = "QUEUE"
	USER_PLAYING            = "PLAYING"
)

func GetUserStatus(userId string) (UserStatus, error) {
	status, err := rdb.HGet(c, fmt.Sprintf("user:%s", userId), "status").Result()
	if err == redis.Nil {
		// TODO: maybe send current status?
		SetUserStatus(userId, USER_IDLE)
		return USER_IDLE, nil
	} else if err != nil {
		return USER_IDLE, err
	}
	return UserStatus(status), nil
}

func SetUserStatus(userId string, status UserStatus) error {
	_, err := rdb.HSet(c, fmt.Sprintf("user:%s", userId), map[string]string{
		"status": string(status),
	}).Result()
	return err
}

func AddUserQueue(userId string) error {
	_, err := rdb.ZAdd(c, "queue", redis.Z{
		Score:  float64(time.Now().Unix()),
		Member: userId,
	}).Result()
	return err
}

func RemoveUserQueue(userId string) error {
	_, err := rdb.ZRem(c, "queue", userId).Result()
	return err
}

func SetUserGameId(userId string, gameId string) error {
	_, err := rdb.HSet(c, fmt.Sprintf("user:%s", userId), map[string]string{
		"gameId": gameId,
	}).Result()
	return err
}

func GetQueue() ([]string, error) {
	res, err := rdb.ZRange(c, "queue", 0, -1).Result()
	return res, err
}
