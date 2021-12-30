import 'atonal'

declare module 'fastify' {
  interface FastifyRequest {
    guardUserPermission(
      permissions: string | string[],
      except?: () => boolean,
    ): void

    hasUserPermission(permissions: string | string[]): boolean
  }
}
