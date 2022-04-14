import { NotFound, useInstance } from 'atonal'
import { ObjectId } from 'atonal-db'
import { IAMConfigs } from '../common/configs'
import { UserModel } from '../models'
import { CaptchaProvider } from './captcha.provider'
import { SessionProvider } from './session.provider'

const captchaProvider = useInstance<CaptchaProvider>('IAM.provider.captcha')
const sessionProvider = useInstance<SessionProvider>('IAM.provider.session')

export class PrivacyProvider {
  constructor(private configs: IAMConfigs) {}

  async deleteUser(userId: ObjectId, ticket: string) {
    await captchaProvider.instance.verifyTicket(ticket, `uid:${userId}`)

    const user = await UserModel.findByIdAndUpdate(userId, {
      $unset: {
        permissions: true,
        roles: true,
        username: true,
        email: true,
        emailVerified: true,
        phoneNumber: true,
        phoneNumberVerified: true,
        pwdHash: true,
        secret: true,
        profile: true,
        data: true,
        nationalId: true,
      },
    })

    if (!user) {
      throw new NotFound('user is not found')
    }

    // Delete session
    await sessionProvider.instance.deleteObject(userId.toHexString())

    // Call hook
    await this.configs.hooks?.onUserDeleted?.(user)

    return { success: true }
  }
}

export const usePrivacyProvider = () =>
  useInstance<PrivacyProvider>('IAM.provider.privacy')
