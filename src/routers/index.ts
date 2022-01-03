import { useRouter } from 'atonal'
import authRouter from './auth.router'
import captchaRouter from './captcha.router'
import permissionRouter from './permission.router'
import sessionRouter from './session.router'
import userRouter from './user.router'

const router = useRouter()

router.use('/auth', authRouter)
router.use('/captcha', captchaRouter)
router.use('/permissions', permissionRouter)
router.use('/session', sessionRouter)
router.use('/users', userRouter)

export default router
