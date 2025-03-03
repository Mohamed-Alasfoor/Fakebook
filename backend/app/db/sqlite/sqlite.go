package sqlite

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite" // Register SQLite driver
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file" // File-based migrations
)

// ConnectDB initializes and returns a SQLite database connection with proper settings.
func ConnectDB() *sql.DB {
	// Set busy timeout to 5 seconds to prevent immediate lock errors
	dsn := "./social_network.db?_busy_timeout=5000"

	db, err := sql.Open("sqlite", dsn) // Open SQLite with timeout settings
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Enable WAL (Write-Ahead Logging) mode for better concurrency
	_, err = db.Exec("PRAGMA journal_mode=WAL;")
	if err != nil {
		log.Fatalf("Failed to set WAL mode: %v", err)
	}

	// Increase cache size (Optional: Helps performance)
	_, err = db.Exec("PRAGMA cache_size = 10000;")
	if err != nil {
		log.Fatalf("Failed to set cache size: %v", err)
	}

	// Ensure foreign keys are enabled (Optional: Good practice)
	_, err = db.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		log.Fatalf("Failed to enable foreign keys: %v", err)
	}

	log.Println("Connected to SQLite database successfully.")
	return db
}

// ApplyMigrations applies database migrations safely.
func ApplyMigrations(db *sql.DB) {
	// Use the existing database connection
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		log.Fatalf("Failed to create migration driver: %v", err)
	}

	// Use the correct driver name "sqlite" instead of "sqlite3"
	m, err := migrate.NewWithDatabaseInstance(
		"file://app/db/migrations",
		"sqlite", // Correct driver name for migrate
		driver,
	)

	if err != nil {
		log.Fatalf("Failed to initialize migrations: %v", err)
	}

	// Apply migrations
	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	log.Println("Migrations applied successfully.")
}
