package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler contains HTTP handlers for health-related endpoints.
type Handler struct {
	db *pgxpool.Pool
}

// NewHandler creates a new health handler with required dependencies.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{
		db: db,
	}
}

// Health returns the service health status
// @Summary      Service Health
// @Description  Check if the service is running
// @Tags         health
// @Produce      json
// @Success      200  {object}  HealthResponse
// @Router       /health [get]
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status: "ok",
	})
}

// DBCheck returns the database health status
// @Summary      Database Health
// @Description  Check if the database is reachable
// @Tags         health
// @Produce      json
// @Success      200  {object}  DBCheckResponse
// @Failure      503  {object}  DBCheckResponse
// @Router       /db-check [get]
func (h *Handler) DBCheck(c *gin.Context) {
	if err := h.db.Ping(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, DBCheckResponse{
			Status: "db down",
			Error:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, DBCheckResponse{
		Status: "db ok",
	})
}
