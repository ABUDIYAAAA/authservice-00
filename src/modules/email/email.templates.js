const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);

const sanitizeHref = (value) => {
  const raw = String(value ?? "").trim();

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "#";
    }

    return parsed.toString();
  } catch {
    return "#";
  }
};

export const welcomeTemplate = ({ name }) => {
  const safeName = escapeHtml(name);

  return `
  <h1>Welcome${safeName ? `, ${safeName}` : ""}!</h1>
  <p>Your account has been created successfully.</p>
`;
};

export const emailVerificationTemplate = ({ verifyUrl }) => {
  const safeVerifyUrl = escapeHtml(sanitizeHref(verifyUrl));

  return `
  <h1>Verify your email</h1>
  <p>Click the link below to verify your email address:</p>
  <a href="${safeVerifyUrl}">${safeVerifyUrl}</a>
`;
};

export const passwordResetTemplate = ({ resetUrl }) => {
  const safeResetUrl = escapeHtml(sanitizeHref(resetUrl));

  return `
  <h1>Password reset request</h1>
  <p>Use the link below to reset your password. This link expires in 1 hour.</p>
  <a href="${safeResetUrl}">${safeResetUrl}</a>
`;
};

export const newDeviceAlertTemplate = ({
  ipAddress,
  userAgent,
  loggedInAt,
}) => {
  const safeIpAddress = escapeHtml(ipAddress);
  const safeUserAgent = escapeHtml(userAgent);
  const safeLoggedInAt = escapeHtml(loggedInAt);

  return `
  <h1>New device login detected</h1>
  <p>We noticed a new login:</p>
  <ul>
    <li><strong>Time:</strong> ${safeLoggedInAt}</li>
    <li><strong>IP:</strong> ${safeIpAddress}</li>
    <li><strong>Device:</strong> ${safeUserAgent}</li>
  </ul>
`;
};

export const passwordChangedTemplate = ({ changedAt }) => {
  const safeChangedAt = escapeHtml(changedAt);

  return `
  <h1>Password changed</h1>
  <p>Your password was changed at ${safeChangedAt}.</p>
  <p>If this was not you, contact support immediately.</p>
`;
};

export const organizationInviteTemplate = ({
  organizationName,
  inviteUrl,
  expiresAt,
}) => {
  const safeOrganizationName = escapeHtml(organizationName);
  const safeInviteUrl = escapeHtml(sanitizeHref(inviteUrl));
  const safeExpiresAt = escapeHtml(expiresAt);

  return `
  <h1>Organization Invite</h1>
  <p>You were invited to join <strong>${safeOrganizationName}</strong> as a collaborator.</p>
  <p>This invite expires at ${safeExpiresAt}.</p>
  <a href="${safeInviteUrl}">${safeInviteUrl}</a>
`;
};
