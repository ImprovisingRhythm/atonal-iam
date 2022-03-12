import { NotFound, useInstance } from 'atonal'
import { ObjectId } from 'atonal-db'
import { IAMConfigs } from '../common/configs'
import { RelationModel, UserModel } from '../models'
import { CaptchaProvider } from './captcha.provider'
import { SessionProvider } from './session.provider'

const captchaProvider = useInstance<CaptchaProvider>('IAM.provider.captcha')
const sessionProvider = useInstance<SessionProvider>('IAM.provider.session')

export class PrivacyProvider {
  constructor(private configs: IAMConfigs) {}

  async deleteUser(userId: ObjectId, code: string) {
    await captchaProvider.instance.verify2FACode(userId, code)

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
        nationalId: true,
        meta: true,
      },
    })

    if (!user) {
      throw new NotFound('user is not found')
    }

    // Delete relations
    await RelationModel.deleteMany({
      $or: [{ from: userId }, { to: userId }],
    })

    // Delete session
    await sessionProvider.instance.deleteObject(userId.toHexString())

    // Call hook
    await this.configs.hooks?.onUserDeleted?.(user)

    return { success: true }
  }
}

export const usePrivacyProvider = () =>
  useInstance<PrivacyProvider>('IAM.provider.privacy')
