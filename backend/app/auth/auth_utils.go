package auth

import (
	"golang.org/x/crypto/bcrypt"
	"errors"
	"regexp"
	"time"
)

// User struct for easy validation reference (kept unchanged)
type User struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Nickname    string `json:"nickname"`
	AboutMe     string `json:"about_me"`
	Avatar      string `json:"avatar"`
	DateOfBirth string `json:"date_of_birth"`
}

var creds struct {
	Identifier string `json:"identifier"` // email or nickname
	Password   string `json:"password"`
}

// ValidateEmail validates the email format using regex
func ValidateEmail(email string) error {
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	matched, _ := regexp.MatchString(emailRegex, email)
	if !matched {
		return errors.New("invalid email format")
	}
	return nil
}

// ValidatePassword validates the password using regex
func ValidatePassword(password string) error {
	if len(password) < 8 || !regexp.MustCompile(`[A-Z]`).MatchString(password) || !regexp.MustCompile(`[a-z]`).MatchString(password) || !regexp.MustCompile(`[0-9]`).MatchString(password) || !regexp.MustCompile(`[!@#~$%^&*(),.?":{}|<>]`).MatchString(password) {
		return errors.New("password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character")
	}
	return nil
}


// ValidateNickname validates the nickname (only letters and numbers, no spaces, max 15 characters)
func ValidateNickname(nickname string) error {
	nicknameRegex := `^[a-zA-Z0-9]{1,15}$` // Only letters and numbers, max length of 15
	matched, _ := regexp.MatchString(nicknameRegex, nickname)
	if !matched {
		return errors.New("nickname must only contain letters and numbers, no spaces, and be up to 15 characters long")
	}
	return nil
}

// ValidateName validates first name and last name (only letters, max 15 characters)
func ValidateName(name string) error {
	nameRegex := `^[a-zA-Z]{1,15}$` // Only letters, max length of 15
	matched, _ := regexp.MatchString(nameRegex, name)
	if !matched {
		return errors.New("name must only contain letters and be up to 15 characters long")
	}
	return nil
}

// ValidateAboutMe validates the "about me" field (max 50 characters, optional)
func ValidateAboutMe(aboutMe string) error {
	if len(aboutMe) > 50 {
		return errors.New("about me must not exceed 50 characters")
	}
	return nil
}

// ValidateDateOfBirth ensures the date of birth is not empty (basic validation)
func ValidateDateOfBirth(dateOfBirth string) error {
	// Basic date format regex: YYYY-MM-DD
	dateRegex := `^\d{4}-\d{2}-\d{2}$`
	matched, _ := regexp.MatchString(dateRegex, dateOfBirth)
	if !matched {
		return errors.New("date of birth must be in the format YYYY-MM-DD")
	}

	// Parse the date to check if it's valid and not in the future
	parsedDate, err := time.Parse("2006-01-02", dateOfBirth)
	if err != nil {
		return errors.New("invalid date format")
	}

	// Check if the date is in the future
	if parsedDate.After(time.Now()) {
		return errors.New("date of birth cannot be in the future")
	}

	return nil
}
// ValidateUser validates all fields for a user during registration
func ValidateUser(user User) error {
	if err := ValidateEmail(user.Email); err != nil {
		return err
	}
	if err := ValidatePassword(user.Password); err != nil {
		return err
	}
	if user.Nickname != "" { // Nickname is optional
		if err := ValidateNickname(user.Nickname); err != nil {
			return err
		}
	}
	if err := ValidateName(user.FirstName); err != nil {
		return err
	}
	if err := ValidateName(user.LastName); err != nil {
		return err
	}
	if err := ValidateAboutMe(user.AboutMe); err != nil {
		return err
	}
	if err := ValidateDateOfBirth(user.DateOfBirth); err != nil {
		return err
	}
	return nil
}


// HashPassword hashes a plaintext password using bcrypt
func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

// CheckPassword compares a hashed password with a plaintext password
func CheckPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
