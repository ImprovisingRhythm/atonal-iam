import { useInstance, usePlugin } from 'atonal'
import { useDB } from 'atonal-db'
import { IAMConfigs } from './common/configs'
import { CaptchaModel, SessionModel, UserModel } from './models'
import { rbacPlugin } from './plugins'
import {
  AuthProvider,
  CaptchaProvider,
  OTPProvider,
  RBACProvider,
  SessionProvider,
  UserProvider,
} from './providers'
import router from './routers'

export * from './common/configs'
export * from './common/constants'
export * from './middlewares'
export * from './models'
export * from './providers'
export * from './types'
export * from './utils'

export const useIAM = (configs: IAMConfigs) => {
  return usePlugin(async (instance, _, next) => {
    await useDB({
      databases: configs.databases,
      models: [CaptchaModel, SessionModel, UserModel],
    })

    useInstance('IAM.configs', configs)

    useInstance('IAM.provider.auth', new AuthProvider(configs))
    useInstance('IAM.provider.captcha', new CaptchaProvider(configs))
    useInstance('IAM.provider.otp', new OTPProvider(configs))
    useInstance('IAM.provider.rbac', new RBACProvider(configs))
    useInstance('IAM.provider.session', new SessionProvider(configs))
    useInstance('IAM.provider.user', new UserProvider(configs))

    instance.register(rbacPlugin)
    instance.register(router.compile())

    next()
  })
}
