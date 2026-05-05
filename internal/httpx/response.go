package httpx

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type Response struct {
	Success bool           `json:"success"`
	Data    any            `json:"data,omitempty"`
	Error   *ErrorResponse `json:"error,omitempty"`
}

func Respond(c *gin.Context, status int, data any) {
	c.JSON(status, Response{
		Success: status < http.StatusBadRequest,
		Data:    data,
	})
}

func RespondError(c *gin.Context, status int, code string, message string, details any) {
	c.JSON(status, Response{
		Success: false,
		Error: &ErrorResponse{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
