import 'atonal'

declare module 'fastify' {
  interface FastifyRequest {
    hasPermission(permission: string | string[]): boolean
    hasAllPermissions(permission: string[]): boolean
    guardPermission(permission: string | string[], except?: () => boolean): void
    guardAllPermissions(permissions: string[], except?: () => boolean): void
  }
}
