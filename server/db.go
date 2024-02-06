package main

import (
	"github.com/jmoiron/sqlx"
)

type Database struct {
	*sqlx.DB
}

var userDB Database

func InitDB() error {
	userDB = Database{}	
	err := userDB.New("./db/user.db")
	return err
}

func (db *Database) New(dataSourceName string) error {
	sqlDB, err := sqlx.Open("sqlite3", dataSourceName)

	if err != nil {
		return err
	}
	
	db.DB = sqlDB
	return nil
}
