package sqlite

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite" // Register SQLite driver
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file" // File-based migrations
)

// ConnectDB initializes and returns a SQLite database connection.
func ConnectDB() *sql.DB {
	db, err := sql.Open("sqlite", "./social_network.db") // Create SQLite database file
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	return db
}

// ApplyMigrations applies database migrations.
func ApplyMigrations(db *sql.DB) {
	// Create a migration driver for SQLite
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		log.Fatalf("Failed to create migration driver: %v", err)
	}

	// Point to the migration files directory
	m, err := migrate.NewWithDatabaseInstance(
    "file://pkg/db/migrations", 
    "sqlite3",
    driver,
)

	if err != nil {
		log.Fatalf("Failed to initialize migrations: %v", err)
	}

	// Apply migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	log.Println("Migrations applied successfully.")
}
