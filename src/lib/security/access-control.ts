/**
 * Access Control and Permissions System
 *
 * Comprehensive role-based access control (RBAC) system with fine-grained
 * permissions, resource ownership, and delegation capabilities.
 */

import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: {
    ownership?: boolean;
    level?: number;
    timeBased?: boolean;
    locationBased?: boolean;
  };
  category: 'read' | 'write' | 'delete' | 'admin' | 'system';
  isSystem: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  department?: string;
  location?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  type: string;
  ownerId?: string;
  department?: string;
  location?: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  metadata: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessRequest {
  id: string;
  requesterId: string;
  requestedPermission: string;
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  reason: string;
  duration?: {
    start: Date;
    end: Date;
  };
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approverId?: string;
  approvedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessSession {
  id: string;
  userId: string;
  permissions: Array<{
    permission: string;
    resourceType: string;
    resourceId: string;
    conditions: { [key: string]: any };
  }>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

class AccessControlService {
  private static instance: AccessControlService;
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  private userPermissions: Map<string, string[]> = new Map();
  private resourceOwners: Map<string, string> = new Map();

  private constructor() {
    this.initializeSystemRoles();
    this.initializeSystemPermissions();
  }

  static getInstance(): AccessControlService {
    if (!AccessControlService.instance) {
      AccessControlService.instance = new AccessControlService();
    }
    return AccessControlService.instance;
  }

  /**
   * Create a new role
   */
  async createRole(
    name: string,
    description: string,
    permissions: string[],
    creatorId: string
  ): Promise<Role> {
    try {
      // Validate permission existence
      await this.validatePermissions(permissions);

      const role: Role = {
        id: this.generateId(),
        name,
        description,
        permissions: [...new Set(permissions)], // Remove duplicates
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store role
      this.roles.set(role.id, role);

      logger.info('Role created', { roleId: role.id, name, creatorId });

      return role;
    } catch (error) {
      logger.error('Error creating role', error, { name });
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(
    roleId: string,
    updates: Partial<Role>,
    updatedBy: string
  ): Promise<Role> {
    try {
      const existingRole = this.roles.get(roleId);
      if (!existingRole) {
        throw new Error('Role not found');
      }

      if (existingRole.isSystem) {
        throw new Error('Cannot modify system role');
      }

      // Validate permissions if provided
      if (updates.permissions) {
        await this.validatePermissions(updates.permissions);
      }

      const updatedRole: Role = {
        ...existingRole,
        ...updates,
        permissions: updates.permissions
          ? [...new Set(updates.permissions)]
          : existingRole.permissions,
        updatedAt: new Date(),
      };

      this.roles.set(roleId, updatedRole);

      // Update user permissions for users with this role
      await this.updateUsersForRoleChange(roleId, updatedRole);

      logger.info('Role updated', { roleId, updatedBy });

      return updatedRole;
    } catch (error) {
      logger.error('Error updating role', error, { roleId });
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      if (role.isSystem) {
        throw new Error('Cannot delete system role');
      }

      // Check if any users have this role
      const usersWithRole = Array.from(this.userRoles.entries())
        .filter(([, roles]) => roles.includes(roleId));

      if (usersWithRole.length > 0) {
        throw new Error('Cannot delete role: assigned to users');
      }

      this.roles.delete(roleId);

      logger.info('Role deleted', { roleId, deletedBy });
    } catch (error) {
      logger.error('Error deleting role', error, { roleId });
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<Role | null> {
    return this.roles.get(roleId) || null;
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<void> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const userRoles = this.userRoles.get(userId) || [];
      if (!userRoles.includes(roleId)) {
        userRoles.push(roleId);
        this.userRoles.set(userId, userRoles);
      }

      // Update user permissions
      await this.updateUserPermissions(userId);

      logger.info('Role assigned to user', { userId, roleId, assignedBy });
    } catch (error) {
      logger.error('Error assigning role to user', error, { userId, roleId });
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(
    userId: string,
    roleId: string,
    removedBy: string
  ): Promise<void> {
    try {
      const userRoles = this.userRoles.get(userId);
      if (!userRoles || !userRoles.includes(roleId)) {
        return; // Role not assigned to user
      }

      const updatedRoles = userRoles.filter(id => id !== roleId);
      this.userRoles.set(userId, updatedRoles);

      // Update user permissions
      await this.updateUserPermissions(userId);

      logger.info('Role removed from user', { userId, roleId, removedBy });
    } catch (error) {
      logger.error('Error removing role from user', error, { userId, roleId });
      throw error;
    }
  }

  /**
   * Grant permission to user
   */
  async grantPermissionToUser(
    userId: string,
    permissionId: string,
    grantedBy: string
  ): Promise<void> {
    try {
      const permission = this.permissions.get(permissionId);
      if (!permission) {
        throw new Error('Permission not found');
      }

      const userPermissions = this.userPermissions.get(userId) || [];
      if (!userPermissions.includes(permissionId)) {
        userPermissions.push(permissionId);
        this.userPermissions.set(userId, userPermissions);
      }

      logger.info('Permission granted to user', { userId, permissionId, grantedBy });
    } catch (error) {
      logger.error('Error granting permission to user', error, { userId, permissionId });
      throw error;
    }
  }

  /**
   * Revoke permission from user
   */
  async revokePermissionFromUser(
    userId: string,
    permissionId: string,
    revokedBy: string
  ): Promise<void> {
    try {
      const userPermissions = this.userPermissions.get(userId);
      if (!userPermissions || !userPermissions.includes(permissionId)) {
        return; // Permission not granted to user
      }

      const updatedPermissions = userPermissions.filter(id => id !== permissionId);
      this.userPermissions.set(userId, updatedPermissions);

      logger.info('Permission revoked from user', { userId, permissionId, revokedBy });
    } catch (error) {
      logger.error('Error revoking permission from user', error, { userId, permissionId });
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    permissionId: string,
    resource?: {
      type: string;
      id: string;
      ownerId?: string;
    }
  ): Promise<boolean> {
    try {
      const cacheKey = `user_permission:${userId}:${permissionId}:${resource?.type || ''}:${resource?.id || ''}`;

      return await cache.wrap(cacheKey, async () => {
        // Check direct permission grant
        const userPermissions = this.userPermissions.get(userId) || [];
        if (userPermissions.includes(permissionId)) {
          return true;
        }

        // Check role-based permissions
        const userRoles = this.userRoles.get(userId) || [];
        for (const roleId of userRoles) {
          const role = this.roles.get(roleId);
          if (role && role.permissions.includes(permissionId)) {
            return true;
          }
        }

        // Check resource ownership if required
        if (resource && resource.ownerId) {
          return await this.checkResourceOwnership(userId, resource);
        }

        return false;
      }, 300); // Cache for 5 minutes
    } catch (error) {
      logger.error('Error checking user permission', error, { userId, permissionId });
      return false;
    }
  }

  /**
   * Check if user can perform action on resource
   */
  async canPerformAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    resourceOwnerId?: string
  ): Promise<boolean> {
    try {
      // Construct permission name
      const permissionName = `${resourceType}:${action}`;

      // Check if user has permission
      return await this.hasPermission(userId, permissionName, {
        type: resourceType,
        id: resourceId || '',
        ownerId: resourceOwnerId,
      });
    } catch (error) {
      logger.error('Error checking action permission', error, { userId, action, resourceType });
      return false;
    }
  }

  /**
   * Create access request
   */
  async createAccessRequest(
    requesterId: string,
    requestedPermission: string,
    resource: {
      type: string;
      id: string;
      name?: string;
    },
    reason: string,
    duration?: {
      start: Date;
      end: Date;
    }
  ): Promise<AccessRequest> {
    try {
      const request: AccessRequest = {
        id: this.generateId(),
        requesterId,
        requestedPermission,
        resource,
        reason,
        duration,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store access request
      // This would integrate with your database
      logger.info('Access request created', {
        requestId: request.id,
        requesterId,
        permission: requestedPermission
      });

      return request;
    } catch (error) {
      logger.error('Error creating access request', error);
      throw error;
    }
  }

  /**
   * Approve access request
   */
  async approveAccessRequest(
    requestId: string,
    approverId: string,
    justification?: string
  ): Promise<AccessRequest> {
    try {
      const request = await this.getAccessRequest(requestId);
      if (!request) {
        throw new Error('Access request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      const approvedRequest: AccessRequest = {
        ...request,
        status: 'approved',
        approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      };

      // Update request
      // This would integrate with your database
      logger.info('Access request approved', {
        requestId,
        approverId,
        permission: request.requestedPermission
      });

      // Grant temporary permission
      if (approvedRequest.duration) {
        await this.grantTemporaryPermission(
          approvedRequest.requesterId,
          approvedRequest.requestedPermission,
          approvedRequest.duration
        );
      }

      return approvedRequest;
    } catch (error) {
      logger.error('Error approving access request', error, { requestId });
      throw error;
    }
  }

  /**
   * Reject access request
   */
  async rejectAccessRequest(
    requestId: string,
    approverId: string,
    reason: string
  ): Promise<AccessRequest> {
    try {
      const request = await this.getAccessRequest(requestId);
      if (!request) {
        throw new Error('Access request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      const rejectedRequest: AccessRequest = {
        ...request,
        status: 'rejected',
        approvedId,
        updatedAt: new Date(),
      };

      // Update request
      // This would integrate with your database
      logger.info('Access request rejected', {
        requestId,
        approverId,
        reason
      });

      return rejectedRequest;
    } catch (error) {
      error 'Error rejecting access request', error, { requestId });
      throw error;
    }
  }

  /**
   * Get access requests for user
   */
  async getAccessRequestsForUser(
    userId: string,
    status?: AccessRequest['status']
  ): Promise<AccessRequest[]> {
    // Get access requests for user
    // This would integrate with your database
    return [];
  }

  /**
   * Create access session
   */
  async createAccessSession(
    userId: string,
    permissions: Array<{
      permission: string;
      resourceType: string;
      resourceId: string;
      conditions: { [key: string]: any };
    }>,
    ipAddress: string,
    userAgent: string,
    expiresAt?: Date
  ): Promise<AccessSession> {
    try {
      const session: AccessSession = {
        id: this.generateId(),
        userId,
        permissions,
        ipAddress,
        userAgent,
        createdAt: new Date(),
        expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
        lastActivity: new Date(),
        isActive: true,
      };

      // Store session
      // This would integrate with your session store
      logger.info('Access session created', {
        sessionId: session.id,
        userId,
        permissionCount: permissions.length
      });

      return session;
    } catch (set_error) {
      logger.error('Error creating access session', set_error, { userId });
      throw error;
    }
  }

  /**
   * Validate access session
   */
  async validateAccessSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getAccessSession(sessionId);
      if (!session) {
        return false;
      }

      // Check if session is active and not expired
      if (!session.isActive || session.expiresAt < new Date()) {
        return false;
      }

      // Update last activity
      await this.updateSessionActivity(sessionId);

      return true;
    } catch (error) {
      logger.error('Error validating access session', error, { sessionId });
      return false;
    }
  }

  /**
   * Revoke access session
   */
  async revokeAccessSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getAccessSession(sessionId);
      if (session) {
        session.isActive = false;
        // Update session
        logger.info('Access session revoked', { sessionId });
      }
    } catch (error) {
      logger.error('Error revoking access session', error, { sessionId });
      throw error;
    }
  }

  /**
   * Get access session
   */
  async getAccessSession(sessionId: string): Promise<AccessSession | null> {
    // Get session from session store
    return null; // Placeholder
  }

  /**
   * Update session activity
   */
  private async updateSessionActivity(sessionId: string): Promise<void> {
    // Update last activity timestamp
    logger.debug('Session activity updated', { sessionId });
  }

  /**
   * Set resource owner
   */
  async setResourceOwner(
    resourceType: string,
    resourceId: string,
    ownerId: string
  {
      if (resourceId) {
        const key = `${resourceType}:${resourceId}`;
        this.resourceOwners.set(key, ownerId);
      }
    } catch (error) {
      logger.error('Error setting resource owner', error, { resourceType, resourceId });
    }
  }

  /**
   * Check resource ownership
   */
  async checkResourceOwnership(
    userId: string,
    resource: {
      type: string;
      id: string;
      ownerId?: string;
    }
  ): Promise<boolean> {
    if (resource.ownerId) {
      return resource.ownerId === userId;
    }

    const key = `${resource.type}:${resource.id}`;
    const ownerId = this.resourceOwners.get(key);

    return ownerId === userId;
  }

  /**
   * Get resource owner
   */
  async getResourceOwner(
    resourceType: string,
    resourceId: string
  ): Promise<string | null> {
    const key = `${resourceType}:${resourceId}`;
    return this.resourceOwners.get(key) || null;
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<string[]> {
    return this.userRoles.get(userId) || [];
  }

  /**
   * Get user's permissions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    return this.userPermissions.get(userId) || [];
  }

  /**
   * Update user permissions based on roles
   */
  private async updateUserPermissions(userId: string): Promise<void> {
    const userRoles = this.userRoles.get(userId) || [];
    const rolePermissions = new Set<string>();

    // Collect permissions from all user roles
    for (const roleId of userRoles) {
      const role = this.roles.get(roleId);
      if (role) {
        role.permissions.forEach(permission => rolePermissions.add(permission));
      }
    }

    // Add direct user permissions
    const directPermissions = this.userPermissions.get(userId) || [];
    directPermissions.forEach(permission => rolePermissions.add(permission));

    this.userPermissions.set(userId, Array.from(rolePermissions));
  }

  /**
   * Update users for role change
   */
  private async updateUsersForRoleChange(roleId: string, updatedRole: Role): Promise<void> {
    const usersWithRole = Array.from(this.userRoles.entries())
      .filter(([, roles]) => roles.includes(roleId))
      .map(([userId]) => userId);

    for (const userId of usersWithRole) {
      await this.updateUserPermissions(userId);
    }
  }

  /**
   * Grant temporary permission
   */
  private async grantTemporaryPermission(
    userId: string,
    permissionId: string,
    duration: {
      start: Date;
      end: Date;
    }
  ): Promise<void> {
    // Store temporary permission with expiration
    logger.info('Temporary permission granted', {
      userId,
      permissionId,
      start: duration.start,
      end: duration.end
    });
  }

  /**
   * Validate permissions
   */
  private async validatePermissions(permissions: string[]): Promise<void> {
    for (const permissionId of permissions) {
      if (!this.permissions.has(permissionId)) {
        throw new Error(`Permission not found: ${permissionId}`);
      }
    }
  }

  /**
   * Initialize system roles
   */
  private initializeSystemRoles(): void {
    const systemRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'super_admin',
        description: 'Super administrator with full system access',
        permissions: [
          'system:*',
          'admin:*',
          'user:*',
          'resource:*',
          'audit:*',
          'compliance:*',
        ],
        isSystem: true,
      },
      {
        name: 'admin',
        description: 'System administrator',
        permissions: [
          'user:*',
          'role:*',
          'resource:read',
          'audit:*',
          'compliance:*',
        ],
        isSystem: true,
      },
      ],
      {
        name: 'moderator',
        description: 'Content moderator',
        permissions: [
          'content:read',
          'content:write',
          'content:delete',
          'user:read',
          'audit:read',
        ],
        isSystem: true,
      },
      },
      {
        name: 'analyst',
        description: 'Data analyst',
        permissions: [
          'analytics:read',
          'reports:read',
          'export:read',
          'audit:read',
        ],
        isSystem: true,
      },
      {
        name: 'employer',
        description: 'Employer user',
        permissions: [
          'job:read',
          'job:write',
          'candidate:read',
          'application:read',
          'application:write',
        ],
        isSystem: true,
      },
      {
        name: 'candidate',
        description: 'Job seeker',
        permissions: [
          'job:read',
          'application:read',
          'application:write',
          'profile:read',
          'profile:write',
        ],
        isSystem: true,
      },
    ];

    systemRoles.forEach(role => {
      const roleWithId = {
        ...role,
        id: `role_${role.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.roles.set(roleWithId.id, roleWithId);
    });
  }

  /**
   * Initialize system permissions
   */
  private initializeSystemPermissions(): void {
    const systemPermissions: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'system:all',
        description: 'Full system access',
        resource: 'system',
        action: '*',
        category: 'system',
        isSystem: true,
      },
      {
        name: 'admin:all',
        description: 'All admin operations',
        resource: 'admin',
        action: '*',
        category: 'admin',
        isSystem: true,
      },
      {
        name: 'user:create',
        description: 'Create users',
        resource: 'user',
        action: 'create',
        category: 'admin',
        isSystem: true,
      },
      {
        name: 'user:read',
        description: 'Read user information',
        resource: 'user',
        action: 'read',
        category: 'read',
        isSystem: true,
      },
      },
      {
        name: 'user:update',
        description: 'Update user information',
        resource: 'user',
        action: 'update',
        category: 'write',
        isSystem: true,
      },
      {
        name: 'user:delete',
        description: 'Delete users',
        resource: 'user',
        action: 'delete',
        category: 'delete',
        isSystem: true,
        conditions: {
          ownership: true,
          level: 3,
        },
      },
      {
        name: 'role:read',
        description: 'Read role information',
        resource: 'role',
        action: 'read',
        category: 'read',
        isSystem: true,
      },
      {
        name: 'role:create',
        description: 'Create roles',
        resource: 'role',
        action: 'create',
        category: 'write',
        category: 'admin',
        isSystem: true,
      },
      {
        name: 'role:update',
        description: 'Update roles',
        resource: 'role',
        action: 'update',
        category: 'write',
        isSystem: true,
      },
      {
        name: 'role:delete',
        description: 'Delete roles',
        resource: 'role',
        action: 'delete',
        category: 'delete',
        category: 'admin',
        conditions: {
          ownership: true,
          level: 3,
        },
      },
      {
        name: 'audit:read',
        description: 'Read audit logs',
        resource: 'audit',
        action: 'read',
        category: 'read',
        isSystem: true,
      },
      {
        name: 'audit:write',
        description: 'Write audit logs',
        resource: 'audit',
        action: 'write',
        category: 'system',
        isSystem: true,
      },
      {
        name: 'compliance:read',
        description: 'Read compliance information',
        resource: 'compliance',
        action: 'read',
        category: 'compliance',
        isSystem: true,
      },
      {
        name: 'compliance:write',
        description: 'Write compliance information',
        resource: 'compliance',
        action: 'write',
        category: 'compliance',
        isSystem: true,
      },
      ];

    systemPermissions.forEach(permission => {
      const permissionWithId = {
        ...permission,
        id: `perm_${permission.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.permissions.set(permissionWithId.id, permissionWithId);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get access request
   */
  private async getAccessRequest(requestId: string): Promise<AccessRequest | null> {
    // Get access request from database
    return null; // Placeholder
  }
}

export const accessControl = AccessControlService.getInstance();
export type {
  Role,
  Permission,
  User,
  Resource,
  AccessRequest,
  AccessSession,
};