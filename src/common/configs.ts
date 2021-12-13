import { TObject } from 'atonal'
import { MongoConfig, RedisConfig } from 'atonal-db'

export interface IAMConfigs {
  databases: {
    mongodb: MongoConfig
    redis: RedisConfig
  }
  schemas: {
    userProfile: TObject<{}>
  }
  auth: {
    apiToken: string
    session: {
      expiresIn: string
      cookie: {
        key?: string
        domain?: string
        signed?: boolean
        httpOnly?: boolean
        maxAge?: number
      }
      jwt: {
        secret: string
        expiresIn: string
      }
    }
  }
  verification: {
    smsCode: {
      len: number
      format: 'number-only' | 'uppercase-letter-number'
      expiresIn: string
      send: (phoneNumber: string, code: string) => Promise<void>
    }
    emailCode: {
      len: number
      format: 'number-only' | 'uppercase-letter-number'
      expiresIn: string
      send: (email: string, code: string) => Promise<void>
    }
    ticket: {
      len: number
      expiresIn: string
    }
  }
}
