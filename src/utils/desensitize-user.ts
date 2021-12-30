import { DesensitizedUser, User } from '../models'
import { maskEmail, maskIdCardNumber, maskPhoneNumber } from './mask-string'

export type DesensitizeUserMode = 'remove' | 'mask'

export const desensitizeUser = (
  user: User,
  mode: DesensitizeUserMode = 'mask',
) => {
  // @ts-ignore
  delete user.salt

  // @ts-ignore
  delete user.pwdHash

  // Mask id card number
  if (user.nationalId) {
    if (mode === 'mask') {
      const { idCardNumber } = user.nationalId

      if (idCardNumber) {
        user.nationalId.idCardNumber = maskIdCardNumber(idCardNumber)
      }
    } else {
      delete user.nationalId
    }
  }

  // Mask email address
  if (user.email) {
    if (mode === 'mask') {
      user.email = maskEmail(user.email)
    } else {
      delete user.email
    }
  }

  // Mask phone number
  if (user.phoneNumber) {
    if (mode === 'mask') {
      user.phoneNumber = maskPhoneNumber(user.phoneNumber)
    } else {
      delete user.phoneNumber
    }
  }

  return user as DesensitizedUser
}

export const desensitizeUsers = (
  users: User[],
  mode: DesensitizeUserMode = 'mask',
) => {
  for (const user of users) {
    desensitizeUser(user, mode)
  }

  return users as DesensitizedUser[]
}
