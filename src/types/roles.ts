export interface NavigationPanel {
  id: string;
  name: string;
  portal: 'transport' | 'warehouse' | 'serviser';
  icon: string;
  tabId: number;
}

export interface RolePermissions {
  canUploadExcel: boolean;
  canInputCost: boolean;
  canRegisterVehicle: boolean;
  canAccessAdminPanel: boolean;
  canSwitchPortal: boolean;
  canExportExcel: boolean;
  canEditCost: boolean;
  canDeleteCost: boolean;
}

export interface AppRole {
  roleId: string;
  roleName: string;
  roleIcon: string;
  roleBadge: string;
  description: string;
  defaultPortal: 'transport' | 'warehouse' | 'serviser';
  allowedPortals: ('transport' | 'warehouse' | 'serviser')[];
  navigationPanels: NavigationPanel[];
  permissions: RolePermissions;
}
