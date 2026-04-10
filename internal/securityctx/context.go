package securityctx

import (
	"time"

	"github.com/gin-gonic/gin"
)

const identityKey = "request_identity"

type Identity struct {
	UserID    string
	SessionID string
	JTI       string
	OrgID     *string
	ExpiresAt time.Time
}

func SetIdentity(c *gin.Context, identity Identity) {
	c.Set(identityKey, identity)
}

func GetIdentity(c *gin.Context) (Identity, bool) {
	v, ok := c.Get(identityKey)
	if !ok {
		return Identity{}, false
	}

	identity, ok := v.(Identity)
	if !ok {
		return Identity{}, false
	}

	return identity, true
}
