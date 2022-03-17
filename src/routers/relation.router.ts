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
    const { user } = req.state
    const { fromUserId, toUserId, meta } = transform(req.body, {
      fromUserId: ObjectId.createFromHexString,
      toUserId: ObjectId.createFromHexString,
    })

    if (fromUserId.equals(user._id)) {
      req.guardPermission(IAM_PERMISSION.MANAGE_RELATIONS)
    }

    return relationProvider.instance.ensureRelation(fromUserId, toUserId, {
      meta,
    })
  },
})

router.get('/', {
  schema: {
    querystring: Type.Object({
      fromUserId: Type.Optional(Type.String({ format: 'object-id' })),
      toUserId: Type.Optional(Type.String({ format: 'object-id' })),
      connected: Type.Optional(Type.String({ format: 'boolean' })),
      score: Type.Optional(Type.String({ format: 'number' })),
      customFilters: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      populate: Type.Optional(Type.String({ format: 'boolean' })),
      sortBy: Type.Optional(
        Type.Literal(['_id', 'createdAt', 'updatedAt', 'score']),
      ),
      orderBy: Type.Optional(Type.Literal(['asc', 'desc'])),
      skip: Type.Optional(Type.String({ format: 'integer' })),
      limit: Type.Optional(Type.String({ format: 'integer' })),
    }),
  },
  handler: async req => {
    const { user } = req.state
    const { populate, ...filters } = transform(req.query, {
      fromUserId: ObjectId.createFromHexString,
      toUserId: ObjectId.createFromHexString,
      connected: Boolean,
      score: Number,
      populate: Boolean,
      skip: Number,
      limit: Number,
    })

    if (!filters.fromUserId || filters.fromUserId.equals(user._id)) {
      req.guardPermission(IAM_PERMISSION.MANAGE_RELATIONS)
    }

    return relationProvider.instance.getRelations(filters, { populate })
  },
})

router.get('/count', {
  schema: {
    querystring: Type.Object({
      fromUserId: Type.Optional(Type.String({ format: 'object-id' })),
      toUserId: Type.Optional(Type.String({ format: 'object-id' })),
      connected: Type.Optional(Type.String({ format: 'boolean' })),
      score: Type.Optional(Type.String({ format: 'number' })),
      customFilters: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    }),
  },
  handler: async req => {
    const { user } = req.state

    const filters = transform(req.query, {
      fromUserId: ObjectId.createFromHexString,
      toUserId: ObjectId.createFromHexString,
      connected: Boolean,
      score: Number,
    })

    if (!filters.fromUserId || filters.fromUserId.equals(user._id)) {
      req.guardPermission(IAM_PERMISSION.MANAGE_RELATIONS)
    }

    return relationProvider.instance.countRelations(filters)
  },
})

router.put('/:relationId/score', {
  schema: () => ({
    params: Type.Object({
      relationId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Object({
      score: Type.Number(),
    }),
  }),
  handler: async req => {
    req.guardPermission(IAM_PERMISSION.MANAGE_RELATIONS)

    const { score } = req.body
    const { relationId } = transform(req.params, {
      relationId: ObjectId.createFromHexString,
    })

    return relationProvider.instance.updateScoreById(relationId, score)
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

    return relationProvider.instance.updateMetaById(relationId, req.body)
  },
})

export default router
