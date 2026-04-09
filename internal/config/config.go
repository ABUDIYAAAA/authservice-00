package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment string
	Port        string
	DatabaseURL string
}

func Load() (*Config, error) {
	_ = godotenv.Load(".env", "../.env")
	cfg := &Config{
		Environment: os.Getenv("APP_ENV"),
		Port:        os.Getenv("PORT"),
		DatabaseURL: os.Getenv("DATABASE_URL")}

	return cfg, nil
}
