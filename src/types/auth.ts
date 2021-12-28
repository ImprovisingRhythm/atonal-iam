import 'atonal'
import { ObjectId } from 'bson'

export declare interface UserState {
  _id: ObjectId
  permissions: string[]
  emailVerified?: boolean
  phoneNumberVerified?: boolean
}

declare module 'fastify' {
  interface RequestState {
    sid: string
    user: UserState
  }
}
