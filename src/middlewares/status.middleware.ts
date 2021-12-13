import { useMiddleware } from 'atonal'

export const statusCode = (statusCode: number) => {
  return useMiddleware(async (_, res) => {
    res.code(statusCode)
  })
}
