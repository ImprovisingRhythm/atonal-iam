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
      code: Type.String(),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { code } = req.body

    return privacyProvider.instance.deleteUser(user._id, code)
  },
})

export default router
