package user

import "time"

type ErrorResponse struct {
	Error string `json:"error" example:"forbidden"`
}

type CreateOrganizationRequest struct {
	Name string `json:"name" binding:"required,min=2" example:"Acme Corp"`
}

type AssignOrgAdminRequest struct {
	UserID string `json:"user_id" binding:"required,uuid"`
}

type UpsertOrgMembershipRequest struct {
	UserID string `json:"user_id" binding:"required,uuid"`
	Role   string `json:"role" binding:"required" example:"MEMBER"`
}

type CreateServiceRequest struct {
	Name         string   `json:"name" binding:"required,min=2" example:"billing-service"`
	RedirectURIs []string `json:"redirect_uris" example:"https://app.acme.com/callback"`
}

type OrganizationResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type OrgUserResponse struct {
	UserID   string    `json:"user_id"`
	Email    string    `json:"email"`
	Name     string    `json:"name"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joined_at"`
}

type ServiceResponse struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	ClientID     string    `json:"client_id"`
	ClientSecret string    `json:"client_secret,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}
