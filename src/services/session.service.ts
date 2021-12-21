import { randomString, Unauthorized } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { SessionModel } from '../models'

export type SessionValue = Record<string, any>

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

  async getSession<T = SessionValue>(sid: string) {
    const uid = await SessionModel.sid.get(sid)

    if (uid === null) {
      throw new Unauthorized('invalid sid')
    }

    const session = await SessionModel.user.get(uid)

    if (session === null) {
      throw new Unauthorized('no matching session')
    }

    // make alive without blocking
    this.makeAlive(sid, uid)
      .then()
      .catch(err => console.log(err))

    return session as T
  }

  async deleteSession(uid: string) {
    await SessionModel.user.remove(uid)
  }

  async createSID(uid: string) {
    const sid = randomString(8)

    // make alive without blocking
    this.makeAlive(sid, uid)
      .then()
      .catch(err => console.log(err))

    return sid
  }

  async deleteSID(sid: string) {
    await SessionModel.sid.remove(sid)
  }

  private async makeAlive(sid: string, uid: string) {
    const { expiresIn } = this.configs.auth.session

    await Promise.all([
      SessionModel.sid.expire(sid, expiresIn),
      SessionModel.user.expire(uid, expiresIn),
    ])
  }
}
