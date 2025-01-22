package auth

import (
	"net/http"
	"social-network/pkg/sessions"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := sessions.GetSessionValue(r, "userID")
		if err != nil || userID == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
