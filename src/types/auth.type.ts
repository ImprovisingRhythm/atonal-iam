import 'atonal'
import { ObjectId } from 'bson'

export declare type AuthMethod = 'key' | 'user'

export declare interface UserState {
  _id: ObjectId
  permissions: string[]
  emailVerified?: boolean
  phoneNumberVerified?: boolean
}

declare module 'fastify' {
  interface RequestState {
    authMethod: AuthMethod
    sid: string
    user: UserState
  }
}
