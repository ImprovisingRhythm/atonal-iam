import { NotFound, randomString, useInstance } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { SessionModel } from '../models'

export class SessionProvider {
  private expiresIn: string

  constructor(private configs: IAMConfigs) {
    this.expiresIn = this.configs.auth.session.expiresIn
  }

  async hasObject(key: string) {
    return SessionModel.object.has(key)
  }

  async setObject(key: string, value: Record<string, any> = {}) {
    await SessionModel.object.set(key, value, this.expiresIn)

    return { success: true }
  }

  async getObject(key: string) {
    return SessionModel.object.get(key)
  }

  async deleteObject(key: string) {
    await SessionModel.object.remove(key)

    return { success: true }
  }

  async createSID(key: string) {
    if (!(await SessionModel.object.has(key))) {
      throw new NotFound('key is not found')
    }

    const sid = randomString(8)

    await SessionModel.sid.set(sid, key, this.expiresIn)
    await SessionModel.object.expire(key, this.expiresIn)

    return sid
  }

  async getObjectBySID(
    sid: string,
    { resetTTL = true }: { resetTTL?: boolean } = {},
  ) {
    const key = await SessionModel.sid.get(sid)

    if (key === null) {
      return null
    }

    if (resetTTL) {
      await SessionModel.sid.expire(sid, this.expiresIn)
      await SessionModel.object.expire(key, this.expiresIn)
    }

    return SessionModel.object.get(key)
  }

  async deleteSID(sid: string) {
    await SessionModel.sid.remove(sid)

    return { success: true }
  }
}

export const useSessionProvider = () =>
  useInstance<SessionProvider>('IAM.provider.session')
