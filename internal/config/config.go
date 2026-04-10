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
	JWTSecret             string
	AccessTokenTTLMinutes int
	RefreshTokenTTLDays   int
	AuthPublicRPS         float64
	AuthPublicBurst       int
	AuthPrivateRPS        float64
	AuthPrivateBurst      int
	AdminRPS              float64
	AdminBurst            int
}

func Load() (*Config, error) {
	_ = godotenv.Load(".env", "../.env")
	cfg := &Config{
		Environment:           getString("APP_ENV", "development"),
		Port:                  getString("PORT", "8080"),
		DatabaseURL:           os.Getenv("DATABASE_URL"),
		AllowedOrigins:        splitCSV(os.Getenv("ALLOWED_ORIGINS")),
		JWTSecret:             getString("JWT_SECRET", "dev-secret-change-me"),
		AccessTokenTTLMinutes: getInt("ACCESS_TOKEN_TTL_MINUTES", 15),
		RefreshTokenTTLDays:   getInt("REFRESH_TOKEN_TTL_DAYS", 30),
		AuthPublicRPS:         getFloat("RATE_LIMIT_AUTH_PUBLIC_RPS", 4),
		AuthPublicBurst:       getInt("RATE_LIMIT_AUTH_PUBLIC_BURST", 8),
		AuthPrivateRPS:        getFloat("RATE_LIMIT_AUTH_PRIVATE_RPS", 12),
		AuthPrivateBurst:      getInt("RATE_LIMIT_AUTH_PRIVATE_BURST", 20),
		AdminRPS:              getFloat("RATE_LIMIT_ADMIN_RPS", 2),
		AdminBurst:            getInt("RATE_LIMIT_ADMIN_BURST", 4),
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
