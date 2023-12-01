import { Router } from 'express'
import type { Database } from '@/database'
import { jsonRoute } from '@/utils/middleware'
import buildRepository from './repository'
import randomTemplate from '../templates/utils'
import { postToDiscord, setupDiscord } from './discord'
import { StatusCodes } from 'http-status-codes'
import type { Express } from 'express'
import { validateReq } from './validation'
import client from './discord/client'
import NotFound from '@/utils/errors/NotFound'

export function messagesRouting(db: Database, app: Express) {
  const messages = buildRepository(db)
  const router = Router()

  router
    .route('/')
    .get(
      jsonRoute(async (req) => {
        const username = req.query.username

        const sprint = req.query.sprint

        if (!username && !sprint) {
          return await messages.getAll()
        }
        if (username && typeof username === 'string') {
          return await messages.getByUser(username)
        }

        if (sprint && typeof sprint === 'string') {
          return await messages.getBySprint(sprint)
        }
      })
    )
    .post(
      jsonRoute(async (req) => {
        const sprintCodeInput = req.body.sprintCode
        const usernameInput = req.body.username

        const result = await validateReq(sprintCodeInput, usernameInput, db)
        const { username, sprintCode } = result

        const template = await randomTemplate(db)
        if (!template) throw new NotFound('Message template could not be found')
        // to add message to database
        const messageToDb = {
          sprintCode: sprintCode,
          templateId: template.id,
          username: username,
        }

        const messageAdded = await messages.create(messageToDb)
        if (!messageAdded)
          throw new Error('Message could not be added to database')

        // to get object with template content
        const messageObj = await messages.getBySprintAndUser(
          sprintCode,
          username
        )
        if (!messageObj) throw new Error('Message could not be formed')
        const formedMessage = `has just completed ${messageObj.sprint}! ${messageObj.template}`

        if (app.settings.env === 'test') {
          return 'Message fragment was prepared for discord'
        }

        const { members, channel } = await setupDiscord(client)
        if (!members || !channel)
          throw new Error('Failure connecting to discord server or channel')
        await postToDiscord(username, formedMessage, members, channel)
      }, StatusCodes.CREATED)
    )

  return router
}