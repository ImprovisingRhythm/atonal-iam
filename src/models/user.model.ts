import { BaseModel, Timestamps, useCollection } from 'atonal-db'

export interface UserNationalId {
  idCardType?: string
  idCardNumber?: string
  name?: string
  verified?: boolean
}

export interface UserProfile {}
export interface UserData {}

export interface User extends BaseModel, Timestamps {
  permissions?: string[]
  roles?: string[]
  username?: string
  email?: string
  emailVerified?: boolean
  phoneNumber?: string
  phoneNumberVerified?: boolean
  salt: string
  pwdHash?: string
  secret?: string
  blocked?: boolean
  profile?: UserProfile
  data?: UserData
  nationalId?: UserNationalId
}

export const UserModel = useCollection<User>({
  name: 'user',
  timestamps: true,
  sync: true,
  indexes: [
    [{ username: 1 }, { unique: true, sparse: true }],
    [{ email: 1 }, { unique: true, sparse: true }],
    [{ phoneNumber: 1 }, { unique: true, sparse: true }],
    [{ permissions: 1 }],
    [{ roles: 1 }],
  ],
})
