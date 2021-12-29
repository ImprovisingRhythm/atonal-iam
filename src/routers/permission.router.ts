import {
  transform,
  Type,
  useAuthGuards,
  useRouter,
  useStatusCode,
} from 'atonal'
import { IAM_PERMISSION } from '../common/constants'
import { keyGuard, userGuard } from '../middlewares'
import { usePermissionProvider } from '../providers'

const permissionProvider = usePermissionProvider()

const router = useRouter({
  middlewares: [
    useAuthGuards({
      guards: [keyGuard, userGuard],
    }),
    async req => req.guardUserPermission(IAM_PERMISSION.ROOT),
  ],
})

router.post('/', {
  middlewares: [useStatusCode(201)],
  schema: {
    body: Type.Object({
      name: Type.String(),
      alias: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
    }),
  },
  handler: async req => {
    const { name, alias, description } = req.body

    return permissionProvider.instance.createPermission(name, {
      alias,
      description,
    })
  },
})

router.get('/', {
  schema: {
    querystring: Type.Object({
      name: Type.Optional(Type.String()),
      sortBy: Type.Optional(Type.Literal(['_id', 'createdAt', 'updatedAt'])),
      orderBy: Type.Optional(Type.Literal(['asc', 'desc'])),
      skip: Type.Optional(Type.String({ format: 'integer' })),
      limit: Type.Optional(Type.String({ format: 'integer' })),
    }),
  },
  handler: async req => {
    const { name, sortBy, orderBy, skip, limit } = transform(req.query, {
      skip: Number,
      limit: Number,
    })

    return permissionProvider.instance.getPermissions({
      name,
      sortBy,
      orderBy,
      skip,
      limit,
    })
  },
})

router.get('/:name', {
  schema: {
    params: Type.Object({
      name: Type.String(),
    }),
  },
  handler: async req => {
    const { name } = req.params

    return permissionProvider.instance.getPermission(name)
  },
})

router.patch('/:name', {
  schema: {
    params: Type.Object({
      name: Type.String(),
    }),
    body: Type.Object(
      {
        alias: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  },
  handler: async req => {
    const { name } = req.params

    return permissionProvider.instance.updatePermission(name, req.body)
  },
})

router.delete('/:name', {
  schema: {
    params: Type.Object({
      name: Type.String(),
    }),
  },
  handler: async req => {
    const { name } = req.params

    return permissionProvider.instance.deletePermission(name)
  },
})

export default router
