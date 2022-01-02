import { BaseModel, Timestamps, useCollection } from 'atonal-db'

export type BuiltInRole = Pick<
  Role,
  'name' | 'permissions' | 'alias' | 'description'
>

export interface Role extends BaseModel, Timestamps {
  name: string
  permissions: string[]
  alias?: string
  description?: string
}

export const RoleModel = useCollection<Role>({
  name: 'role',
  timestamps: true,
  sync: true,
  indexes: [[{ name: 1 }, { unique: true }], { permissions: 1 }],
})
