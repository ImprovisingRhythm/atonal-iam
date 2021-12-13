import { Type, useInstance, useRouter } from 'atonal'
import { rateLimit } from '../middlewares/rate-limit.middleware'
import { VerificationService } from '../services/verification.service'

const verificationService = useInstance<VerificationService>(
  'IAM.service.verification',
)

const router = useRouter()

// @ts-ignore
router.post('/send-email-code', {
  middlewares: [
    rateLimit({
      timeWindow: 60000,
      maxRequests: 30,
    }),
  ],
  schema: {
    body: Type.Object({
      email: Type.String({ format: 'email' }),
    }),
  },
  handler: async req => {
    const { email } = req.body

    return verificationService.instance.sendEmailCode(email)
  },
})

router.post('/send-sms-code', {
  middlewares: [
    rateLimit({
      timeWindow: 60000,
      maxRequests: 10,
    }),
  ],
  schema: {
    body: Type.Object({
      phoneNumber: Type.String({ format: 'phone-number' }),
    }),
  },
  handler: async req => {
    const { phoneNumber } = req.body

    return verificationService.instance.sendSmsCode(phoneNumber)
  },
})

router.post('/verify-email-code', {
  middlewares: [
    rateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      email: Type.String({ format: 'email' }),
      code: Type.String(),
    }),
  },
  handler: async req => {
    const { email, code } = req.body

    return verificationService.instance.verifyEmailCode(email, code)
  },
})

router.post('/verify-sms-code', {
  middlewares: [
    rateLimit({
      timeWindow: 10000,
      maxRequests: 20,
    }),
  ],
  schema: {
    body: Type.Object({
      phoneNumber: Type.String({ format: 'phone-number' }),
      code: Type.String(),
    }),
  },
  handler: async req => {
    const { phoneNumber, code } = req.body

    return verificationService.instance.verifySmsCode(phoneNumber, code)
  },
})

export default router
