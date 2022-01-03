import { Forbidden, usePlugin } from 'atonal'
import { usePermissionProvider } from '../providers'

const pmsProvider = usePermissionProvider()

export const userPermissionPlugin = usePlugin(
  async (instance, _, next) => {
    instance.decorateRequest(
      'hasPermission',
      function (permission: string | string[]) {
        const { authMethod, user } = this.state

        if (authMethod !== 'user' && authMethod !== 'key') {
          return false
        }

        if (authMethod === 'user') {
          const result = pmsProvider.instance
            .of(user.permissions)
            .has(permission)

          if (result) {
            return true
          } else {
            return false
          }
        }

        return true
      },
    )

    instance.decorateRequest(
      'hasAllPermissions',
      function (permissions: string[]) {
        const { authMethod, user } = this.state

        if (authMethod !== 'user' && authMethod !== 'key') {
          return false
        }

        if (authMethod === 'user') {
          const result = pmsProvider.instance
            .of(user.permissions)
            .hasAll(permissions)

          if (result) {
            return true
          } else {
            return false
          }
        }

        return true
      },
    )

    instance.decorateRequest(
      'guardPermission',
      function (permission: string | string[], except?: () => boolean) {
        const { authMethod, user } = this.state

        if (authMethod !== 'user' && authMethod !== 'key') {
          throw new Forbidden()
        }

        if (authMethod === 'user') {
          pmsProvider.instance
            .of(user.permissions)
            .except(except)
            .guard(permission)
        }
      },
    )

    instance.decorateRequest(
      'guardAllPermissions',
      function (permissions: string[], except?: () => boolean) {
        const { authMethod, user } = this.state

        if (authMethod !== 'user' && authMethod !== 'key') {
          throw new Forbidden()
        }

        if (authMethod === 'user') {
          pmsProvider.instance
            .of(user.permissions)
            .except(except)
            .guardAll(permissions)
        }
      },
    )

    next()
  },
  { global: true },
)
