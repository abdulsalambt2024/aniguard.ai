/**
 * Client-side administration is intentionally read-only/disabled.
 * User roles, privileged identities, audit events and settings must be managed by
 * authenticated server-side endpoints with database-enforced authorization.
 * Browser storage is never an authority for administrator permissions.
 */
export interface AdminUserRecord {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'user' | 'veterinarian';
  is_protected: boolean;
  status: 'active' | 'suspended';
  created_at: string;
  last_login?: string;
  farm_name?: string;
  animal_count?: number;
}

export interface AuditLogEntry {
  id: string;
  actor_user_id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: unknown;
  new_value: unknown;
  reason?: string;
  created_at: string;
}

export interface AppSettingItem {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description: string;
  is_security_critical: boolean;
  updated_at: string;
}

export interface FeatureFlagItem {
  id: string;
  key: string;
  enabled: boolean;
  description: string;
  updated_at: string;
}

/** Compatibility exports: no privileged identities are embedded in the browser. */
export const PROTECTED_SUPER_ADMIN_EMAILS: string[] = [];
export const INITIAL_ADMIN_USERS: AdminUserRecord[] = [];

const disabled = {
  success: false,
  message: 'Administrative changes are disabled in the browser prototype. Use a verified server-side RBAC workflow.',
};

class AdminService {
  public isProtectedSuperAdmin(_email?: string): boolean {
    return false;
  }

  public resolveRole(_email?: string, _currentRole?: string): 'super_admin' | 'admin' | 'user' {
    return 'user';
  }

  public getUsers(): AdminUserRecord[] {
    return [];
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [];
  }

  public getFeatureFlags(): FeatureFlagItem[] {
    return [];
  }

  public getSettings(): AppSettingItem[] {
    return [];
  }

  public assignUserRole(
    _actorEmail: string,
    _targetUserId: string,
    _newRole: 'admin' | 'user',
    _reason = 'Administrative role modification'
  ): { success: boolean; message: string } {
    return disabled;
  }

  public toggleUserStatus(
    _actorEmail: string,
    _targetUserId: string
  ): { success: boolean; message: string } {
    return disabled;
  }

  public toggleFeatureFlag(
    _actorEmail: string,
    _key: string
  ): { success: boolean; message: string } {
    return disabled;
  }
}

export const adminService = new AdminService();
