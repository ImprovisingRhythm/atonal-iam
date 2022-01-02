import {
  transform,
  Type,
  useAuthGuards,
  useRouter,
  useStatusCode,
} from 'atonal'
import { IAM_PERMISSION } from '../common/constants'
import { keyGuard, userGuard } from '../middlewares'
import { useRoleProvider } from '../providers'

const roleProvider = useRoleProvider()

const router = useRouter({
  middlewares: [
    useAuthGuards({
      guards: [keyGuard, userGuard],
    }),
    async req => req.guardUserPermission(IAM_PERMISSION.ADMIN),
  ],
})

router.post('/', {
  middlewares: [useStatusCode(201)],
  schema: {
    body: Type.Object({
      name: Type.String(),
      permissions: Type.Array(Type.String()),
      alias: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
    }),
  },
  handler: async req => {
    const { name, permissions, alias, description } = req.body

    return roleProvider.instance.createRole(name, permissions, {
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

    return roleProvider.instance.getRoles({
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

    return roleProvider.instance.getRole(name)
  },
})

router.patch('/:name', {
  schema: {
    params: Type.Object({
      name: Type.String(),
    }),
    body: Type.Object(
      {
        permissions: Type.Optional(Type.Array(Type.String())),
        alias: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  },
  handler: async req => {
    const { name } = req.params

    return roleProvider.instance.updateRole(name, req.body)
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

    return roleProvider.instance.deleteRole(name)
  },
})

export default router
