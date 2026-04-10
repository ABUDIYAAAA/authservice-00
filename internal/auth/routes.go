package auth

import "github.com/gin-gonic/gin"

func RegisterRoutes(router *gin.Engine, h *Handler, publicLimiter gin.HandlerFunc, privateLimiter gin.HandlerFunc) {
	public := router.Group("/auth")
	public.Use(publicLimiter)
	{
		public.POST("/login", h.Login)
		public.POST("/refresh", h.Refresh)
	}

	private := router.Group("/auth")
	private.Use(privateLimiter, h.AuthMiddleware())
	{
		private.GET("/me", h.Me)
		private.POST("/logout", h.Logout)
	}
}
