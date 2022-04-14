import { Type, useAuthGuards, useRouter } from 'atonal'
import { userGuard } from '../middlewares'
import { useOTPProvider } from '../providers'

const otpProvider = useOTPProvider()

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
      ticket: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { ticket } = req.query

    return otpProvider.instance.getKeyUri(user._id, ticket)
  },
})

router.post('/generate-secret', {
  schema: {
    querystring: Type.Object({
      ticket: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { ticket } = req.query

    return otpProvider.instance.generateSecret(user._id, ticket)
  },
})

export default router
