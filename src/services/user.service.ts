import { getInstance, NotFound } from 'atonal'
import { ObjectId, usePopulateItem } from 'atonal-db'
import { Role, RoleModel, UserIPs, UserModel } from '../models'
import { AuthService } from './auth.service'
import { SessionService } from './session.service'

export class UserService {
  async updatePermissions(userId: ObjectId, permissions: string[]) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { permissions } },
      { returnDocument: 'after' },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    await this.authService.refreshSession(userId)

    return user
  }

  async updateRoles(userId: ObjectId, roleIds: ObjectId[]) {
    if (!(await RoleModel.exists(roleIds))) {
      throw new NotFound('cannot find all role ids')
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { roles: roleIds } },
      { returnDocument: 'after' },
    )

    if (!user) {
      throw new NotFound('user is not found')
    }

    await this.authService.refreshSession(userId)

    await UserModel.populate(
      [user],
      usePopulateItem({
        model: RoleModel,
        path: 'roles',
        select: ['name', 'alias'],
      }),
    )

    return user.roles as Pick<Role, 'name' | 'alias' | 'permissions'>[]
  }

  async blockUser(userId: ObjectId) {
    await this.sessionService.deleteSession(userId.toHexString())
    await UserModel.updateById(userId, {
      $set: {
        blocked: true,
      },
    })

    return { success: true }
  }

  async unblockUser(userId: ObjectId) {
    await UserModel.updateById(userId, {
      $unset: {
        blocked: true,
      },
    })

    return { success: true }
  }

  async setUserIP(userId: ObjectId, ip: string, type: keyof UserIPs) {
    await UserModel.updateById(
      userId,
      {
        $set: {
          [`ips.${type}`]: ip,
        },
      },
      { timestamps: false },
    )
  }

  private get sessionService() {
    return getInstance<SessionService>('IAM.service.session')
  }

  private get authService() {
    return getInstance<AuthService>('IAM.service.auth')
  }
}
