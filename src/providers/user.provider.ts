import {
  Conflict,
  ensureValues,
  Forbidden,
  hashPassword,
  NotFound,
  randomString,
  useInstance,
} from 'atonal'
import { ObjectId } from 'atonal-db'
import { chain } from 'lodash'
import { IAM_PERMISSION } from '../common/constants'
import {
  PermissionModel,
  RoleModel,
  User,
  UserMeta,
  UserModel,
  UserNationalId,
  UserProfile,
} from '../models'
import { desensitizeUser, desensitizeUsers } from '../utils'
import { AuthProvider } from './auth.provider'
import { RoleProvider } from './role.provider'

const authProvider = useInstance<AuthProvider>('IAM.provider.auth')
const roleProvider = useInstance<RoleProvider>('IAM.provider.role')

export class UserProvider {
  async createUser({
    username,
    email,
    emailVerified,
    phoneNumber,
    phoneNumberVerified,
    password,
  }: {
    username?: string
    email?: string
    emailVerified?: boolean
    phoneNumber?: string
    phoneNumberVerified?: boolean
    password?: string
  }) {
    const salt = randomString(8)
    const pwdHash = password ? hashPassword(password + salt) : undefined

    try {
      const user = await UserModel.create(
        ensureValues({
          username,
          email,
          emailVerified,
          phoneNumber,
          phoneNumberVerified,
          salt,
          pwdHash,
        }),
      )

      return desensitizeUser(user)
    } catch {
      throw new Conflict('user exists')
    }
  }

  async getUsers(
    {
      userId,
      userIds,
      role,
      permission,
      username,
      email,
      phoneNumber,
      sortBy = 'createdAt',
      orderBy = 'asc',
      skip = 0,
      limit = 20,
    }: {
      userId?: ObjectId
      userIds?: ObjectId[]
      role?: string
      permission?: string
      username?: string
      email?: string
      phoneNumber?: string
      sortBy?: '_id' | 'createdAt' | 'updatedAt'
      orderBy?: 'asc' | 'desc'
      skip?: number
      limit?: number
    },
    { sensitive = false }: { sensitive?: boolean } = {},
  ) {
    const filter = ensureValues({
      _id: userId,
      ...(userIds && { _id: { $in: userIds } }),
      roles: role,
      permissions: permission,
      username,
      email,
      phoneNumber,
    })

    const count = await UserModel.countDocuments(filter)
    const results = await UserModel.find(filter)
      .sort({ [sortBy]: orderBy === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return {
      count,
      results: desensitizeUsers(results, sensitive ? 'mask' : 'delete'),
    }
  }

  async getUser(
    userId: ObjectId,
    { sensitive = false }: { sensitive?: boolean } = {},
  ) {
    const user = await UserModel.findById(userId)

    if (!user) {
      throw new NotFound('user is not found')
    }

    return desensitizeUser(user, sensitive ? 'mask' : 'delete')
  }

  async getRawUserBy(filter: {
    _id?: ObjectId
    username?: string
    email?: string
    phoneNumber?: string
  }) {
    return UserModel.findOne(filter)
  }

  async updateUser(userId: ObjectId, partial: Partial<User>) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: partial },
      { returnDocument: 'after' },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    return user
  }

  async updateProfile(userId: ObjectId, partial: Partial<UserProfile>) {
    const $set = ensureValues(
      chain(partial)
        .mapKeys((_, key) => `profile.${key}`)
        .value(),
    )

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set },
      { returnDocument: 'after' },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    return user.profile ?? {}
  }

  async updateFullProfile(userId: ObjectId, full: UserProfile) {
    const profile = ensureValues(full)
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { profile } },
      { returnDocument: 'after' },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    return user.profile ?? {}
  }

  async updateMeta(userId: ObjectId, partial: Partial<UserMeta>) {
    const $set = ensureValues(
      chain(partial)
        .mapKeys((_, key) => `meta.${key}`)
        .value(),
    )

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set },
      { returnDocument: 'after' },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    return user.meta ?? {}
  }

  async updateNationalId(userId: ObjectId, partial: Partial<UserNationalId>) {
    const $set = ensureValues(
      chain(partial)
        .mapKeys((_, key) => `nationalId.${key}`)
        .value(),
    )

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set },
      { returnDocument: 'after' },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    return user.nationalId ?? {}
  }

  async updatePermissions(userId: ObjectId, permissions: string[]) {
    const count = await PermissionModel.countDocuments({
      name: {
        $in: permissions,
      },
    })

    if (count !== permissions.length) {
      throw new NotFound('some permissions are not found')
    }

    const user = await this.updateUser(userId, { permissions })

    await authProvider.instance.refreshSession(user._id)

    return { permissions }
  }

  async updateRoles(userId: ObjectId, roles: string[]) {
    const count = await RoleModel.countDocuments({
      name: {
        $in: roles,
      },
    })

    if (count !== roles.length) {
      throw new NotFound('some roles are not found')
    }

    const user = await this.updateUser(userId, { roles })

    await authProvider.instance.refreshSession(user._id)

    return { roles }
  }

  async blockUser(userId: ObjectId) {
    const permissions = await this.resolvePermissions(userId)

    if (permissions.includes(IAM_PERMISSION.ROOT)) {
      throw new Forbidden('not allowed to block an user')
    }

    await this.updateUser(userId, { blocked: true })
    await authProvider.instance.signOutAll(userId)

    return { success: true }
  }

  async unblockUser(userId: ObjectId) {
    await this.updateUser(userId, { blocked: false })

    return { success: true }
  }

  private async resolvePermissions(userId: ObjectId) {
    const user = await UserModel.findById(userId, {
      projection: {
        roles: 1,
        permissions: 1,
      },
    })

    if (!user) {
      throw new NotFound('user is not found')
    }

    const permissions = new Set<string>()

    if (user.permissions) {
      for (const permission of user.permissions) {
        permissions.add(permission)
      }
    }

    if (user.roles) {
      const roles = await roleProvider.instance.getRolesByNames(user.roles)

      for (const role of roles) {
        for (const permission of role.permissions) {
          permissions.add(permission)
        }
      }
    }

    return Array.from(permissions)
  }
}

export const useUserProvider = () =>
  useInstance<UserProvider>('IAM.provider.user')
