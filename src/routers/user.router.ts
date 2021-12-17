import { Forbidden, transform, Type, useInstance, useRouter } from 'atonal'
import { ObjectId } from 'atonal-db'
import { IAMConfigs } from '../common/configs'
import { requireAuth } from '../middlewares/auth.middleware'
import { rateLimit } from '../middlewares/rate-limit.middleware'
import { UserProvider } from '../providers/user.provider'
import { UserService } from '../services/user.service'

const configs = useInstance<IAMConfigs>('IAM.configs')
const userProvider = useInstance<UserProvider>('IAM.provider.user')
const userService = useInstance<UserService>('IAM.service.user')

const router = useRouter({
  middlewares: [
    requireAuth(),
    rateLimit({
      timeWindow: 1000,
      maxRequests: 20,
    }),
  ],
})

router.get('/', {
  schema: {
    querystring: Type.Object({
      userId: Type.Optional(Type.String({ format: 'object-id' })),
      email: Type.Optional(Type.String({ format: 'email' })),
      phoneNumber: Type.Optional(Type.String({ format: 'phone-number' })),
      sortBy: Type.Optional(Type.Literal(['_id', 'createdAt', 'updatedAt'])),
      orderBy: Type.Optional(Type.Literal(['asc', 'desc'])),
      skip: Type.Optional(Type.String({ format: 'integer' })),
      limit: Type.Optional(Type.String({ format: 'integer' })),
    }),
  },
  handler: async req => {
    const { authSource, user } = req.state
    const { userId, email, phoneNumber, sortBy, orderBy, skip, limit } =
      transform(req.query, {
        userId: ObjectId.createFromHexString,
        skip: Number,
        limit: Number,
      })

    if (authSource === 'user' && !user.permissions.includes('getUsers')) {
      throw new Forbidden()
    }

    return userProvider.instance.getUsers({
      userId,
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
    const { authSource, user } = req.state
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    if (
      authSource === 'user' &&
      !user.permissions.includes('getUsers') &&
      !user._id.equals(userId)
    ) {
      throw new Forbidden()
    }

    return userProvider.instance.getUser(userId)
  },
})

router.patch('/:userId/profile', {
  schema: () => ({
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Partial(configs.instance.schemas.userProfile),
  }),
  handler: async req => {
    const { authSource, user } = req.state
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    if (
      authSource === 'user' &&
      !user.permissions.includes('updateUsers') &&
      !user._id.equals(userId)
    ) {
      throw new Forbidden()
    }

    return userProvider.instance.updateProfile(userId, req.body)
  },
})

router.put('/:userId/profile', {
  schema: () => ({
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: configs.instance.schemas.userProfile,
  }),
  handler: async req => {
    const { authSource, user } = req.state
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    if (
      authSource === 'user' &&
      !user.permissions.includes('updateUsers') &&
      !user._id.equals(userId)
    ) {
      throw new Forbidden()
    }

    return userProvider.instance.updateFullProfile(userId, req.body)
  },
})

router.put('/:userId/roles', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
    body: Type.Object({
      roleIds: Type.Array(Type.String({ format: 'object-id' })),
    }),
  },
  handler: async req => {
    const { authSource, user } = req.state
    const { userId, roleIds } = transform(
      { ...req.params, ...req.body },
      {
        userId: ObjectId.createFromHexString,
        roleIds: ids => ids.map(ObjectId.createFromHexString),
      },
    )

    if (
      authSource === 'user' &&
      !user.permissions.includes('setUserPermissions')
    ) {
      throw new Forbidden()
    }

    return userService.instance.updateRoles(userId, roleIds)
  },
})

router.post('/:userId/block', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
  },
  handler: async req => {
    const { authSource, user } = req.state
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    if (authSource === 'user' && !user.permissions.includes('blockUser')) {
      throw new Forbidden()
    }

    return userService.instance.blockUser(userId)
  },
})

router.post('/:userId/unblock', {
  schema: {
    params: Type.Object({
      userId: Type.String({ format: 'object-id' }),
    }),
  },
  handler: async req => {
    const { authSource, user } = req.state
    const { userId } = transform(req.params, {
      userId: ObjectId.createFromHexString,
    })

    if (authSource === 'user' && !user.permissions.includes('blockUser')) {
      throw new Forbidden()
    }

    return userService.instance.unblockUser(userId)
  },
})

export default router
