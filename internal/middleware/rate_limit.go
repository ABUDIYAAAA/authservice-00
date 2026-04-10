package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type clientLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type IPRateLimiter struct {
	limit   rate.Limit
	burst   int
	ttl     time.Duration
	clients map[string]*clientLimiter
	mu      sync.Mutex
}

func NewIPRateLimiter(limit rate.Limit, burst int, ttl time.Duration) *IPRateLimiter {
	return &IPRateLimiter{
		limit:   limit,
		burst:   burst,
		ttl:     ttl,
		clients: make(map[string]*clientLimiter),
	}
}

func (l *IPRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := l.getLimiter(ip)
		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "rate limit exceeded",
			})
			return
		}
		c.Next()
	}
}

func (l *IPRateLimiter) getLimiter(ip string) *rate.Limiter {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	l.cleanup(now)

	if cl, ok := l.clients[ip]; ok {
		cl.lastSeen = now
		return cl.limiter
	}

	limiter := rate.NewLimiter(l.limit, l.burst)
	l.clients[ip] = &clientLimiter{
		limiter:  limiter,
		lastSeen: now,
	}
	return limiter
}

func (l *IPRateLimiter) cleanup(now time.Time) {
	for ip, cl := range l.clients {
		if now.Sub(cl.lastSeen) > l.ttl {
			delete(l.clients, ip)
		}
	}
}
