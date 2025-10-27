import Session from "../models/sessionModel.js";
import User from "../models/userModel.js";
import UserType from "../models/userTypeModel.js"

export const CheckAuth = async (req, res, next) => {
  const { sid } = req.signedCookies;

  if (!sid) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "Not logged in!!" });
  }

  try {
    const session = await Session.findById(sid);

    if (!session?.userId)
      return res.status(401).json({ error: "Not logged in!" });

    const currentTimeInSecond = Math.round(Date.now() / 1000);

    // Auto-refresh session if within 30 minutes of expiry
    const timeToExpiry = session?.expiry - currentTimeInSecond;
    if (timeToExpiry <= 30 * 60 && timeToExpiry > 0) {
      const newExpiry = currentTimeInSecond + 60 * 60 * 8; // Extend by 8 hours
      await Session.updateById(session.id, { expiry: newExpiry });
    }

    if (currentTimeInSecond > session?.expiry) {
      res.clearCookie("sid");
      return res.status(401).json({
        message: "Logged out!",
      });
    }

    const user = await User.findById(session?.userId);
    if (!user) return res.status(401).json({ error: "Not logged in!" });
    else if (user.isDeleted)
      return res.status(403).json({
        error:
          "Your account has been deleted. Contact your application Admin to recover your account!",
      });
    req.user = user;
  } catch (error) {
    next(error);
  }
  next();
};

export const isAdminOrManager = async (req, res, next) => {
  try {
    const user = req.user;
    const userType = await UserType.findById(user.userTypeId);
    if (userType && (userType.name === "superadmin" || userType.name === "admin" || userType.name === "manager")) return next();
    return res.status(403).json({
      error: "You do not have an access to manage users!",
    });
  } catch (error) {
    next(error);
  }
};
  
  export const isOwner = async (req, res, next) => {
    try {
      const user = req.user;
      const userType = await UserType.findById(user.userTypeId);
      if (!userType || userType.name !== "superadmin") {
        return res.status(403).json({
          error: "You do not have access to perform owner operations!",
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export const isAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    const userType = await UserType.findById(user.userTypeId);
    if (userType.name !== "superadmin" && userType.name !== "admin")
      return res.status(403).json({
        error: "You do not have access to manage users!",
      });

    next();
  } catch (error) {
    next(error);
  }
};

export const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    const userType = await UserType.findById(user.userTypeId);
    if (!userType || (userType.name !== "superadmin" && userType.name !== "admin")) {
      return res.status(403).json({
        error: "Unauthorized access!",
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const isManager = async (req, res, next) => {
  try {
    const user = req.user;
    const userType = await UserType.findById(user.userTypeId);
    if (userType && userType.name === "manager")
      return next();
    return res.status(403).json({
      error: "You do not have an access to manage users!",
    });
  } catch (error) {
    next(error);
  }
};
