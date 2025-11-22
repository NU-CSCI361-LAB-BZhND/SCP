export const Roles = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
};

export const RBAC_CONFIG = {
  complaint: {
    allowedRoles: [Roles.OWNER, Roles.MANAGER],
    actions: {
      handle: [Roles.OWNER, Roles.MANAGER],
    },
  },
  "return": {
    allowedRoles: [Roles.OWNER, Roles.MANAGER],
    actions: {
      handle: [Roles.OWNER, Roles.MANAGER],
    },
  },
  dashboard: {
    allowedRoles: [Roles.OWNER, Roles.MANAGER],
    actions: {
      viewOrder: [Roles.OWNER, Roles.MANAGER],
      viewComplaint: [Roles.OWNER, Roles.MANAGER],
      viewCatalog: [Roles.OWNER, Roles.MANAGER],
    },
  },
  catalog: {
    allowedRoles: [Roles.OWNER, Roles.MANAGER],
    actions: {
      createProduct: [Roles.OWNER, Roles.MANAGER],
      editProduct: [Roles.OWNER, Roles.MANAGER],
      deleteProduct: [Roles.OWNER, Roles.MANAGER],
    },
  },
  orders: {
    allowedRoles: [Roles.OWNER, Roles.MANAGER],
    actions: {
      create: [Roles.OWNER, Roles.MANAGER],
      accept: [Roles.OWNER, Roles.MANAGER],
      reject: [Roles.OWNER, Roles.MANAGER],
      track: [Roles.OWNER, Roles.MANAGER],
    },
  },
  accounts: {
    allowedRoles: [Roles.OWNER],
    actions: {
      createAccount: [Roles.OWNER],
      assignPermission: [Roles.OWNER],
      deleteAccount: [Roles.OWNER],
    },
  },
}