import { useKV, useMultiModel } from 'atonal-db'

export const SessionModel = useMultiModel({
  object: useKV({
    name: 'session:object',
    type: 'record',
  }),
  sid: useKV({
    name: 'session:sid',
    type: 'string',
  }),
})
