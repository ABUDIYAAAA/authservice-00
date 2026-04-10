package user

import (
	"errors"
	"net/http"
	"strings"

	"authservice/internal/securityctx"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Handler struct {
	service *UserService
	logger  *zap.Logger
}

func NewHandler(service *UserService, logger *zap.Logger) *Handler {
	return &Handler{service: service, logger: logger}
}

func (h *Handler) RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		identity, ok := securityctx.GetIdentity(c)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
			return
		}

		if err := h.service.EnsureSuperAdmin(c.Request.Context(), identity.UserID); err != nil {
			h.handleMiddlewareError(c, err)
			return
		}

		c.Next()
	}
}

func (h *Handler) RequireOrgAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		identity, ok := securityctx.GetIdentity(c)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, ErrorResponse{Error: "unauthorized"})
			return
		}

		orgID := c.Param("orgID")
		if strings.TrimSpace(orgID) == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, ErrorResponse{Error: "missing orgID"})
			return
		}

		if err := h.service.EnsureOrgAdmin(c.Request.Context(), identity.UserID, orgID); err != nil {
			h.handleMiddlewareError(c, err)
			return
		}

		c.Next()
	}
}

// CreateOrganization godoc
// @Summary Create organization (authenticated user)
// @Description Any authenticated user can create organizations. The creator is assigned ADMIN in the new organization.
// @Tags admin-org,organizations
// @Accept json
// @Produce json
// @Security Bearer
// @Param body body CreateOrganizationRequest true "Create organization"
// @Success 201 {object} OrganizationResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /admin/org/organizations [post]
func (h *Handler) CreateOrganization(c *gin.Context) {
	var req CreateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid request payload"})
		return
	}

	identity, _ := securityctx.GetIdentity(c)
	resp, err := h.service.CreateOrganization(c.Request.Context(), identity.UserID, req, RequestMetadata{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	})
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// ListOrganizations godoc
// @Summary List organizations (super admin)
// @Description Super admins can list all organizations.
// @Tags admin-super,organizations
// @Produce json
// @Security Bearer
// @Success 200 {array} OrganizationResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /admin/super/organizations [get]
func (h *Handler) ListOrganizations(c *gin.Context) {
	orgs, err := h.service.ListOrganizations(c.Request.Context())
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, orgs)
}

// AssignOrgAdmin godoc
// @Summary Assign org admin (super admin)
// @Description Super admins can assign an org admin membership.
// @Tags admin-super,organizations
// @Accept json
// @Produce json
// @Security Bearer
// @Param orgID path string true "Organization ID"
// @Param body body AssignOrgAdminRequest true "Assign org admin"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /admin/super/organizations/{orgID}/admins [post]
func (h *Handler) AssignOrgAdmin(c *gin.Context) {
	orgID := c.Param("orgID")
	if strings.TrimSpace(orgID) == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "missing orgID"})
		return
	}

	var req AssignOrgAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid request payload"})
		return
	}

	identity, _ := securityctx.GetIdentity(c)
	if err := h.service.AssignOrgAdmin(c.Request.Context(), identity.UserID, orgID, req, RequestMetadata{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "org admin assigned"})
}

// ListOrgUsers godoc
// @Summary List organization users (org admin)
// @Description Org admins can list users in their organization.
// @Tags admin-org,users
// @Produce json
// @Security Bearer
// @Param orgID path string true "Organization ID"
// @Success 200 {array} OrgUserResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /admin/org/{orgID}/users [get]
func (h *Handler) ListOrgUsers(c *gin.Context) {
	orgID := c.Param("orgID")
	users, err := h.service.ListOrgUsers(c.Request.Context(), orgID)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, users)
}

// UpsertOrgMembership godoc
// @Summary Upsert organization membership (org admin)
// @Description Org admins can assign/update ADMIN or MEMBER role for users in their org.
// @Tags admin-org,users
// @Accept json
// @Produce json
// @Security Bearer
// @Param orgID path string true "Organization ID"
// @Param body body UpsertOrgMembershipRequest true "Membership update"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /admin/org/{orgID}/users/memberships [post]
func (h *Handler) UpsertOrgMembership(c *gin.Context) {
	orgID := c.Param("orgID")
	var req UpsertOrgMembershipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid request payload"})
		return
	}

	identity, _ := securityctx.GetIdentity(c)
	if err := h.service.UpsertOrgMembership(c.Request.Context(), identity.UserID, orgID, req, RequestMetadata{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "membership updated"})
}

// ListOrgServices godoc
// @Summary List services in organization (org admin)
// @Description Org admins can list OAuth client services in their org.
// @Tags admin-org,organizations
// @Produce json
// @Security Bearer
// @Param orgID path string true "Organization ID"
// @Success 200 {array} ServiceResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /admin/org/{orgID}/services [get]
func (h *Handler) ListOrgServices(c *gin.Context) {
	orgID := c.Param("orgID")
	services, err := h.service.ListOrgServices(c.Request.Context(), orgID)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, services)
}

// CreateOrgService godoc
// @Summary Create service in organization (org admin)
// @Description Org admins can register services (OAuth clients) in their org.
// @Tags admin-org,organizations
// @Accept json
// @Produce json
// @Security Bearer
// @Param orgID path string true "Organization ID"
// @Param body body CreateServiceRequest true "Service payload"
// @Success 201 {object} ServiceResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /admin/org/{orgID}/services [post]
func (h *Handler) CreateOrgService(c *gin.Context) {
	orgID := c.Param("orgID")
	var req CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid request payload"})
		return
	}

	identity, _ := securityctx.GetIdentity(c)
	resp, err := h.service.CreateOrgService(c.Request.Context(), identity.UserID, orgID, req, RequestMetadata{
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	})
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *Handler) handleMiddlewareError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrMissingOrganization):
		c.AbortWithStatusJSON(http.StatusBadRequest, ErrorResponse{Error: ErrMissingOrganization.Error()})
	case errors.Is(err, ErrForbiddenRole):
		c.AbortWithStatusJSON(http.StatusForbidden, ErrorResponse{Error: "admin access required"})
	default:
		h.logger.Error("authorization middleware failed", zap.Error(err))
		c.AbortWithStatusJSON(http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
	}
}

func (h *Handler) handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrInvalidRole):
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: "role must be ADMIN or MEMBER"})
	case errors.Is(err, ErrMissingOrganization):
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrMissingOrganization.Error()})
	case errors.Is(err, ErrForbiddenRole):
		c.JSON(http.StatusForbidden, ErrorResponse{Error: ErrForbiddenRole.Error()})
	default:
		h.logger.Error("user service failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
	}
}
