package csrf

import "errors"

var (
	ErrInvalidCSRFCookie  = errors.New("invalid csrf cookie")
	ErrInvalidCSRFToken   = errors.New("invalid csrf token")
	ErrCSRFOriginRejected = errors.New("csrf origin check failed")
	ErrCSRFRefererInvalid = errors.New("csrf referer check failed")
)
