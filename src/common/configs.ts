import { Request, TObject, useInstance } from 'atonal'
import { MongoConfig, RedisConfig } from 'atonal-db'
import { DesensitizedUser } from '../models'

export interface IAMConfigs {
  databases: {
    mongodb: MongoConfig
    redis: RedisConfig
  }
  schemas: {
    user?: {
      profile?: TObject<{}>
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
  overrides?: {
    getUser?: (
      req: Request,
      user: DesensitizedUser,
    ) => Promise<DesensitizedUser> | DesensitizedUser
  }
}

export const useConfigs = () => useInstance<IAMConfigs>('IAM.configs')
