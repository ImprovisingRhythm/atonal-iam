import { useRouter } from 'atonal'
import authRouter from './auth.router'
import captchaRouter from './captcha.router'
import otpRouter from './otp.router'
import privacyRouter from './privacy.router'
import rbacRouter from './rbac.router'
import sessionRouter from './session.router'
import userRouter from './user.router'

const router = useRouter()

router.use('/auth', authRouter)
router.use('/captcha', captchaRouter)
router.use('/otp', otpRouter)
router.use('/privacy', privacyRouter)
router.use('/rbac', rbacRouter)
router.use('/session', sessionRouter)
router.use('/users', userRouter)

export default router
