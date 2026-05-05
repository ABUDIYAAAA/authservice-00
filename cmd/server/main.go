package main

import (
	"kael/internal/config"
	"kael/internal/database"
	"kael/internal/health"
	"log"

	"github.com/gin-gonic/gin"
)

// @title           Kael API
// @version         1.0
// @description     Auth API for devclub services.
// @BasePath        /
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Unable to load config:", err)
	}

	pool, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Unable to connect to db:", err)
	}
	defer pool.Close()

	r := gin.Default()
	health.RegisterRoutes(r, pool)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
