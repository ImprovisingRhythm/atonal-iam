import { useKV, useMultiModel } from 'atonal-db'

export const SessionModel = useMultiModel({
  user: useKV({
    name: 'session:user',
    type: 'record',
  }),
  sid: useKV({
    name: 'session:sid',
    type: 'string',
  }),
})
