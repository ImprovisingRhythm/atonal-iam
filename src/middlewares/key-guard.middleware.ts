import { Unauthorized, useMiddleware } from 'atonal'
import { useConfigs } from '../common/configs'

const configs = useConfigs()

export const keyGuard = useMiddleware(async req => {
  const accessKey = req.headers['x-access-key']
  const secretKey = req.headers['x-secret-key']

  if (
    accessKey !== configs.instance.auth.keys.accessKey ||
    secretKey !== configs.instance.auth.keys.secretKey
  ) {
    throw new Unauthorized('invalid accessKey or secretKey')
  }

  req.state.bypassRateLimit = true
  req.state.authMethod = 'key'
})
