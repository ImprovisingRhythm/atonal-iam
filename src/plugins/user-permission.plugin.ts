import { Forbidden, usePlugin } from 'atonal'

export const userPermissionPlugin = usePlugin(
  async (instance, _, next) => {
    instance.decorateRequest(
      'guardUserPermission',
      function (
        permissions: string | string[],
        except: () => boolean | Promise<boolean> = () => false,
      ) {
        const { authMethod, user } = this.state

        if (authMethod !== 'user' && authMethod !== 'key') {
          throw new Forbidden()
        }

        if (authMethod === 'user') {
          const hasPermission = Array.isArray(permissions)
            ? user.permissions.some(item => permissions.includes(item))
            : user.permissions.includes(permissions)

          if (!hasPermission && !except()) {
            throw new Forbidden()
          }
        }
      },
    )

    instance.decorateRequest(
      'hasUserPermission',
      function (permissions: string | string[]) {
        const { authMethod, user } = this.state

        if (authMethod !== 'user' && authMethod !== 'key') {
          return false
        }

        if (authMethod === 'user') {
          const hasPermission = Array.isArray(permissions)
            ? user.permissions.some(item => permissions.includes(item))
            : user.permissions.includes(permissions)

          if (hasPermission) {
            return true
          } else {
            return false
          }
        }

        return true
      },
    )

    next()
  },
  { global: true },
)
