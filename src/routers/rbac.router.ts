import { useAuthGuards, useRouter } from 'atonal'
import { IAM_PERMISSION } from '../common/constants'
import { keyGuard, userGuard } from '../middlewares'
import { useRBACProvider } from '../providers'

const rbacProvider = useRBACProvider()

const router = useRouter({
  middlewares: [
    useAuthGuards({
      guards: [keyGuard, userGuard],
    }),
    async req => req.guardPermission(IAM_PERMISSION.MANAGE_PERMISSIONS),
  ],
})

router.get('/permissions', {
  handler: async () => {
    return rbacProvider.instance.getPermissionDefs()
  },
})

router.get('/roles', {
  handler: async () => {
    return rbacProvider.instance.getRoleDefs()
  },
})

export default router
