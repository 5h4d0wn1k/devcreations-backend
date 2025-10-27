import { createActivity } from '../models/activityModel.js';

export const logActivity = async (type, description, userId = null, metadata = {}) => {
  try {
    await createActivity({
      type,
      description,
      userId,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

export const activityLogger = (type, getDescription, getMetadata = () => ({})) => {
  return async (req, res, next = null) => {
    const originalSend = res.send;
    const userId = req.user?.id || null;

    res.send = function (data) {
      // Only log successful operations (status codes 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const description = typeof getDescription === 'function'
            ? getDescription(req, res, data)
            : getDescription;

          const metadata = typeof getMetadata === 'function'
            ? getMetadata(req, res, data)
            : getMetadata;

          logActivity(type, description, userId, metadata);
        } catch (error) {
          console.error('Error in activity logger:', error);
        }
      }

      originalSend.call(this, data);
    };

    if (next && typeof next === 'function') {
      next();
    }
  };
};

// Predefined activity loggers for common operations
export const userActivityLoggers = {
  userCreated: activityLogger(
    'user_created',
    (req) => `User ${req.body.firstName} ${req.body.lastName} was created`,
    (req) => ({ email: req.body.email })
  ),

  userUpdated: activityLogger(
    'user_updated',
    (req) => `User profile was updated`,
    (req) => ({ userId: req.params.id })
  ),

  userDeleted: activityLogger(
    'user_deleted',
    (req) => `User was deleted`,
    (req) => ({ userId: req.params.id })
  ),

  userLogin: activityLogger(
    'login',
    (req) => `User logged in`,
    (req) => ({ email: req.body.email })
  ),

  userLogout: activityLogger(
    'logout',
    (req) => `User logged out`,
    () => ({})
  ),

  passwordChanged: activityLogger(
    'password_changed',
    (req) => `Password was changed`,
    () => ({})
  ),

  moduleAssigned: activityLogger(
    'module_assigned',
    (req) => `Module was assigned to user`,
    (req) => ({ userId: req.body.userId, moduleId: req.body.moduleId })
  ),

  permissionChanged: activityLogger(
    'permission_changed',
    (req) => `User permissions were changed`,
    (req) => ({ userId: req.params.id })
  ),

  moduleCreated: activityLogger(
    'module_created',
    (req) => `Module "${req.body.name}" was created`,
    (req) => ({ moduleName: req.body.name, urlSlug: req.body.urlSlug })
  ),

  moduleUpdated: activityLogger(
    'module_updated',
    (req) => `Module was updated`,
    (req) => ({ moduleId: req.params.id })
  ),

  moduleDeactivated: activityLogger(
    'module_deactivated',
    (req) => `Module was deactivated`,
    (req) => ({ moduleId: req.params.id })
  ),

  moduleDeleted: activityLogger(
    'module_deleted',
    (req) => `Module was deleted`,
    (req) => ({ moduleId: req.params.id })
  ),
};

// Direct logging functions for use in controllers (no req, res, next required)
export const directActivityLoggers = {
  userLogin: async (userId, email) => {
    await logActivity('login', 'User logged in', userId, { email });
  },

  userLogout: async (userId) => {
    await logActivity('logout', 'User logged out', userId, {});
  },

  passwordChanged: async (userId) => {
    await logActivity('password_changed', 'Password was changed', userId, {});
  },
};