import { useInstance, usePlugin } from 'atonal'
import { useDB } from 'atonal-db'
import { IAMConfigs } from './common/configs'
import { RoleModel, SessionModel, UserModel, VerificationModel } from './models'
import { RoleProvider } from './providers/role.provider'
import { UserProvider } from './providers/user.provider'
import router from './routers'
import { AuthService } from './services/auth.service'
import { SessionService } from './services/session.service'
import { UserService } from './services/user.service'
import { VerificationService } from './services/verification.service'

export const useIAM = (configs: IAMConfigs) => {
  return usePlugin(async (instance, _, next) => {
    await useDB({
      databases: configs.databases,
      models: [RoleModel, UserModel, SessionModel, VerificationModel],
    })

    useInstance('IAM.configs', configs)

    useInstance('IAM.provider.user', new UserProvider())
    useInstance('IAM.provider.role', new RoleProvider())

    useInstance('IAM.service.session', new SessionService(configs))
    useInstance('IAM.service.auth', new AuthService(configs))
    useInstance('IAM.service.verification', new VerificationService(configs))
    useInstance('IAM.service.user', new UserService())

    instance.register(router.compile())

    next()
  })
}
