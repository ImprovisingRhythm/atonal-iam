import { TObject, useInstance } from 'atonal'
import { MongoConfig, RedisConfig } from 'atonal-db'
import { UserMeta, UserProfile } from '../models'

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
  }
  defaults?: {
    user?: {
      permissions?: string[]
      profile?: UserProfile
      meta?: UserMeta
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
  permissions?: Record<string, string>
}

export const useConfigs = () => useInstance<IAMConfigs>('IAM.configs')
