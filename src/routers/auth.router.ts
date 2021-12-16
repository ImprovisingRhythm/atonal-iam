import { BadRequest, Type, useInstance, useRouter } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { requireAuth } from '../middlewares/auth.middleware'
import { rateLimit } from '../middlewares/rate-limit.middleware'
import { statusCode } from '../middlewares/status.middleware'
import { User } from '../models'
import { AuthService } from '../services/auth.service'
import { UserService } from '../services/user.service'
import { UserAuthInfo } from '../types/auth'

const configs = useInstance<IAMConfigs>('IAM.configs')
const authService = useInstance<AuthService>('IAM.service.auth')
const userService = useInstance<UserService>('IAM.service.user')

const router = useRouter()

router.get('/session', {
  middlewares: [
    requireAuth({
      sources: ['user'],
      throwError: false,
    }),
    rateLimit({
      timeWindow: 1000,
      maxRequests: 20,
    }),
  ],
  handler: async req => {
    const { sid, user } = req.state

    if (user) {
      // It's not wise to set user's IP on each request
      // However, set IP on this request may not reflect the realtime IP of the user
      await userService.instance.setUserIP(user._id, req.ip, 'session')

      return { sid, user }
    } else {
      return {}
    }
  },
})

router.post('/sign-up', {
  middlewares: [
    rateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
    statusCode(201),
  ],
  schema: {
    body: Type.Object({
      type: Type.Literal(['email', 'phoneNumber']),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      ticket: Type.Optional(Type.String()),
      password: Type.Optional(Type.String()),
    }),
  },
  handler: async req => {
    const { type, email, phoneNumber, ticket, password } = req.body

    let user: Pick<User, '_id'>

    if (type === 'email') {
      if (!email || !password) {
        throw new BadRequest('must include [email] and [password]')
      }

      user = await authService.instance.signUpWithEmail(email, password)
    } else if (type === 'phoneNumber') {
      if (!phoneNumber || !ticket) {
        throw new BadRequest('must include [phone] and [ticket]')
      }

      user = await authService.instance.signUpWithPhoneNumber(
        phoneNumber,
        ticket,
        password,
      )
    } else {
      throw new BadRequest('unknown [type]')
    }

    await userService.instance.setUserIP(user._id, req.ip, 'signUp')

    return user
  },
})

router.post('/sign-in', {
  middlewares: [
    rateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      type: Type.Literal(['email', 'phoneNumber']),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      password: Type.Optional(Type.String()),
      ticket: Type.Optional(Type.String()),
    }),
  },
  handler: async (req, res) => {
    const { type, email, phoneNumber, password, ticket } = req.body

    let resData: {
      sid: string
      token: string
      user: UserAuthInfo
    }

    if (type === 'email') {
      if (!email || !password) {
        throw new BadRequest('must include [email] and [password]')
      }

      resData = await authService.instance.signInWithEmail(email, password)
    } else if (type === 'phoneNumber') {
      if (!phoneNumber) {
        throw new BadRequest('must include [phone]')
      }

      if (password) {
        resData = await authService.instance.signInWithPhoneNumberAndPassword(
          phoneNumber,
          password,
        )
      } else if (ticket) {
        resData = await authService.instance.signInWithPhoneNumberAndTicket(
          phoneNumber,
          ticket,
        )
      } else {
        throw new BadRequest('must include [password] or [ticket]')
      }
    } else {
      throw new BadRequest('unknown [type]')
    }

    await userService.instance.setUserIP(resData.user._id, req.ip, 'signIn')

    const {
      key = 'atonal_sid',
      domain,
      signed,
      maxAge,
    } = configs.instance.auth.session.cookie

    res.setCookie(key, resData.sid, {
      domain,
      path: '/',
      sameSite: 'none',
      secure: true,
      httpOnly: true,
      signed,
      maxAge,
    })

    return resData
  },
})

router.post('/sign-out', {
  middlewares: [
    requireAuth(),
    rateLimit({
      timeWindow: 1000,
      maxRequests: 20,
    }),
  ],
  handler: async (req, res) => {
    const { sid } = req.state

    if (sid) {
      res.clearCookie('atonal_sid')
      return authService.instance.signOut(sid)
    } else {
      return { success: true }
    }
  },
})

router.post('/bind-email', {
  middlewares: [
    requireAuth({
      sources: ['user'],
    }),
    rateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      ticket: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { email, ticket } = req.body

    return authService.instance.bindEmail(user._id, email, ticket)
  },
})

router.post('/bind-phone-number', {
  middlewares: [
    requireAuth({
      sources: ['user'],
    }),
    rateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      phoneNumber: Type.String({ format: 'phone-number' }),
      ticket: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { phoneNumber, ticket } = req.body

    return authService.instance.bindPhoneNumber(user._id, phoneNumber, ticket)
  },
})

router.post('/change-password', {
  middlewares: [
    requireAuth({
      sources: ['user'],
    }),
    rateLimit({
      timeWindow: 10000,
      maxRequests: 10,
    }),
  ],
  schema: {
    body: Type.Object({
      password: Type.String(),
      newPassword: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { password, newPassword } = req.body

    return authService.instance.changePassword(user._id, password, newPassword)
  },
})

router.post('/reset-password', {
  middlewares: [
    rateLimit({
      timeWindow: 10000,
      maxRequests: 10,
    }),
  ],
  schema: {
    body: Type.Object({
      type: Type.Literal(['email', 'phoneNumber']),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      ticket: Type.String(),
      password: Type.String(),
    }),
  },
  handler: async req => {
    const { type, email, phoneNumber, ticket, password } = req.body

    if (type === 'email') {
      if (!email) {
        throw new BadRequest('must include [email]')
      }

      return authService.instance.resetPasswordByEmail(email, password, ticket)
    }

    if (type === 'phoneNumber') {
      if (!phoneNumber) {
        throw new BadRequest('must include [phone]')
      }

      return authService.instance.resetPasswordByPhoneNumber(
        phoneNumber,
        password,
        ticket,
      )
    }

    throw new BadRequest('unknown [type]')
  },
})

export default router
