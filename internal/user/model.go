package user

import "time"

type Organization struct {
	ID        string    `db:"id"`
	Name      string    `db:"name"`
	CreatedAt time.Time `db:"created_at"`
}

type OrgUser struct {
	UserID   string    `db:"user_id"`
	Email    string    `db:"email"`
	Name     string    `db:"name"`
	Role     string    `db:"role"`
	JoinedAt time.Time `db:"joined_at"`
}

type OrgService struct {
	ID        string    `db:"id"`
	Name      string    `db:"name"`
	ClientID  string    `db:"client_id"`
	IsActive  bool      `db:"is_active"`
	CreatedAt time.Time `db:"created_at"`
}
