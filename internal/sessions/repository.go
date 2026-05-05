package sessions

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

func (r *Repository) Create(ctx context.Context, session Session) (*Session, error) {
	query := `
		INSERT INTO sessions (user_id, device_id, session_token_hash, ip_address, user_agent, expires_at, is_active, mfa_pending)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, device_id, session_token_hash, ip_address, user_agent, created_at, last_seen_at, expires_at, revoked_at, is_active, mfa_pending`

	row := r.db.QueryRow(ctx, query,
		session.UserID,
		session.DeviceID,
		session.TokenHash,
		session.IPAddress,
		session.UserAgent,
		session.ExpiresAt,
		session.IsActive,
		session.MFAPending,
	)
	return scanSession(row)
}

func (r *Repository) RevokeActiveByUserDevice(ctx context.Context, userID uuid.UUID, deviceID string) error {
	query := `
		UPDATE sessions
		SET revoked_at = $3, is_active = false
		WHERE user_id = $1 AND device_id = $2 AND is_active = true`
	_, err := r.db.Exec(ctx, query, userID, deviceID, time.Now())
	return err
}

func (r *Repository) FindByTokenHash(ctx context.Context, tokenHash string) (*Session, error) {
	query := `
		SELECT id, user_id, device_id, session_token_hash, ip_address, user_agent, created_at, last_seen_at, expires_at, revoked_at, is_active, mfa_pending
		FROM sessions WHERE session_token_hash = $1`
	row := r.db.QueryRow(ctx, query, tokenHash)
	return scanSession(row)
}

func (r *Repository) ListByUser(ctx context.Context, userID uuid.UUID) ([]Session, error) {
	query := `
		SELECT id, user_id, device_id, session_token_hash, ip_address, user_agent, created_at, last_seen_at, expires_at, revoked_at, is_active, mfa_pending
		FROM sessions WHERE user_id = $1 ORDER BY created_at DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		session, err := scanSession(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, *session)
	}
	return sessions, rows.Err()
}

func (r *Repository) RevokeByID(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	query := `
		UPDATE sessions
		SET revoked_at = $3, is_active = false
		WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, sessionID, userID, time.Now())
	return err
}

func (r *Repository) UpdateLastSeen(ctx context.Context, sessionID uuid.UUID) error {
	query := `UPDATE sessions SET last_seen_at = $2 WHERE id = $1`
	_, err := r.db.Exec(ctx, query, sessionID, time.Now())
	return err
}

func (r *Repository) RotateToken(ctx context.Context, sessionID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	query := `
		UPDATE sessions
		SET session_token_hash = $2, expires_at = $3, last_seen_at = $4
		WHERE id = $1`
	_, err := r.db.Exec(ctx, query, sessionID, tokenHash, expiresAt, time.Now())
	return err
}

func (r *Repository) MarkConsumed(ctx context.Context, sessionID uuid.UUID) error {
	query := `UPDATE sessions SET mfa_pending = false, is_active = true WHERE id = $1`
	_, err := r.db.Exec(ctx, query, sessionID)
	return err
}

func (r *Repository) RevokeByTokenHash(ctx context.Context, tokenHash string) error {
	query := `UPDATE sessions SET revoked_at = $2, is_active = false WHERE session_token_hash = $1`
	_, err := r.db.Exec(ctx, query, tokenHash, time.Now())
	return err
}

func scanSession(row pgx.Row) (*Session, error) {
	var session Session
	if err := row.Scan(
		&session.ID,
		&session.UserID,
		&session.DeviceID,
		&session.TokenHash,
		&session.IPAddress,
		&session.UserAgent,
		&session.CreatedAt,
		&session.LastSeenAt,
		&session.ExpiresAt,
		&session.RevokedAt,
		&session.IsActive,
		&session.MFAPending,
	); err != nil {
		return nil, err
	}
	return &session, nil
}
