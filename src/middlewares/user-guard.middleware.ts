import { Unauthorized, useMiddleware } from 'atonal'
import { useAuthProvider } from '../providers'

const authProvider = useAuthProvider()

export const userGuard = useMiddleware(async req => {
  const authorization = req.headers.authorization
  const [method, token] = (authorization ?? '').split(' ')

  if (method === 'Bearer' && token) {
    const { sid, user } = await authProvider.instance.getSessionByToken(token)

    req.state.clientId = user._id.toHexString()
    req.state.sid = sid
    req.state.user = user
  } else {
    throw new Unauthorized('invalid authorization header')
  }
})
