import { PreconditionFailed, useInstance } from 'atonal'
import { ObjectId } from 'atonal-db'
import { Secret, TOTP } from 'otpauth'
import { IAMConfigs } from '../common/configs'
import { CaptchaProvider } from './captcha.provider'
import { UserProvider } from './user.provider'

const captchaProvider = useInstance<CaptchaProvider>('IAM.provider.captcha')
const userProvider = useInstance<UserProvider>('IAM.provider.user')

export class OtpProvider {
  constructor(private configs: IAMConfigs) {}

  async generateSecret(userId: ObjectId, token: string) {
    await captchaProvider.instance.verifyToken(token, `uid:${userId}`)

    const secret = new Secret().base32

    await userProvider.instance.updateUser(userId, { secret })

    return { secret }
  }

  async getKeyUri(userId: ObjectId, token: string) {
    await captchaProvider.instance.verifyToken(token, `uid:${userId}`)

    const user = await userProvider.instance.getRawUserBy({ _id: userId })

    if (!user || !user.secret) {
      throw new PreconditionFailed('a generated secret is required')
    }

    const uri = new TOTP({
      ...this.configs.auth.otp,
      label: user._id.toHexString(),
      secret: user.secret,
    }).toString()

    return { uri }
  }

  async validateToken(userId: ObjectId, token: string) {
    const user = await userProvider.instance.getRawUserBy({ _id: userId })

    if (!user || !user.secret) {
      throw new PreconditionFailed('a generated secret is required')
    }

    const delta = new TOTP({
      ...this.configs.auth.otp,
      secret: user.secret,
    }).validate({ token })

    if (delta === null) {
      throw new PreconditionFailed('invalid token')
    }
  }
}

export const useOtpProvider = () => useInstance<OtpProvider>('IAM.provider.otp')
