import { BaseModel, Ref, Timestamps, useCollection } from 'atonal-db'
import { Role } from './role.model'

export interface UserIdentity {
  idCardType?: string
  idCardNumber?: string
  name?: string
  verified?: boolean
}

export interface UserIPs {
  session?: string
  signIn?: string
  signUp?: string
}

export type UserProfile = Record<string, any>

export interface User extends BaseModel, Timestamps {
  roles?: Ref<Role>[]
  permissions?: string[]
  username?: string
  email?: string
  emailVerified?: boolean
  phoneNumber?: string
  phoneNumberVerified?: boolean
  salt: string
  pwdHash?: string
  blocked?: boolean
  identity?: UserIdentity
  ips?: UserIPs
  profile?: UserProfile
}

export const UserModel = useCollection<User>({
  name: 'user',
  timestamps: true,
  sync: true,
  indexes: [
    [{ username: 1 }, { unique: true, sparse: true }],
    [{ email: 1 }, { unique: true, sparse: true }],
    [{ phoneNumber: 1 }, { unique: true, sparse: true }],
    { roles: 1 },
  ],
})
