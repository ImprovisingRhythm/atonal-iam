import { useAuthGuards, useRouter } from 'atonal'
import { IAM_PERMISSION } from '../common/constants'
import { keyGuard, userGuard } from '../middlewares'
import { usePermissionProvider } from '../providers'

const pmsProvider = usePermissionProvider()

const router = useRouter({
  middlewares: [
    useAuthGuards({
      guards: [keyGuard, userGuard],
    }),
    async req => req.guardPermission(IAM_PERMISSION.MANAGE_PERMISSIONS),
  ],
})

router.get('/', {
  handler: async () => {
    return pmsProvider.instance.getPermissions()
  },
})

export default router
