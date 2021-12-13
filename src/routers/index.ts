import { useRouter } from 'atonal'
import clientRouter from './client'
import authRouter from './auth.router'
import integratedRouter from './integrated.router'
import roleRouter from './role.router'
import userRouter from './user.router'
import verificationRouter from './verification.router'

const router = useRouter()

router.use('/client', clientRouter)
router.use('/auth', authRouter)
router.use('/integrated', integratedRouter)
router.use('/roles', roleRouter)
router.use('/users', userRouter)
router.use('/verification', verificationRouter)

export default router
