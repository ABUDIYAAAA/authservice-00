package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"authservice/internal/audit"
	"authservice/internal/securityctx"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type RequestMetadata struct {
	IPAddress string
	UserAgent string
	DeviceID  string
}

type Service struct {
	repo   *Repository
	audit  *audit.Service
	tokens *TokenManager
	logger *zap.Logger
}

func NewService(repo *Repository, auditService *audit.Service, tokens *TokenManager, logger *zap.Logger) *Service {
	return &Service{
		repo:   repo,
		audit:  auditService,
		tokens: tokens,
		logger: logger,
	}
}

func (s *Service) Login(ctx context.Context, req LoginRequest, meta RequestMetadata) (*TokenResponse, error) {
	user, err := s.repo.FindUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}

	if user == nil || user.PasswordHash == "" {
		s.audit.Log(ctx, audit.Entry{
			Action:       "AUTH_LOGIN_FAILED",
			ResourceType: "user",
			RequestPayload: map[string]any{
				"email": req.Email,
			},
			IPAddress: meta.IPAddress,
			UserAgent: meta.UserAgent,
		})
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		s.audit.Log(ctx, audit.Entry{
			UserID:       &user.ID,
			Action:       "AUTH_LOGIN_FAILED",
			ResourceType: "user",
			ResourceID:   &user.ID,
			RequestPayload: map[string]any{
				"email": req.Email,
			},
			IPAddress: meta.IPAddress,
			UserAgent: meta.UserAgent,
		})
		return nil, ErrInvalidCredentials
	}

	if req.OrgID != nil {
		member, err := s.repo.IsOrgMember(ctx, user.ID, *req.OrgID)
		if err != nil {
			return nil, fmt.Errorf("check org membership: %w", err)
		}
		if !member {
			return nil, ErrOrgMembershipDenied
		}
	}

	refreshExpiry := time.Now().UTC().Add(s.tokens.refreshTTL)
	sessionID, err := s.repo.CreateSession(ctx, user.ID, req.OrgID, meta.DeviceID, meta.UserAgent, meta.IPAddress, refreshExpiry)
	if err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}

	if err := s.repo.AttachServiceSession(ctx, sessionID, req.ServiceID); err != nil {
		return nil, fmt.Errorf("attach service session: %w", err)
	}

	accessToken, accessJTI, accessExpiry, err := s.tokens.NewAccessToken(user.ID, sessionID, req.OrgID)
	if err != nil {
		return nil, fmt.Errorf("issue access token: %w", err)
	}

	refreshPlain, refreshHash, refreshJTI, refreshExpiresAt, err := s.tokens.NewRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("issue refresh token: %w", err)
	}

	if err := s.repo.StoreRefreshToken(ctx, sessionID, refreshHash, refreshJTI, refreshExpiresAt); err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	s.audit.Log(ctx, audit.Entry{
		OrgID:        req.OrgID,
		UserID:       &user.ID,
		SessionID:    &sessionID,
		Action:       "AUTH_LOGIN_SUCCESS",
		ResourceType: "session",
		ResourceID:   &sessionID,
		RequestPayload: map[string]any{
			"email":  req.Email,
			"org_id": req.OrgID,
		},
		ResponsePayload: map[string]any{
			"access_jti":  accessJTI,
			"refresh_jti": refreshJTI,
		},
		IPAddress: meta.IPAddress,
		UserAgent: meta.UserAgent,
	})

	lastLoginAt := time.Now().UTC()
	if user.LastLoginAt.Valid {
		lastLoginAt = user.LastLoginAt.Time
	}

	return &TokenResponse{
		TokenType:    "Bearer",
		AccessToken:  accessToken,
		RefreshToken: refreshPlain,
		ExpiresAt:    accessExpiry,
		User: AuthUser{
			ID:            user.ID,
			Email:         user.Email,
			Name:          user.Name,
			EmailVerified: user.EmailVerified,
			LastLoginAt:   lastLoginAt,
		},
	}, nil
}

func (s *Service) Refresh(ctx context.Context, req RefreshRequest, meta RequestMetadata) (*TokenResponse, error) {
	rec, err := s.repo.GetRefreshTokenByHash(ctx, HashRefreshToken(req.RefreshToken))
	if err != nil {
		return nil, fmt.Errorf("load refresh token: %w", err)
	}
	if rec == nil || rec.IsRevoked || rec.SessionID == "" || rec.UserID == "" || rec.ExpiresAt.Before(time.Now().UTC()) {
		return nil, ErrInvalidRefreshToken
	}

	accessToken, _, accessExpiry, err := s.tokens.NewAccessToken(rec.UserID, rec.SessionID, rec.OrgID)
	if err != nil {
		return nil, fmt.Errorf("issue access token: %w", err)
	}

	refreshPlain, refreshHash, refreshJTI, refreshExpiry, err := s.tokens.NewRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("issue refresh token: %w", err)
	}

	if err := s.repo.RotateRefreshToken(ctx, rec.ID, rec.SessionID, refreshHash, refreshJTI, refreshExpiry); err != nil {
		return nil, fmt.Errorf("rotate refresh token: %w", err)
	}

	user, err := s.repo.FindUserByID(ctx, rec.UserID)
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	s.audit.Log(ctx, audit.Entry{
		OrgID:        rec.OrgID,
		UserID:       &rec.UserID,
		SessionID:    &rec.SessionID,
		Action:       "AUTH_REFRESH_SUCCESS",
		ResourceType: "session",
		ResourceID:   &rec.SessionID,
		IPAddress:    meta.IPAddress,
		UserAgent:    meta.UserAgent,
	})

	lastLoginAt := time.Now().UTC()
	if user.LastLoginAt.Valid {
		lastLoginAt = user.LastLoginAt.Time
	}

	return &TokenResponse{
		TokenType:    "Bearer",
		AccessToken:  accessToken,
		RefreshToken: refreshPlain,
		ExpiresAt:    accessExpiry,
		User: AuthUser{
			ID:            user.ID,
			Email:         user.Email,
			Name:          user.Name,
			EmailVerified: user.EmailVerified,
			LastLoginAt:   lastLoginAt,
		},
	}, nil
}

func (s *Service) Logout(ctx context.Context, identity securityctx.Identity, req LogoutRequest, meta RequestMetadata) error {
	if err := s.repo.BlacklistAccessToken(ctx, identity.JTI, identity.SessionID, identity.ExpiresAt); err != nil {
		return fmt.Errorf("blacklist access token: %w", err)
	}

	if err := s.repo.RevokeSession(ctx, identity.SessionID, req.ServiceID); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}

	s.audit.Log(ctx, audit.Entry{
		OrgID:        identity.OrgID,
		UserID:       &identity.UserID,
		SessionID:    &identity.SessionID,
		Action:       "AUTH_LOGOUT",
		ResourceType: "session",
		ResourceID:   &identity.SessionID,
		RequestPayload: map[string]any{
			"service_id": req.ServiceID,
		},
		IPAddress: meta.IPAddress,
		UserAgent: meta.UserAgent,
	})

	return nil
}

func (s *Service) Me(ctx context.Context, identity securityctx.Identity) (*MeResponse, error) {
	user, err := s.repo.FindUserByID(ctx, identity.UserID)
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	return &MeResponse{
		UserID:    user.ID,
		Email:     user.Email,
		Name:      user.Name,
		SessionID: identity.SessionID,
		OrgID:     identity.OrgID,
	}, nil
}

func (s *Service) Authenticate(ctx context.Context, authHeader string) (securityctx.Identity, error) {
	if strings.TrimSpace(authHeader) == "" {
		return securityctx.Identity{}, ErrMissingAuthorization
	}

	rawToken := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer"))
	if strings.TrimSpace(rawToken) == "" {
		return securityctx.Identity{}, ErrInvalidBearerToken
	}

	claims, err := s.tokens.ParseAccessToken(rawToken)
	if err != nil {
		return securityctx.Identity{}, ErrInvalidBearerToken
	}

	blacklisted, err := s.repo.IsAccessTokenBlacklisted(ctx, claims.ID)
	if err != nil {
		return securityctx.Identity{}, fmt.Errorf("check access token blacklist: %w", err)
	}
	if blacklisted {
		return securityctx.Identity{}, ErrUnauthorized
	}

	return securityctx.Identity{
		UserID:    claims.UserID,
		SessionID: claims.SessionID,
		JTI:       claims.ID,
		OrgID:     claims.OrgID,
		ExpiresAt: claims.ExpiresAt.Time,
	}, nil
}

func IsClientError(err error) bool {
	return errors.Is(err, ErrInvalidCredentials) ||
		errors.Is(err, ErrOrgMembershipDenied) ||
		errors.Is(err, ErrInvalidRefreshToken) ||
		errors.Is(err, ErrUnauthorized) ||
		errors.Is(err, ErrUserNotFound) ||
		errors.Is(err, ErrInvalidBearerToken) ||
		errors.Is(err, ErrMissingAuthorization)
}
