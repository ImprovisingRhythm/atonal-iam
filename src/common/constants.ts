import { PermissionDef, RoleDef } from '../types'

export const IAM_PERMISSION = {
  ALL: 'IAM.*',
  CREATE_USER: 'IAM.CreateUser',
  GET_USERS: 'IAM.GetUsers',
  UPDATE_USERS: 'IAM.UpdateUsers',
  BLOCK_USERS: 'IAM.BlockUsers',
  MANAGE_PERMISSIONS: 'IAM.ManagePermissions',
  SENSITIVE_ACCESS: 'IAM.SensitiveAccess',
} as const

export const IAM_ROLE = {
  ADMIN: 'IAM.admin',
  COORDINATOR: 'IAM.coordinator',
} as const

export const IAM_BUILT_IN_PERMISSIONS: PermissionDef[] = [
  {
    name: IAM_PERMISSION.CREATE_USER,
    description: 'Allow to create a new user',
  },
  {
    name: IAM_PERMISSION.GET_USERS,
    description: 'Allow to get any users',
  },
  {
    name: IAM_PERMISSION.UPDATE_USERS,
    description: 'Allow to update any users',
  },
  {
    name: IAM_PERMISSION.BLOCK_USERS,
    description: 'Allow to block and unblock users',
  },
  {
    name: IAM_PERMISSION.MANAGE_PERMISSIONS,
    description: 'Allow to get and set permissions',
  },
  {
    name: IAM_PERMISSION.SENSITIVE_ACCESS,
    description: 'Allow to access sensitive data',
  },
]

export const IAM_BUILT_IN_ROLES: RoleDef[] = [
  {
    name: IAM_ROLE.ADMIN,
    description: 'Granted all IAM permissions',
    permissions: [IAM_PERMISSION.ALL],
  },
  {
    name: IAM_ROLE.COORDINATOR,
    description: 'Granted necessary IAM permissions for coordinating',
    permissions: [
      IAM_PERMISSION.CREATE_USER,
      IAM_PERMISSION.GET_USERS,
      IAM_PERMISSION.UPDATE_USERS,
      IAM_PERMISSION.BLOCK_USERS,
    ],
  },
]
