import User from "../models/userModel.js";
import UserType from "../models/userTypeModel.js"
import Session from "../models/sessionModel.js";
import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";
import { verifyToken } from "../services/googleAuthService.js";
import { randomUUID } from "crypto";
import { logActivity, directActivityLoggers } from "../middlewares/activityLoggerMiddleware.js";
import { asyncErrorHandler, handleDatabaseError, handleAuthError } from "../middlewares/errorHandlerMiddleware.js";

export const createUser = asyncErrorHandler(async (req, res) => {
  const { firstName, lastName, email, password, otp } = req.body;

  if (!firstName || !lastName || !email || !password)
    return res.status(400).json({ message: "All fields are required!" });

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(401).json({
        error: "Invalid or Expired OTP",
      });
    }

    await OTP.deleteByEmail(email);

    const users = await User.find();

    if(users.length===0){
      const userType = await UserType.create({
        name: "superadmin"
      })

      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        userTypeId : userType.id
      });
      return res.status(201).json({
        success: true,
        message: "User created successfully.",
      });


    }
    const userType = await UserType.create({})

    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        userTypeId : userType.id
      });
      return res.status(201).json({
        success: true,
        message: "User created successfully.",
      });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: "Email already exists!",
      });
    } else {
      throw handleDatabaseError(error, req);
    }
  }
});

export const loginUser = asyncErrorHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord)
      return res.status(401).json({
        error: "Invalid or Expired OTP!",
      });

    await OTP.deleteByEmail(email);

    const user = await User.findOne({ email });

    if (user.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });

    if (!user)
      return res.status(409).json({
        error: "Invalid credentials!",
      });
    const checkPassword = await User.comparePassword(user.password, password);

    if (!checkPassword)
      return res.status(409).json({
        error: "Invalid credentials!",
      });

    const allSession = await Session.find({ userId: user.id });

    if (allSession.length >= 2) {
      await Session.deleteById(allSession[0].id);
    }

    const session = await Session.create({
      userId: user.id,
      expiry: Math.round(Date.now() / 1000) + 60 * 60 * 8,
    });

    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    // Log login activity
    await directActivityLoggers.userLogin(user.id, email);

    const userType = await UserType.findById(user.userTypeId);

    const responseData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        userTypeId: user.userTypeId,
        isActive: user.isActive,
        picture: user.picture,
        isDeleted: user.isDeleted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        userType: {
          id: userType.id,
          name: userType.name,
          createdAt: userType.createdAt,
          updatedAt: userType.updatedAt,
          isActive: userType.isActive
        }
      },
      session: {
        id: session.id,
        userId: session.userId,
        expiry: session.expiry,
        createdAt: session.createdAt
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    throw handleAuthError(error, req);
  }
});

export const createNewPassword = asyncErrorHandler(async (req, res) => {
  const { email, newPassword, otp } = req.body;
  try {
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord)
      return res.status(401).json({
        error: "Invalid or Expired OTP!",
      });

    await OTP.deleteByEmail(email);

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({
        error: "User not found!",
      });

    if (user.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });

    const isSamePassword = await User.comparePassword(user.password, newPassword);
    if (isSamePassword)
      return res.status(400).json({
        error: "New Password is same as current password!",
      });

    await User.updateById(user.id, {
      password: newPassword,
    });

    // Log password change activity
    await directActivityLoggers.passwordChanged(user.id);

    return res.status(201).json({
      message: "Password reset successfully!",
    });
  } catch (error) {
    throw handleDatabaseError(error, req);
  }
});

export const getUserDetails = asyncErrorHandler(async (req, res) => {
  const userType = await UserType.findById(req.user.userTypeId);
  return res.status(200).json({
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    picture: req.user.picture,
    userType: userType.name,
  });
});

export const logoutUser = asyncErrorHandler(async (req, res) => {
  const sessionId = req.signedCookies.sid;
  if (sessionId) {
    try {
      await Session.deleteById(sessionId);
    } catch (error) {
      // Log error silently or use proper logging
    }
  }

  // Log logout activity before clearing cookie
  await directActivityLoggers.userLogout(req.user?.id);

  res.clearCookie("sid");
  res.status(200).end();
});

export const logouAll = asyncErrorHandler(async (req, res) => {
  const sessionId = req.signedCookies.sid;
  try {
    const session = await Session.findById(sessionId);
    if (session) {
      await Session.deleteById(sessionId);
      // Delete all sessions for this user
      await Session.find({ userId: session.userId }).then(sessions => {
        sessions.forEach(sess => Session.deleteById(sess.id));
      });
    }
  } catch (error) {
    // Log error silently or use proper logging
  }

  res.clearCookie("sid");
  res.status(200).end();
});

export const sendOtp = asyncErrorHandler(async (req, res) => {
  const { email } = req.body;
  await sendOtpService(email);
  res.status(201).json({
    message: "OTP sent successfully",
  });
});

export const verifyOtp = asyncErrorHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord)
    return res.status(404).json({
      error: "Invalid or Expired OTP",
    });

  res.status(201).json({
    message: "OTP verification successful",
  });
});

export const loginWithGoogle = asyncErrorHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken)
    return res.status(400).json({
      error: "something went wrong!",
    });

  try {
    const { email } = await verifyToken(idToken);

    const user = await User.findOne({ email });

    if (user?.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });

    if (user) {
      const userSessions = await Session.find({ userId: user.id });

      if (userSessions.length >= 2) {
        await Session.deleteById(userSessions[0].id);
      }

      const session = await Session.create({
        userId: user.id,
        expiry: Math.round(Date.now() / 1000) + 60 * 60 * 8,
      });

      res.cookie("sid", session.id, {
        httpOnly: true,
        signed: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 1000 * 60 * 24 * 7,
      });

      // Log login activity
      await directActivityLoggers.userLogin(user.id, email);

      return res.status(200).json({
        message: "Login successfully!",
      });
    } else {
      const { email, name, picture } = await verifyToken(idToken);

      const users = await User.find();

      const userType = users.length ? await UserType.findOne({ name: "user" }) : await UserType.findOne({ name: "superadmin" });
      const user = await User.create({
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        email,
        password: randomUUID(),
        picture,
        userTypeId: userType.id,
      });

      const setSession = await Session.create({
        userId: user.id,
        expiry: Math.round(Date.now() / 1000) + 60 * 60 * 8,
      });

      res.cookie("sid", setSession.id, {
        httpOnly: true,
        signed: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 1000 * 60 * 24 * 7,
      });

      // Log user creation and login activity
      await logActivity('user_created', `User ${name} was created`, user.id, { email });
      await directActivityLoggers.userLogin(user.id, email);

      return res.status(201).json({
        success: true,
        message: "User created successfully.",
      });
    }
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: "Email already exists!",
      });
    } else {
      throw handleDatabaseError(error, req);
    }
  }
});
