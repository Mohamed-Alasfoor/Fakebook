package auth

import (
	"net/http"
	"social-network/pkg/sessions"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionID, err := sessions.GetSessionValue(r, sessions.SessionCookieName)
		if err != nil || sessionID == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Optionally log or use the session ID here if needed
		r = r.WithContext(r.Context())

		next.ServeHTTP(w, r)
	})
}
