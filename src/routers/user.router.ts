import { makeArray, transform, Type, useAuthGuards, useRouter } from 'atonal'
import { ObjectId } from 'atonal-db'
import { useConfigs } from '../common/configs'
import { keyGuard, userGuard } from '../middlewares'
import { useUserProvider } from '../providers'

const configs = useConfigs()
const userProvider = useUserProvider()

const DefaultUserProfileSchema = Type.Object({})
const DefaultUserMetaSchema = Type.Object({})

const router = useRouter({
  middlewares: [
    useAuthGuards({
      guards: [keyGuard, userGuard],
    }),
  ],
})

router.post('/', {
  schema: {
    body: Type.Object({
      username: Type.Optional(Type.String()),
      email: Type.Optional(Type.String({ format: 'email' })),
      emailVerified: Type.Optional(Type.Boolean()),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      phoneNumberVerified: Type.Optional(Type.Boolean()),
      password: Type.Optional(Type.String({ format: 'phone-number' })),
    }),
  },
  handler: async req => {
    req.guardUserPermission(['iam.root', 'iam.createUser'])

    return userProvider.instance.createUser(req.body)
  },
})

router.get('/', {
  schema: {
    querystring: Type.Object({
      userId: Type.Optional(Type.String({ format: 'object-id' })),
      userIds: Type.Optional(
        Type.ArrayOr(Type.String({ format: 'object-id' })),
      ),
      role: Type.Optional(Type.String()),
      permission: Type.Optional(Type.String()),
      username: Type.Optional(Type.String()),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      sortBy: Type.Optional(Type.Literal(['_id', 'createdAt', 'updatedAt'])),
      orderBy: Type.Optional(Type.Literal(['asc', 'desc'])),
      skip: Type.Optional(Type.String({ format: 'integer' })),
      limit: Type.Optional(Type.String({ format: 'integer' })),
    }),
  },
  handler: async req => {
    req.guardUserPermission(['iam.root', 'iam.getUsers'])

    const {
      userId,
      userIds,
      role,
      permission,
      username,
      email,
      phoneNumber,
      sortBy,
      orderBy,
      skip,
      limit,
    } = transform(req.query, {
      userId: ObjectId.createFromHexString,
      userIds: x => makeArray(x).map(ObjectId.createFromHexString),
      skip: Number,
      limit: Number,
    })

    return userProvider.instance.getUsers({
      userId,
      userIds,
      role,
      permission,
      username,
      email,
      phoneNumber,
      sortBy,
      orderBy,
      skip,
      limit,
    })
  },
})

router.get('/:userId', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
  },
  handler: async req => {
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    req.guardUserPermission(['iam.root', 'iam.getUsers'], () => {
      return userId.equals(req.state.user._id)
    })

    return userProvider.instance.getUser(userId)
  },
})

router.patch('/:userId/profile', {
  schema: () => ({
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Partial(
      configs.instance.schemas.user?.profile ?? DefaultUserProfileSchema,
    ),
  }),
  handler: async req => {
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    req.guardUserPermission(['iam.root', 'iam.updateUsers'], () => {
      return userId.equals(req.state.user._id)
    })

    return userProvider.instance.updateProfile(userId, req.body)
  },
})

router.put('/:userId/profile', {
  schema: () => ({
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: configs.instance.schemas.user?.profile ?? DefaultUserProfileSchema,
  }),
  handler: async req => {
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    req.guardUserPermission(['iam.root', 'iam.updateUsers'], () => {
      return userId.equals(req.state.user._id)
    })

    return userProvider.instance.updateFullProfile(userId, req.body)
  },
})

router.patch('/:userId/meta', {
  schema: () => ({
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Partial(
      configs.instance.schemas.user?.meta ?? DefaultUserMetaSchema,
    ),
  }),
  handler: async req => {
    req.guardUserPermission(['iam.root', 'iam.updateUsers'])

    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.updateMeta(userId, req.body)
  },
})

router.put('/:userId/permissions', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Object({
      permissions: Type.Array(Type.String()),
    }),
  },
  handler: async req => {
    req.guardUserPermission('iam.root')

    const { permissions } = req.body
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.updatePermissions(userId, permissions)
  },
})

router.put('/:userId/roles', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Object({
      roles: Type.Array(Type.String()),
    }),
  },
  handler: async req => {
    req.guardUserPermission('iam.root')

    const { roles } = req.body
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.updateRoles(userId, roles)
  },
})

router.post('/:userId/block', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
  },
  handler: async req => {
    req.guardUserPermission('iam.root')

    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.blockUser(userId)
  },
})

router.post('/:userId/unblock', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
  },
  handler: async req => {
    req.guardUserPermission('iam.root')

    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.unblockUser(userId)
  },
})

export default router
