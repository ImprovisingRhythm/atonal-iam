import { Type, useAuthGuards, useRateLimit, useRouter } from 'atonal'
import { keyGuard, userGuard } from '../middlewares'
import { useCaptchaProvider } from '../providers'

const captchaProvider = useCaptchaProvider()

const router = useRouter()

router.post('/send/email', {
  middlewares: [
    useRateLimit({
      timeWindow: 60000,
      maxRequests: 30,
    }),
  ],
  schema: {
    body: Type.Object({
      email: Type.String({ format: 'email' }),
    }),
  },
  handler: async req => {
    const { email } = req.body

    return captchaProvider.instance.sendEmailCode(email)
  },
})

router.post('/send/sms', {
  middlewares: [
    useRateLimit({
      timeWindow: 60000,
      maxRequests: 30,
    }),
  ],
  schema: {
    body: Type.Object({
      phoneNumber: Type.String({ format: 'phone-number' }),
    }),
  },
  handler: async req => {
    const { phoneNumber } = req.body

    return captchaProvider.instance.sendSmsCode(phoneNumber)
  },
})

router.post('/send/2fa', {
  middlewares: [
    useAuthGuards({
      guards: [userGuard],
    }),
    useRateLimit({
      timeWindow: 60000,
      maxRequests: 30,
    }),
  ],
  schema: {
    body: Type.Object({
      type: Type.Literal(['email', 'sms']),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { type } = req.body

    return captchaProvider.instance.send2FACode(user._id, type)
  },
})

router.post('/verify/email', {
  middlewares: [
    useRateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      code: Type.String(),
    }),
  },
  handler: async req => {
    const { email, code } = req.body

    return captchaProvider.instance.verifyEmailCode(email, code)
  },
})

router.post('/verify/sms', {
  middlewares: [
    useRateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      phoneNumber: Type.String({ format: 'phone-number' }),
      code: Type.String(),
    }),
  },
  handler: async req => {
    const { phoneNumber, code } = req.body

    return captchaProvider.instance.verifySmsCode(phoneNumber, code)
  },
})

router.post('/verify/2fa', {
  middlewares: [
    useAuthGuards({
      guards: [userGuard],
    }),
    useRateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      code: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { code } = req.body

    return captchaProvider.instance.verify2FACode(user._id, code)
  },
})

router.post('/verify/token', {
  middlewares: [
    useAuthGuards({
      guards: [keyGuard],
    }),
  ],
  schema: {
    body: Type.Object({
      token: Type.String(),
      identifier: Type.String(),
    }),
  },
  handler: async req => {
    const { token, identifier } = req.body

    return captchaProvider.instance.verifyToken(token, identifier)
  },
})

export default router
