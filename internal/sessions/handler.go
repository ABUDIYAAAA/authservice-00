package sessions

import (
	"net/http"
	"time"

	"kael/internal/ctxkeys"
	"kael/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// List returns all active sessions for the user
// @Summary      List sessions
// @Description  Get a list of all active sessions for the authenticated user
// @Tags         sessions
// @Produce      json
// @Success      200  {object}  httpx.Response{data=map[string][]map[string]any}
// @Failure      401  {object}  httpx.Response{error=httpx.ErrorResponse}
// @Router       /sessions [get]
func (h *Handler) List(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		httpx.RespondError(c, http.StatusUnauthorized, "session_missing", "authentication required", nil)
		return
	}

	sessions, err := h.service.List(c.Request.Context(), userID)
	if err != nil {
		httpx.RespondError(c, http.StatusInternalServerError, "session_list_failed", err.Error(), nil)
		return
	}

	var items []gin.H
	for _, session := range sessions {
		items = append(items, gin.H{
			"id":           session.ID,
			"device_id":    session.DeviceID,
			"ip_address":   session.IPAddress,
			"user_agent":   session.UserAgent,
			"created_at":   session.CreatedAt,
			"last_seen_at": session.LastSeenAt,
			"expires_at":   session.ExpiresAt,
			"revoked_at":   session.RevokedAt,
			"is_active":    session.IsActive,
			"mfa_pending":  session.MFAPending,
		})
	}

	httpx.Respond(c, http.StatusOK, gin.H{"sessions": items})
}

// Revoke terminates a specific session
// @Summary      Revoke session
// @Description  Revoke a specific session by its ID
// @Tags         sessions
// @Produce      json
// @Param        id   path      string  true  "Session ID"
// @Success      200  {object}  httpx.Response{data=map[string]string}
// @Failure      400  {object}  httpx.Response{error=httpx.ErrorResponse}
// @Failure      401  {object}  httpx.Response{error=httpx.ErrorResponse}
// @Router       /sessions/{id} [delete]
func (h *Handler) Revoke(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil {
		httpx.RespondError(c, http.StatusUnauthorized, "session_missing", "authentication required", nil)
		return
	}

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.RespondError(c, http.StatusBadRequest, "invalid_session", "invalid session id", nil)
		return
	}

	if err := h.service.Revoke(c.Request.Context(), userID, sessionID); err != nil {
		httpx.RespondError(c, http.StatusInternalServerError, "session_revoke_failed", err.Error(), nil)
		return
	}

	httpx.Respond(c, http.StatusOK, gin.H{"revoked_at": time.Now()})
}

func getUserID(c *gin.Context) (uuid.UUID, error) {
	val, ok := c.Get(ctxkeys.UserIDKey)
	if !ok {
		return uuid.Nil, http.ErrNoCookie
	}
	return uuid.Parse(val.(string))
}
