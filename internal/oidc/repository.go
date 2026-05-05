package oidc

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Authorization code operations

func (r *Repository) CreateAuthCode(ctx context.Context, code AuthorizationCode) (*AuthorizationCode, error) {
	query := `
		INSERT INTO oidc_authorization_codes
			(code_hash, client_id, user_id, session_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, code_hash, client_id, user_id, session_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method, expires_at, consumed_at, created_at`

	row := r.db.QueryRow(ctx, query,
		code.CodeHash, code.ClientPK, code.UserID, code.SessionID,
		code.RedirectURI, code.Scope, code.State, code.Nonce,
		code.CodeChallenge, code.CodeChallengeMethod, code.ExpiresAt,
	)
	return scanAuthCode(row)
}

func (r *Repository) FindAuthCodeByHash(ctx context.Context, codeHash string) (*AuthorizationCode, error) {
	query := `
		SELECT id, code_hash, client_id, user_id, session_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method, expires_at, consumed_at, created_at
		FROM oidc_authorization_codes
		WHERE code_hash = $1`
	return scanAuthCode(r.db.QueryRow(ctx, query, codeHash))
}

func (r *Repository) ConsumeAuthCode(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE oidc_authorization_codes SET consumed_at = $2 WHERE id = $1`,
		id, time.Now(),
	)
	return err
}

// Token operations

func (r *Repository) CreateToken(ctx context.Context, token OIDCToken) (*OIDCToken, error) {
	query := `
		INSERT INTO oidc_tokens
			(client_id, user_id, session_id, access_token_hash, refresh_token_hash, scope, access_expires_at, refresh_expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, client_id, user_id, session_id, access_token_hash, refresh_token_hash, scope, access_expires_at, refresh_expires_at, revoked_at, created_at`

	row := r.db.QueryRow(ctx, query,
		token.ClientPK, token.UserID, token.SessionID,
		token.AccessTokenHash, token.RefreshTokenHash, token.Scope,
		token.AccessExpiresAt, token.RefreshExpiresAt,
	)
	return scanOIDCToken(row)
}

func (r *Repository) FindTokenByAccessHash(ctx context.Context, hash string) (*OIDCToken, error) {
	query := `
		SELECT id, client_id, user_id, session_id, access_token_hash, refresh_token_hash, scope, access_expires_at, refresh_expires_at, revoked_at, created_at
		FROM oidc_tokens
		WHERE access_token_hash = $1`
	return scanOIDCToken(r.db.QueryRow(ctx, query, hash))
}

func (r *Repository) FindTokenByRefreshHash(ctx context.Context, hash string) (*OIDCToken, error) {
	query := `
		SELECT id, client_id, user_id, session_id, access_token_hash, refresh_token_hash, scope, access_expires_at, refresh_expires_at, revoked_at, created_at
		FROM oidc_tokens
		WHERE refresh_token_hash = $1`
	return scanOIDCToken(r.db.QueryRow(ctx, query, hash))
}

func (r *Repository) RevokeToken(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE oidc_tokens SET revoked_at = $2 WHERE id = $1`,
		id, time.Now(),
	)
	return err
}

func (r *Repository) RevokeTokenByAccessHash(ctx context.Context, hash string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE oidc_tokens SET revoked_at = $2 WHERE access_token_hash = $1 AND revoked_at IS NULL`,
		hash, time.Now(),
	)
	return err
}

func (r *Repository) RevokeTokenByRefreshHash(ctx context.Context, hash string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE oidc_tokens SET revoked_at = $2 WHERE refresh_token_hash = $1 AND revoked_at IS NULL`,
		hash, time.Now(),
	)
	return err
}

func (r *Repository) RevokeTokensByUserAndClient(ctx context.Context, userID uuid.UUID, clientPK uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE oidc_tokens SET revoked_at = $3 WHERE user_id = $1 AND client_id = $2 AND revoked_at IS NULL`,
		userID, clientPK, time.Now(),
	)
	return err
}

// Session validation helper: checks if the linked platform session is still active
func (r *Repository) IsSessionActive(ctx context.Context, sessionID uuid.UUID) (bool, error) {
	var isActive bool
	var revokedAt *time.Time
	var expiresAt time.Time

	err := r.db.QueryRow(ctx,
		`SELECT is_active, revoked_at, expires_at FROM sessions WHERE id = $1`,
		sessionID,
	).Scan(&isActive, &revokedAt, &expiresAt)
	if err != nil {
		return false, err
	}

	if !isActive || revokedAt != nil || time.Now().After(expiresAt) {
		return false, nil
	}
	return true, nil
}

func scanAuthCode(row pgx.Row) (*AuthorizationCode, error) {
	var ac AuthorizationCode
	if err := row.Scan(
		&ac.ID, &ac.CodeHash, &ac.ClientPK, &ac.UserID, &ac.SessionID,
		&ac.RedirectURI, &ac.Scope, &ac.State, &ac.Nonce,
		&ac.CodeChallenge, &ac.CodeChallengeMethod,
		&ac.ExpiresAt, &ac.ConsumedAt, &ac.CreatedAt,
	); err != nil {
		return nil, err
	}
	return &ac, nil
}

func scanOIDCToken(row pgx.Row) (*OIDCToken, error) {
	var t OIDCToken
	if err := row.Scan(
		&t.ID, &t.ClientPK, &t.UserID, &t.SessionID,
		&t.AccessTokenHash, &t.RefreshTokenHash, &t.Scope,
		&t.AccessExpiresAt, &t.RefreshExpiresAt,
		&t.RevokedAt, &t.CreatedAt,
	); err != nil {
		return nil, err
	}
	return &t, nil
}
