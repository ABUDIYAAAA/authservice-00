package sessions

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.Engine, handler *Handler, authMiddleware gin.HandlerFunc) {
	group := r.Group("/sessions")
	group.Use(authMiddleware)
	group.GET("", handler.List)
	group.DELETE("/:id", handler.Revoke)
}
