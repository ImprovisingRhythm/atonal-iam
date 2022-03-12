import { BaseModel, Ref, useCollection } from 'atonal-db'
import { User } from './user.model'

export interface RelationMeta extends Record<string, any> {}
export interface Relation extends BaseModel {
  from: Ref<User>
  to: Ref<User>
  connected?: boolean
  score?: number
  meta?: RelationMeta
}

export const RelationModel = useCollection<Relation>({
  name: 'relation',
  sync: true,
  indexes: [
    [{ from: 1, to: 1 }, { unique: true }],
    [{ from: 1 }],
    [{ to: 1 }],
    [{ connected: 1 }],
    [{ score: 1 }],
  ],
})
