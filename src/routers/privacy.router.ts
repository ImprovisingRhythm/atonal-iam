import { Type, useAuthGuards, useRouter } from 'atonal'
import { userGuard } from '../middlewares'
import { usePrivacyProvider } from '../providers'

const privacyProvider = usePrivacyProvider()

const router = useRouter()

router.post('/delete-user', {
  middlewares: [
    useAuthGuards({
      guards: [userGuard],
    }),
  ],
  schema: {
    body: Type.Object({
      ticket: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { ticket } = req.body

    return privacyProvider.instance.deleteUser(user._id, ticket)
  },
})

export default router
