package oauth

import (
	"time"

	"github.com/google/uuid"
)

type Account struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	Provider       string
	ProviderUserID string
	Email          *string
	EmailVerified  bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
}
