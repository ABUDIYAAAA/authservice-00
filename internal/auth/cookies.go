package auth

import (
	"net/http"
	"strings"
	"time"

	"kael/internal/config"
	"kael/internal/sessions"

	"github.com/gin-gonic/gin"
)

func SetSessionCookie(c *gin.Context, cfg *config.Config, token string, deviceID string, expiresAt time.Time) {
	cookie := &http.Cookie{
		Name:     cfg.SessionCookieName,
		Value:    sessions.EncodeCookieValue(token, deviceID),
		Path:     "/",
		Domain:   cfg.SessionCookieDomain,
		HttpOnly: true,
		Secure:   cfg.SessionCookieSecure,
		Expires:  expiresAt,
		SameSite: mapSameSite(cfg.SessionCookieSameSite),
	}
	http.SetCookie(c.Writer, cookie)
}

func ClearSessionCookie(c *gin.Context, cfg *config.Config) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cfg.SessionCookieName,
		Value:    "",
		Path:     "/",
		Domain:   cfg.SessionCookieDomain,
		HttpOnly: true,
		Secure:   cfg.SessionCookieSecure,
		MaxAge:   -1,
		SameSite: mapSameSite(cfg.SessionCookieSameSite),
	})
}

func mapSameSite(value string) http.SameSite {
	switch strings.ToLower(value) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}
