package auth

import "errors"

var (
	ErrInvalidCredentials   = errors.New("invalid credentials")
	ErrOrgMembershipDenied  = errors.New("user is not a member of the requested organization")
	ErrInvalidRefreshToken  = errors.New("invalid refresh token")
	ErrUnauthorized         = errors.New("unauthorized")
	ErrUserNotFound         = errors.New("user not found")
	ErrInvalidBearerToken   = errors.New("invalid bearer token")
	ErrMissingAuthorization = errors.New("missing authorization header")
)
