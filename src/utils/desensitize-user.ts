import { User } from '../models'
import { maskEmail, maskIdCardNumber, maskPhoneNumber } from './mask-string'

export type DesensitizeMode = 'mask' | 'delete'

export const desensitizeUser = (user: User, mode: DesensitizeMode = 'mask') => {
  // @ts-ignore
  delete user.salt
  delete user.pwdHash
  delete user.secret

  if (mode === 'delete') {
    delete user.nationalId
    delete user.email
    delete user.phoneNumber

    return user
  }

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

  return user
}

export const desensitizeUsers = (
  users: User[],
  mode: DesensitizeMode = 'mask',
) => {
  for (const user of users) {
    desensitizeUser(user, mode)
  }

  return users
}
