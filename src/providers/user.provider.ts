import { ensureValues, NotFound } from 'atonal'
import { ObjectId } from 'atonal-db'
import { chain } from 'lodash'
import { User, UserModel, UserProfile } from '../models'
import {
  maskEmail,
  maskIdCardNumber,
  maskPhoneNumber,
} from '../utils/mask-string'

const desensitizeUser = (user: User) => {
  // @ts-ignore
  delete user.salt

  // @ts-ignore
  delete user.pwdHash

  // Mask id card number
  if (user.identity) {
    const { idCardNumber } = user.identity

    if (idCardNumber) {
      user.identity.idCardNumber = maskIdCardNumber(idCardNumber)
    }
  }

  // Mask email address
  if (user.email) {
    user.email = maskEmail(user.email)
  }

  // Mask phone number
  if (user.phoneNumber) {
    user.phoneNumber = maskPhoneNumber(user.phoneNumber)
  }

  return user
}

const desensitizeUsers = (users: User[]) => {
  for (const user of users) {
    desensitizeUser(user)
  }

  return users
}

export class UserProvider {
  async getUsers({
    userId,
    roleId,
    username,
    email,
    phoneNumber,
    sortBy = 'createdAt',
    orderBy = 'asc',
    skip = 0,
    limit = 20,
  }: {
    userId?: ObjectId
    roleId?: ObjectId
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
      roles: roleId,
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

    return user.profile
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

    return user.profile
  }
}
