import { useKV, useMultiModel } from 'atonal-db'

export const CaptchaModel = useMultiModel({
  email: useKV({
    name: 'captcha:email',
    type: 'string',
  }),
  sms: useKV({
    name: 'captcha:sms',
    type: 'string',
  }),
  token: useKV({
    name: 'captcha:token',
    type: 'string',
  }),
})
