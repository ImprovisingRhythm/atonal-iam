import { BadRequest, Unauthorized, useInstance, useMiddleware } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { AuthService } from '../services/auth.service'
import { AuthSource } from '../types/auth'

const configs = useInstance<IAMConfigs>('IAM.configs')
const authService = useInstance<AuthService>('IAM.service.auth')

export interface AuthGuardOptions {
  sources?: AuthSource[]
  throwError?: boolean
}

export const requireAuth = ({
  sources = ['user', 'directAccess'],
  throwError = true,
}: AuthGuardOptions = {}) => {
  return useMiddleware(async req => {
    const { directAccessToken } = configs.instance.auth
    const { key = 'atonal_sid', signed } = configs.instance.auth.session.cookie

    try {
      const payload = req.cookies[key] as string | undefined
      const sid = payload
        ? signed
          ? req.unsignCookie(payload).value
          : payload
        : null

      if (sid) {
        req.state.sid = sid
        req.state.user = await authService.instance.getSessionBySID(sid)
        return
      }

      if (
        sources.includes('directAccess') &&
        req.headers['x-direct-access-token'] === directAccessToken
      ) {
        req.state.authSource = 'directAccess'
        return
      }

      if (!req.headers.authorization) {
        throw new Unauthorized('missing authorization')
      }

      const [method, token] = req.headers.authorization.split(' ')

      if (method !== 'Bearer' || !token) {
        throw new BadRequest('unrecognized token format')
      }

      req.state.user = await authService.instance.getSessionByToken(token)
    } catch (error) {
      if (throwError) {
        throw error
      }
    }
  })
}
