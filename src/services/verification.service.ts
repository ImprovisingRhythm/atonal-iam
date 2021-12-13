import { PreconditionFailed, randomString, ServiceUnavailable } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { VerificationModel } from '../models'

export type TicketType = 'email' | 'phoneNumber'

export class VerificationService {
  constructor(private configs: IAMConfigs) {}

  async sendEmailCode(email: string) {
    const { len, format, expiresIn, send } = this.configs.verification.emailCode
    const code = randomString(len, format)

    try {
      await send(email, code)
      await VerificationModel.emailCode.set(code, email, expiresIn)

      return { success: true }
    } catch (error: any) {
      throw new ServiceUnavailable(error.message ?? 'failed to send email code')
    }
  }

  async sendSmsCode(phoneNumber: string) {
    const { len, format, expiresIn, send } = this.configs.verification.smsCode
    const code = randomString(len, format)

    try {
      await send(phoneNumber, code)
      await VerificationModel.smsCode.set(code, phoneNumber, expiresIn)

      return { success: true }
    } catch (error: any) {
      throw new ServiceUnavailable(error.message ?? 'failed to send sms code')
    }
  }

  async verifyEmailCode(email: string, code: string) {
    const payload = await VerificationModel.emailCode.get(code.toUpperCase())

    if (payload !== email) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateTicket('email', email)
  }

  async verifySmsCode(phoneNumber: string, code: string) {
    const payload = await VerificationModel.emailCode.get(code.toUpperCase())

    if (payload !== phoneNumber) {
      throw new PreconditionFailed('invalid code')
    }

    return this.generateTicket('phoneNumber', phoneNumber)
  }

  async guardTicket({
    ticket,
    email,
    phoneNumber,
  }: {
    ticket: string
    email?: string
    phoneNumber?: string
  }) {
    let type: TicketType

    if (email) {
      type = 'email'
    } else if (phoneNumber) {
      type = 'phoneNumber'
    } else {
      throw new Error('must include [email] or [phoneNumber]')
    }

    const payload = await VerificationModel.ticket.get(ticket)

    if (
      (type === 'email' && payload === type + email) ||
      (type === 'phoneNumber' && payload === type + email)
    ) {
      await VerificationModel.ticket.remove(ticket)
    } else {
      throw new PreconditionFailed('invalid ticket')
    }
  }

  private async generateTicket(type: TicketType, value: string) {
    const ticket = randomString(32, 'all')

    await VerificationModel.ticket.set(
      ticket,
      type + value,
      this.configs.verification.ticket.expiresIn,
    )

    return { ticket }
  }
}
