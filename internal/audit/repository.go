package audit

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Entry struct {
	OrgID           *string
	UserID          *string
	SessionID       *string
	ServiceID       *string
	Action          string
	ResourceType    string
	ResourceID      *string
	RequestPayload  any
	ResponsePayload any
	IPAddress       string
	UserAgent       string
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Insert(ctx context.Context, entry Entry) error {
	requestJSON := marshalOrNull(entry.RequestPayload)
	responseJSON := marshalOrNull(entry.ResponsePayload)

	_, err := r.pool.Exec(ctx, `
        INSERT INTO audit_logs (
            id,
            org_id,
            user_id,
            session_id,
            service_id,
            action,
            resource_type,
            resource_id,
            request_payload,
            response_payload,
            ip_address,
            user_agent,
            created_at
        ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            NOW()
        )
    `,
		entry.OrgID,
		entry.UserID,
		entry.SessionID,
		entry.ServiceID,
		entry.Action,
		entry.ResourceType,
		entry.ResourceID,
		requestJSON,
		responseJSON,
		entry.IPAddress,
		entry.UserAgent,
	)
	if err != nil {
		return err
	}

	return nil
}

func marshalOrNull(v any) []byte {
	if v == nil {
		return []byte("null")
	}
	b, err := json.Marshal(v)
	if err != nil {
		return []byte("null")
	}
	return b
}

func Ptr[T any](v T) *T {
	return &v
}
