import { Conflict, ensureValues, NotFound, randomString } from 'atonal'
import { ObjectId } from 'atonal-db'
import { Client, ClientModel, RoleModel, UserModel } from '../models'

export class ClientProvider {
  async createClient(
    name: string,
    {
      callbackUrls,
      description,
    }: {
      callbackUrls?: string[]
      description?: string
    } = {},
  ) {
    try {
      const accessKey = randomString(32, 'all')
      const secretKey = randomString(32, 'all')

      return await ClientModel.create(
        ensureValues({
          name,
          accessKey,
          secretKey,
          callbackUrls,
          description,
        }),
      )
    } catch {
      throw new Conflict('role exists')
    }
  }

  async getClients({
    name,
    sortBy = 'createdAt',
    orderBy = 'asc',
    skip = 0,
    limit = 20,
  }: {
    name?: string
    sortBy?: '_id' | 'createdAt' | 'updatedAt'
    orderBy?: 'asc' | 'desc'
    skip?: number
    limit?: number
  }) {
    const filter = ensureValues({ name })
    const count = await ClientModel.countDocuments(filter)
    const results = await ClientModel.find(filter)
      .sort({ [sortBy]: orderBy === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return { count, results }
  }

  async getClient(clientId: ObjectId) {
    const client = await ClientModel.findById(clientId)

    if (!client) {
      throw new NotFound('client is not found')
    }

    return client
  }

  async updateClient(
    clientId: ObjectId,
    partial: Partial<Pick<Client, 'callbackUrls' | 'description'>>,
  ) {
    const $set = ensureValues(partial)
    const client = await ClientModel.findByIdAndUpdate(
      clientId,
      { $set },
      { returnDocument: 'after' },
    )

    if (!client) {
      throw new NotFound('client is not found')
    }

    return client
  }

  async deleteClient(clientId: ObjectId) {
    await ClientModel.deleteById(clientId)

    const roles = await RoleModel.find(
      { client: clientId },
      { projection: { _id: 1 } },
    ).toArray()

    const roleIds = roles.map(role => role._id)

    await RoleModel.deleteMany({ _id: { $in: roleIds } })
    await UserModel.updateMany(
      { roles: { $in: roleIds } },
      {
        $pull: {
          roles: { $in: roleIds as any[] },
        },
      },
    )

    return { success: true }
  }
}
