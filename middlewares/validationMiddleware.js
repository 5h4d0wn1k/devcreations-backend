import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  otp: z.string().min(1, "OTP is required")
});

export const loginUserSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  otp: z.string().min(1, "OTP is required")
});

export const createNewPasswordSchema = z.object({
  email: z.email("Invalid email format"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  otp: z.string().min(1, "OTP is required")
});

export const sendOtpSchema = z.object({
  email: z.email("Invalid email format")
});

export const verifyOtpSchema = z.object({
  email: z.email("Invalid email format"),
  otp: z.string().min(1, "OTP is required")
});

export const loginWithGoogleSchema = z.object({
  idToken: z.string().min(1, "ID token is required")
});

// Admin schemas
export const changeUserRoleSchema = z.object({
  userTypeName: z.string().min(1, "User type name is required")
});

export const createAdminUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
  userTypeId: z.string().min(1, "User type ID is required"),
  bankName: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAddress: z.string().optional(),
  isActive: z.boolean().optional()
});

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  address: z.string().optional(),
  userTypeId: z.string().optional(),
  bankName: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAddress: z.string().optional(),
  isActive: z.boolean().optional()
});

export const createModuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentId: z.string().optional(),
  urlSlug: z.string().optional(),
  toolTip: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export const updateModuleSchema = z.object({
  name: z.string().optional(),
  parentId: z.string().optional(),
  urlSlug: z.string().optional(),
  toolTip: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

export const assignModuleToUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  moduleId: z.string().min(1, "Module ID is required")
});

export const unassignModuleFromUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  moduleId: z.string().min(1, "Module ID is required")
});

export const bulkAssignModulesSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  moduleIds: z.array(z.string()).min(1, "At least one module ID is required")
});

export const createUserTypeSchema = z.object({
  name: z.string().min(1, "Name is required")
});

export const updateUserTypeSchema = z.object({
  name: z.string().optional()
});

// Validation middleware function
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      console.log("from ",error.message);
      return res.status(400).json({
        error: "Validation failed",
        details:  error.message
        
      });
    }
  };
};