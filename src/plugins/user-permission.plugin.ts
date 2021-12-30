import { Forbidden, usePlugin } from 'atonal'

export const userPermissionPlugin = usePlugin(
  async (instance, _, next) => {
    instance.decorateRequest(
      'guardUserPermission',
      function (
        permissions: string | string[],
        except: () => boolean = () => false,
        callback?: (userPermissions: string[]) => void,
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

          callback?.(user.permissions)
        }
      },
    )

    next()
  },
  { global: true },
)
