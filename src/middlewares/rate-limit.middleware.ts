import { TooManyRequests, useMiddleware } from 'atonal'

interface RateLimitStore {
  [id: string]: {
    [action: string]: [number, number?] // [currentRequests, expireAt]
  }
}

const store: RateLimitStore = {}

export interface RateLimitOptions {
  timeWindow: number
  maxRequests: number
}

export const rateLimit = ({ timeWindow, maxRequests }: RateLimitOptions) => {
  return useMiddleware(async req => {
    const { routerPath, routerMethod } = req
    const { user } = req.state

    const key = user?._id.toHexString() ?? req.ip
    const action = `${routerMethod} ${routerPath}`
    const now = Date.now()

    store[key] ??= {}
    store[key][action] ??= [0]

    const [currentRequests, expireAt] = store[key][action]

    if (currentRequests >= maxRequests) throw new TooManyRequests()
    if (!expireAt || expireAt < now) {
      store[key][action][1] = now + timeWindow
    }
  })
}
