import { Conflict, ensureValues, NotFound } from 'atonal'
import { ObjectId } from 'atonal-db'
import { Role, RoleModel, UserModel } from '../models'

export class RoleProvider {
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
    const filter = ensureValues({ name })
    const count = await RoleModel.countDocuments(filter)
    const results = await RoleModel.find(filter)
      .sort({ [sortBy]: orderBy === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return { count, results }
  }

  async getRole(roleId: ObjectId) {
    const role = await RoleModel.findById(roleId)

    if (!role) {
      throw new NotFound('role is not found')
    }

    return role
  }

  async updateRole(
    roleId: ObjectId,
    partial: Partial<Pick<Role, 'alias' | 'description'>>,
  ) {
    const $set = ensureValues(partial)
    const role = await RoleModel.findByIdAndUpdate(
      roleId,
      { $set },
      { returnDocument: 'after' },
    )

    if (!role) {
      throw new NotFound('role is not found')
    }

    return role
  }

  async deleteRole(roleId: ObjectId) {
    await RoleModel.deleteById(roleId)
    await UserModel.updateMany(
      { roles: roleId },
      {
        $pull: {
          roles: roleId,
        },
      },
    )

    return { success: true }
  }
}
