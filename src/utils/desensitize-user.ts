import { DesensitizedUser, User } from '../models'
import { maskEmail, maskIdCardNumber, maskPhoneNumber } from './mask-string'

export const desensitizeUser = (user: User) => {
  // @ts-ignore
  delete user.salt

  // @ts-ignore
  delete user.pwdHash

  // Mask id card number
  if (user.nationalId) {
    const { idCardNumber } = user.nationalId

    if (idCardNumber) {
      user.nationalId.idCardNumber = maskIdCardNumber(idCardNumber)
    }
  }

  // Mask email address
  if (user.email) {
    user.email = maskEmail(user.email)
  }

  // Mask phone number
  if (user.phoneNumber) {
    user.phoneNumber = maskPhoneNumber(user.phoneNumber)
  }

  return user as DesensitizedUser
}

export const desensitizeUsers = (users: User[]) => {
  for (const user of users) {
    desensitizeUser(user)
  }

  return users as DesensitizedUser[]
}
