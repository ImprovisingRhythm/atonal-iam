export declare interface PermissionDef {
  name: string
  description: string
}

export declare interface RoleDef {
  name: string
  description: string
  permissions: string[]
  extends?: string[]
}
