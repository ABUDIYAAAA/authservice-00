import { updateMeSchema } from "../../validations/user/user.validators.js";
import { deleteMe, getMe, updateMe } from "./user.service.js";
import {
  AUDIT_CATEGORY,
  AUDIT_EVENTS,
  AUDIT_STATUS,
} from "../audit/audit.events.js";
import {
  buildAuditContextFromRequest,
  emitAuditEvent,
} from "../audit/audit.service.js";

export const getMeHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const user = await getMe(req.auth.sub);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.USER_PROFILE_VIEWED,
    category: AUDIT_CATEGORY.USER,
    status: AUDIT_STATUS.SUCCESS,
    targetUserId: user.id,
    message: "User profile viewed",
  });

  res.status(200).json({ user });
};

export const updateMeHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);
  const payload = updateMeSchema.parse(req.body);
  const user = await updateMe(req.auth.sub, payload);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.USER_PROFILE_UPDATED,
    category: AUDIT_CATEGORY.USER,
    status: AUDIT_STATUS.SUCCESS,
    targetUserId: user.id,
    message: "User profile updated",
    metadata: {
      updatedFields: Object.keys(payload),
    },
  });

  res.status(200).json({ user });
};

export const deleteMeHandler = async (req, res) => {
  const auditContext = buildAuditContextFromRequest(req);

  await deleteMe(req.auth.sub);

  await emitAuditEvent({
    ...auditContext,
    event: AUDIT_EVENTS.USER_PROFILE_DELETED,
    category: AUDIT_CATEGORY.USER,
    status: AUDIT_STATUS.SUCCESS,
    targetUserId: req.auth.sub,
    message: "User profile deleted",
  });

  res.status(204).send();
};
