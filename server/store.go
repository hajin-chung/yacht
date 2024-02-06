package main

import (
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/gofiber/storage/sqlite3"
)

var Store *session.Store

func InitStore() {
	storage := sqlite3.New(sqlite3.Config{
		Database: "./db/session.db",
	})
	Store = session.New(session.Config{Storage: storage})
}
