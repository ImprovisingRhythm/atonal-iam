import { Forbidden, usePlugin } from 'atonal'
import { useRBACProvider } from '../providers'

const rbacProvider = useRBACProvider()

export const rbacPlugin = usePlugin(
  async (instance, _, next) => {
    instance.decorateRequest(
      'hasPermission',
      function (permission: string | string[]) {
        const { authMethod, user } = this.state

        if (authMethod !== 'user' && authMethod !== 'key') {
          return false
        }

        if (authMethod === 'user') {
          const result = rbacProvider.instance.of(user).has(permission)

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
          const result = rbacProvider.instance.of(user).hasAll(permissions)

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
          rbacProvider.instance.of(user).except(except).guard(permission)
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
          rbacProvider.instance.of(user).except(except).guardAll(permissions)
        }
      },
    )

    next()
  },
  { global: true },
)
