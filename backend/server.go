package main

import (
	"log"
	"net/http"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/auth"
)

func main() {
	// Connect to the database
	db := sqlite.ConnectDB()
	defer db.Close()

	// Apply migrations
	sqlite.ApplyMigrations(db)


	// Register authentication routes
	http.HandleFunc("/register", auth.RegisterHandler(db))
	http.HandleFunc("/login", auth.LoginHandler(db))

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
