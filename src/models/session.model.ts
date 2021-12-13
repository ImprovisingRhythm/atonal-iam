import { useKV, useMap, useMultiModel } from 'atonal-db'

export const SessionModel = useMultiModel({
  user: useMap({
    name: 'session:user',
    type: 'record',
  }),
  sid: useKV({
    name: 'session:sid',
    type: 'string',
  }),
})
