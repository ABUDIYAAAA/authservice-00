package csrf

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type TokenResponse struct {
	CSRFToken string `json:"csrf_token"`
}

// GetToken godoc
// @Summary Get CSRF token
// @Description Issues a masked CSRF token and sets CSRF cookie using a Django-style workflow.
// @Tags csrf
// @Produce json
// @Success 200 {object} TokenResponse
// @Failure 500 {object} map[string]string
// @Router /auth/csrf [get]
func (h *Handler) GetToken(c *gin.Context) {
	secret, err := h.service.EnsureCSRFCookie(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to initialize csrf cookie"})
		return
	}

	token, err := h.service.IssueToken(secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue csrf token"})
		return
	}

	c.JSON(http.StatusOK, TokenResponse{CSRFToken: token})
}
