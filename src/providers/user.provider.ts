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
import { RBACProvider } from './rbac.provider'

const authProvider = useInstance<AuthProvider>('IAM.provider.auth')
const rbacProvider = useInstance<RBACProvider>('IAM.provider.rbac')

export class UserProvider {
  constructor(private configs: IAMConfigs) {}

  async createUser({
    permissions,
    roles,
    username,
    email,
    emailVerified,
    phoneNumber,
    phoneNumberVerified,
    password,
  }: {
    permissions?: string[]
    roles?: string[]
    username?: string
    email?: string
    emailVerified?: boolean
    phoneNumber?: string
    phoneNumberVerified?: boolean
    password?: string
  }) {
    if (permissions) {
      rbacProvider.instance.checkExistingPermissions(permissions)
    }

    if (roles) {
      rbacProvider.instance.checkExistingRoles(roles)
    }

    const salt = randomString(8)
    const pwdHash = password ? hashPassword(password + salt) : undefined

    try {
      const user = await UserModel.create(
        ensureValues({
          ...this.configs.defaults?.user,
          permissions,
          roles,
          username,
          email,
          emailVerified,
          phoneNumber,
          phoneNumberVerified,
          salt,
          pwdHash,
        }),
      )

      await this.configs.hooks?.onUserCreated?.(user)

      return desensitizeUser(user)
    } catch {
      throw new Conflict('user exists')
    }
  }

  async getUsers(
    {
      userId,
      permission,
      role,
      username,
      email,
      phoneNumber,
      sortBy = 'createdAt',
      orderBy = 'asc',
      skip = 0,
      limit = 20,
    }: {
      userId?: ObjectId
      permission?: string
      role?: string
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
      permissions: permission,
      roles: role,
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

  async getRawUsersByIds(ids: ObjectId[]) {
    return UserModel.find({ _id: { $in: ids } }).toArray()
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

    await this.configs.hooks?.onUserProfileUpdated?.(user)

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

    await this.configs.hooks?.onUserProfileUpdated?.(user)

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

    await this.configs.hooks?.onUserMetaUpdated?.(user)

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

    await this.configs.hooks?.onUserNationalIdUpdated?.(user)

    return user.nationalId ?? {}
  }

  async updatePermissions(userId: ObjectId, permissions: string[]) {
    rbacProvider.instance.checkExistingPermissions(permissions)

    const user = await this.updateUser(userId, { permissions })

    await authProvider.instance.refreshSession(user._id)
    await this.configs.hooks?.onUserPermissionUpdated?.(user)

    return { permissions }
  }

  async updateRoles(userId: ObjectId, roles: string[]) {
    rbacProvider.instance.checkExistingRoles(roles)

    const user = await this.updateUser(userId, { roles })

    await authProvider.instance.refreshSession(user._id)
    await this.configs.hooks?.onUserPermissionUpdated?.(user)

    return { roles }
  }

  async blockUser(userId: ObjectId) {
    const rbacProfile = await this.getUserRBACProfile(userId)

    if (rbacProvider.instance.of(rbacProfile).has(IAM_PERMISSION.BLOCK_USERS)) {
      throw new Forbidden('not allowed to block this user')
    }

    const user = await this.updateUser(userId, { blocked: true })

    await authProvider.instance.signOutAll(userId)
    await this.configs.hooks?.onUserBlocked?.(user)

    return { success: true }
  }

  async unblockUser(userId: ObjectId) {
    const user = await this.updateUser(userId, { blocked: false })

    await this.configs.hooks?.onUserUnblocked?.(user)

    return { success: true }
  }

  async getUserRBACProfile(userId: ObjectId) {
    const user = await UserModel.findById(userId, {
      projection: {
        permissions: 1,
        roles: 1,
      },
    })

    if (!user) {
      throw new NotFound('user is not found')
    }

    return user
  }
}

export const useUserProvider = () =>
  useInstance<UserProvider>('IAM.provider.user')
