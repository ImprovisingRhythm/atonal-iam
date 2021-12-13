import { parsePhoneNumber } from 'libphonenumber-js/mobile'
import { chain } from 'lodash'

export const maskString = (str: string) => {
  return chain(str)
    .map(_ => '*')
    .join('')
}

export const maskPhoneNumber = (phoneNumber: string) => {
  const { countryCallingCode, nationalNumber } = parsePhoneNumber(phoneNumber)

  return (
    `+${countryCallingCode}` +
    maskString(nationalNumber.substring(0, nationalNumber.length - 4)) +
    nationalNumber.substring(nationalNumber.length - 4)
  )
}

export const maskEmail = (email: string) => {
  const [address, domain] = email.split('@')

  return (
    address[0] +
    maskString(address.substring(1, address.length - 1)) +
    address[address.length - 1] +
    `@${domain}`
  )
}

export const maskIdCardNumber = (idCardNumber: string) => {
  return (
    idCardNumber.substring(0, idCardNumber.length - 4) +
    maskString(idCardNumber.substring(idCardNumber.length - 4))
  )
}
