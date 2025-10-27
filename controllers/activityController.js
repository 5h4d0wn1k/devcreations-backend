import { getActivities } from '../models/activityModel.js';

export const getActivitiesController = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      userId,
      startDate,
      endDate,
      userRole
    } = req.query;

    // Get current user for role-based filtering
    const currentUserRole = req.user?.userType?.name?.toLowerCase() || 'user';

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      userId: userId || req.user?.id, // Default to current user if no userId specified
      startDate,
      endDate,
      userRole: userRole || currentUserRole,
    };

    const result = await getActivities(filters);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching activities:', error);
    next(error);
  }
};

export const getDashboardActivities = async (req, res, next) => {
  try {
    const { limit = 10, userRole } = req.query;

    // Get current user role for filtering
    const currentUserRole = req.user?.userType?.name?.toLowerCase() || 'user';

    const filters = {
      page: 1,
      limit: parseInt(limit),
      userRole: userRole || currentUserRole,
    };

    const result = await getActivities(filters);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    next(error);
  }
};