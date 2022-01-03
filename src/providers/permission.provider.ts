import { Forbidden, NotFound, useInstance } from 'atonal'
import { intersectionWith } from 'lodash'
import { IAMConfigs } from '../common/configs'
import { IAM_DEFAULT_PERMISSIONS } from '../common/constants'

const comparePermission = (a: string, b: string) => {
  const amt = /(.+?)\.(.+?)$/.exec(a)
  const bmt = /(.+?)\.(.+?)$/.exec(b)

  if (!amt || !bmt) {
    return false
  }

  const [ak, ar, am] = amt
  const [bk, br, bm] = bmt

  return ak === bk || (ar === br && (am === '*' || bm === '*'))
}

export class PermissionBuilder {
  private exceptCallbacks: Array<() => boolean> = []

  constructor(private permissions: string[]) {}

  except(cb?: () => boolean) {
    if (cb) {
      this.exceptCallbacks.push(cb)
    }

    return this
  }

  has(item: string | string[]) {
    return Array.isArray(item)
      ? this.permissions.some(x => item.some(y => comparePermission(x, y)))
      : this.permissions.some(x => comparePermission(item, x))
  }

  hasAll(items: string[]) {
    return (
      intersectionWith(this.permissions, items, comparePermission).length ===
      items.length
    )
  }

  guard(item: string | string[]) {
    if (!this.has(item)) {
      const excepted = this.exceptCallbacks.some(cb => cb())

      if (!excepted) {
        throw new Forbidden()
      }
    }
  }

  guardAll(items: string[]) {
    if (!this.hasAll(items)) {
      const excepted = this.exceptCallbacks.some(cb => cb())

      if (!excepted) {
        throw new Forbidden()
      }
    }
  }
}

export class PermissionProvider {
  private permissions: Record<string, string>
  private permissionKeys: string[]

  constructor(configs: IAMConfigs) {
    this.permissions = {
      ...IAM_DEFAULT_PERMISSIONS,
      ...configs.permissions,
    }

    this.permissionKeys = Object.keys(this.permissions)
  }

  getPermissions() {
    return this.permissions
  }

  guardPermissions(permissions: string[]) {
    if (!this.permissionKeys.some(item => permissions.includes(item))) {
      throw new NotFound('some permissions are not found')
    }
  }

  of(userPermissions: string[]) {
    return new PermissionBuilder(userPermissions)
  }
}

export const usePermissionProvider = () =>
  useInstance<PermissionProvider>('IAM.provider.permission')
