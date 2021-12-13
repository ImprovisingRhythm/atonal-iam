import { useKV, useMultiModel } from 'atonal-db'

export const VerificationModel = useMultiModel({
  ticket: useKV({
    name: 'verification:ticket',
    type: 'string',
  }),
  emailCode: useKV({
    name: 'verification:email_code',
    type: 'string',
  }),
  smsCode: useKV({
    name: 'verification:sms_code',
    type: 'string',
  }),
})
