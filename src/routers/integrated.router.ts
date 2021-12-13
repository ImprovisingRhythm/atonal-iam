import { useRouter } from 'atonal'
import { requireAuth } from '../middlewares/auth.middleware'

const router = useRouter({
  middlewares: [requireAuth({ mode: 'api-only' })],
})

router.get('/permissions', {
  handler: async () => {
    return [
      'createRole',
      'getRoles',
      'updateRoles',
      'getUsers',
      'updateUsers',
      'setUserPermissions',
      'blockUser',
    ]
  },
})

export default router
