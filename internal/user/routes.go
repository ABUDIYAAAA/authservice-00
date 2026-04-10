package user

import "github.com/gin-gonic/gin"

func RegisterRoutes(router *gin.Engine, h *Handler, authMiddleware gin.HandlerFunc, adminLimiter gin.HandlerFunc) {
	orgUser := router.Group("/admin/org")
	orgUser.Use(adminLimiter, authMiddleware)
	{
		orgUser.POST("/organizations", h.CreateOrganization)
	}

	super := router.Group("/admin/super")
	super.Use(adminLimiter, authMiddleware, h.RequireSuperAdmin())
	{
		super.GET("/organizations", h.ListOrganizations)
		super.POST("/organizations/:orgID/admins", h.AssignOrgAdmin)
	}

	orgAdmin := router.Group("/admin/org/:orgID")
	orgAdmin.Use(adminLimiter, authMiddleware, h.RequireOrgAdmin())
	{
		orgAdmin.GET("/users", h.ListOrgUsers)
		orgAdmin.POST("/users/memberships", h.UpsertOrgMembership)
		orgAdmin.GET("/services", h.ListOrgServices)
		orgAdmin.POST("/services", h.CreateOrgService)
	}
}
