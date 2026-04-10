package auth

import (
	"authservice/internal/securityctx"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
	logger  *zap.Logger
}

func NewHandler(service *Service, logger *zap.Logger) *Handler {
	return &Handler{
		service: service,
		logger:  logger,
	}
}

// Login godoc
// @Summary Login user
// @Description Authenticates a user and issues access/refresh tokens.
// @Tags auth
// @Accept json
// @Produce json
// @Param body body LoginRequest true "Login payload"
// @Success 200 {object} TokenResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid request payload"})
		return
	}

	resp, err := h.service.Login(c.Request.Context(), req, RequestMetadata{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
		DeviceID:  c.GetHeader("X-Device-ID"),
	})
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Refresh godoc
// @Summary Refresh access token
// @Description Rotates refresh token and returns a new token pair.
// @Tags auth
// @Accept json
// @Produce json
// @Param body body RefreshRequest true "Refresh payload"
// @Success 200 {object} TokenResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/refresh [post]
func (h *Handler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid request payload"})
		return
	}

	resp, err := h.service.Refresh(c.Request.Context(), req, RequestMetadata{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	})
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Logout godoc
// @Summary Logout user
// @Description Revokes session and blacklists the active access token jti.
// @Tags auth
// @Accept json
// @Produce json
// @Security Bearer
// @Param body body LogoutRequest false "Optional service scoped logout"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/logout [post]
func (h *Handler) Logout(c *gin.Context) {
	identity, ok := securityctx.GetIdentity(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	var req LogoutRequest
	if c.ContentType() == "application/json" {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid request payload"})
			return
		}
	}

	if err := h.service.Logout(c.Request.Context(), identity, req, RequestMetadata{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// Me godoc
// @Summary Get current user
// @Description Returns identity and session info for the active access token.
// @Tags auth
// @Produce json
// @Security Bearer
// @Success 200 {object} MeResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/me [get]
func (h *Handler) Me(c *gin.Context) {
	identity, ok := securityctx.GetIdentity(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
		return
	}

	resp, err := h.service.Me(c.Request.Context(), identity)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		identity, err := h.service.Authenticate(c.Request.Context(), c.GetHeader("Authorization"))
		if err != nil {
			h.handleMiddlewareError(c, err)
			return
		}

		securityctx.SetIdentity(c, identity)
		c.Next()
	}
}

func (h *Handler) handleMiddlewareError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrMissingAuthorization):
		c.AbortWithStatusJSON(http.StatusUnauthorized, ErrorResponse{Error: "missing authorization header"})
	case errors.Is(err, ErrInvalidBearerToken), errors.Is(err, ErrUnauthorized):
		c.AbortWithStatusJSON(http.StatusUnauthorized, ErrorResponse{Error: "invalid access token"})
	default:
		h.logger.Error("auth middleware failed", zap.Error(err))
		c.AbortWithStatusJSON(http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
	}
}

func (h *Handler) handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrInvalidCredentials):
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrInvalidCredentials.Error()})
	case errors.Is(err, ErrOrgMembershipDenied):
		c.JSON(http.StatusForbidden, ErrorResponse{Error: ErrOrgMembershipDenied.Error()})
	case errors.Is(err, ErrInvalidRefreshToken):
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrInvalidRefreshToken.Error()})
	case errors.Is(err, ErrUserNotFound):
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrUserNotFound.Error()})
	case errors.Is(err, ErrUnauthorized):
		c.JSON(http.StatusUnauthorized, ErrorResponse{Error: ErrUnauthorized.Error()})
	default:
		h.logger.Error("auth service failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
	}
}
