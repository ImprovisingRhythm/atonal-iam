import {
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

  async sendEmailCodeNotSignedIn(email: string) {
    const { len, format, expiresIn, sendCode } = this.configs.captcha.email

    if (!sendCode) {
      throw new ServiceUnavailable('no send email code function')
    }

    const code = randomString(len, format)

    try {
      // Use the custom function to send email code
      await sendCode(email, code)

      // Set the code in the kv-table with a ttl
      await CaptchaModel.email.set(code, email, expiresIn)

      return { success: true }
    } catch (error: any) {
      throw new ServiceUnavailable(error.message ?? 'failed to send email code')
    }
  }

  async sendEmailCode(userId: ObjectId) {
    const user = await userProvider.instance.getRawUserBy({ _id: userId })

    if (!user || !user.email) {
      throw new PreconditionFailed('user email is not found')
    }

    return this.sendEmailCodeNotSignedIn(user.email)
  }

  async sendSmsCodeNotSignedIn(phoneNumber: string) {
    const { len, format, expiresIn, sendCode } = this.configs.captcha.sms

    if (!sendCode) {
      throw new ServiceUnavailable('no send sms code function')
    }

    const code = randomString(len, format)

    try {
      // Use the custom function to send sms code
      await sendCode(phoneNumber, code)

      // Set the code in the kv-table with a ttl
      await CaptchaModel.sms.set(code, phoneNumber, expiresIn)

      return { success: true }
    } catch (error: any) {
      throw new ServiceUnavailable(error.message ?? 'failed to send sms code')
    }
  }

  async sendSmsCode(userId: ObjectId) {
    const user = await userProvider.instance.getRawUserBy({ _id: userId })

    if (!user || !user.phoneNumber) {
      throw new PreconditionFailed('user phone number is not found')
    }

    return this.sendSmsCodeNotSignedIn(user.phoneNumber)
  }

  async verifyEmailCodeNotSignedIn(email: string, code: string) {
    const payload = await CaptchaModel.email.get(code.toUpperCase())

    if (payload !== email) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken(`email:${email}`)
  }

  async verifyEmailCode(userId: ObjectId, code: string) {
    const user = await userProvider.instance.getRawUserBy({ _id: userId })

    if (!user || !user.email) {
      throw new PreconditionFailed('user email is not found')
    }

    const payload = await CaptchaModel.email.get(code.toUpperCase())

    if (payload !== user.email) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken(`uid:${userId}`)
  }

  async verifySmsCodeNotSignedIn(phoneNumber: string, code: string) {
    const payload = await CaptchaModel.sms.get(code.toUpperCase())

    if (payload !== phoneNumber) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken(`sms:${phoneNumber}`)
  }

  async verifySmsCode(userId: ObjectId, code: string) {
    const user = await userProvider.instance.getRawUserBy({ _id: userId })

    if (!user || !user.phoneNumber) {
      throw new PreconditionFailed('user phone number is not found')
    }

    const payload = await CaptchaModel.sms.get(code.toUpperCase())

    if (payload !== user.phoneNumber) {
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
