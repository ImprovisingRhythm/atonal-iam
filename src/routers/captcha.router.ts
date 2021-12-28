import { Type, useAuthGuards, useRateLimit, useRouter } from 'atonal'
import { keyGuard } from '../middlewares'
import { useCaptchaProvider } from '../providers'

const captchaProvider = useCaptchaProvider()

const router = useRouter()

router.post('/send/email-code', {
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

router.post('/send/sms-code', {
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

router.post('/verify/email-code', {
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

router.post('/verify/sms-code', {
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

router.post('/verify/token', {
  middlewares: [
    useAuthGuards({
      guards: [keyGuard],
    }),
  ],
  schema: {
    body: Type.Object({
      token: Type.String(),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
    }),
  },
  handler: async req => {
    const { token, email, phoneNumber } = req.body

    return captchaProvider.instance.verifyToken({
      token,
      email,
      phoneNumber,
    })
  },
})

export default router
