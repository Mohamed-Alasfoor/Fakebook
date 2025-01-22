package sessions

import (
	"net/http"

	"github.com/gorilla/sessions"
)

var store = sessions.NewCookieStore([]byte("your-secret-key")) // Use a strong random secret key

// GetSession retrieves the session object for a given request
func GetSession(r *http.Request) (*sessions.Session, error) {
	return store.Get(r, "social-network-session")
}

// SetSessionValue sets a value in the session
func SetSessionValue(w http.ResponseWriter, r *http.Request, key string, value interface{}) error {
	session, err := GetSession(r)
	if err != nil {
		return err
	}
	session.Values[key] = value
	return session.Save(r, w)
}

// GetSessionValue retrieves a value from the session
func GetSessionValue(r *http.Request, key string) (interface{}, error) {
	session, err := GetSession(r)
	if err != nil {
		return nil, err
	}
	value, exists := session.Values[key]
	if !exists {
		return nil, nil
	}
	return value, nil
}

// DestroySession clears the session
func DestroySession(w http.ResponseWriter, r *http.Request) error {
	session, err := GetSession(r)
	if err != nil {
		return err
	}
	session.Options.MaxAge = -1 // Mark session for deletion
	return session.Save(r, w)
}
