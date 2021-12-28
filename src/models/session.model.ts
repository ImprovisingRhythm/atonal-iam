import { useKV, useMultiModel } from 'atonal-db'

export const SessionModel = useMultiModel({
  store: useKV({
    name: 'session:store',
    type: 'record',
  }),
  sid: useKV({
    name: 'session:sid',
    type: 'string',
  }),
})
