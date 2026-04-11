import { DAY_MS } from "../../core/constants/time.constants.js";

export const ORGANIZATION_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
};

export const ORGANIZATION_ROLE_VALUES = Object.values(ORGANIZATION_ROLES);

export const ORGANIZATION_NAME_LIMITS = {
  MIN: 2,
  MAX: 255,
};

export const ORGANIZATION_SLUG_LIMITS = {
  MIN: 3,
  MAX: 255,
};

export const ORGANIZATION_INVITE_TTL_MS = 7 * DAY_MS;

export const ORGANIZATION_TOKEN_BYTES = 32;

export const ORGANIZATION_ROUTE_PATHS = {
  FRONTEND_INVITE_ACCEPT: "/org-invite",
};

export const ORGANIZATION_ERRORS = {
  INVALID_NAME: "Organization name is invalid",
  NAME_ALREADY_EXISTS: "Organization name already exists",
  ORGANIZATION_NOT_FOUND: "Organization not found",
  MEMBERSHIP_REQUIRED: "You are not a collaborator in this organization",
  INSUFFICIENT_PERMISSIONS: "You do not have permission for this organization",
  INVITE_ALREADY_EXISTS: "An active invite already exists for this email",
  INVITE_NOT_FOUND: "Invite not found",
  INVITE_INVALID: "Invite is invalid or expired",
  INVITE_EMAIL_MISMATCH: "Invite email does not match your account email",
  INVITE_ALREADY_USED: "Invite has already been used",
  INVITE_ALREADY_REVOKED: "Invite has already been revoked",
  ALREADY_COLLABORATOR: "User is already a collaborator",
  OWNER_ROLE_REQUIRED: "Only an owner can perform this action",
};

export const ORGANIZATION_MESSAGES = {
  INVITE_SENT: "Invite sent",
  INVITE_ACCEPTED: "Invite accepted",
  INVITE_REVOKED: "Invite revoked",
  ORGANIZATION_DELETED: "Organization deleted",
};
