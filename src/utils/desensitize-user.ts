import { User } from '../models'
import { maskEmail, maskIdCardNumber, maskPhoneNumber } from './mask-string'

export type DesensitizeMode = 'mask' | 'delete'

export const desensitizeUser = (user: User, mode: DesensitizeMode = 'mask') => {
  // @ts-ignore
  delete user.salt
  delete user.pwdHash
  delete user.secret

  if (mode === 'delete') {
    delete user.email
    delete user.phoneNumber
    delete user.data

    // Delete sensitive national id info
    if (user.nationalId) {
      delete user.nationalId.idCardType
      delete user.nationalId.idCardNumber
      delete user.nationalId.name
    }

    // Delete sensitive location info
    if (user.location) {
      delete user.location.point
      delete user.location.ip
    }

    return user
  }

  // Mask email address
  if (user.email) {
    user.email = maskEmail(user.email)
  }

  // Mask phone number
  if (user.phoneNumber) {
    user.phoneNumber = maskPhoneNumber(user.phoneNumber)
  }

  // Mask id card number
  if (user.nationalId) {
    const { idCardNumber } = user.nationalId

    if (idCardNumber) {
      user.nationalId.idCardNumber = maskIdCardNumber(idCardNumber)
    }
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
