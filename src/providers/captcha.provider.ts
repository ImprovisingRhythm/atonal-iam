import {
  BadRequest,
  PreconditionFailed,
  randomString,
  ServiceUnavailable,
  useInstance,
} from 'atonal'
import { ObjectId } from 'atonal-db'
import { IAMConfigs } from '../common/configs'
import { CaptchaModel } from '../models'
import { UserProvider } from './user.provider'

const userProvider = useInstance<UserProvider>('IAM.provider.user')

export class CaptchaProvider {
  constructor(private configs: IAMConfigs) {}

  async sendEmailCode(email: string, uid?: string) {
    const { len, format, expiresIn, sendCode } = this.configs.captcha.email

    if (!sendCode) {
      throw new ServiceUnavailable('no send email code function')
    }

    const code = randomString(len, format)

    try {
      await sendCode(email, code)

      if (uid) {
        await CaptchaModel.uid.set(code, uid, expiresIn)
      } else {
        await CaptchaModel.email.set(code, email, expiresIn)
      }

      return { success: true }
    } catch (error: any) {
      throw new ServiceUnavailable(error.message ?? 'failed to send email code')
    }
  }

  async sendSmsCode(phoneNumber: string, uid?: string) {
    const { len, format, expiresIn, sendCode } = this.configs.captcha.sms

    if (!sendCode) {
      throw new ServiceUnavailable('no send sms code function')
    }

    const code = randomString(len, format)

    try {
      await sendCode(phoneNumber, code)

      if (uid) {
        await CaptchaModel.uid.set(code, uid, expiresIn)
      } else {
        await CaptchaModel.sms.set(code, phoneNumber, expiresIn)
      }

      return { success: true }
    } catch (error: any) {
      throw new ServiceUnavailable(error.message ?? 'failed to send sms code')
    }
  }

  async send2FACode(userId: ObjectId, type: 'email' | 'sms') {
    const user = await userProvider.instance.getRawUserBy({ _id: userId })

    if (!user) {
      throw new PreconditionFailed('user is not found')
    }

    const { email, emailVerified, phoneNumber, phoneNumberVerified } = user

    if (type === 'email') {
      if (!email || !emailVerified) {
        throw new PreconditionFailed('user email is not verified')
      }

      return this.sendEmailCode(email, user._id.toHexString())
    }

    if (type === 'sms') {
      if (!phoneNumber || !phoneNumberVerified) {
        throw new PreconditionFailed('user phone number is not verified')
      }

      return this.sendSmsCode(phoneNumber, user._id.toHexString())
    }

    throw new BadRequest('type is not valid')
  }

  async verifyEmailCode(email: string, code: string) {
    const payload = await CaptchaModel.email.get(code.toUpperCase())

    if (payload !== email) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken(`email:${email}`)
  }

  async verifySmsCode(phoneNumber: string, code: string) {
    const payload = await CaptchaModel.sms.get(code.toUpperCase())

    if (payload !== phoneNumber) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken(`sms:${phoneNumber}`)
  }

  async verify2FACode(userId: ObjectId, code: string) {
    const payload = await CaptchaModel.uid.get(code.toUpperCase())

    if (payload !== userId.toHexString()) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken(`uid:${userId}`)
  }

  async verifyToken(token: string, identifier: string) {
    const payload = await CaptchaModel.token.get(token)

    if (payload !== identifier) {
      throw new PreconditionFailed('invalid token')
    }

    await CaptchaModel.token.remove(token)
  }

  private async generateToken(identifier: string) {
    const { len, expiresIn } = this.configs.captcha.token
    const token = randomString(len, 'all')

    await CaptchaModel.token.set(token, identifier, expiresIn)

    return { token }
  }
}

export const useCaptchaProvider = () =>
  useInstance<CaptchaProvider>('IAM.provider.captcha')
