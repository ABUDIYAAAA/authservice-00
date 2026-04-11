export const OPENAPI_TAGS = {
  AUTH: "Auth",
  USERS: "Users",
  OAUTH: "OAuth",
};

export const OPENAPI_SECURITY = {
  AUTHENTICATED: [{ bearerAuth: [] }, { cookieAuth: [] }],
};

export const OPENAPI_DESCRIPTIONS = {
  SIGNUP_SUCCESS: "Signup successful",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logged out",
  TOKEN_REFRESHED: "Token refreshed",
  EMAIL_VERIFIED: "Email verified",
  REQUEST_ACCEPTED: "Request accepted",
  PASSWORD_UPDATED: "Password updated",
  SESSION_LIST: "Session list",
  SESSION_REVOKED: "Session revoked",
  CURRENT_USER: "Current user",
  USER_UPDATED: "Updated user profile",
  USER_DELETED: "User deleted",
  OAUTH_REDIRECT: "Sets auth cookies and redirects to frontend",
  OAUTH_PROVIDER_REDIRECT: "Redirect to provider authorization page",
  INVALID_INPUT: "Invalid input",
  UNAUTHORIZED: "Unauthorized",
  INVALID_CREDENTIALS: "Invalid credentials",
  INVALID_TOKEN: "Invalid or expired token",
  INVALID_REFRESH_TOKEN: "Invalid or missing refresh token",
  SESSION_NOT_FOUND: "Session not found",
  MISSING_OR_INVALID_CODE: "Missing or invalid authorization code",
};

export const OPENAPI_PATHS = {
  AUTH_SIGNUP: "/api/auth/signup",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_REFRESH: "/api/auth/refresh",
  AUTH_VERIFY_EMAIL: "/api/auth/verify-email/{token}",
  AUTH_RESEND_VERIFICATION: "/api/auth/resend-verification",
  AUTH_FORGOT_PASSWORD: "/api/auth/forgot-password",
  AUTH_RESET_PASSWORD: "/api/auth/reset-password",
  AUTH_SESSIONS: "/api/auth/sessions",
  AUTH_SESSION_BY_ID: "/api/auth/sessions/{id}",
  USERS_ME: "/api/users/me",
  OAUTH_GOOGLE: "/api/oauth/google",
  OAUTH_GOOGLE_CALLBACK: "/api/oauth/google/callback",
  OAUTH_GITHUB: "/api/oauth/github",
  OAUTH_GITHUB_CALLBACK: "/api/oauth/github/callback",
};
