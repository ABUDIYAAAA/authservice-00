package tokens

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrTokenInvalid = errors.New("token invalid")

// Repository manages verification and password reset tokens.
type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateEmailVerification(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	query := `
		INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`
	_, err := r.db.Exec(ctx, query, userID, tokenHash, expiresAt)
	return err
}

func (r *Repository) ConsumeEmailVerification(ctx context.Context, tokenHash string) (uuid.UUID, error) {
	return r.consumeToken(ctx, "email_verification_tokens", tokenHash)
}

func (r *Repository) CreatePasswordReset(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	query := `
		INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`
	_, err := r.db.Exec(ctx, query, userID, tokenHash, expiresAt)
	return err
}

func (r *Repository) ConsumePasswordReset(ctx context.Context, tokenHash string) (uuid.UUID, error) {
	return r.consumeToken(ctx, "password_reset_tokens", tokenHash)
}

func (r *Repository) consumeToken(ctx context.Context, table string, tokenHash string) (uuid.UUID, error) {
	query := `
		SELECT id, user_id, expires_at, used_at
		FROM ` + table + `
		WHERE token_hash = $1
		FOR UPDATE`

	var (
		id        uuid.UUID
		userID    uuid.UUID
		expiresAt time.Time
		usedAt    *time.Time
	)

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	row := tx.QueryRow(ctx, query, tokenHash)
	if err := row.Scan(&id, &userID, &expiresAt, &usedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, ErrTokenInvalid
		}
		return uuid.Nil, err
	}

	if usedAt != nil || time.Now().After(expiresAt) {
		return uuid.Nil, ErrTokenInvalid
	}

	update := `UPDATE ` + table + ` SET used_at = $2 WHERE id = $1`
	if _, err := tx.Exec(ctx, update, id, time.Now()); err != nil {
		return uuid.Nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, err
	}

	return userID, nil
}
