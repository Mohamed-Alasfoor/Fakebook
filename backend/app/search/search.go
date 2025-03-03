package search

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
)

// SearchUser holds basic user information for search results.
type SearchUser struct {
	ID       string `json:"id"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
}

// SearchGroup holds basic group information for search results.
type SearchGroup struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// SearchHandler searches for users (by nickname) and groups (by name).
func SearchHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow GET requests.
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Retrieve the search query from the URL query parameters.
		// For example: /search?query=john
		queryParam := r.URL.Query().Get("query")
		if strings.TrimSpace(queryParam) == "" {
			http.Error(w, "Missing search query", http.StatusBadRequest)
			return
		}

		// Use wildcards for partial matching.
		searchTerm := "%" + queryParam + "%"

		// --- Search for users by nickname ---
		userRows, err := db.Query(`SELECT id, nickname, avatar FROM users WHERE nickname LIKE ?`, searchTerm)
		if err != nil {
			http.Error(w, "Failed to search users", http.StatusInternalServerError)
			return
		}
		defer userRows.Close()

		var users []SearchUser
		for userRows.Next() {
			var user SearchUser
			if err := userRows.Scan(&user.ID, &user.Nickname, &user.Avatar); err != nil {
				http.Error(w, "Failed to scan user", http.StatusInternalServerError)
				return
			}
			users = append(users, user)
		}

		// --- Search for groups by name ---
		groupRows, err := db.Query(`SELECT id, name, description FROM groups WHERE name LIKE ?`, searchTerm)
		if err != nil {
			http.Error(w, "Failed to search groups", http.StatusInternalServerError)
			return
		}
		defer groupRows.Close()

		var groups []SearchGroup
		for groupRows.Next() {
			var group SearchGroup
			if err := groupRows.Scan(&group.ID, &group.Name, &group.Description); err != nil {
				http.Error(w, "Failed to scan group", http.StatusInternalServerError)
				return
			}
			groups = append(groups, group)
		}

		// Build the final response.
		response := map[string]interface{}{
			"users":  users,
			"groups": groups,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}
