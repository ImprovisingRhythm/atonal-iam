import { Forbidden, NotFound, useInstance } from 'atonal'
import { intersectionWith } from 'lodash'
import { IAMConfigs } from '../common/configs'
import {
  IAM_BUILT_IN_PERMISSIONS,
  IAM_BUILT_IN_ROLES,
} from '../common/constants'
import { PermissionDef, RoleDef } from '../types'

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

export interface RBACProfile {
  permissions?: string[]
  roles?: string[]
}

export class PermissionBuilder {
  private permissions: string[]
  private exceptCallbacks: (() => boolean)[]

  constructor(permissions: string[]) {
    this.permissions = permissions
    this.exceptCallbacks = []
  }

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

export class RBACProvider {
  private permissionDefs: PermissionDef[]
  private permissions: string[]
  private roleDefs: RoleDef[]
  private roleDefMap: Map<string, RoleDef>
  private roles: string[]

  constructor(configs: IAMConfigs) {
    this.permissionDefs = IAM_BUILT_IN_PERMISSIONS
    this.roleDefs = IAM_BUILT_IN_ROLES

    if (configs.rbac) {
      const { permissionDefs, roleDefs } = configs.rbac

      if (permissionDefs) {
        this.permissionDefs.push(...permissionDefs)
      }

      if (roleDefs) {
        this.roleDefs.push(...roleDefs)
      }
    }

    this.roleDefMap = new Map<string, RoleDef>()

    for (const roleDef of this.roleDefs) {
      this.roleDefMap.set(roleDef.name, roleDef)
    }

    this.permissions = this.permissionDefs.map(def => def.name)
    this.roles = this.roleDefs.map(def => def.name)
  }

  getPermissionDefs() {
    return this.permissionDefs
  }

  getRoleDefs() {
    return this.roleDefs
  }

  checkExistingPermissions(permissions: string[]) {
    if (!this.permissions.some(item => permissions.includes(item))) {
      throw new NotFound('some permissions are not found')
    }
  }

  checkExistingRoles(roles: string[]) {
    if (!this.roles.some(item => roles.includes(item))) {
      throw new NotFound('some roles are not found')
    }
  }

  resolvePermissions({ permissions = [], roles = [] }: RBACProfile) {
    const permissionSet = new Set<string>()

    for (const permission of permissions) {
      permissionSet.add(permission)
    }

    const walkRoles = (roles: string[]) => {
      for (const role of roles) {
        const roleDef = this.roleDefMap.get(role)

        if (roleDef) {
          for (const permission of roleDef.permissions) {
            permissionSet.add(permission)
          }

          if (roleDef.extends) {
            walkRoles(roleDef.extends)
          }
        }
      }
    }

    walkRoles(roles)

    return Array.from(permissionSet)
  }

  of(profile: RBACProfile) {
    return new PermissionBuilder(this.resolvePermissions(profile))
  }
}

export const useRBACProvider = () =>
  useInstance<RBACProvider>('IAM.provider.rbac')
