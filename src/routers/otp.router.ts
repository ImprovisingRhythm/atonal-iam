import { Type, useAuthGuards, useRouter } from 'atonal'
import { userGuard } from '../middlewares'
import { useOtpProvider } from '../providers'

const otpProvider = useOtpProvider()

const router = useRouter({
  middlewares: [
    useAuthGuards({
      guards: [userGuard],
    }),
  ],
})

router.get('/uri', {
  schema: {
    querystring: Type.Object({
      token: Type.String({ description: 'captcha token' }),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { token } = req.query

    return otpProvider.instance.getKeyUri(user._id, token)
  },
})

router.post('/generate-secret', {
  schema: {
    querystring: Type.Object({
      token: Type.String({ description: 'captcha token' }),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { token } = req.query

    return otpProvider.instance.generateSecret(user._id, token)
  },
})

export default router
