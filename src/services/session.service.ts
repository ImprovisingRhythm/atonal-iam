import { randomString, Unauthorized } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { SessionModel } from '../models'

export class SessionService {
  constructor(private configs: IAMConfigs) {}

  async hasSession(uid: string) {
    return SessionModel.user.has(uid)
  }

  async createSession(uid: string, value: SessionValue) {
    await this.writeSession(uid, value)

    return this.createSID(uid)
  }

  async writeSession(uid: string, value: SessionValue) {
    await SessionModel.user.set(uid, value)
  }

  async getSession<T>(sid: string) {
    const uid = await this.validateSID(sid)
    const session = await SessionModel.user.get(uid)

    if (session === null) {
      throw new Unauthorized('no matching session')
    }

    return session as T
  }

  async deleteSession(uid: string) {
    await SessionModel.user.remove(uid)
  }

  async createSID(uid: string) {
    const sid = randomString(8)

    await SessionModel.sid.set(sid, uid, this.configs.auth.session.expiresIn)

    return sid
  }

  async renewSID(sid: string) {
    await SessionModel.sid.expire(sid, this.configs.auth.session.expiresIn)
  }

  async validateSID(sid: string) {
    const uid = await SessionModel.sid.get(sid)

    if (uid === null) {
      throw new Unauthorized('no matching session')
    }

    await this.renewSID(sid)

    return uid
  }

  async deleteSID(sid: string) {
    await SessionModel.sid.remove(sid)
  }
}
