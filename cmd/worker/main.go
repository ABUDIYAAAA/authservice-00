package main

import (
	"log"

	"kael/internal/config"
	"kael/internal/email"
	"kael/internal/workers"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Unable to load config:", err)
	}

	mailer := email.NewClient(cfg)

	log.Println("Worker starting")
	if err := workers.Run(cfg, mailer); err != nil {
		log.Fatal("Worker failed:", err)
	}
}
