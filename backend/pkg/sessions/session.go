package sessions

import (
	"errors"
	"net/http"
)

const SessionCookieName = "social-network-session"

// SetSessionValue sets a session cookie with the given key-value pair
func SetSessionValue(w http.ResponseWriter, r *http.Request, key, value string) error {
	http.SetCookie(w, &http.Cookie{
		Name:     key,
		Value:    value,
		Path:     "/",
		HttpOnly: true,                      // Prevent access to cookies via JavaScript
		Secure:   true,                      // Ensure cookies are sent over HTTPS only
		SameSite: http.SameSiteStrictMode,   // Enforce SameSite: Strict
	})
	return nil
}


// GetSessionValue retrieves the session cookie value for the given key
func GetSessionValue(r *http.Request, key string) (string, error) {
	cookie, err := r.Cookie(key)
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return "", nil
		}
		return "", err
	}
	return cookie.Value, nil
}

// DestroySession clears the session cookie
func DestroySession(w http.ResponseWriter, r *http.Request) error {
	http.SetCookie(w, &http.Cookie{
		Name:   SessionCookieName,
		Value:  "",
		Path:   "/",
		MaxAge: -1, // Expire the cookie immediately
	})
	return nil
}

// GetUserIDFromSession retrieves the user_id from the session cookie
func GetUserIDFromSession(r *http.Request) (string, error) {
	// Get the session value (user_id) from the cookie
	userID, err := GetSessionValue(r, SessionCookieName)
	if err != nil {
		return "", err
	}

	// If user_id is empty, return an error
	if userID == "" {
		return "", errors.New("user_id not found in session")
	}

	return userID, nil
}