package csrf

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	defaultCSRFCookieName      = "csrftoken"
	defaultCSRFCookiePath      = "/"
	defaultCSRFCookieMaxAgeSec = 31536000
	csrfSecretSize             = 32
)

type CookieConfig struct {
	Name          string
	Domain        string
	Path          string
	Secure        bool
	HTTPOnly      bool
	SameSite      http.SameSite
	MaxAgeSeconds int
}

type ServiceConfig struct {
	Cookie CookieConfig
}

type Service struct {
	cookie CookieConfig
}

func NewService(cfg ServiceConfig) *Service {
	cookie := cfg.Cookie
	if strings.TrimSpace(cookie.Name) == "" {
		cookie.Name = defaultCSRFCookieName
	}
	if strings.TrimSpace(cookie.Path) == "" {
		cookie.Path = defaultCSRFCookiePath
	}
	if cookie.MaxAgeSeconds <= 0 {
		cookie.MaxAgeSeconds = defaultCSRFCookieMaxAgeSec
	}
	if cookie.SameSite == 0 {
		cookie.SameSite = http.SameSiteLaxMode
	}

	return &Service{cookie: cookie}
}

func ParseSameSite(raw string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func (s *Service) EnsureCSRFCookie(c *gin.Context) ([]byte, error) {
	rawCookie, err := c.Cookie(s.cookie.Name)
	if err == nil {
		secret, decodeErr := decodeSecret(rawCookie)
		if decodeErr == nil {
			return secret, nil
		}
	}

	secret := make([]byte, csrfSecretSize)
	if _, err := rand.Read(secret); err != nil {
		return nil, fmt.Errorf("generate csrf secret: %w", err)
	}

	encoded := base64.RawURLEncoding.EncodeToString(secret)
	c.SetSameSite(s.cookie.SameSite)
	c.SetCookie(
		s.cookie.Name,
		encoded,
		s.cookie.MaxAgeSeconds,
		s.cookie.Path,
		s.cookie.Domain,
		s.cookie.Secure,
		s.cookie.HTTPOnly,
	)

	return secret, nil
}

func (s *Service) IssueToken(secret []byte) (string, error) {
	if len(secret) != csrfSecretSize {
		return "", ErrInvalidCSRFCookie
	}

	mask := make([]byte, len(secret))
	if _, err := rand.Read(mask); err != nil {
		return "", fmt.Errorf("generate csrf mask: %w", err)
	}

	maskedSecret := xor(mask, secret)
	return base64.RawURLEncoding.EncodeToString(mask) + ":" + base64.RawURLEncoding.EncodeToString(maskedSecret), nil
}

func (s *Service) ValidateToken(secret []byte, submittedToken string) error {
	if len(secret) != csrfSecretSize {
		return ErrInvalidCSRFCookie
	}

	candidate, err := parseSubmittedToken(submittedToken)
	if err != nil {
		return err
	}

	if subtle.ConstantTimeCompare(secret, candidate) != 1 {
		return ErrInvalidCSRFToken
	}

	return nil
}

func parseSubmittedToken(raw string) ([]byte, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, ErrInvalidCSRFToken
	}

	parts := strings.Split(raw, ":")
	if len(parts) == 2 {
		mask, err := base64.RawURLEncoding.DecodeString(parts[0])
		if err != nil {
			return nil, ErrInvalidCSRFToken
		}
		maskedSecret, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			return nil, ErrInvalidCSRFToken
		}
		if len(mask) != csrfSecretSize || len(maskedSecret) != csrfSecretSize {
			return nil, ErrInvalidCSRFToken
		}
		return xor(mask, maskedSecret), nil
	}

	secret, err := decodeSecret(raw)
	if err != nil {
		return nil, ErrInvalidCSRFToken
	}
	return secret, nil
}

func decodeSecret(raw string) ([]byte, error) {
	decoded, err := base64.RawURLEncoding.DecodeString(strings.TrimSpace(raw))
	if err != nil {
		return nil, ErrInvalidCSRFCookie
	}
	if len(decoded) != csrfSecretSize {
		return nil, ErrInvalidCSRFCookie
	}
	return decoded, nil
}

func xor(a, b []byte) []byte {
	out := make([]byte, len(a))
	for i := range a {
		out[i] = a[i] ^ b[i]
	}
	return out
}
