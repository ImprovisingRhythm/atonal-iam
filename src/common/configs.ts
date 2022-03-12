import { Middleware, TObject, useInstance } from 'atonal'
import { MongoConfig, RedisConfig } from 'atonal-db'
import { Relation, User, UserMeta, UserProfile } from '../models'
import { PermissionDef, RoleDef, UserState } from '../types'

export interface IAMConfigs {
  databases: {
    mongodb: MongoConfig
    redis: RedisConfig
  }
  schemas?: {
    user?: {
      profile?: TObject<{}>
      meta?: TObject<{}>
    }
    relation?: {
      meta?: TObject<{}>
    }
  }
  auth: {
    keys: {
      accessKey: string
      secretKey: string
    }
    session: {
      expiresIn: string
      token: {
        secret: string
      }
    }
    otp?: {
      issuer?: string
      algorithm?: 'SHA1' | 'SHA256' | 'SHA512'
      digits?: number
      period?: number
    }
  }
  captcha: {
    email: {
      len: number
      format: 'number-only' | 'uppercase-letter-number'
      expiresIn: string
      sendCode?: (email: string, code: string) => Promise<void>
    }
    sms: {
      len: number
      format: 'number-only' | 'uppercase-letter-number'
      expiresIn: string
      sendCode?: (phoneNumber: string, code: string) => Promise<void>
    }
    token: {
      len: number
      expiresIn: string
    }
  }
  rbac?: {
    permissionDefs?: PermissionDef[]
    roleDefs?: RoleDef[]
  }
  defaults?: {
    user?: {
      permissions?: string[]
      roles?: string[]
      profile?: UserProfile
      meta?: UserMeta
    }
  }
  hooks?: {
    onUserCreated?: (user: User) => Promise<void> | void
    onUserPermissionUpdated?: (user: User) => Promise<void> | void
    onUserProfileUpdated?: (user: User) => Promise<void> | void
    onUserMetaUpdated?: (user: User) => Promise<void> | void
    onUserNationalIdUpdated?: (user: User) => Promise<void> | void
    onUserBlocked?: (user: User) => Promise<void> | void
    onUserUnblocked?: (user: User) => Promise<void> | void
    onUserDeleted?: (user: User) => Promise<void> | void
    onRelationUpdated?: (relation: Relation) => Promise<void> | void
    onGetSession?: (state: UserState) => Promise<void> | void
    onSignIn?: (state: UserState) => Promise<void> | void
    onSignOut?: (state: UserState) => Promise<void> | void
  }
  middlewares?: {
    auth?: {
      signUp?: Middleware
      signIn?: Middleware
      signOut?: Middleware
    }
    captcha?: {
      sendSmsCode?: Middleware
      sendEmailCode?: Middleware
      send2FACode?: Middleware
    }
  }
}

export const useConfigs = () => useInstance<IAMConfigs>('IAM.configs')
