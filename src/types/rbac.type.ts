export declare type PermissionDef = {
  name: string
  description: string
}

export declare type RoleDef = {
  name: string
  description: string
  permissions: string[]
  extends?: string[]
}
