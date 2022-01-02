import { Conflict, ensureValues, NotFound, useInstance } from 'atonal'
import { makeStartsWithRegExp } from 'atonal-db'
import { isEqual } from 'lodash'
import {
  BuiltInRole,
  PermissionModel,
  Role,
  RoleModel,
  UserModel,
} from '../models'

export class RoleProvider {
  async loadRoles(roles: BuiltInRole[]) {
    const created: Role[] = []
    const updated: Role[] = []

    for (const role of roles) {
      const { name, permissions, alias, description } = role

      const existing = await RoleModel.findOne({ name })

      if (existing) {
        if (
          !isEqual(existing.permissions, permissions) ||
          !isEqual(existing.alias, alias) ||
          !isEqual(existing.description, description)
        ) {
          const item = await RoleModel.findOneAndUpdate(
            { name },
            {
              $set: ensureValues({
                permissions,
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
        const item = await RoleModel.create(
          ensureValues({
            name,
            permissions,
            alias,
            description,
          }),
        )

        created.push(item)
      }
    }

    return { created, updated }
  }

  async createRole(
    name: string,
    permissions: string[],
    {
      alias,
      description,
    }: {
      alias?: string
      description?: string
    },
  ) {
    try {
      return await RoleModel.create(
        ensureValues({
          name,
          permissions,
          alias,
          description,
        }),
      )
    } catch {
      throw new Conflict('role exists')
    }
  }

  async getRoles({
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

    const count = await RoleModel.countDocuments(filter)
    const results = await RoleModel.find(filter)
      .sort({ [sortBy]: orderBy === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return { count, results }
  }

  async getRolesByNames(names: string[]) {
    return RoleModel.find({ name: { $in: names } }).toArray()
  }

  async getRole(name: string) {
    const role = await RoleModel.findOne({ name })

    if (!role) {
      throw new NotFound('role is not found')
    }

    return role
  }

  async updateRole(
    name: string,
    partial: Partial<Pick<Role, 'permissions' | 'alias' | 'description'>>,
  ) {
    if (partial.permissions) {
      const count = await PermissionModel.countDocuments({
        name: {
          $in: partial.permissions,
        },
      })

      if (count !== partial.permissions.length) {
        throw new NotFound('some permissions are not found')
      }
    }

    const $set = ensureValues(partial)
    const role = await RoleModel.findOneAndUpdate(
      { name },
      { $set },
      { returnDocument: 'after' },
    )

    if (!role) {
      throw new NotFound('role is not found')
    }

    return role
  }

  async deleteRole(name: string) {
    const result = await RoleModel.deleteOne({ name })

    if (result.deletedCount === 0) {
      throw new NotFound('role is not found')
    }

    await UserModel.updateMany(
      { roles: name },
      {
        $pull: {
          roles: name,
        },
      },
    )

    return { success: true }
  }

  async guardExistingRoles(roles: string[]) {
    if (roles.length > 0) {
      const count = await RoleModel.countDocuments({
        name: {
          $in: roles,
        },
      })

      if (count !== roles.length) {
        throw new NotFound('some roles are not found')
      }
    }
  }
}

export const useRoleProvider = () =>
  useInstance<RoleProvider>('IAM.provider.role')
