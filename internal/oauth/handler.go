package oauth

import (
	"net/http"
	"net/url"
	"strings"

	"kael/internal/auth"
	"kael/internal/config"
	"kael/internal/ctxkeys"
	"kael/internal/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	svc  *Service
	auth *auth.Service
	cfg  *config.Config
}

func NewHandler(svc *Service, authService *auth.Service, cfg *config.Config) *Handler {
	return &Handler{svc: svc, auth: authService, cfg: cfg}
}

// StartGoogle starts Google OAuth flow
// @Summary      Start Google OAuth
// @Description  Get the Google OAuth authorization URL
// @Tags         oauth
// @Produce      json
// @Param        X-Device-ID header string true "Device Identifier"
// @Success      200  {object}  httpx.Response{data=map[string]string}
// @Router       /oauth/google/start [get]
func (h *Handler) StartGoogle(c *gin.Context) {
	h.start(c, "google", ModeLogin, nil)
}

// StartGitHub starts GitHub OAuth flow
// @Summary      Start GitHub OAuth
// @Description  Get the GitHub OAuth authorization URL
// @Tags         oauth
// @Produce      json
// @Param        X-Device-ID header string true "Device Identifier"
// @Success      200  {object}  httpx.Response{data=map[string]string}
// @Router       /oauth/github/start [get]
func (h *Handler) StartGitHub(c *gin.Context) {
	h.start(c, "github", ModeLogin, nil)
}

// LinkGoogle links Google account
// @Summary      Link Google
// @Description  Link Google account to the currently authenticated user
// @Tags         oauth
// @Produce      json
// @Param        X-Device-ID header string true "Device Identifier"
// @Success      200  {object}  httpx.Response{data=map[string]string}
// @Router       /oauth/google/link [get]
func (h *Handler) LinkGoogle(c *gin.Context) {
	h.startLink(c, "google")
}

// LinkGitHub links GitHub account
// @Summary      Link GitHub
// @Description  Link GitHub account to the currently authenticated user
// @Tags         oauth
// @Produce      json
// @Param        X-Device-ID header string true "Device Identifier"
// @Success      200  {object}  httpx.Response{data=map[string]string}
// @Router       /oauth/github/link [get]
func (h *Handler) LinkGitHub(c *gin.Context) {
	h.startLink(c, "github")
}

func (h *Handler) CallbackGoogle(c *gin.Context) {
	h.callback(c, "google")
}

func (h *Handler) CallbackGitHub(c *gin.Context) {
	h.callback(c, "github")
}

func (h *Handler) startLink(c *gin.Context, provider string) {
	userIDValue, exists := c.Get(ctxkeys.UserIDKey)
	if !exists {
		httpx.RespondError(c, http.StatusUnauthorized, "session_missing", "authentication required", nil)
		return
	}
	userID, err := uuid.Parse(userIDValue.(string))
	if err != nil {
		httpx.RespondError(c, http.StatusBadRequest, "invalid_user", "invalid user", nil)
		return
	}

	h.start(c, provider, ModeLink, &userID)
}

func (h *Handler) start(c *gin.Context, provider string, mode string, userID *uuid.UUID) {
	deviceID := c.GetHeader("X-Device-ID")
	if deviceID == "" {
		httpx.RespondError(c, http.StatusBadRequest, "device_id_missing", "X-Device-ID header required", nil)
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	url, err := h.svc.StartAuth(provider, mode, userID, deviceID, ipAddress, userAgent)
	if err != nil {
		httpx.RespondError(c, http.StatusBadRequest, "oauth_start_failed", err.Error(), nil)
		return
	}

	httpx.Respond(c, http.StatusOK, gin.H{"auth_url": url})
}

func (h *Handler) callback(c *gin.Context, provider string) {
	code := c.Query("code")
	state := c.Query("state")
	redirect := strings.ToLower(c.DefaultQuery("redirect", "false")) == "true"

	if code == "" || state == "" {
		h.renderCallback(c, redirect, "missing_code", "missing oauth code", nil)
		return
	}

	user, _, deviceID, ipAddress, userAgent, err := h.svc.HandleCallback(c.Request.Context(), provider, code, state)
	if err != nil {
		h.renderCallback(c, redirect, "oauth_failed", err.Error(), nil)
		return
	}
	if deviceID == "" {
		h.renderCallback(c, redirect, "device_id_missing", "device id missing", nil)
		return
	}

	result, err := h.auth.CompleteLogin(c.Request.Context(), user, deviceID, ipAddress, userAgent)
	if err != nil {
		h.renderCallback(c, redirect, "login_failed", err.Error(), nil)
		return
	}

	if result.SessionToken != "" {
		auth.SetSessionCookie(c, h.cfg, result.SessionToken, result.SessionExpiry)
	}

	payload := gin.H{
		"mfa_required": result.MFARequired,
		"mfa_token":    result.MFAToken,
		"mfa_methods":  result.MFAMethods,
	}

	if redirect {
		h.renderCallback(c, redirect, "", "", payload)
		return
	}

	httpx.Respond(c, http.StatusOK, payload)
}

func (h *Handler) renderCallback(c *gin.Context, redirect bool, errCode string, errMessage string, data map[string]any) {
	if !redirect {
		if errCode != "" {
			httpx.RespondError(c, http.StatusBadRequest, errCode, errMessage, nil)
			return
		}
		httpx.Respond(c, http.StatusOK, data)
		return
	}

	callbackURL, _ := url.Parse(h.cfg.FrontendBaseURL + "/oauth/callback")
	query := callbackURL.Query()
	if errCode != "" {
		query.Set("status", "error")
		query.Set("code", errCode)
		query.Set("message", errMessage)
	} else {
		query.Set("status", "ok")
		if data != nil {
			if v, ok := data["mfa_required"].(bool); ok && v {
				query.Set("mfa_required", "true")
			}
			if v, ok := data["mfa_token"].(string); ok && v != "" {
				query.Set("mfa_token", v)
			}
		}
	}
	callbackURL.RawQuery = query.Encode()
	c.Redirect(http.StatusFound, callbackURL.String())
}
