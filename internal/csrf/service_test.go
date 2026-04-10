package csrf

import "testing"

func TestIssueAndValidateMaskedToken(t *testing.T) {
	svc := NewService(ServiceConfig{})
	secret := make([]byte, 32)
	for i := range secret {
		secret[i] = byte(i + 1)
	}

	token, err := svc.IssueToken(secret)
	if err != nil {
		t.Fatalf("IssueToken() error = %v", err)
	}

	if err := svc.ValidateToken(secret, token); err != nil {
		t.Fatalf("ValidateToken() error = %v", err)
	}
}

func TestValidateUnmaskedCookieToken(t *testing.T) {
	svc := NewService(ServiceConfig{})
	secret := make([]byte, 32)
	for i := range secret {
		secret[i] = byte(i + 10)
	}

	cookieValue := "CgM7RVRaFz0FY8OFsz8RPn8zthQ28Fj8okQEdhR6ZeY"
	if err := svc.ValidateToken(secret, cookieValue); err == nil {
		t.Fatalf("ValidateToken() expected error for unrelated token")
	}
}

func TestValidateRejectsTamperedToken(t *testing.T) {
	svc := NewService(ServiceConfig{})
	secret := make([]byte, 32)
	for i := range secret {
		secret[i] = byte(i + 1)
	}

	token, err := svc.IssueToken(secret)
	if err != nil {
		t.Fatalf("IssueToken() error = %v", err)
	}

	tampered := token + "A"
	if err := svc.ValidateToken(secret, tampered); err == nil {
		t.Fatalf("ValidateToken() expected error for tampered token")
	}
}
