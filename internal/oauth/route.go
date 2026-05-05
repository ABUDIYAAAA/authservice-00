package oauth

import (
	"kael/internal/config"
	"kael/internal/middleware"
	"kael/internal/sessions"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, handler *Handler, cfg *config.Config, sessionService *sessions.Service) {
	group := r.Group("/oauth")
	group.GET("/google/start", handler.StartGoogle)
	group.GET("/github/start", handler.StartGitHub)
	group.GET("/google/callback", handler.CallbackGoogle)
	group.GET("/github/callback", handler.CallbackGitHub)

	linkGroup := r.Group("/oauth")
	linkGroup.Use(middleware.RequireSession(cfg, sessionService))
	linkGroup.GET("/google/link", handler.LinkGoogle)
	linkGroup.GET("/github/link", handler.LinkGitHub)
}
