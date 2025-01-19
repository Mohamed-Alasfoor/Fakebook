package main

import (
	"log"
	"net/http"
	"social-network/backend/pkg/db/sqlite"
)

func main() {
	// Connect to the database
	db := sqlite.ConnectDB()
	defer db.Close()

	// Apply migrations
	sqlite.ApplyMigrations(db)

	// Placeholder for server setup
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Social Network Backend is running!"))
	})

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
