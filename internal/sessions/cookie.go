package sessions

import "strings"

const sessionCookieSeparator = "."

func EncodeCookieValue(token string, deviceID string) string {
	return token + sessionCookieSeparator + deviceID
}

func DecodeCookieValue(value string) (string, string, bool) {
	parts := strings.SplitN(value, sessionCookieSeparator, 2)
	if len(parts) != 2 {
		return "", "", false
	}
	token := strings.TrimSpace(parts[0])
	deviceID := strings.TrimSpace(parts[1])
	if token == "" || deviceID == "" {
		return "", "", false
	}
	return token, deviceID, true
}
