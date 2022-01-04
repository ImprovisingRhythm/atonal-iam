import {
  BadRequest,
  Type,
  useAuthGuards,
  useRateLimit,
  useRouter,
} from 'atonal'
import { keyGuard, userGuard } from '../middlewares'
import { useCaptchaProvider } from '../providers'

const captchaProvider = useCaptchaProvider()

const router = useRouter()

router.post('/send/email-code', {
  middlewares: [
    useAuthGuards({
      strategy: 'ignore-error',
      guards: [userGuard],
    }),
    useRateLimit({
      timeWindow: 60000,
      maxRequests: 30,
    }),
  ],
  schema: {
    body: Type.Object({
      email: Type.Optional(Type.String({ format: 'email' })),
    }),
  },
  handler: async req => {
    const { authed, user } = req.state
    const { email } = req.body

    if (email) {
      return captchaProvider.instance.sendEmailCode(email)
    }

    if (!authed || !user) {
      throw new BadRequest('email should be provided if not signed in')
    }

    return captchaProvider.instance.sendEmailCodeForUser(user._id)
  },
})

router.post('/send/sms-code', {
  middlewares: [
    useAuthGuards({
      strategy: 'ignore-error',
      guards: [userGuard],
    }),
    useRateLimit({
      timeWindow: 60000,
      maxRequests: 30,
    }),
  ],
  schema: {
    body: Type.Object({
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
    }),
  },
  handler: async req => {
    const { authed, user } = req.state
    const { phoneNumber } = req.body

    if (phoneNumber) {
      return captchaProvider.instance.sendSmsCode(phoneNumber)
    }

    if (!authed || !user) {
      throw new BadRequest('phone number should be provided if not signed in')
    }

    return captchaProvider.instance.sendSmsCodeForUser(user._id)
  },
})

router.post('/verify/email-code', {
  middlewares: [
    useAuthGuards({
      strategy: 'ignore-error',
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
      email: Type.Optional(Type.String({ format: 'email' })),
    }),
  },
  handler: async req => {
    const { authed, user } = req.state
    const { code, email } = req.body

    if (email) {
      return captchaProvider.instance.verifyEmailCode(email, code)
    }

    if (!authed || !user) {
      throw new BadRequest('email should be provided if not signed in')
    }

    return captchaProvider.instance.verifyEmailCodeForUser(user._id, code)
  },
})

router.post('/verify/sms-code', {
  middlewares: [
    useAuthGuards({
      strategy: 'ignore-error',
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
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
    }),
  },
  handler: async req => {
    const { authed, user } = req.state
    const { code, phoneNumber } = req.body

    if (phoneNumber) {
      return captchaProvider.instance.verifySmsCode(phoneNumber, code)
    }

    if (!authed || !user) {
      throw new BadRequest('phone number should be provided if not signed in')
    }

    return captchaProvider.instance.verifySmsCodeForUser(user._id, code)
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
