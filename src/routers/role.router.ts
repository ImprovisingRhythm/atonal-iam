import { Forbidden, transform, Type, useInstance, useRouter } from 'atonal'
import { ObjectId } from 'atonal-db'
import { requireAuth } from '../middlewares/auth.middleware'
import { rateLimit } from '../middlewares/rate-limit.middleware'
import { statusCode } from '../middlewares/status.middleware'
import { RoleProvider } from '../providers/role.provider'

const roleProvider = useInstance<RoleProvider>('IAM.provider.role')

const router = useRouter({
  middlewares: [
    requireAuth(),
    rateLimit({
      timeWindow: 1000,
      maxRequests: 20,
    }),
  ],
})

// @ts-ignore
router.post('/', {
  middlewares: [statusCode(201)],
  schema: {
    body: Type.Object({
      name: Type.String(),
      permissions: Type.Array(Type.String()),
      alias: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
    }),
  },
  handler: async req => {
    const { user, withApiToken } = req.state
    const { name, permissions, alias, description } = req.body

    if (!withApiToken && !user.permissions.includes('createRole')) {
      throw new Forbidden()
    }

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
    const { user, withApiToken } = req.state
    const { name, sortBy, orderBy, skip, limit } = transform(req.query, {
      skip: Number,
      limit: Number,
    })

    if (!withApiToken && !user.permissions.includes('getRoles')) {
      throw new Forbidden()
    }

    return roleProvider.instance.getRoles({
      name,
      sortBy,
      orderBy,
      skip,
      limit,
    })
  },
})

router.get('/:roleId', {
  schema: {
    params: Type.Object({
      roleId: Type.String({ format: 'object-id' }),
    }),
  },
  handler: async req => {
    const { user, withApiToken } = req.state
    const { roleId } = transform(req.params, {
      roleId: ObjectId.createFromHexString,
    })

    if (!withApiToken && !user.permissions.includes('getRoles')) {
      throw new Forbidden()
    }

    return roleProvider.instance.getRole(roleId)
  },
})

router.patch('/:roleId', {
  schema: {
    params: Type.Object({
      roleId: Type.String({ format: 'object-id' }),
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
    const { user, withApiToken } = req.state
    const { roleId } = transform(req.params, {
      roleId: ObjectId.createFromHexString,
    })

    if (!!withApiToken && !user.permissions.includes('updateRoles')) {
      throw new Forbidden()
    }

    return roleProvider.instance.updateRole(roleId, req.body)
  },
})

export default router
