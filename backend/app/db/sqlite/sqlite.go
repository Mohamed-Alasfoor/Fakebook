package sqlite

import (
	"database/sql"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file" // File-based migrations
	_ "modernc.org/sqlite"                               // Register SQLite driver
)

// ConnectDB initializes and returns a SQLite database connection with proper settings.
func ConnectDB() *sql.DB {
	dsn := "./social_network.db?_busy_timeout=5000"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Enable WAL mode for better concurrency
	_, err = db.Exec("PRAGMA journal_mode=WAL;")
	if err != nil {
		log.Fatalf("Failed to set WAL mode: %v", err)
	}

	// Increase cache size (Optional)
	_, err = db.Exec("PRAGMA cache_size = 10000;")
	if err != nil {
		log.Fatalf("Failed to set cache size: %v", err)
	}

	// Ensure foreign keys are enabled (Optional)
	_, err = db.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		log.Fatalf("Failed to enable foreign keys: %v", err)
	}

	log.Println("Connected to SQLite database successfully.")
	return db
}

// ApplyMigrations applies database migrations safely.
func ApplyMigrations(db *sql.DB) {
	driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		log.Fatalf("Failed to create migration driver: %v", err)
	}

	// Read migration path from environment variable, default to local relative path
	migrationPath := os.Getenv("MIGRATIONS_PATH")
	if migrationPath == "" {
		// Local development default: using relative path
		migrationPath = "file://app/db/migrations"
	}

	m, err := migrate.NewWithDatabaseInstance(
		migrationPath,
		"sqlite", // Correct driver name for migrate
		driver,
	)
	if err != nil {
		log.Fatalf("Failed to initialize migrations: %v", err)
	}

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	log.Println("Migrations applied successfully.")
}
