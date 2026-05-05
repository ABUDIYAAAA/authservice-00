package mfa

import (
	"errors"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

var ErrInvalidCode = errors.New("invalid mfa code")

func GenerateTOTPSecret(email string) (string, string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Kael",
		AccountName: email,
		Algorithm:   otp.AlgorithmSHA1,
		Digits:      otp.DigitsSix,
		Period:      30,
	})
	if err != nil {
		return "", "", err
	}

	return key.Secret(), key.URL(), nil
}

func VerifyTOTP(secret string, code string) bool {
	return totp.Validate(code, secret)
}
