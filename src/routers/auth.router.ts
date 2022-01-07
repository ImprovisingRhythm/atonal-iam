import {
  BadRequest,
  Type,
  useAuthGuards,
  useNullableMiddleware,
  useRateLimit,
  useRouter,
  useStatusCode,
} from 'atonal'
import { useConfigs } from '../common/configs'
import { userGuard } from '../middlewares'
import { useAuthProvider } from '../providers'

const configs = useConfigs()
const authProvider = useAuthProvider()

const router = useRouter()

router.get('/session', {
  middlewares: [
    useAuthGuards({
      strategy: 'ignore-error',
      guards: [userGuard],
    }),
  ],
  handler: async req => {
    const { sid, user } = req.state

    if (user) {
      return { message: 'OK', sid, user }
    } else {
      return { message: 'Unauthorized' }
    }
  },
})

router.post('/sign-in', {
  middlewares: [
    useRateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
    useNullableMiddleware(configs.instance.middlewares?.auth?.signIn),
  ],
  schema: {
    body: Type.Object({
      type: Type.Literal(['username', 'email', 'phoneNumber']),
      username: Type.Optional(Type.String()),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      password: Type.Optional(Type.String()),
      token: Type.Optional(Type.String()),
    }),
  },
  handler: async req => {
    const { type, username, email, phoneNumber, password, token } = req.body

    if (type === 'username') {
      if (!username || !password) {
        throw new BadRequest('must include [username] and [password]')
      }

      return authProvider.instance.signInWithUsername(username, password)
    }

    if (type === 'email') {
      if (!email || !password) {
        throw new BadRequest('must include [email] and [password]')
      }

      return authProvider.instance.signInWithEmail(email, password)
    }

    if (type === 'phoneNumber') {
      if (!phoneNumber) {
        throw new BadRequest('must include [phone]')
      }

      if (password) {
        return authProvider.instance.signInWithPhoneNumberAndPassword(
          phoneNumber,
          password,
        )
      }

      if (token) {
        return authProvider.instance.signInWithPhoneNumberAndToken(
          phoneNumber,
          token,
        )
      }

      throw new BadRequest('must include [password] or [token]')
    }

    throw new BadRequest('unknown [type]')
  },
})

router.post('/sign-up', {
  middlewares: [
    useRateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
    useStatusCode(201),
    useNullableMiddleware(configs.instance.middlewares?.auth?.signUp),
  ],
  schema: {
    body: Type.Object({
      type: Type.Literal(['username', 'email', 'phoneNumber']),
      username: Type.Optional(Type.String()),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      token: Type.Optional(Type.String()),
      password: Type.Optional(Type.String()),
    }),
  },
  handler: async req => {
    const { type, username, email, phoneNumber, token, password } = req.body

    if (type === 'username') {
      if (!username || !password) {
        throw new BadRequest('must include [username] and [password]')
      }

      return authProvider.instance.signUpWithUsername(username, password)
    }

    if (type === 'email') {
      if (!email || !password) {
        throw new BadRequest('must include [email] and [password]')
      }

      return authProvider.instance.signUpWithEmail(email, password)
    }

    if (type === 'phoneNumber') {
      if (!phoneNumber || !token) {
        throw new BadRequest('must include [phone] and [token]')
      }

      return authProvider.instance.signUpWithPhoneNumber(
        phoneNumber,
        token,
        password,
      )
    }

    throw new BadRequest('unknown [type]')
  },
})

router.post('/sign-out', {
  middlewares: [
    useAuthGuards({
      guards: [userGuard],
    }),
    useRateLimit({
      timeWindow: 1000,
      maxRequests: 20,
    }),
    useNullableMiddleware(configs.instance.middlewares?.auth?.signOut),
  ],
  schema: {
    body: Type.Object({
      allSessions: Type.Optional(Type.Boolean()),
    }),
  },
  handler: async req => {
    const { sid, user } = req.state
    const { allSessions = false } = req.body

    if (allSessions) {
      return authProvider.instance.signOutAll(user._id, user)
    }

    return authProvider.instance.signOut(sid, user)
  },
})

router.post('/bind-email', {
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
      email: Type.String({ format: 'email' }),
      token: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { email, token } = req.body

    return authProvider.instance.bindEmail(user._id, email, token)
  },
})

router.post('/bind-phone-number', {
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
      phoneNumber: Type.String({ format: 'phone-number' }),
      token: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { phoneNumber, token } = req.body

    return authProvider.instance.bindPhoneNumber(user._id, phoneNumber, token)
  },
})

router.post('/change-password', {
  middlewares: [
    useAuthGuards({
      guards: [userGuard],
    }),
    useRateLimit({
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

    return authProvider.instance.changePassword(user._id, password, newPassword)
  },
})

router.post('/reset-password', {
  middlewares: [
    useRateLimit({
      timeWindow: 10000,
      maxRequests: 10,
    }),
  ],
  schema: {
    body: Type.Object({
      type: Type.Literal(['email', 'phoneNumber']),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      token: Type.String(),
      password: Type.String(),
    }),
  },
  handler: async req => {
    const { type, email, phoneNumber, token, password } = req.body

    if (type === 'email') {
      if (!email) {
        throw new BadRequest('must include [email]')
      }

      return authProvider.instance.resetPasswordByEmail(email, password, token)
    }

    if (type === 'phoneNumber') {
      if (!phoneNumber) {
        throw new BadRequest('must include [phone]')
      }

      return authProvider.instance.resetPasswordByPhoneNumber(
        phoneNumber,
        password,
        token,
      )
    }

    throw new BadRequest('unknown [type]')
  },
})

export default router
