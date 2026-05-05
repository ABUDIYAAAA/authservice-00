package middleware

import (
	"fmt"
	"net/http"
	"time"

	"kael/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func RateLimit(client *redis.Client, keyPrefix string, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if client == nil {
			c.Next()
			return
		}

		key := fmt.Sprintf("%s:%s", keyPrefix, c.ClientIP())
		ctx := c.Request.Context()
		count, err := client.Incr(ctx, key).Result()
		if err != nil {
			httpx.RespondError(c, http.StatusServiceUnavailable, "rate_limit_unavailable", "rate limiting unavailable", nil)
			c.Abort()
			return
		}

		if count == 1 {
			_ = client.Expire(ctx, key, window).Err()
		}

		if int(count) > limit {
			httpx.RespondError(c, http.StatusTooManyRequests, "rate_limited", "too many requests", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
