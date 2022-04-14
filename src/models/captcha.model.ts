import { useKV, useMultiModel } from 'atonal-db'

export const CaptchaModel = useMultiModel({
  uid: useKV({
    name: 'captcha:uid',
    type: 'string',
  }),
  email: useKV({
    name: 'captcha:email',
    type: 'string',
  }),
  sms: useKV({
    name: 'captcha:sms',
    type: 'string',
  }),
  ticket: useKV({
    name: 'captcha:ticket',
    type: 'string',
  }),
})
