import 'atonal'
import { ObjectId } from 'bson'
import { JwtPayload } from 'jsonwebtoken'

export declare interface UserAuthInfo {
  _id: ObjectId
  permissions: string[]
  emailVerified?: boolean
  phoneNumberVerified?: boolean
}

export declare type UserAuthInfoJwtPayload = UserAuthInfo & JwtPayload

declare module 'fastify' {
  interface RequestState {
    withApiToken?: boolean
    sid: string
    user: UserAuthInfo
  }
}
