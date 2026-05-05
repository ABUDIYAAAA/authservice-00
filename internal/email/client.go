package email

import (
	"crypto/tls"
	"errors"
	"fmt"

	"kael/internal/config"

	"gopkg.in/gomail.v2"
)

type Message struct {
	To      string
	Subject string
	Text    string
	HTML    string
}

type Client struct {
	fromName  string
	fromEmail string
	dialer    *gomail.Dialer
	enabled   bool
}

func NewClient(cfg *config.Config) *Client {
	if cfg.SMTPHost == "" || cfg.SMTPFromEmail == "" {
		return &Client{enabled: false}
	}

	dialer := gomail.NewDialer(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword)
	if cfg.SMTPUseTLS {
		dialer.TLSConfig = &tls.Config{ServerName: cfg.SMTPHost, MinVersion: tls.VersionTLS12}
	}

	return &Client{
		fromName:  cfg.SMTPFromName,
		fromEmail: cfg.SMTPFromEmail,
		dialer:    dialer,
		enabled:   true,
	}
}

func (c *Client) Send(msg Message) error {
	if !c.enabled {
		return errors.New("smtp not configured")
	}

	if msg.To == "" {
		return errors.New("email recipient missing")
	}

	message := gomail.NewMessage()
	from := c.fromEmail
	if c.fromName != "" {
		from = fmt.Sprintf("%s <%s>", c.fromName, c.fromEmail)
	}

	message.SetHeader("From", from)
	message.SetHeader("To", msg.To)
	message.SetHeader("Subject", msg.Subject)

	if msg.HTML != "" {
		message.SetBody("text/html", msg.HTML)
	} else {
		message.SetBody("text/plain", msg.Text)
	}

	return c.dialer.DialAndSend(message)
}
