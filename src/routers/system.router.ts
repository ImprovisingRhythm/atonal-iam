import { useRouter } from 'atonal'
import { SYSTEM_PERMISSIONS } from '../common/constants'
import { requireAuth } from '../middlewares'

const router = useRouter({
  middlewares: [
    requireAuth({
      sources: ['directAccess'],
    }),
  ],
})

router.get('/permissions', {
  handler: async () => {
    return {
      permissions: SYSTEM_PERMISSIONS,
    }
  },
})

export default router
