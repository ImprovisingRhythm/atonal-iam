import { Conflict, ensureValues, NotFound, useInstance } from 'atonal'
import { makeStartsWithRegExp } from 'atonal-db'
import { isEqual } from 'lodash'
import {
  BuiltInPermission,
  Permission,
  PermissionModel,
  RoleModel,
  UserModel,
} from '../models'

export class PermissionProvider {
  async loadPermissions(permissions: BuiltInPermission[]) {
    const created: Permission[] = []
    const updated: Permission[] = []

    for (const permission of permissions) {
      const { name, alias, description } = permission

      const existing = await PermissionModel.findOne({ name })

      if (existing) {
        if (
          !isEqual(existing.alias, alias) ||
          !isEqual(existing.description, description)
        ) {
          const item = await PermissionModel.findOneAndUpdate(
            { name },
            {
              $set: ensureValues({
                alias,
                description,
              }),
            },
            { returnDocument: 'after' },
          )

          if (item) {
            updated.push(item)
          }
        }
      } else {
        const item = await PermissionModel.create(
          ensureValues({
            name,
            alias,
            description,
          }),
        )

        created.push(item)
      }
    }

    return { created, updated }
  }

  async createPermission(
    name: string,
    {
      alias,
      description,
    }: {
      alias?: string
      description?: string
    },
  ) {
    try {
      return await PermissionModel.create(
        ensureValues({
          name,
          alias,
          description,
        }),
      )
    } catch {
      throw new Conflict('permission exists')
    }
  }

  async getPermissions({
    name,
    sortBy = 'createdAt',
    orderBy = 'asc',
    skip = 0,
    limit = 20,
  }: {
    name?: string
    sortBy?: '_id' | 'createdAt' | 'updatedAt'
    orderBy?: 'asc' | 'desc'
    skip?: number
    limit?: number
  }) {
    const filter = ensureValues({
      ...(name && { name: makeStartsWithRegExp(name, 'i') }),
    })

    const count = await PermissionModel.countDocuments(filter)
    const results = await PermissionModel.find(filter)
      .sort({ [sortBy]: orderBy === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return { count, results }
  }

  async getPermission(name: string) {
    const permission = await PermissionModel.findOne({ name })

    if (!permission) {
      throw new NotFound('permission is not found')
    }

    return permission
  }

  async updatePermission(
    name: string,
    partial: Partial<Pick<Permission, 'alias' | 'description'>>,
  ) {
    const $set = ensureValues(partial)
    const permission = await PermissionModel.findOneAndUpdate(
      { name },
      { $set },
      { returnDocument: 'after' },
    )

    if (!permission) {
      throw new NotFound('permission is not found')
    }

    return permission
  }

  async deletePermission(name: string) {
    const result = await PermissionModel.deleteOne({ name })

    if (result.deletedCount === 0) {
      throw new NotFound('permission is not found')
    }

    await RoleModel.updateMany(
      { permissions: name },
      {
        $pull: {
          permissions: name,
        },
      },
    )

    await UserModel.updateMany(
      { permissions: name },
      {
        $pull: {
          permissions: name,
        },
      },
    )

    return { success: true }
  }

  async guardExistingPermissions(permissions: string[]) {
    if (permissions.length > 0) {
      const count = await PermissionModel.countDocuments({
        name: {
          $in: permissions,
        },
      })

      if (count !== permissions.length) {
        throw new NotFound('some permissions are not found')
      }
    }
  }
}

export const usePermissionProvider = () =>
  useInstance<PermissionProvider>('IAM.provider.permission')
