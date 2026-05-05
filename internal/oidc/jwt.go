package oidc

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type IDTokenClaims struct {
	Iss           string  `json:"iss"`
	Sub           string  `json:"sub"`
	Aud           string  `json:"aud"`
	Exp           int64   `json:"exp"`
	Iat           int64   `json:"iat"`
	Nonce         string  `json:"nonce,omitempty"`
	Email         string  `json:"email,omitempty"`
	EmailVerified bool    `json:"email_verified,omitempty"`
	Name          *string `json:"name,omitempty"`
	Picture       *string `json:"picture,omitempty"`
}

type jwtHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

func SignIDToken(signingKey []byte, claims IDTokenClaims) (string, error) {
	header := jwtHeader{Alg: "HS256", Typ: "JWT"}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	headerEncoded := base64.RawURLEncoding.EncodeToString(headerJSON)
	claimsEncoded := base64.RawURLEncoding.EncodeToString(claimsJSON)

	signingInput := headerEncoded + "." + claimsEncoded

	mac := hmac.New(sha256.New, signingKey)
	mac.Write([]byte(signingInput))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return signingInput + "." + signature, nil
}

func BuildIDTokenClaims(issuer string, userID uuid.UUID, clientID string, nonce *string, email string, emailVerified bool, name *string, avatarURL *string, ttl time.Duration) IDTokenClaims {
	now := time.Now()
	claims := IDTokenClaims{
		Iss:           issuer,
		Sub:           userID.String(),
		Aud:           clientID,
		Exp:           now.Add(ttl).Unix(),
		Iat:           now.Unix(),
		Email:         email,
		EmailVerified: emailVerified,
		Name:          name,
		Picture:       avatarURL,
	}
	if nonce != nil {
		claims.Nonce = *nonce
	}
	return claims
}

func DecodeBase64SigningKey(key string) ([]byte, error) {
	if key == "" {
		return nil, fmt.Errorf("OIDC signing key is not configured")
	}
	decoded, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		decoded = []byte(key)
	}
	if len(decoded) < 32 {
		return nil, fmt.Errorf("OIDC signing key must be at least 32 bytes")
	}
	return decoded, nil
}
