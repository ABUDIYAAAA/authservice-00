import {
  OPENAPI_DESCRIPTIONS,
  OPENAPI_PATHS,
  OPENAPI_SECURITY,
  OPENAPI_TAGS,
} from "./openapi.constants.js";

const jsonRefResponse = (description, ref) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: ref },
    },
  },
});

const jsonObjectResponse = (description, schema) => ({
  description,
  content: {
    "application/json": {
      schema,
    },
  },
});

export const OPENAPI_PATH_DEFINITIONS = {
  [OPENAPI_PATHS.AUTH_SIGNUP]: {
    post: {
      summary: "Register a new user account",
      tags: [OPENAPI_TAGS.AUTH],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SignupRequest" },
          },
        },
      },
      responses: {
        201: jsonRefResponse(
          OPENAPI_DESCRIPTIONS.SIGNUP_SUCCESS,
          "#/components/schemas/AuthResponse",
        ),
        400: jsonRefResponse(
          OPENAPI_DESCRIPTIONS.INVALID_INPUT,
          "#/components/schemas/ErrorResponse",
        ),
        409: { description: "Email already exists" },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_LOGIN]: {
    post: {
      summary: "Sign in with email and password",
      tags: [OPENAPI_TAGS.AUTH],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
          },
        },
      },
      responses: {
        200: jsonRefResponse(
          OPENAPI_DESCRIPTIONS.LOGIN_SUCCESS,
          "#/components/schemas/AuthResponse",
        ),
        401: { description: OPENAPI_DESCRIPTIONS.INVALID_CREDENTIALS },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_LOGOUT]: {
    post: {
      summary: "Logout current session",
      tags: [OPENAPI_TAGS.AUTH],
      security: OPENAPI_SECURITY.AUTHENTICATED,
      responses: {
        200: { description: OPENAPI_DESCRIPTIONS.LOGOUT_SUCCESS },
        401: { description: OPENAPI_DESCRIPTIONS.UNAUTHORIZED },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_REFRESH]: {
    post: {
      summary: "Refresh access token using refresh cookie",
      tags: [OPENAPI_TAGS.AUTH],
      responses: {
        200: jsonRefResponse(
          OPENAPI_DESCRIPTIONS.TOKEN_REFRESHED,
          "#/components/schemas/RefreshResponse",
        ),
        401: { description: OPENAPI_DESCRIPTIONS.INVALID_REFRESH_TOKEN },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_VERIFY_EMAIL]: {
    get: {
      summary: "Verify user email by one-time token",
      tags: [OPENAPI_TAGS.AUTH],
      parameters: [
        {
          in: "path",
          name: "token",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: OPENAPI_DESCRIPTIONS.EMAIL_VERIFIED },
        401: { description: OPENAPI_DESCRIPTIONS.INVALID_TOKEN },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_RESEND_VERIFICATION]: {
    post: {
      summary: "Resend verification email",
      tags: [OPENAPI_TAGS.AUTH],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: { type: "string", format: "email" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: OPENAPI_DESCRIPTIONS.REQUEST_ACCEPTED },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_FORGOT_PASSWORD]: {
    post: {
      summary: "Request password reset link",
      tags: [OPENAPI_TAGS.AUTH],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: { type: "string", format: "email" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: OPENAPI_DESCRIPTIONS.REQUEST_ACCEPTED },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_RESET_PASSWORD]: {
    post: {
      summary: "Reset account password with one-time token",
      tags: [OPENAPI_TAGS.AUTH],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["token", "password"],
              properties: {
                token: { type: "string" },
                password: { type: "string", minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: OPENAPI_DESCRIPTIONS.PASSWORD_UPDATED },
        401: { description: OPENAPI_DESCRIPTIONS.INVALID_TOKEN },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_SESSIONS]: {
    get: {
      summary: "List active sessions for current user",
      tags: [OPENAPI_TAGS.AUTH],
      security: OPENAPI_SECURITY.AUTHENTICATED,
      responses: {
        200: jsonRefResponse(
          OPENAPI_DESCRIPTIONS.SESSION_LIST,
          "#/components/schemas/SessionListResponse",
        ),
        401: { description: OPENAPI_DESCRIPTIONS.UNAUTHORIZED },
      },
    },
  },
  [OPENAPI_PATHS.AUTH_SESSION_BY_ID]: {
    delete: {
      summary: "Revoke a specific session for current user",
      tags: [OPENAPI_TAGS.AUTH],
      security: OPENAPI_SECURITY.AUTHENTICATED,
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: OPENAPI_DESCRIPTIONS.SESSION_REVOKED },
        404: { description: OPENAPI_DESCRIPTIONS.SESSION_NOT_FOUND },
      },
    },
  },
  [OPENAPI_PATHS.USERS_ME]: {
    get: {
      summary: "Get current authenticated user profile",
      tags: [OPENAPI_TAGS.USERS],
      security: OPENAPI_SECURITY.AUTHENTICATED,
      responses: {
        200: jsonObjectResponse(OPENAPI_DESCRIPTIONS.CURRENT_USER, {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/AuthUser" },
          },
        }),
        401: { description: OPENAPI_DESCRIPTIONS.UNAUTHORIZED },
      },
    },
    patch: {
      summary: "Update current user profile",
      tags: [OPENAPI_TAGS.USERS],
      security: OPENAPI_SECURITY.AUTHENTICATED,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                avatarUrl: { type: "string", format: "uri" },
              },
            },
          },
        },
      },
      responses: {
        200: jsonObjectResponse(OPENAPI_DESCRIPTIONS.USER_UPDATED, {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/AuthUser" },
          },
        }),
        400: { description: OPENAPI_DESCRIPTIONS.INVALID_INPUT },
        401: { description: OPENAPI_DESCRIPTIONS.UNAUTHORIZED },
      },
    },
    delete: {
      summary: "Delete current user account",
      tags: [OPENAPI_TAGS.USERS],
      security: OPENAPI_SECURITY.AUTHENTICATED,
      responses: {
        204: { description: OPENAPI_DESCRIPTIONS.USER_DELETED },
        401: { description: OPENAPI_DESCRIPTIONS.UNAUTHORIZED },
      },
    },
  },
  [OPENAPI_PATHS.OAUTH_GOOGLE]: {
    get: {
      summary: "Start Google OAuth authorization flow",
      tags: [OPENAPI_TAGS.OAUTH],
      responses: {
        302: { description: OPENAPI_DESCRIPTIONS.OAUTH_PROVIDER_REDIRECT },
      },
    },
  },
  [OPENAPI_PATHS.OAUTH_GOOGLE_CALLBACK]: {
    get: {
      summary: "Handle Google OAuth callback and create authenticated session",
      tags: [OPENAPI_TAGS.OAUTH],
      parameters: [
        {
          in: "query",
          name: "code",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        302: { description: OPENAPI_DESCRIPTIONS.OAUTH_REDIRECT },
        400: { description: OPENAPI_DESCRIPTIONS.MISSING_OR_INVALID_CODE },
      },
    },
  },
  [OPENAPI_PATHS.OAUTH_GITHUB]: {
    get: {
      summary: "Start GitHub OAuth authorization flow",
      tags: [OPENAPI_TAGS.OAUTH],
      responses: {
        302: { description: OPENAPI_DESCRIPTIONS.OAUTH_PROVIDER_REDIRECT },
      },
    },
  },
  [OPENAPI_PATHS.OAUTH_GITHUB_CALLBACK]: {
    get: {
      summary: "Handle GitHub OAuth callback and create authenticated session",
      tags: [OPENAPI_TAGS.OAUTH],
      parameters: [
        {
          in: "query",
          name: "code",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        302: { description: OPENAPI_DESCRIPTIONS.OAUTH_REDIRECT },
        400: { description: OPENAPI_DESCRIPTIONS.MISSING_OR_INVALID_CODE },
      },
    },
  },
};
