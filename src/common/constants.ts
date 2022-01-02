import { BuiltInPermission } from '../models'

export const IAM_PERMISSION = {
  ADMIN: 'iam.admin',
  CREATE_USER: 'iam.createUser',
  GET_USERS: 'iam.getUsers',
  UPDATE_USERS: 'iam.updateUsers',
  BLOCK_USERS: 'iam.blockUsers',
  SENSITIVE_ACCESS: 'iam.sensitiveAccess',
}

export const IAM_BUILT_IN_PERMISSIONS: BuiltInPermission[] = [
  // User
  {
    name: IAM_PERMISSION.ADMIN,
    description: 'Allow to manage permissions, roles and users',
  },
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
    description: 'Allow to block any users',
  },
  {
    name: IAM_PERMISSION.SENSITIVE_ACCESS,
    description: 'Allow to access sensitive user data',
  },
]
