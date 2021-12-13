import { BadRequest, Unauthorized, useInstance, useMiddleware } from 'atonal'
import { IAMConfigs } from '../common/configs'
import { AuthService } from '../services/auth.service'

const configs = useInstance<IAMConfigs>('IAM.configs')
const authService = useInstance<AuthService>('IAM.service.auth')

export type AuthGuardMode = 'all' | 'user-only' | 'client-only' | 'api-only'

export interface AuthGuardOptions {
  mode?: AuthGuardMode
  throwError?: boolean
}

export const requireAuth = ({
  mode = 'all',
  throwError = true,
}: AuthGuardOptions = {}) => {
  return useMiddleware(async req => {
    try {
      const payload = req.cookies['atonal_sid'] as string | undefined
      const sid = payload
        ? configs.instance.auth.cookie.signed
          ? req.unsignCookie(payload).value
          : payload
        : null

      if (sid) {
        req.state.sid = sid
        req.state.user = await authService.instance.getSessionFromSID(sid)
        return
      }

      if (
        mode !== 'user-only' &&
        req.headers['x-api-token'] === configs.instance.auth.apiToken
      ) {
        req.state.withApiToken = true
        return
      }

      if (mode === 'api-only') {
        throw new Unauthorized('only api token allowed')
      }

      if (!req.headers.authorization) {
        throw new Unauthorized('missing authorization')
      }

      const [method, token] = req.headers.authorization.split(' ')

      if (method !== 'Bearer' || !token) {
        throw new BadRequest('unrecognized token format')
      }

      req.state.user = await authService.instance.getSessionFromToken(token)
    } catch (error) {
      if (throwError) {
        throw error
      }
    }
  })
}
