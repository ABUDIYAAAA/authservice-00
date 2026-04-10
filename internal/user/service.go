package user

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"authservice/internal/audit"

	"go.uber.org/zap"
)

type RequestMetadata struct {
	IPAddress string
	UserAgent string
}

type UserService struct {
	repo   *Repository
	audit  *audit.Service
	logger *zap.Logger
}

func NewUserService(repo *Repository, auditService *audit.Service, logger *zap.Logger) *UserService {
	return &UserService{repo: repo, audit: auditService, logger: logger}
}

func (s *UserService) EnsureSuperAdmin(ctx context.Context, userID string) error {
	ok, err := s.repo.IsSuperAdmin(ctx, userID)
	if err != nil {
		return fmt.Errorf("check super admin: %w", err)
	}
	if !ok {
		return ErrForbiddenRole
	}
	return nil
}

func (s *UserService) EnsureOrgAdmin(ctx context.Context, userID, orgID string) error {
	if strings.TrimSpace(orgID) == "" {
		return ErrMissingOrganization
	}

	isSuper, err := s.repo.IsSuperAdmin(ctx, userID)
	if err != nil {
		return fmt.Errorf("check super admin: %w", err)
	}
	if isSuper {
		return nil
	}

	ok, err := s.repo.IsOrgAdmin(ctx, userID, orgID)
	if err != nil {
		return fmt.Errorf("check org admin: %w", err)
	}
	if !ok {
		return ErrForbiddenRole
	}

	return nil
}

func (s *UserService) CreateOrganization(ctx context.Context, actorUserID string, req CreateOrganizationRequest, meta RequestMetadata) (*OrganizationResponse, error) {
	org, err := s.repo.CreateOrganization(ctx, strings.TrimSpace(req.Name), actorUserID)
	if err != nil {
		return nil, fmt.Errorf("create organization: %w", err)
	}

	s.audit.Log(ctx, audit.Entry{
		UserID:          &actorUserID,
		OrgID:           &org.ID,
		Action:          "ORG_CREATE",
		ResourceType:    "organization",
		ResourceID:      &org.ID,
		RequestPayload:  req,
		ResponsePayload: org,
		IPAddress:       meta.IPAddress,
		UserAgent:       meta.UserAgent,
	})

	return &OrganizationResponse{
		ID:        org.ID,
		Name:      org.Name,
		CreatedAt: org.CreatedAt,
	}, nil
}

func (s *UserService) ListOrganizations(ctx context.Context) ([]OrganizationResponse, error) {
	orgs, err := s.repo.ListOrganizations(ctx)
	if err != nil {
		return nil, fmt.Errorf("list organizations: %w", err)
	}

	out := make([]OrganizationResponse, 0, len(orgs))
	for _, org := range orgs {
		out = append(out, OrganizationResponse{ID: org.ID, Name: org.Name, CreatedAt: org.CreatedAt})
	}

	return out, nil
}

func (s *UserService) AssignOrgAdmin(ctx context.Context, actorUserID, orgID string, req AssignOrgAdminRequest, meta RequestMetadata) error {
	if strings.TrimSpace(orgID) == "" {
		return ErrMissingOrganization
	}

	if err := s.repo.AssignOrgAdmin(ctx, orgID, req.UserID); err != nil {
		return fmt.Errorf("assign org admin: %w", err)
	}

	s.audit.Log(ctx, audit.Entry{
		UserID:         &actorUserID,
		OrgID:          &orgID,
		Action:         "ORG_ADMIN_ASSIGN",
		ResourceType:   "org_membership",
		ResourceID:     &req.UserID,
		RequestPayload: req,
		IPAddress:      meta.IPAddress,
		UserAgent:      meta.UserAgent,
	})

	return nil
}

func (s *UserService) ListOrgUsers(ctx context.Context, orgID string) ([]OrgUserResponse, error) {
	users, err := s.repo.ListOrgUsers(ctx, orgID)
	if err != nil {
		return nil, fmt.Errorf("list org users: %w", err)
	}

	out := make([]OrgUserResponse, 0, len(users))
	for _, item := range users {
		out = append(out, OrgUserResponse{
			UserID:   item.UserID,
			Email:    item.Email,
			Name:     item.Name,
			Role:     item.Role,
			JoinedAt: item.JoinedAt,
		})
	}

	return out, nil
}

func (s *UserService) UpsertOrgMembership(ctx context.Context, actorUserID, orgID string, req UpsertOrgMembershipRequest, meta RequestMetadata) error {
	if strings.TrimSpace(orgID) == "" {
		return ErrMissingOrganization
	}

	if err := s.repo.UpsertOrgMembership(ctx, orgID, req.UserID, req.Role); err != nil {
		if strings.Contains(err.Error(), "invalid role") {
			return ErrInvalidRole
		}
		return fmt.Errorf("upsert org membership: %w", err)
	}

	s.audit.Log(ctx, audit.Entry{
		UserID:         &actorUserID,
		OrgID:          &orgID,
		Action:         "ORG_MEMBERSHIP_UPSERT",
		ResourceType:   "org_membership",
		ResourceID:     &req.UserID,
		RequestPayload: req,
		IPAddress:      meta.IPAddress,
		UserAgent:      meta.UserAgent,
	})

	return nil
}

func (s *UserService) ListOrgServices(ctx context.Context, orgID string) ([]ServiceResponse, error) {
	services, err := s.repo.ListOrgServices(ctx, orgID)
	if err != nil {
		return nil, fmt.Errorf("list org services: %w", err)
	}

	out := make([]ServiceResponse, 0, len(services))
	for _, svc := range services {
		out = append(out, ServiceResponse{
			ID:        svc.ID,
			Name:      svc.Name,
			ClientID:  svc.ClientID,
			IsActive:  svc.IsActive,
			CreatedAt: svc.CreatedAt,
		})
	}

	return out, nil
}

func (s *UserService) CreateOrgService(ctx context.Context, actorUserID, orgID string, req CreateServiceRequest, meta RequestMetadata) (*ServiceResponse, error) {
	if strings.TrimSpace(orgID) == "" {
		return nil, ErrMissingOrganization
	}

	clientID, err := randomToken(18)
	if err != nil {
		return nil, fmt.Errorf("generate client id: %w", err)
	}
	clientSecret, err := randomToken(32)
	if err != nil {
		return nil, fmt.Errorf("generate client secret: %w", err)
	}

	svc, err := s.repo.CreateOrgService(ctx, orgID, req.Name, clientID, clientSecret, req.RedirectURIs)
	if err != nil {
		return nil, fmt.Errorf("create org service: %w", err)
	}

	s.audit.Log(ctx, audit.Entry{
		UserID:         &actorUserID,
		OrgID:          &orgID,
		ServiceID:      &svc.ID,
		Action:         "ORG_SERVICE_CREATE",
		ResourceType:   "service",
		ResourceID:     &svc.ID,
		RequestPayload: req,
		IPAddress:      meta.IPAddress,
		UserAgent:      meta.UserAgent,
	})

	return &ServiceResponse{
		ID:           svc.ID,
		Name:         svc.Name,
		ClientID:     svc.ClientID,
		ClientSecret: clientSecret,
		IsActive:     svc.IsActive,
		CreatedAt:    svc.CreatedAt,
	}, nil
}

func IsClientError(err error) bool {
	return errors.Is(err, ErrForbiddenRole) ||
		errors.Is(err, ErrInvalidRole) ||
		errors.Is(err, ErrMissingOrganization)
}

func randomToken(size int) (string, error) {
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
