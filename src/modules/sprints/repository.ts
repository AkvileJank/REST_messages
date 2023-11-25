import type { Database, Sprints } from '@/database'
import { keys } from './schema'
import type { Updateable } from 'kysely'

type Row = Sprints
type RowWithoutCode = Omit<Row, 'code'>
type RowUpdate = Updateable<RowWithoutCode>

export default (db: Database) => ({
  getAll: async () => db.selectFrom('sprints').selectAll().execute(),

  create: async (record: Row) =>
    db.insertInto('sprints').values(record).returning(keys).executeTakeFirst(),

  update: async (code: string, partial: RowUpdate) =>
    db
      .updateTable('sprints')
      .set(partial)
      .where('code', '=', code)
      .returning(keys)
      .executeTakeFirst(),

  delete: async (code: string) =>
    db
      .deleteFrom('sprints')
      .where('code', '=', code)
      .returning(keys)
      .executeTakeFirst(),
})
