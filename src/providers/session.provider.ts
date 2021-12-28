import { NotFound, randomString, useInstance } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { SessionModel } from '../models'

export class SessionProvider {
  private expiresIn: string

  constructor(private configs: IAMConfigs) {
    this.expiresIn = this.configs.auth.session.expiresIn
  }

  async hasStore(key: string) {
    return SessionModel.store.has(key)
  }

  async setStore(key: string, value: Record<string, any> = {}) {
    await SessionModel.store.set(key, value, this.expiresIn)

    return { success: true }
  }

  async getStore(key: string) {
    return SessionModel.store.get(key)
  }

  async deleteStore(key: string) {
    await SessionModel.store.remove(key)

    return { success: true }
  }

  async createSID(key: string) {
    if (!(await SessionModel.store.has(key))) {
      throw new NotFound('key is not found')
    }

    const sid = randomString(8)

    await SessionModel.sid.set(sid, key, this.expiresIn)
    await SessionModel.store.expire(key, this.expiresIn)

    return sid
  }

  async getStoreBySID(
    sid: string,
    { resetTTL = true }: { resetTTL?: boolean } = {},
  ) {
    const key = await SessionModel.sid.get(sid)

    if (key === null) {
      return null
    }

    if (resetTTL) {
      await SessionModel.sid.expire(sid, this.expiresIn)
      await SessionModel.store.expire(key, this.expiresIn)
    }

    return SessionModel.store.get(key)
  }

  async deleteSID(sid: string) {
    await SessionModel.sid.remove(sid)

    return { success: true }
  }
}

export const useSessionProvider = () =>
  useInstance<SessionProvider>('IAM.provider.session')
