import { Router } from "express";
import asyncHandler from "../../utils/async-handler.js";
import { oauthCallbackHandler, oauthStartHandler } from "./oauth.controller.js";
import { OAUTH_PROVIDERS, OAUTH_ROUTE_PATHS } from "./oauth.constants.js";

const router = Router();

router.get(
  OAUTH_ROUTE_PATHS.GOOGLE,
  asyncHandler((req, res) => {
    req.params.provider = OAUTH_PROVIDERS.GOOGLE;
    return oauthStartHandler(req, res);
  }),
);

router.get(
  OAUTH_ROUTE_PATHS.GOOGLE_CALLBACK,
  asyncHandler((req, res) => {
    req.params.provider = OAUTH_PROVIDERS.GOOGLE;
    return oauthCallbackHandler(req, res);
  }),
);

router.get(
  OAUTH_ROUTE_PATHS.GITHUB,
  asyncHandler((req, res) => {
    req.params.provider = OAUTH_PROVIDERS.GITHUB;
    return oauthStartHandler(req, res);
  }),
);

router.get(
  OAUTH_ROUTE_PATHS.GITHUB_CALLBACK,
  asyncHandler((req, res) => {
    req.params.provider = OAUTH_PROVIDERS.GITHUB;
    return oauthCallbackHandler(req, res);
  }),
);

export default router;
