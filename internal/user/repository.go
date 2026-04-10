package user

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) IsSuperAdmin(ctx context.Context, userID string) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM platform_roles
			WHERE user_id = $1
			  AND upper(role) = 'SUPER_ADMIN'
		)
	`, userID).Scan(&ok)
	if err != nil {
		return false, fmt.Errorf("check super admin: %w", err)
	}
	return ok, nil
}

func (r *Repository) IsOrgAdmin(ctx context.Context, userID, orgID string) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM org_memberships
			WHERE user_id = $1
			  AND org_id = $2
			  AND upper(role) = 'ADMIN'
		)
	`, userID, orgID).Scan(&ok)
	if err != nil {
		return false, fmt.Errorf("check org admin: %w", err)
	}
	return ok, nil
}

func (r *Repository) CreateOrganization(ctx context.Context, name, creatorUserID string) (*Organization, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin create organization tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	org := &Organization{}
	err = tx.QueryRow(ctx, `
		INSERT INTO organizations (id, name, created_at)
		VALUES (gen_random_uuid(), $1, NOW())
		RETURNING id::text, name, created_at
	`, name).Scan(&org.ID, &org.Name, &org.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create organization: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO org_memberships (id, user_id, org_id, role, created_at)
		VALUES (gen_random_uuid(), $1, $2, 'ADMIN', NOW())
		ON CONFLICT (user_id, org_id)
		DO UPDATE SET role = 'ADMIN'
	`, creatorUserID, org.ID)
	if err != nil {
		return nil, fmt.Errorf("create creator membership: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit create organization tx: %w", err)
	}

	return org, nil
}

func (r *Repository) ListOrganizations(ctx context.Context) ([]Organization, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, name, created_at
		FROM organizations
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list organizations: %w", err)
	}
	defer rows.Close()

	out := make([]Organization, 0)
	for rows.Next() {
		var org Organization
		if err := rows.Scan(&org.ID, &org.Name, &org.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan organization: %w", err)
		}
		out = append(out, org)
	}

	return out, nil
}

func (r *Repository) AssignOrgAdmin(ctx context.Context, orgID, userID string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO org_memberships (id, user_id, org_id, role, created_at)
		VALUES (gen_random_uuid(), $1, $2, 'ADMIN', NOW())
		ON CONFLICT (user_id, org_id)
		DO UPDATE SET role = 'ADMIN'
	`, userID, orgID)
	if err != nil {
		return fmt.Errorf("assign org admin: %w", err)
	}
	return nil
}

func (r *Repository) UpsertOrgMembership(ctx context.Context, orgID, userID, role string) error {
	role = strings.ToUpper(strings.TrimSpace(role))
	if role != "ADMIN" && role != "MEMBER" {
		return fmt.Errorf("invalid role")
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO org_memberships (id, user_id, org_id, role, created_at)
		VALUES (gen_random_uuid(), $1, $2, $3, NOW())
		ON CONFLICT (user_id, org_id)
		DO UPDATE SET role = EXCLUDED.role
	`, userID, orgID, role)
	if err != nil {
		return fmt.Errorf("upsert org membership: %w", err)
	}
	return nil
}

func (r *Repository) ListOrgUsers(ctx context.Context, orgID string) ([]OrgUser, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT u.id::text, u.email, COALESCE(u.name, ''), om.role, om.created_at
		FROM org_memberships om
		JOIN users u ON u.id = om.user_id
		WHERE om.org_id = $1
		ORDER BY om.created_at DESC
	`, orgID)
	if err != nil {
		return nil, fmt.Errorf("list org users: %w", err)
	}
	defer rows.Close()

	out := make([]OrgUser, 0)
	for rows.Next() {
		var item OrgUser
		if err := rows.Scan(&item.UserID, &item.Email, &item.Name, &item.Role, &item.JoinedAt); err != nil {
			return nil, fmt.Errorf("scan org user: %w", err)
		}
		out = append(out, item)
	}

	return out, nil
}

func (r *Repository) ListOrgServices(ctx context.Context, orgID string) ([]OrgService, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id::text, name, client_id, is_active, created_at
		FROM services
		WHERE org_id = $1
		ORDER BY created_at DESC
	`, orgID)
	if err != nil {
		return nil, fmt.Errorf("list org services: %w", err)
	}
	defer rows.Close()

	out := make([]OrgService, 0)
	for rows.Next() {
		var svc OrgService
		if err := rows.Scan(&svc.ID, &svc.Name, &svc.ClientID, &svc.IsActive, &svc.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan service: %w", err)
		}
		out = append(out, svc)
	}

	return out, nil
}

func (r *Repository) CreateOrgService(ctx context.Context, orgID, name, clientID, clientSecret string, redirectURIs []string) (*OrgService, error) {
	svc := &OrgService{}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO services (
			id,
			org_id,
			name,
			client_id,
			client_secret,
			redirect_uris,
			is_active,
			created_at
		) VALUES (
			gen_random_uuid(),
			$1,
			$2,
			$3,
			$4,
			$5,
			true,
			NOW()
		)
		RETURNING id::text, name, client_id, is_active, created_at
	`, orgID, name, clientID, clientSecret, redirectURIs).Scan(&svc.ID, &svc.Name, &svc.ClientID, &svc.IsActive, &svc.CreatedAt)
	if err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok {
			return nil, fmt.Errorf("create org service (%s): %w", pgErr.Code, err)
		}
		return nil, fmt.Errorf("create org service: %w", err)
	}
	return svc, nil
}
