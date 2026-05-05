package workers

import (
	"kael/internal/config"
	"kael/internal/email"
	"kael/internal/ques"

	"github.com/hibiken/asynq"
)

func Run(cfg *config.Config, mailer *email.Client) error {
	server, err := ques.NewServer(cfg)
	if err != nil {
		return err
	}

	mux := asynq.NewServeMux()
	emailConsumer := email.NewConsumer(mailer)
	emailConsumer.Register(mux)

	return server.Run(mux)
}
