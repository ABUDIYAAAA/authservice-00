package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) FindUserByEmail(ctx context.Context, email string) (*UserRecord, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id::text, email, COALESCE(name, ''), COALESCE(password_hash, ''), email_verified, last_login_at
		FROM users
		WHERE lower(email) = lower($1)
	`, email)

	var user UserRecord
	if err := row.Scan(&user.ID, &user.Email, &user.Name, &user.PasswordHash, &user.EmailVerified, &user.LastLoginAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("find user by email: %w", err)
	}

	return &user, nil
}

func (r *Repository) FindUserByID(ctx context.Context, userID string) (*UserRecord, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id::text, email, COALESCE(name, ''), COALESCE(password_hash, ''), email_verified, last_login_at
		FROM users
		WHERE id = $1
	`, userID)

	var user UserRecord
	if err := row.Scan(&user.ID, &user.Email, &user.Name, &user.PasswordHash, &user.EmailVerified, &user.LastLoginAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("find user by id: %w", err)
	}

	return &user, nil
}

func (r *Repository) IsOrgMember(ctx context.Context, userID, orgID string) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM org_memberships WHERE user_id = $1 AND org_id = $2
		)
	`, userID, orgID).Scan(&ok)
	if err != nil {
		return false, fmt.Errorf("check org membership: %w", err)
	}
	return ok, nil
}

func (r *Repository) CreateSession(ctx context.Context, userID string, orgID *string, deviceID, userAgent, ipAddress string, expiresAt time.Time) (string, error) {
	var sessionID string
	err := r.pool.QueryRow(ctx, `
		INSERT INTO sessions (
			id,
			user_id,
			org_id,
			device_id,
			user_agent,
			ip_address,
			is_active,
			last_activity_at,
			created_at,
			expires_at
		) VALUES (
			gen_random_uuid(),
			$1,
			$2,
			$3,
			$4,
			$5,
			true,
			NOW(),
			NOW(),
			$6
		)
		RETURNING id::text
	`, userID, orgID, emptyToNil(deviceID), emptyToNil(userAgent), emptyToNil(ipAddress), expiresAt).Scan(&sessionID)
	if err != nil {
		return "", fmt.Errorf("create session: %w", err)
	}

	_, _ = r.pool.Exec(ctx, `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, userID)

	return sessionID, nil
}

func (r *Repository) AttachServiceSession(ctx context.Context, sessionID string, serviceID *string) error {
	if serviceID == nil || strings.TrimSpace(*serviceID) == "" {
		return nil
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO service_sessions (id, session_id, service_id, is_logged_out, created_at)
		VALUES (gen_random_uuid(), $1, $2, false, NOW())
		ON CONFLICT (session_id, service_id) DO NOTHING
	`, sessionID, *serviceID)
	if err != nil {
		return fmt.Errorf("attach service session: %w", err)
	}
	return nil
}

func (r *Repository) StoreRefreshToken(ctx context.Context, sessionID, tokenHash, jti string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO refresh_tokens (
			id,
			session_id,
			token_hash,
			jti,
			is_revoked,
			expires_at,
			created_at
		) VALUES (
			gen_random_uuid(),
			$1,
			$2,
			$3,
			false,
			$4,
			NOW()
		)
	`, sessionID, tokenHash, jti, expiresAt)
	if err != nil {
		return fmt.Errorf("store refresh token: %w", err)
	}
	return nil
}

func (r *Repository) GetRefreshTokenByHash(ctx context.Context, tokenHash string) (*RefreshTokenRecord, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT
			rt.id::text,
			rt.session_id::text,
			rt.jti::text,
			rt.is_revoked,
			rt.expires_at,
			s.user_id::text,
			s.org_id::text
		FROM refresh_tokens rt
		LEFT JOIN sessions s ON s.id = rt.session_id
		WHERE rt.token_hash = $1
	`, tokenHash)

	var rec RefreshTokenRecord
	var sessionID sql.NullString
	var jti sql.NullString
	var userID sql.NullString
	var orgID sql.NullString
	if err := row.Scan(&rec.ID, &sessionID, &jti, &rec.IsRevoked, &rec.ExpiresAt, &userID, &orgID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get refresh token by hash: %w", err)
	}

	if sessionID.Valid {
		rec.SessionID = sessionID.String
	}
	if jti.Valid {
		rec.JTI = jti.String
	}
	if userID.Valid {
		rec.UserID = userID.String
	}
	if orgID.Valid {
		rec.OrgID = &orgID.String
	}

	return &rec, nil
}

func (r *Repository) RotateRefreshToken(ctx context.Context, oldTokenID, sessionID, newTokenHash, newJTI string, expiresAt time.Time) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin refresh rotation tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var newTokenID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO refresh_tokens (
			id,
			session_id,
			token_hash,
			jti,
			is_revoked,
			expires_at,
			created_at
		) VALUES (
			gen_random_uuid(),
			$1,
			$2,
			$3,
			false,
			$4,
			NOW()
		)
		RETURNING id::text
	`, sessionID, newTokenHash, newJTI, expiresAt).Scan(&newTokenID); err != nil {
		return fmt.Errorf("insert rotated refresh token: %w", err)
	}

	cmd, err := tx.Exec(ctx, `
		UPDATE refresh_tokens
		SET is_revoked = true,
			replaced_by = $1,
			last_used_at = NOW(),
			session_id = NULL
		WHERE id = $2
	`, newTokenID, oldTokenID)
	if err != nil {
		return fmt.Errorf("revoke previous refresh token: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("refresh token not found")
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit refresh rotation: %w", err)
	}
	return nil
}

func (r *Repository) RevokeSession(ctx context.Context, sessionID string, serviceID *string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin revoke session tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE refresh_tokens
		SET is_revoked = true,
			last_used_at = NOW()
		WHERE session_id = $1 AND is_revoked = false
	`, sessionID); err != nil {
		return fmt.Errorf("revoke refresh tokens: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE sessions
		SET is_active = false,
			last_activity_at = NOW()
		WHERE id = $1
	`, sessionID); err != nil {
		return fmt.Errorf("deactivate session: %w", err)
	}

	if serviceID != nil && strings.TrimSpace(*serviceID) != "" {
		if _, err := tx.Exec(ctx, `
			UPDATE service_sessions
			SET is_logged_out = true
			WHERE session_id = $1 AND service_id = $2
		`, sessionID, *serviceID); err != nil {
			return fmt.Errorf("logout service session: %w", err)
		}
	} else {
		if _, err := tx.Exec(ctx, `
			UPDATE service_sessions
			SET is_logged_out = true
			WHERE session_id = $1
		`, sessionID); err != nil {
			return fmt.Errorf("logout all service sessions: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit revoke session: %w", err)
	}
	return nil
}

func (r *Repository) IsAccessTokenBlacklisted(ctx context.Context, jti string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM access_token_blacklist WHERE jti = $1
		)
	`, jti).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check access token blacklist: %w", err)
	}
	return exists, nil
}

func (r *Repository) BlacklistAccessToken(ctx context.Context, jti, sessionID string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO access_token_blacklist (
			jti,
			session_id,
			revoked_at,
			expires_at,
			created_at
		) VALUES (
			$1,
			$2,
			NOW(),
			$3,
			NOW()
		)
		ON CONFLICT (jti) DO NOTHING
	`, jti, sessionID, expiresAt)
	if err != nil {
		return fmt.Errorf("blacklist access token: %w", err)
	}
	return nil
}

func emptyToNil(s string) *string {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
