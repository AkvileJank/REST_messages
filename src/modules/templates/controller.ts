import { Router } from 'express'
import type { Database } from '@/database'
import { jsonRoute } from '@/utils/middleware'
import buildRepository from './repository'
import * as schema from './schema'
import { StatusCodes } from 'http-status-codes'

//import { NoIdProvided } from './errors'

export function templatesRouting(db: Database) {
  const templates = buildRepository(db)
  const router = Router()

  router
    .route('/')
    .get(
      jsonRoute(async () => {
        return await templates.getAll()
      })
    )
    .post(
      jsonRoute(async (req) => {
        const body = schema.parseInsertable(req.body)
        return templates.create(body)
      }, StatusCodes.CREATED)
    )

  router
    .route('/:id')
    .patch(
      jsonRoute(async (req) => {
        const id = schema.parseId(req.params.id)
        const bodyPatch = schema.parseInsertable(req.body)
        const record = await templates.update(id, bodyPatch)

        // if (!record) {
        //   throw new notFound();
        // }
        return record
      })
    )
    .delete(
      jsonRoute(async (req) => {
        const id = schema.parseId(req.params.id)
        const record = await templates.delete(id)
        return record
      })
    )
  return router
}
