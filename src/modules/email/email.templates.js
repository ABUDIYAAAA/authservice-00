export const welcomeTemplate = ({ name }) => `
  <h1>Welcome${name ? `, ${name}` : ""}!</h1>
  <p>Your account has been created successfully.</p>
`;

export const emailVerificationTemplate = ({ verifyUrl }) => `
  <h1>Verify your email</h1>
  <p>Click the link below to verify your email address:</p>
  <a href="${verifyUrl}">${verifyUrl}</a>
`;

export const passwordResetTemplate = ({ resetUrl }) => `
  <h1>Password reset request</h1>
  <p>Use the link below to reset your password. This link expires in 1 hour.</p>
  <a href="${resetUrl}">${resetUrl}</a>
`;

export const newDeviceAlertTemplate = ({
  ipAddress,
  userAgent,
  loggedInAt,
}) => `
  <h1>New device login detected</h1>
  <p>We noticed a new login:</p>
  <ul>
    <li><strong>Time:</strong> ${loggedInAt}</li>
    <li><strong>IP:</strong> ${ipAddress}</li>
    <li><strong>Device:</strong> ${userAgent}</li>
  </ul>
`;

export const passwordChangedTemplate = ({ changedAt }) => `
  <h1>Password changed</h1>
  <p>Your password was changed at ${changedAt}.</p>
  <p>If this was not you, contact support immediately.</p>
`;

export const organizationInviteTemplate = ({
  organizationName,
  inviteUrl,
  expiresAt,
}) => `
  <h1>Organization Invite</h1>
  <p>You were invited to join <strong>${organizationName}</strong> as a collaborator.</p>
  <p>This invite expires at ${expiresAt}.</p>
  <a href="${inviteUrl}">${inviteUrl}</a>
`;
