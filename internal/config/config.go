package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment           string
	Port                  string
	DatabaseURL           string
	AllowedOrigins        []string
	CSRFTrustedOrigins    []string
	JWTSecret             string
	AccessTokenTTLMinutes int
	RefreshTokenTTLDays   int
	AuthPublicRPS         float64
	AuthPublicBurst       int
	AuthPrivateRPS        float64
	AuthPrivateBurst      int
	AdminRPS              float64
	AdminBurst            int
	CSRFCookieName        string
	CSRFCookieDomain      string
	CSRFCookiePath        string
	CSRFCookieSecure      bool
	CSRFCookieHTTPOnly    bool
	CSRFCookieSameSite    string
	CSRFCookieMaxAgeSec   int
	CSRFHeaderName        string
}

func Load() (*Config, error) {
	_ = godotenv.Load(".env", "../.env")
	env := getString("APP_ENV", "development")
	allowedOrigins := splitCSV(os.Getenv("ALLOWED_ORIGINS"))
	csrfTrustedOrigins := splitCSV(os.Getenv("CSRF_TRUSTED_ORIGINS"))
	if len(csrfTrustedOrigins) == 0 {
		csrfTrustedOrigins = allowedOrigins
	}

	cfg := &Config{
		Environment:           env,
		Port:                  getString("PORT", "8080"),
		DatabaseURL:           os.Getenv("DATABASE_URL"),
		AllowedOrigins:        allowedOrigins,
		CSRFTrustedOrigins:    csrfTrustedOrigins,
		JWTSecret:             getString("JWT_SECRET", "dev-secret-change-me"),
		AccessTokenTTLMinutes: getInt("ACCESS_TOKEN_TTL_MINUTES", 15),
		RefreshTokenTTLDays:   getInt("REFRESH_TOKEN_TTL_DAYS", 30),
		AuthPublicRPS:         getFloat("RATE_LIMIT_AUTH_PUBLIC_RPS", 4),
		AuthPublicBurst:       getInt("RATE_LIMIT_AUTH_PUBLIC_BURST", 8),
		AuthPrivateRPS:        getFloat("RATE_LIMIT_AUTH_PRIVATE_RPS", 12),
		AuthPrivateBurst:      getInt("RATE_LIMIT_AUTH_PRIVATE_BURST", 20),
		AdminRPS:              getFloat("RATE_LIMIT_ADMIN_RPS", 2),
		AdminBurst:            getInt("RATE_LIMIT_ADMIN_BURST", 4),
		CSRFCookieName:        getString("CSRF_COOKIE_NAME", "csrftoken"),
		CSRFCookieDomain:      strings.TrimSpace(os.Getenv("CSRF_COOKIE_DOMAIN")),
		CSRFCookiePath:        getString("CSRF_COOKIE_PATH", "/"),
		CSRFCookieSecure:      getBool("CSRF_COOKIE_SECURE", env == "production"),
		CSRFCookieHTTPOnly:    getBool("CSRF_COOKIE_HTTPONLY", false),
		CSRFCookieSameSite:    getString("CSRF_COOKIE_SAMESITE", "Lax"),
		CSRFCookieMaxAgeSec:   getInt("CSRF_COOKIE_MAX_AGE_SECONDS", 31536000),
		CSRFHeaderName:        getString("CSRF_HEADER_NAME", "X-CSRF-Token"),
	}

	return cfg, nil
}

func splitCSV(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		v := strings.TrimSpace(part)
		if v != "" {
			out = append(out, v)
		}
	}
	return out
}

func getString(key, defaultValue string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return defaultValue
	}
	return v
}

func getInt(key string, defaultValue int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return defaultValue
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return defaultValue
	}
	return n
}

func getFloat(key string, defaultValue float64) float64 {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return defaultValue
	}
	n, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return defaultValue
	}
	return n
}

func getBool(key string, defaultValue bool) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if v == "" {
		return defaultValue
	}
	if v == "1" || v == "true" || v == "yes" || v == "on" {
		return true
	}
	if v == "0" || v == "false" || v == "no" || v == "off" {
		return false
	}
	return defaultValue
}
