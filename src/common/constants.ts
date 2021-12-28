import { SideloadablePermission } from '../models'

export const BUILT_IN_PERMISSIONS: SideloadablePermission[] = [
  // User
  {
    name: 'iam.root',
    description: 'Allow to manage permissions, roles and users',
  },
  {
    name: 'iam.createUser',
    description: 'Allow to create a new user',
  },
  {
    name: 'iam.getUsers',
    description: 'Allow to get any users',
  },
  {
    name: 'iam.updateUsers',
    description: 'Allow to update any users',
  },
]
