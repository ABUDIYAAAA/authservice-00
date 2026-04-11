import { updateMeSchema } from "../../validations/user/user.validators.js";
import { deleteMe, getMe, updateMe } from "./user.service.js";

export const getMeHandler = async (req, res) => {
  const user = await getMe(req.auth.sub);
  res.status(200).json({ user });
};

export const updateMeHandler = async (req, res) => {
  const payload = updateMeSchema.parse(req.body);
  const user = await updateMe(req.auth.sub, payload);
  res.status(200).json({ user });
};

export const deleteMeHandler = async (req, res) => {
  await deleteMe(req.auth.sub);
  res.status(204).send();
};
