package main

import (
	"authservice/docs"
	"authservice/internal/audit"
	"authservice/internal/auth"
	"authservice/internal/config"
	"authservice/internal/database"
	"authservice/internal/middleware"
	"authservice/internal/user"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"golang.org/x/time/rate"
)

// @title AuthService API
// @version 1.0.0
// @description Multi-tenant SSO service.
// @BasePath /
// @schemes http https
// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @description Bearer access token.
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("load config: ", err)
	}

	logger, err := newLogger(cfg.Environment)
	if err != nil {
		log.Fatal("init logger: ", err)
	}
	defer logger.Sync()

	ctx := context.Background()
	startedAt := time.Now().UTC()
	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("database connection failed", zap.Error(err))
	}
	defer pool.Close()

	auditRepo := audit.NewRepository(pool)
	auditService := audit.NewService(auditRepo, logger)
	authRepo := auth.NewRepository(pool)
	userRepo := user.NewRepository(pool)
	tokenManager := auth.NewTokenManager(
		cfg.JWTSecret,
		time.Duration(cfg.AccessTokenTTLMinutes)*time.Minute,
		time.Duration(cfg.RefreshTokenTTLDays)*24*time.Hour,
	)

	authService := auth.NewService(authRepo, auditService, tokenManager, logger)
	userService := user.NewUserService(userRepo, auditService, logger)

	authHandler := auth.NewHandler(authService, logger)
	userHandler := user.NewHandler(userService, logger)

	publicLimiter := middleware.NewIPRateLimiter(rate.Limit(cfg.AuthPublicRPS), cfg.AuthPublicBurst, 10*time.Minute)
	privateLimiter := middleware.NewIPRateLimiter(rate.Limit(cfg.AuthPrivateRPS), cfg.AuthPrivateBurst, 10*time.Minute)
	adminLimiter := middleware.NewIPRateLimiter(rate.Limit(cfg.AdminRPS), cfg.AdminBurst, 15*time.Minute)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.RequestID(), middleware.ZapRequestLogger(logger))
	router.Use(corsMiddleware())
	router.SetTrustedProxies(nil)

	docs.SwaggerInfo.Title = "AuthService API"
	docs.SwaggerInfo.Description = "Multi-tenant SSO service with platform super-admin and org-admin control."
	docs.SwaggerInfo.Version = "1.0.0"
	docs.SwaggerInfo.BasePath = "/"
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	auth.RegisterRoutes(router, authHandler, publicLimiter.Middleware(), privateLimiter.Middleware())
	user.RegisterRoutes(router, userHandler, authHandler.AuthMiddleware(), adminLimiter.Middleware())

	router.GET("/health", func(c *gin.Context) {
		dbCtx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		pingStarted := time.Now()
		dbErr := pool.Ping(dbCtx)
		dbLatency := time.Since(pingStarted)
		cancel()

		status := "ok"
		httpStatus := http.StatusOK
		dbStatus := "up"
		if dbErr != nil {
			status = "degraded"
			httpStatus = http.StatusServiceUnavailable
			dbStatus = "down"
		}

		poolStat := pool.Stat()

		c.JSON(httpStatus, gin.H{
			"status": status,
			"uptime": gin.H{
				"startedAt": startedAt,
				"seconds":   int64(time.Since(startedAt).Seconds()),
			},
			"database": gin.H{
				"status":    dbStatus,
				"latencyMs": float64(dbLatency.Microseconds()) / 1000.0,
				"error":     errorString(dbErr),
				"pool": gin.H{
					"acquiredConns":        poolStat.AcquiredConns(),
					"idleConns":            poolStat.IdleConns(),
					"totalConns":           poolStat.TotalConns(),
					"maxConns":             poolStat.MaxConns(),
					"acquireCount":         poolStat.AcquireCount(),
					"emptyAcquireCount":    poolStat.EmptyAcquireCount(),
					"canceledAcquireCount": poolStat.CanceledAcquireCount(),
				},
			},
		})
	})

	logger.Info("starting server",
		zap.String("port", cfg.Port),
		zap.String("env", cfg.Environment),
	)
	if err := router.Run(":" + cfg.Port); err != nil {
		logger.Fatal("server stopped", zap.Error(err))
	}
}

func newLogger(env string) (*zap.Logger, error) {
	if env == "production" {
		cfg := zap.NewProductionConfig()
		cfg.EncoderConfig.TimeKey = "ts"
		cfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		return cfg.Build()
	}

	cfg := zap.NewDevelopmentConfig()
	cfg.EncoderConfig.TimeKey = "ts"
	cfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	return cfg.Build()
}

func errorString(err error) any {
	if err == nil {
		return nil
	}
	return err.Error()
}
