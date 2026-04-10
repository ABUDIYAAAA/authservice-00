package audit

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"go.uber.org/zap"
)

var ErrInvalidEntry = errors.New("invalid audit entry")

type Service struct {
	repo   *Repository
	logger *zap.Logger
}

func NewService(repo *Repository, logger *zap.Logger) *Service {
	return &Service{repo: repo, logger: logger}
}

func (s *Service) Log(ctx context.Context, entry Entry) {
	if err := s.log(ctx, entry); err != nil {
		s.logger.Warn("audit log write failed",
			zap.String("action", entry.Action),
			zap.String("resource_type", entry.ResourceType),
			zap.Error(err),
		)
	}
}

func (s *Service) log(ctx context.Context, entry Entry) error {
	if err := validateEntry(entry); err != nil {
		return err
	}

	if err := s.repo.Insert(ctx, entry); err != nil {
		return fmt.Errorf("insert audit entry: %w", err)
	}

	return nil
}

func validateEntry(entry Entry) error {
	if strings.TrimSpace(entry.Action) == "" {
		return fmt.Errorf("%w: action is required", ErrInvalidEntry)
	}
	if strings.TrimSpace(entry.ResourceType) == "" {
		return fmt.Errorf("%w: resource type is required", ErrInvalidEntry)
	}
	return nil
}
