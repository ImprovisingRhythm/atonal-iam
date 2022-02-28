import { transform, Type, useAuthGuards, useRouter } from 'atonal'
import { ObjectId } from 'atonal-db'
import { useConfigs } from '../common/configs'
import { IAM_PERMISSION } from '../common/constants'
import { keyGuard, userGuard } from '../middlewares'
import { useRelationProvider } from '../providers'

const configs = useConfigs()
const relationProvider = useRelationProvider()

const DefaultRelationMetaSchema = Type.Object({})

const router = useRouter({
  middlewares: [
    useAuthGuards({
      guards: [keyGuard, userGuard],
    }),
  ],
})

router.post('/', {
  schema: () => ({
    body: Type.Object({
      fromUserId: Type.String({ format: 'object-id' }),
      toUserId: Type.String({ format: 'object-id' }),
      connected: Type.Optional(Type.String({ format: 'boolean' })),
      meta: Type.Optional(
        Type.Partial(
          configs.instance.schemas?.relation?.meta ?? DefaultRelationMetaSchema,
        ),
      ),
    }),
  }),
  handler: async req => {
    req.guardPermission(IAM_PERMISSION.MANAGE_RELATIONS)

    const { fromUserId, toUserId, meta } = transform(req.body, {
      fromUserId: ObjectId.createFromHexString,
      toUserId: ObjectId.createFromHexString,
    })

    return relationProvider.instance.createRelation(fromUserId, toUserId, {
      meta,
    })
  },
})

router.get('/', {
  schema: {
    querystring: Type.Object({
      entire: Type.Optional(Type.String({ format: 'boolean' })),
      fromUserId: Type.Optional(Type.String({ format: 'object-id' })),
      toUserId: Type.Optional(Type.String({ format: 'object-id' })),
      connected: Type.Optional(Type.String({ format: 'boolean' })),
      sortBy: Type.Optional(Type.Literal(['_id', 'createdAt', 'updatedAt'])),
      orderBy: Type.Optional(Type.Literal(['asc', 'desc'])),
      skip: Type.Optional(Type.String({ format: 'integer' })),
      limit: Type.Optional(Type.String({ format: 'integer' })),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { entire, ...filters } = transform(req.query, {
      entire: Boolean,
      fromUserId: ObjectId.createFromHexString,
      toUserId: ObjectId.createFromHexString,
      connected: Boolean,
      skip: Number,
      limit: Number,
    })

    if (!entire || !req.hasPermission(IAM_PERMISSION.MANAGE_RELATIONS)) {
      Object.assign(filters, { fromUserId: user._id })
    }

    return relationProvider.instance.getRelations(filters, { populate: true })
  },
})

router.get('/count', {
  schema: {
    querystring: Type.Object({
      entire: Type.Optional(Type.String({ format: 'boolean' })),
      fromUserId: Type.Optional(Type.String({ format: 'object-id' })),
      toUserId: Type.Optional(Type.String({ format: 'object-id' })),
      connected: Type.Optional(Type.String({ format: 'boolean' })),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { entire, ...filters } = transform(req.query, {
      entire: Boolean,
      fromUserId: ObjectId.createFromHexString,
      toUserId: ObjectId.createFromHexString,
      connected: Boolean,
    })

    if (!entire || !req.hasPermission(IAM_PERMISSION.MANAGE_RELATIONS)) {
      Object.assign(filters, { opUserId: user._id })
    }

    return relationProvider.instance.countRelations(filters)
  },
})

router.patch('/:relationId/meta', {
  schema: () => ({
    params: Type.Object({
      relationId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Partial(
      configs.instance.schemas?.relation?.meta ?? DefaultRelationMetaSchema,
    ),
  }),
  handler: async req => {
    req.guardPermission(IAM_PERMISSION.MANAGE_RELATIONS)

    const { relationId } = transform(req.params, {
      relationId: ObjectId.createFromHexString,
    })

    return relationProvider.instance.updateMeta(relationId, req.body)
  },
})

export default router
