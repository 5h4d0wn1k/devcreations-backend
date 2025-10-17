import express from "express";
import { CheckAuth } from "../middlewares/authMiddleware.js";
import { authLimiter } from "../middlewares/rateLimitMiddleware.js";
import {
  validateRequest,
  createUserSchema,
  loginUserSchema,
  createNewPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  loginWithGoogleSchema,
} from "../middlewares/validationMiddleware.js";
import {
  createNewPassword,
  createUser,
  getUserDetails,
  loginUser,
  loginWithGoogle,
  logouAll,
  logoutUser,
  sendOtp,
  verifyOtp,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/user/register", authLimiter, validateRequest(createUserSchema), createUser);

router.post("/user/login", authLimiter, validateRequest(loginUserSchema), loginUser);

router.get("/user/data", CheckAuth, getUserDetails);

router.post("/user/logout", logoutUser);

router.post("/user/forgot/password", validateRequest(createNewPasswordSchema), createNewPassword);

router.post("/user/logout/all", logouAll);

router.post("/user/send-otp", authLimiter, validateRequest(sendOtpSchema), sendOtp);

router.post("/user/verify-otp", authLimiter, validateRequest(verifyOtpSchema), verifyOtp);

router.post("/user/google/login", authLimiter, validateRequest(loginWithGoogleSchema), loginWithGoogle);

export default router;
