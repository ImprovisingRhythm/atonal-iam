import { transform, Type, useAuthGuards, useRouter } from 'atonal'
import { ObjectId } from 'atonal-db'
import { useConfigs } from '../common/configs'
import { IAM_PERMISSION } from '../common/constants'
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
    req.guardPermission(IAM_PERMISSION.CREATE_USER)

    return userProvider.instance.createUser(req.body)
  },
})

router.get('/', {
  schema: {
    querystring: Type.Object({
      userId: Type.Optional(Type.String({ format: 'object-id' })),
      permission: Type.Optional(Type.String()),
      role: Type.Optional(Type.String()),
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
    req.guardPermission(IAM_PERMISSION.GET_USERS)

    const params = transform(req.query, {
      userId: ObjectId.createFromHexString,
      skip: Number,
      limit: Number,
    })

    return userProvider.instance.getUsers(params, {
      sensitive: req.hasPermission(IAM_PERMISSION.SENSITIVE_ACCESS),
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
    const { user } = req.state
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    req.guardPermission(IAM_PERMISSION.GET_USERS, () => {
      return userId.equals(user._id)
    })

    return userProvider.instance.getUser(userId, {
      sensitive:
        req.hasPermission(IAM_PERMISSION.SENSITIVE_ACCESS) ||
        userId.equals(user._id),
    })
  },
})

router.patch('/:userId/profile', {
  schema: () => ({
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Partial(
      configs.instance.schemas?.user?.profile ?? DefaultUserProfileSchema,
    ),
  }),
  handler: async req => {
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    req.guardPermission(IAM_PERMISSION.UPDATE_USERS, () => {
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
    body: configs.instance.schemas?.user?.profile ?? DefaultUserProfileSchema,
  }),
  handler: async req => {
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    req.guardPermission(IAM_PERMISSION.UPDATE_USERS, () => {
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
      configs.instance.schemas?.user?.meta ?? DefaultUserMetaSchema,
    ),
  }),
  handler: async req => {
    req.guardPermission(IAM_PERMISSION.UPDATE_USERS)

    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.updateMeta(userId, req.body)
  },
})

router.patch('/:userId/national-id', {
  schema: () => ({
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Object({
      idCardType: Type.Optional(Type.String()),
      idCardNumber: Type.Optional(Type.String()),
      name: Type.Optional(Type.String()),
      verified: Type.Optional(Type.Boolean()),
    }),
  }),
  handler: async req => {
    req.guardAllPermissions([
      IAM_PERMISSION.UPDATE_USERS,
      IAM_PERMISSION.SENSITIVE_ACCESS,
    ])

    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.updateNationalId(userId, req.body)
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
    req.guardPermission(IAM_PERMISSION.MANAGE_PERMISSIONS)

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
    req.guardPermission(IAM_PERMISSION.MANAGE_PERMISSIONS)

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
    req.guardPermission(IAM_PERMISSION.BLOCK_USERS)

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
    req.guardPermission(IAM_PERMISSION.BLOCK_USERS)

    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    return userProvider.instance.unblockUser(userId)
  },
})

export default router
