import 'atonal'

declare module 'fastify' {
  interface FastifyRequest {
    guardUserPermission(
      this: FastifyRequest,
      permissions: string | string[],
      except?: () => boolean,
      callback?: (userPermissions: string[]) => void,
    ): string[]
  }
}
