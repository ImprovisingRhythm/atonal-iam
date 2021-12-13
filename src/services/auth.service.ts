import {
  Conflict,
  getInstance,
  hashPassword,
  NotFound,
  randomString,
  Unauthorized,
} from 'atonal'
import { asObjectId, ObjectId } from 'atonal-db'
import { pick } from 'lodash'
import jwt from 'jsonwebtoken'
import { RoleModel, UserModel } from '../models'
import { VerificationService } from './verification.service'
import { IAMConfigs } from '../common/configs'
import { UserAuthInfo, UserAuthInfoJwtPayload } from '../types/auth'
import { SessionService } from './session.service'

export class AuthService {
  constructor(private configs: IAMConfigs) {}

  async getSessionFromSID(sid: string) {
    return this.sessionService.getSession<UserAuthInfo>(sid)
  }

  async getSessionFromToken(token: string) {
    return this.verifyToken(token)
  }

  async refreshSession(userId: ObjectId) {
    const uid = userId.toHexString()
    const hasSession = await this.sessionService.hasSession(uid)

    if (hasSession) {
      await this.sessionService.writeSession(
        uid,
        await this.getUserAuthInfo(userId),
      )
    }
  }

  async signUpWithPhoneNumber(
    phoneNumber: string,
    ticket: string,
    password?: string,
  ) {
    await this.verificationService.guardTicket({
      ticket,
      phoneNumber,
    })

    const salt = randomString(8)
    const pwdHash = password ? hashPassword(password + salt) : undefined

    try {
      const user = await UserModel.create({
        phoneNumber,
        phoneNumberVerified: true,
        salt,
        pwdHash,
      })

      return pick(user, ['_id', 'phoneNumber'])
    } catch {
      throw new Conflict('user exists')
    }
  }

  async signUpWithUsername(username: string, password: string) {
    const salt = randomString(8)
    const pwdHash = hashPassword(password + salt)

    try {
      const user = await UserModel.create({
        username,
        salt,
        pwdHash,
      })

      return pick(user, ['_id', 'email'])
    } catch {
      throw new Conflict('user exists')
    }
  }

  async signUpWithEmail(email: string, password: string) {
    const salt = randomString(8)
    const pwdHash = hashPassword(password + salt)

    try {
      const user = await UserModel.create({
        email,
        salt,
        pwdHash,
      })

      return pick(user, ['_id', 'email'])
    } catch {
      throw new Conflict('user exists')
    }
  }

  async signInWithPhoneNumberAndTicket(phoneNumber: string, ticket: string) {
    await this.verificationService.guardTicket({
      ticket,
      phoneNumber,
    })

    const user = await UserModel.findOne(
      { phoneNumber },
      { projection: { _id: 1 } },
    )

    if (!user) {
      throw new Unauthorized('invalid credentials')
    }

    return this.handleSignIn(user._id)
  }

  async signInWithPhoneNumberAndPassword(
    phoneNumber: string,
    password: string,
  ) {
    const user = await UserModel.findOne(
      { phoneNumber },
      {
        projection: {
          salt: 1,
          pwdHash: 1,
        },
      },
    )

    if (!user || hashPassword(password + user.salt) !== user.pwdHash) {
      throw new Unauthorized('invalid credentials')
    }

    return this.handleSignIn(user._id)
  }

  async signInWithUsername(username: string, password: string) {
    const user = await UserModel.findOne(
      { username },
      {
        projection: {
          salt: 1,
          pwdHash: 1,
        },
      },
    )

    if (!user || hashPassword(password + user.salt) !== user.pwdHash) {
      throw new Unauthorized('invalid credentials')
    }

    return this.handleSignIn(user._id)
  }

  async signInWithEmail(email: string, password: string) {
    const user = await UserModel.findOne(
      { email },
      {
        projection: {
          salt: 1,
          pwdHash: 1,
        },
      },
    )

    if (!user || hashPassword(password + user.salt) !== user.pwdHash) {
      throw new Unauthorized('invalid credentials')
    }

    return this.handleSignIn(user._id)
  }

  async signOut(sid: string) {
    await this.sessionService.deleteSID(sid)
    return { success: true }
  }

  async signOutAll(userId: ObjectId) {
    await this.sessionService.deleteSession(userId.toHexString())
    return { success: true }
  }

  async bindPhoneNumber(userId: ObjectId, phoneNumber: string, ticket: string) {
    await this.verificationService.guardTicket({
      ticket,
      phoneNumber,
    })

    const user = await UserModel.findByIdAndUpdate(userId, {
      $set: {
        phoneNumber,
        phoneNumberVerified: true,
      },
    })

    if (!user) {
      throw new NotFound('user is not found')
    }

    await this.refreshSession(userId)

    return { success: true }
  }

  async bindEmail(userId: ObjectId, email: string, ticket: string) {
    await this.verificationService.guardTicket({ ticket, email })

    const user = await UserModel.findByIdAndUpdate(userId, {
      $set: {
        email,
        emailVerified: true,
      },
    })

    if (!user) {
      throw new NotFound('user is not found')
    }

    await this.refreshSession(userId)

    return { success: true }
  }

  async changePassword(
    userId: ObjectId,
    password: string,
    newPassword: string,
  ) {
    const user = await UserModel.findById(userId, {
      projection: {
        salt: 1,
        pwdHash: 1,
      },
    })

    if (!user || hashPassword(password + user.salt) !== user.pwdHash) {
      throw new Unauthorized('invalid credentials')
    }

    await UserModel.updateById(userId, {
      $set: {
        pwdHash: hashPassword(newPassword + user.salt),
      },
    })

    await this.sessionService.deleteSession(userId.toHexString())

    return { success: true }
  }

  async resetPasswordByEmail(email: string, password: string, ticket: string) {
    await this.verificationService.guardTicket({ ticket, email })

    const user = await UserModel.findOne({ email }, { projection: { _id: 1 } })

    if (!user) {
      throw new NotFound('user is not found')
    }

    await UserModel.updateById(user._id, {
      $set: {
        pwdHash: hashPassword(password + user.salt),
      },
    })

    return { success: true }
  }

  async resetPasswordByPhoneNumber(
    phoneNumber: string,
    password: string,
    ticket: string,
  ) {
    await this.verificationService.guardTicket({
      ticket,
      phoneNumber,
    })

    const user = await UserModel.findOne(
      { phoneNumber },
      { projection: { _id: 1 } },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    await UserModel.updateById(user._id, {
      $set: {
        pwdHash: hashPassword(password + user.salt),
      },
    })

    return { success: true }
  }

  private async getUserAuthInfo(userId: ObjectId) {
    const user = await UserModel.findById(userId, {
      projection: {
        _id: 1,
        roles: 1,
        permissions: 1,
        blocked: 1,
      },
    })

    if (!user) {
      throw new Unauthorized('user is not found')
    }

    if (user.blocked) {
      throw new Unauthorized('user has been blocked')
    }

    const permissions = new Set<string>()

    if (user.permissions) {
      for (const permission of user.permissions) {
        permissions.add(permission)
      }
    }

    if (user.roles) {
      const roles = await RoleModel.find({
        _id: {
          $in: user.roles.map(asObjectId),
        },
      }).toArray()

      for (const role of roles) {
        for (const permission of role.permissions) {
          permissions.add(permission)
        }
      }
    }

    const authInfo: UserAuthInfo = {
      _id: user._id,
      permissions: Array.from(permissions),
    }

    return authInfo
  }

  private async verifyToken(token: string) {
    const payload = await new Promise<UserAuthInfoJwtPayload>(
      (resolve, reject) => {
        jwt.verify(token, this.configs.auth.jwt.secret, {}, (err, result) => {
          if (err) {
            reject(new Unauthorized(`invalid token: ${err.message}`))
          } else {
            resolve(result as UserAuthInfoJwtPayload)
          }
        })
      },
    )

    return payload as UserAuthInfo
  }

  private async handleSignIn(userId: ObjectId) {
    const user = await this.getUserAuthInfo(userId)
    const sid = await this.sessionService.createSession(
      user._id.toHexString(),
      user,
    )

    const token = jwt.sign(user, this.configs.auth.jwt.secret, {
      expiresIn: this.configs.auth.jwt.expiresIn,
    })

    return { sid, token, user }
  }

  private get sessionService() {
    return getInstance<SessionService>('IAM.service.session')
  }

  private get verificationService() {
    return getInstance<VerificationService>('IAM.service.verification')
  }
}
