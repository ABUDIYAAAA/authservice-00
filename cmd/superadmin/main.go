package main

import (
	"authservice/internal/config"
	"authservice/internal/database"
	"context"
	"flag"
	"fmt"
	"log"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	email := flag.String("email", "", "super admin email")
	password := flag.String("password", "", "super admin password")
	name := flag.String("name", "", "super admin display name")
	flag.Parse()

	if strings.TrimSpace(*email) == "" || strings.TrimSpace(*password) == "" || strings.TrimSpace(*name) == "" {
		log.Fatal("all flags are required: --email --password --name")
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatal("load config: ", err)
	}

	ctx := context.Background()
	pool, err := database.NewPool(ctx, cfg.DatabaseURL)

	log.Println(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("database connection failed: ", err)
	}
	defer pool.Close()

	hash, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("hash password: ", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		log.Fatal("begin tx: ", err)
	}
	defer tx.Rollback(ctx)

	var userID string
	err = tx.QueryRow(ctx, `
		INSERT INTO users (
			id,
			email,
			password_hash,
			name,
			email_verified,
			created_at,
			updated_at
		) VALUES (
			gen_random_uuid(),
			$1,
			$2,
			$3,
			true,
			NOW(),
			NOW()
		)
		ON CONFLICT (email)
		DO UPDATE SET
			password_hash = EXCLUDED.password_hash,
			name = EXCLUDED.name,
			updated_at = NOW()
		RETURNING id::text
	`, strings.TrimSpace(strings.ToLower(*email)), string(hash), strings.TrimSpace(*name)).Scan(&userID)
	if err != nil {
		log.Fatal("upsert user: ", err)
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO platform_roles (id, user_id, role, created_at)
		VALUES (gen_random_uuid(), $1, 'SUPER_ADMIN', NOW())
		ON CONFLICT (user_id, role) DO NOTHING
	`, userID); err != nil {
		log.Fatal("assign super admin role: ", err)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatal("commit tx: ", err)
	}

	fmt.Printf("super admin ready: user_id=%s email=%s\n", userID, strings.TrimSpace(strings.ToLower(*email)))
}
