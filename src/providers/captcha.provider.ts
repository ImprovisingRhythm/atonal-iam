import {
  PreconditionFailed,
  randomString,
  ServiceUnavailable,
  useInstance,
} from 'atonal'
import { IAMConfigs } from '../common/configs'
import { CaptchaModel } from '../models'

export type CaptchaTokenType = 'email' | 'phoneNumber'

export class CaptchaProvider {
  constructor(private configs: IAMConfigs) {}

  async sendEmailCode(email: string) {
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

  async sendSmsCode(phoneNumber: string) {
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

  async verifyEmailCode(email: string, code: string) {
    const payload = await CaptchaModel.email.get(code.toUpperCase())

    if (payload !== email) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken('email', email)
  }

  async verifySmsCode(phoneNumber: string, code: string) {
    const payload = await CaptchaModel.sms.get(code.toUpperCase())

    if (payload !== phoneNumber) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateToken('phoneNumber', phoneNumber)
  }

  async verifyToken({
    token,
    email,
    phoneNumber,
  }: {
    token: string
    email?: string
    phoneNumber?: string
  }) {
    let type: CaptchaTokenType

    if (email) {
      type = 'email'
    } else if (phoneNumber) {
      type = 'phoneNumber'
    } else {
      throw new Error('must include [email] or [phoneNumber]')
    }

    const payload = await CaptchaModel.token.get(token)

    if (
      (type === 'email' && payload === `${type}:${email}`) ||
      (type === 'phoneNumber' && payload === `${type}:${phoneNumber}`)
    ) {
      await CaptchaModel.token.remove(token)
    } else {
      throw new PreconditionFailed('invalid token')
    }
  }

  private async generateToken(type: CaptchaTokenType, value: string) {
    const { len, expiresIn } = this.configs.captcha.token
    const token = randomString(len, 'all')

    await CaptchaModel.token.set(token, `${type}:${value}`, expiresIn)

    return { token }
  }
}

export const useCaptchaProvider = () =>
  useInstance<CaptchaProvider>('IAM.provider.captcha')
