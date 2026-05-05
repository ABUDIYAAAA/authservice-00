package middleware

import (
	"github.com/gin-gonic/gin"
)

// DevStaticDeviceID injects a static device ID if the X-Device-ID header is missing.
// This is intended for development purposes only.
func DevStaticDeviceID(deviceID string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetHeader("X-Device-ID") == "" {
			c.Request.Header.Set("X-Device-ID", deviceID)
		}
		c.Next()
	}
}
