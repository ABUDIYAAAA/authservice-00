package email

import (
	"context"
	"encoding/json"
	"errors"

	"kael/internal/ques"

	"github.com/hibiken/asynq"
)

type TaskPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
	HTML    string `json:"html"`
}

type Consumer struct {
	mailer *Client
}

func NewConsumer(mailer *Client) *Consumer {
	return &Consumer{mailer: mailer}
}

func (c *Consumer) Register(mux *asynq.ServeMux) {
	mux.HandleFunc(ques.TaskEmailVerification, c.handleEmailTask)
	mux.HandleFunc(ques.TaskPasswordReset, c.handleEmailTask)
	mux.HandleFunc(ques.TaskEmailOTP, c.handleEmailTask)
}

func (c *Consumer) handleEmailTask(ctx context.Context, task *asynq.Task) error {
	if c.mailer == nil {
		return errors.New("email client not configured")
	}

	var payload TaskPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return err
	}

	return c.mailer.Send(Message{
		To:      payload.To,
		Subject: payload.Subject,
		Text:    payload.Text,
		HTML:    payload.HTML,
	})
}
