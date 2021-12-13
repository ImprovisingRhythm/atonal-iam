import { BaseModel, Timestamps, useCollection } from 'atonal-db'

export interface Client extends BaseModel, Timestamps {
  name: string
  accessKey: string
  secretKey: string
  callbackUrls?: string[]
  description?: string
  verified?: boolean
}

export const ClientModel = useCollection<Client>({
  name: 'client',
  timestamps: true,
  sync: true,
  indexes: [
    [{ name: 1 }, { unique: true }],
    [{ accessKey: 1, secretKey: 1 }, { unique: true }],
  ],
})
