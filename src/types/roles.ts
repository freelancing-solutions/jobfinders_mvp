/**
 * User Role Management System
 * 
 * This module provides type-safe role management for the JobFinders platform.
 * It replaces string-based role comparisons with proper enums and display mappings.
 */

// Core user roles enum - matches database values
export enum UserRole {
  EMPLOYER = 'EMPLOYER',
  JOB_SEEKER = 'JOB_SEEKER', 
  ADMIN = 'ADMIN'
}

// Legacy database values mapping (for backward compatibility during migration)
export enum LegacyUserRole {
  EMPLOYER = 'employer',
  JOB_SEEKER = 'seeker',
  ADMIN = 'admin'
}

// Display text mapping for UI components
export const RoleDisplayText = {
  [UserRole.EMPLOYER]: 'Employer',
  [UserRole.JOB_SEEKER]: 'Job Seeker',
  [UserRole.ADMIN]: 'Administrator'
} as const;

// Legacy display text mapping (for backward compatibility)
export const LegacyRoleDisplayText = {
  [LegacyUserRole.EMPLOYER]: 'employer',
  [LegacyUserRole.JOB_SEEKER]: 'job seeker', 
  [LegacyUserRole.ADMIN]: 'administrator'
} as const;

// Type guards for role validation
export const isUserRole = (role: any): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export const isLegacyUserRole = (role: any): role is string => {
  if (typeof role !== 'string') return false;
  const normalizedRole = role.toLowerCase();
  return ['seeker', 'employer', 'admin'].includes(normalizedRole) ||
         Object.values(UserRole).includes(role as UserRole);
};

// Additional utility functions for hierarchy and permissions
export const getRoleHierarchyLevel = (role: UserRole | string | null | undefined): number => {
  if (!role) return 0;
  
  let normalizedRole: UserRole;
  if (typeof role === 'string') {
    normalizedRole = convertLegacyToNewRole(role);
  } else {
    normalizedRole = role;
  }
  
  return RoleHierarchy[normalizedRole] || 0;
};

export const hasPermission = (userRole: UserRole | string | null | undefined, requiredRole: UserRole | string): boolean => {
  const userLevel = getRoleHierarchyLevel(userRole);
  const requiredLevel = getRoleHierarchyLevel(requiredRole);
  return userLevel >= requiredLevel;
};

// Role conversion utilities for migration
export const convertLegacyToNewRole = (legacyRole: string): UserRole => {
  const normalizedRole = legacyRole.toLowerCase();
  switch (normalizedRole) {
    case 'employer':
      return UserRole.EMPLOYER;
    case 'seeker':
    case 'job_seeker':
      return UserRole.JOB_SEEKER;
    case 'admin':
      return UserRole.ADMIN;
    default:
      // Return default role instead of throwing error for better compatibility
      return UserRole.JOB_SEEKER;
  }
};

export const convertNewToLegacyRole = (newRole: UserRole): LegacyUserRole => {
  switch (newRole) {
    case UserRole.EMPLOYER:
      return LegacyUserRole.EMPLOYER;
    case UserRole.JOB_SEEKER:
      return LegacyUserRole.JOB_SEEKER;
    case UserRole.ADMIN:
      return LegacyUserRole.ADMIN;
    default:
      throw new Error(`Invalid role: ${newRole}`);
  }
};

// Role permission helpers with hierarchy support
export const hasAdminAccess = (role: UserRole | string | null | undefined): boolean => {
  if (!role) return false;
  if (typeof role === 'string') {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'admin' || role === UserRole.ADMIN;
  }
  return role === UserRole.ADMIN;
};

export const hasEmployerAccess = (role: UserRole | string | null | undefined): boolean => {
  if (!role) return false;
  if (typeof role === 'string') {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'employer' || normalizedRole === 'admin' || 
           role === UserRole.EMPLOYER || role === UserRole.ADMIN;
  }
  return role === UserRole.EMPLOYER || role === UserRole.ADMIN;
};

export const hasJobSeekerAccess = (role: UserRole | string | null | undefined): boolean => {
  if (!role) return false;
  if (typeof role === 'string') {
    const normalizedRole = role.toLowerCase();
    return normalizedRole === 'seeker' || normalizedRole === 'admin' || 
           role === UserRole.JOB_SEEKER || role === UserRole.ADMIN;
  }
  return role === UserRole.JOB_SEEKER || role === UserRole.ADMIN;
};

// Role hierarchy for permission checks
export const RoleHierarchy = {
  [UserRole.ADMIN]: 3,
  [UserRole.EMPLOYER]: 2,
  [UserRole.JOB_SEEKER]: 1
} as const;

export const hasRolePermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
};

// Type definitions for better TypeScript support
export type UserRoleType = keyof typeof UserRole;
export type RoleDisplayTextType = typeof RoleDisplayText[UserRole];
export type LegacyUserRoleType = keyof typeof LegacyUserRole;

// Default role for new users
export const DEFAULT_USER_ROLE = UserRole.JOB_SEEKER;
export const DEFAULT_LEGACY_USER_ROLE = LegacyUserRole.JOB_SEEKER;