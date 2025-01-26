package auth

import (
	"context"
	"database/sql"
	"net/http"
	"time"
)

func AuthMiddleware(db *sql.DB, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // (1) Retrieve the session ID from the cookie
        cookie, err := r.Cookie("social-network-session")
        if err != nil || cookie.Value == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }

        sessionID := cookie.Value

        // (2) Validate the session in the database
        var userID string
        query := `SELECT user_id FROM active_sessions WHERE session_id = ? AND expires_at > ?`
        err = db.QueryRow(query, sessionID, time.Now()).Scan(&userID)
        if err == sql.ErrNoRows {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        } else if err != nil {
            http.Error(w, "Internal server error", http.StatusInternalServerError)
            return
        }

        // (3) Add the user ID to the request context
        ctx := context.WithValue(r.Context(), "user_id", userID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
