import {
  Conflict,
  ensureValues,
  hashPassword,
  NotFound,
  randomString,
  useInstance,
} from 'atonal'
import { ObjectId } from 'atonal-db'
import { chain } from 'lodash'
import {
  PermissionModel,
  RoleModel,
  User,
  UserMeta,
  UserModel,
  UserProfile,
} from '../models'
import { desensitizeUser, desensitizeUsers } from '../utils'
import { useAuthProvider } from './auth.provider'

const authProvider = useAuthProvider()

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

  async getUsers({
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
  }) {
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
      results: desensitizeUsers(results),
    }
  }

  async getUser(userId: ObjectId) {
    const user = await UserModel.findById(userId)

    if (!user) {
      throw new NotFound('user is not found')
    }

    return desensitizeUser(user)
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
    await authProvider.instance.signOutAll(userId)
    await this.updateUser(userId, { blocked: true })

    return { success: true }
  }

  async unblockUser(userId: ObjectId) {
    await this.updateUser(userId, { blocked: false })

    return { success: true }
  }
}

export const useUserProvider = () =>
  useInstance<UserProvider>('IAM.provider.user')
