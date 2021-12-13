import { BaseModel, Ref, Timestamps, useCollection } from 'atonal-db'
import { Client } from './client.model'

export interface Role extends BaseModel, Timestamps {
  client?: Ref<Client>
  name: string
  permissions: string[]
  alias?: string
  description?: string
}

export const RoleModel = useCollection<Role>({
  name: 'role',
  timestamps: true,
  sync: true,
  indexes: [[{ name: 1 }, { unique: true }]],
})
