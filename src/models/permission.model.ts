import { BaseModel, Timestamps, useCollection } from 'atonal-db'

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
