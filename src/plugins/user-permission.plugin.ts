import { Forbidden, useGlobalPlugin } from 'atonal'

export const userPermissionPlugin = useGlobalPlugin(
  async (instance, _, next) => {
    instance.decorateRequest(
      'guardUserPermission',
      function (
        permissions: string | string[],
        except: () => boolean = () => false,
      ) {
        const { user } = this.state

        if (user) {
          const hasPermission = Array.isArray(permissions)
            ? user.permissions.some(item => permissions.includes(item))
            : user.permissions.includes(permissions)

          if (!hasPermission && !except()) {
            throw new Forbidden()
          }
        }
      },
    )

    next()
  },
)
