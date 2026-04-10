package user

import "errors"

var (
	ErrForbiddenRole       = errors.New("forbidden")
	ErrInvalidRole         = errors.New("invalid role")
	ErrMissingOrganization = errors.New("missing organization")
)
