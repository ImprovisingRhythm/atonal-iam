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
import { IAMConfigs } from '../common/configs'
import { IAM_PERMISSION } from '../common/constants'
import {
  User,
  UserMeta,
  UserModel,
  UserNationalId,
  UserProfile,
} from '../models'
import { desensitizeUser, desensitizeUsers } from '../utils'
import { AuthProvider } from './auth.provider'
import { PermissionProvider } from './permission.provider'

const authProvider = useInstance<AuthProvider>('IAM.provider.auth')
const pmsProvider = useInstance<PermissionProvider>('IAM.provider.permission')

export class UserProvider {
  constructor(private configs: IAMConfigs) {}

  async createUser({
    permissions,
    username,
    email,
    emailVerified,
    phoneNumber,
    phoneNumberVerified,
    password,
  }: {
    permissions?: string[]
    username?: string
    email?: string
    emailVerified?: boolean
    phoneNumber?: string
    phoneNumberVerified?: boolean
    password?: string
  }) {
    if (permissions) {
      pmsProvider.instance.guardPermissions(permissions)
    }

    const salt = randomString(8)
    const pwdHash = password ? hashPassword(password + salt) : undefined

    try {
      const user = await UserModel.create(
        ensureValues({
          ...this.configs.defaults?.user,
          permissions,
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
    pmsProvider.instance.guardPermissions(permissions)

    const user = await this.updateUser(userId, { permissions })

    await authProvider.instance.refreshSession(user._id)

    return { permissions }
  }

  async blockUser(userId: ObjectId) {
    const permissions = await this.getUserPermissions(userId)

    if (pmsProvider.instance.of(permissions).has(IAM_PERMISSION.BLOCK_USERS)) {
      throw new Forbidden('not allowed to block this user')
    }

    await this.updateUser(userId, { blocked: true })
    await authProvider.instance.signOutAll(userId)

    return { success: true }
  }

  async unblockUser(userId: ObjectId) {
    await this.updateUser(userId, { blocked: false })

    return { success: true }
  }

  async getUserPermissions(userId: ObjectId) {
    const user = await UserModel.findById(userId, {
      projection: {
        permissions: 1,
      },
    })

    if (!user) {
      throw new NotFound('user is not found')
    }

    return user.permissions ?? []
  }
}

export const useUserProvider = () =>
  useInstance<UserProvider>('IAM.provider.user')
