import 'atonal'
import { ObjectId } from 'bson'

export declare type AuthSource = 'user' | 'client' | 'api-token'

export declare interface UserAuthInfo {
  _id: ObjectId
  permissions: string[]
  emailVerified?: boolean
  phoneNumberVerified?: boolean
}

declare module 'fastify' {
  interface RequestState {
    authSource: AuthSource
    sid: string
    user: UserAuthInfo
  }
}
