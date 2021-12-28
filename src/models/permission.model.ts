import { BaseModel, Timestamps, useCollection } from 'atonal-db'

export type SideloadablePermission = Pick<
  Permission,
  'name' | 'alias' | 'description'
>

export interface Permission extends BaseModel, Timestamps {
  name: string
  alias?: string
  description?: string
}

export const PermissionModel = useCollection<Permission>({
  name: 'permission',
  timestamps: true,
  sync: true,
  indexes: [[{ name: 1 }, { unique: true }]],
})
