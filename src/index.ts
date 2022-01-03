import { useInstance, usePlugin } from 'atonal'
import { useDB } from 'atonal-db'
import { IAMConfigs } from './common/configs'
import { CaptchaModel, SessionModel, UserModel } from './models'
import { userPermissionPlugin } from './plugins'
import {
  AuthProvider,
  CaptchaProvider,
  PermissionProvider,
  SessionProvider,
  UserProvider,
} from './providers'
import router from './routers'

export * from './types'
export * from './common/configs'
export * from './common/constants'
export * from './middlewares'
export * from './models'
export * from './providers'
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
    useInstance('IAM.provider.permission', new PermissionProvider(configs))
    useInstance('IAM.provider.session', new SessionProvider(configs))
    useInstance('IAM.provider.user', new UserProvider())

    instance.register(userPermissionPlugin)
    instance.register(router.compile())

    next()
  })
}
