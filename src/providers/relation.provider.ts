import assert from 'assert'
import { BadRequest, ensureValues, NotFound, useInstance } from 'atonal'
import { ObjectId, usePopulateItem } from 'atonal-db'
import { chain } from 'lodash'
import { IAMConfigs } from '../common/configs'
import { Relation, RelationMeta, RelationModel, UserModel } from '../models'

export type RelationTarget =
  | ObjectId
  | {
      fromUserId: ObjectId
      toUserId: ObjectId
    }

export class RelationProvider {
  constructor(private configs: IAMConfigs) {}

  async ensureRelation(
    fromUserId: ObjectId,
    toUserId: ObjectId,
    { meta }: { meta?: RelationMeta } = {},
  ) {
    if (fromUserId.equals(toUserId)) {
      throw new BadRequest('self-relation is not allowed')
    }

    const relation = await RelationModel.findOne({
      from: fromUserId,
      to: toUserId,
    })

    if (!relation) {
      return RelationModel.create({
        from: fromUserId,
        to: toUserId,
        meta,
      })
    }

    return relation
  }

  async countRelations({
    fromUserId,
    toUserId,
    connected,
    score,
    customFilters,
  }: {
    fromUserId?: ObjectId
    toUserId?: ObjectId
    connected?: boolean
    score?: number
    customFilters?: Record<string, unknown>
  }) {
    const count = await RelationModel.countDocuments(
      ensureValues({
        from: fromUserId,
        to: toUserId,
        connected,
        ...(score && { score: { $gte: score } }),
        ...customFilters,
      }),
    )

    return { count }
  }

  async getRelations(
    {
      fromUserId,
      toUserId,
      connected,
      score,
      customFilters,
      sortBy = 'createdAt',
      orderBy = 'asc',
      skip = 0,
      limit = 20,
    }: {
      fromUserId?: ObjectId
      toUserId?: ObjectId
      connected?: boolean
      score?: number
      customFilters?: Record<string, unknown>
      sortBy?: '_id' | 'createdAt' | 'updatedAt' | 'score'
      orderBy?: 'asc' | 'desc'
      skip?: number
      limit?: number
    },
    { populate = false }: { populate?: boolean } = {},
  ) {
    const relations = await RelationModel.find(
      ensureValues({
        from: fromUserId,
        to: toUserId,
        connected,
        ...(score && { score: { $gte: score } }),
        ...customFilters,
      }),
    )
      .sort({ [sortBy]: orderBy === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    if (populate) {
      await this.populateRelations(relations)
    }

    return relations
  }

  async addConnection(userIds: ObjectId[]) {
    if (userIds.length !== 2) {
      throw new BadRequest('can only pass 2 users')
    }

    if (userIds[0].equals(userIds[1])) {
      throw new BadRequest('self-relation is not allowed')
    }

    const relations = await Promise.all([
      RelationModel.findOneAndUpdate(
        {
          from: userIds[0],
          to: userIds[1],
        },
        { $set: { connected: true } },
        { upsert: true },
      ),
      RelationModel.findOneAndUpdate(
        {
          from: userIds[1],
          to: userIds[0],
        },
        { $set: { connected: true } },
        { upsert: true },
      ),
    ])

    assert(relations[0])
    assert(relations[1])

    await this.configs.hooks?.onRelationUpdated?.(relations[0])
    await this.configs.hooks?.onRelationUpdated?.(relations[1])

    return { success: true }
  }

  async removeConnection(userIds: ObjectId[]) {
    if (userIds.length !== 2) {
      throw new BadRequest('can only pass 2 users')
    }

    if (userIds[0].equals(userIds[1])) {
      throw new BadRequest('self-relation is not allowed')
    }

    const relations = await Promise.all([
      RelationModel.findOneAndUpdate(
        {
          from: userIds[0],
          to: userIds[1],
        },
        { $unset: { connected: true } },
        { upsert: true },
      ),
      RelationModel.findOneAndUpdate(
        {
          from: userIds[1],
          to: userIds[0],
        },
        { $unset: { connected: true } },
        { upsert: true },
      ),
    ])

    assert(relations[0])
    assert(relations[1])

    await this.configs.hooks?.onRelationUpdated?.(relations[0])
    await this.configs.hooks?.onRelationUpdated?.(relations[1])

    return { success: true }
  }

  async hasConnection(userIds: ObjectId[]) {
    if (userIds.length !== 2) {
      throw new BadRequest('can only pass 2 users')
    }

    if (userIds[0].equals(userIds[1])) {
      throw new BadRequest('self-relation is not allowed')
    }

    return RelationModel.exists({
      from: userIds[0],
      to: userIds[1],
      connected: true,
    })
  }

  async addScore(fromUserId: ObjectId, toUserId: ObjectId, amount: number) {
    if (fromUserId.equals(toUserId)) {
      throw new BadRequest('self-relation is not allowed')
    }

    const relation = await RelationModel.findOneAndUpdate(
      {
        from: fromUserId,
        to: toUserId,
      },
      {
        $inc: {
          score: amount,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    )

    assert(relation)

    await this.configs.hooks?.onRelationUpdated?.(relation)

    return relation
  }

  async updateScoreById(relationId: ObjectId, score: number) {
    const relation = await RelationModel.findByIdAndUpdate(
      relationId,
      { $set: { score } },
      { returnDocument: 'after' },
    )

    if (!relation) {
      throw new NotFound('relation is not found')
    }

    await this.configs.hooks?.onRelationUpdated?.(relation)

    return { score }
  }

  async updateScoreByTarget(
    fromUserId: ObjectId,
    toUserId: ObjectId,
    score: number,
  ) {
    if (fromUserId.equals(toUserId)) {
      throw new BadRequest('self-relation is not allowed')
    }

    const relation = await RelationModel.findOneAndUpdate(
      {
        from: fromUserId,
        to: toUserId,
      },
      { $set: { score } },
      {
        upsert: true,
        returnDocument: 'after',
      },
    )

    assert(relation)

    await this.configs.hooks?.onRelationUpdated?.(relation)

    return { score }
  }

  async updateMetaById(relationId: ObjectId, partial: Partial<RelationMeta>) {
    const $set = ensureValues(
      chain(partial)
        .mapKeys((_, key) => `meta.${key}`)
        .value(),
    )

    const relation = await RelationModel.findByIdAndUpdate(
      relationId,
      { $set },
      { returnDocument: 'after' },
    )

    if (!relation) {
      throw new NotFound('relation is not found')
    }

    await this.configs.hooks?.onRelationUpdated?.(relation)

    return relation.meta ?? {}
  }

  async updateMetaByTarget(
    fromUserId: ObjectId,
    toUserId: ObjectId,
    partial: Partial<RelationMeta>,
  ) {
    if (fromUserId.equals(toUserId)) {
      throw new BadRequest('self-relation is not allowed')
    }

    const $set = ensureValues(
      chain(partial)
        .mapKeys((_, key) => `meta.${key}`)
        .value(),
    )

    const relation = await RelationModel.findOneAndUpdate(
      {
        from: fromUserId,
        to: toUserId,
      },
      { $set },
      {
        upsert: true,
        returnDocument: 'after',
      },
    )

    assert(relation)

    await this.configs.hooks?.onRelationUpdated?.(relation)

    return relation.meta ?? {}
  }

  async populateRelations(relations: Relation[]) {
    return RelationModel.populate(relations, [
      usePopulateItem({
        model: UserModel,
        path: 'from',
        select: ['profile', 'meta'],
      }),
      usePopulateItem({
        model: UserModel,
        path: 'to',
        select: ['profile', 'meta'],
      }),
    ])
  }
}

export const useRelationProvider = () =>
  useInstance<RelationProvider>('IAM.provider.relation')
