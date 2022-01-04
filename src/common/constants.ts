export const IAM_PERMISSION = {
  ALL: 'IAM.*',
  CREATE_USER: 'IAM.CreateUser',
  GET_USERS: 'IAM.GetUsers',
  UPDATE_USERS: 'IAM.UpdateUsers',
  BLOCK_USERS: 'IAM.BlockUsers',
  MANAGE_PERMISSIONS: 'IAM.ManagePermissions',
  SENSITIVE_ACCESS: 'IAM.SensitiveAccess',
} as const

export const IAM_BUILT_IN_PERMISSIONS = {
  [IAM_PERMISSION.CREATE_USER]: 'Allow to create a new user',
  [IAM_PERMISSION.GET_USERS]: 'Allow to get any users',
  [IAM_PERMISSION.UPDATE_USERS]: 'Allow to update any users',
  [IAM_PERMISSION.BLOCK_USERS]: 'Allow to block and unblock users',
  [IAM_PERMISSION.MANAGE_PERMISSIONS]: 'Allow to get and set permissions',
  [IAM_PERMISSION.SENSITIVE_ACCESS]: 'Allow to access sensitive data',
}
