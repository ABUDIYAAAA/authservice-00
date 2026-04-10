package csrf

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

type MiddlewareConfig struct {
	TrustedOrigins []string
	HeaderNames    []string
	FormFieldName  string
}

type Middleware struct {
	service        *Service
	trustedOrigins map[string]struct{}
	headerNames    []string
	formFieldName  string
}

func NewMiddleware(service *Service, cfg MiddlewareConfig) *Middleware {
	trusted := make(map[string]struct{}, len(cfg.TrustedOrigins))
	for _, raw := range cfg.TrustedOrigins {
		if normalized, ok := normalizeOrigin(raw); ok {
			trusted[normalized] = struct{}{}
		}
	}

	headers := make([]string, 0)
	for _, raw := range cfg.HeaderNames {
		if h := strings.TrimSpace(raw); h != "" {
			headers = append(headers, h)
		}
	}
	if len(headers) == 0 {
		headers = []string{"X-CSRF-Token", "X-CSRFToken"}
	}

	formFieldName := strings.TrimSpace(cfg.FormFieldName)
	if formFieldName == "" {
		formFieldName = "csrfmiddlewaretoken"
	}

	return &Middleware{
		service:        service,
		trustedOrigins: trusted,
		headerNames:    headers,
		formFieldName:  formFieldName,
	}
}

func (m *Middleware) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret, err := m.service.EnsureCSRFCookie(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to initialize csrf cookie"})
			return
		}

		if isSafeMethod(c.Request.Method) {
			c.Next()
			return
		}

		if err := m.validateOriginOrReferer(c); err != nil {
			status := http.StatusForbidden
			message := "csrf check failed"
			if err == ErrCSRFOriginRejected {
				message = "csrf origin check failed"
			}
			if err == ErrCSRFRefererInvalid {
				message = "csrf referer check failed"
			}
			c.AbortWithStatusJSON(status, gin.H{"error": message})
			return
		}

		submitted := m.extractSubmittedToken(c)
		if err := m.service.ValidateToken(secret, submitted); err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "csrf token missing or invalid"})
			return
		}

		c.Next()
	}
}

func (m *Middleware) validateOriginOrReferer(c *gin.Context) error {
	origin := strings.TrimSpace(c.GetHeader("Origin"))
	if origin != "" {
		if m.isTrusted(c, origin) {
			return nil
		}
		return ErrCSRFOriginRejected
	}

	if !isSecureRequest(c) {
		return nil
	}

	referer := strings.TrimSpace(c.GetHeader("Referer"))
	if referer == "" {
		return ErrCSRFRefererInvalid
	}

	refererURL, err := url.Parse(referer)
	if err != nil || refererURL.Scheme == "" || refererURL.Host == "" {
		return ErrCSRFRefererInvalid
	}

	refererOrigin := strings.ToLower(refererURL.Scheme + "://" + refererURL.Host)
	if m.isTrusted(c, refererOrigin) {
		return nil
	}

	return ErrCSRFRefererInvalid
}

func (m *Middleware) isTrusted(c *gin.Context, origin string) bool {
	normalized, ok := normalizeOrigin(origin)
	if !ok {
		return false
	}

	if normalized == requestOrigin(c) {
		return true
	}

	_, ok = m.trustedOrigins[normalized]
	return ok
}

func (m *Middleware) extractSubmittedToken(c *gin.Context) string {
	for _, name := range m.headerNames {
		if value := strings.TrimSpace(c.GetHeader(name)); value != "" {
			return value
		}
	}

	if value := strings.TrimSpace(c.PostForm(m.formFieldName)); value != "" {
		return value
	}

	return ""
}

func isSafeMethod(method string) bool {
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodTrace:
		return true
	default:
		return false
	}
}

func isSecureRequest(c *gin.Context) bool {
	if c.Request.TLS != nil {
		return true
	}

	if proto := strings.TrimSpace(c.GetHeader("X-Forwarded-Proto")); proto != "" {
		first := strings.ToLower(strings.TrimSpace(strings.Split(proto, ",")[0]))
		return first == "https"
	}

	return false
}

func requestOrigin(c *gin.Context) string {
	scheme := "http"
	if isSecureRequest(c) {
		scheme = "https"
	}

	host := strings.TrimSpace(c.GetHeader("X-Forwarded-Host"))
	if host == "" {
		host = strings.TrimSpace(c.Request.Host)
	}
	if host == "" {
		return ""
	}
	host = strings.TrimSpace(strings.Split(host, ",")[0])

	return strings.ToLower(scheme + "://" + host)
}

func normalizeOrigin(raw string) (string, bool) {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || u.Scheme == "" || u.Host == "" {
		return "", false
	}
	return strings.ToLower(u.Scheme + "://" + u.Host), true
}
