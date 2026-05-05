package middleware

import (
	"net/http"
	"sync"
	"time"

	"kael/internal/httpx"

	"github.com/gin-gonic/gin"
	"go.uber.org/ratelimit"
)

// limiterEntry holds a per-IP leaky-bucket limiter and the time it was last used.
type limiterEntry struct {
	rl       ratelimit.Limiter
	lastUsed time.Time
}

// limiterStore manages per-IP limiters for a single route bucket.
type limiterStore struct {
	mu      sync.Mutex
	entries map[string]*limiterEntry
	rps     int // requests per second derived from (limit / window)
}

func newLimiterStore(rps int) *limiterStore {
	s := &limiterStore{
		entries: make(map[string]*limiterEntry),
		rps:     rps,
	}
	// Background goroutine to evict idle limiters older than 5 minutes.
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			s.evict(5 * time.Minute)
		}
	}()
	return s
}

func (s *limiterStore) take(ip string) {
	s.mu.Lock()
	entry, ok := s.entries[ip]
	if !ok {
		entry = &limiterEntry{
			rl: ratelimit.New(s.rps),
		}
		s.entries[ip] = entry
	}
	entry.lastUsed = time.Now()
	rl := entry.rl
	s.mu.Unlock()

	rl.Take() // blocks briefly to enforce the rate
}

func (s *limiterStore) evict(idleTimeout time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	cutoff := time.Now().Add(-idleTimeout)
	for ip, e := range s.entries {
		if e.lastUsed.Before(cutoff) {
			delete(s.entries, ip)
		}
	}
}

// stores is the global registry of named limiter buckets.
var (
	storesMu sync.Mutex
	stores   = make(map[string]*limiterStore)
)

func getStore(name string, rps int) *limiterStore {
	storesMu.Lock()
	defer storesMu.Unlock()
	if s, ok := stores[name]; ok {
		return s
	}
	s := newLimiterStore(rps)
	stores[name] = s
	return s
}

// RateLimit returns a Gin middleware that enforces a leaky-bucket rate limit
// per client IP. limit/window is converted to an approximate RPS value.
// If limit <= 0 the middleware is a no-op.
//
// Example: RateLimit("rl:login", 20, time.Minute)  →  ~0.33 rps per IP
func RateLimit(name string, limit int, window time.Duration) gin.HandlerFunc {
	if limit <= 0 || window <= 0 {
		return func(c *gin.Context) { c.Next() }
	}

	// Convert limit-per-window to requests-per-second (minimum 1).
	rps := int(float64(limit) / window.Seconds())
	if rps < 1 {
		rps = 1
	}

	store := getStore(name, rps)

	return func(c *gin.Context) {
		ip := c.ClientIP()

		done := make(chan struct{})
		go func() {
			store.take(ip)
			close(done)
		}()

		select {
		case <-done:
			c.Next()
		case <-time.After(3 * time.Second):
			// Caller waited too long — return 429 rather than blocking indefinitely.
			httpx.RespondError(c, http.StatusTooManyRequests, "rate_limited", "too many requests, please slow down", nil)
			c.Abort()
		}
	}
}
