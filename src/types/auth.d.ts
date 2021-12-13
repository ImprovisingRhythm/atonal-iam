import 'atonal'
import { ObjectId } from 'bson'
import { JwtPayload } from 'jsonwebtoken'
import { AclTarget, Permission, Role } from '../models'

declare interface UserAuthInfo {
  _id: ObjectId
  permissions: string[]
  emailVerified?: boolean
  phoneNumberVerified?: boolean
}

declare type UserAuthInfoJwtPayload = UserAuthInfo & JwtPayload

declare module 'fastify' {
  interface RequestState {
    withApiToken?: boolean
    sid: string
    user: UserAuthInfo
  }
}
