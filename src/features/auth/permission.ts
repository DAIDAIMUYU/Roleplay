import type { AppRole } from "./auth.types";

export function canAccessAdminPanel(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageAdmins(role: AppRole | null): boolean {
  return role === "owner";
}

export function canManageDemoData(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageSystemTemplates(role: AppRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function canManageSystemSecrets(role: AppRole | null): boolean {
  return role === "owner";
}

export function canViewPrivateUserData(role: AppRole | null): boolean {
  return role === "owner";
}

export function canReadSensitivePrivateData(role: AppRole | null): boolean {
  return role === "owner";
}
