package mfa

import (
	"time"

	"github.com/google/uuid"
)

type Factor struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	FactorType      string
	SecretEncrypted []byte
	Enabled         bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
	LastUsedAt      *time.Time
}

type Challenge struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	TokenHash       string
	RequiredFactors []string
	VerifiedFactors []string
	EmailCodeHash   *string
	ExpiresAt       time.Time
	ConsumedAt      *time.Time
	DeviceID        *string
	IPAddress       *string
	UserAgent       *string
	CreatedAt       time.Time
}
