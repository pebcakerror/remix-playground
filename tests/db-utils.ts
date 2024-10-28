import fs from 'node:fs'
import { faker } from '@faker-js/faker'
import Database from 'better-sqlite3'
import { UniqueEnforcer } from 'enforce-unique'

const uniqueUsernameEnforcer = new UniqueEnforcer()

export function createContact() {
  const first = faker.person.firstName()
	const last = faker.person.lastName()
  const slug = uniqueUsernameEnforcer.enforce(() => {
    return faker.internet.userName({firstName: first, lastName: last});
  });
  const avatar = faker.image.avatar()
  const bio = faker.person.bio()
  const notes = faker.lorem.sentences({ min: 0, max: 3 })
  

  return {
		first: first,
		last: last,
    slug: slug,
    avatar: avatar,
    bio: bio,
    notes: notes
	}
}

let _migrationSqls: Array<Array<string>> | undefined
async function getMigrationSqls() {
	if (_migrationSqls) return _migrationSqls

	const migrationSqls: Array<Array<string>> = []
	const migrationPaths = (await fs.promises.readdir('prisma/migrations'))
		.filter((dir) => dir !== 'migration_lock.toml')
		.map((dir) => `prisma/migrations/${dir}/migration.sql`)

	for (const path of migrationPaths) {
		const sql = await fs.promises.readFile(path, 'utf8')
		const statements = sql
			.split(';')
			.map((statement) => statement.trim())
			.filter(Boolean)
		migrationSqls.push(statements)
	}

	_migrationSqls = migrationSqls

	return migrationSqls
}

export async function cleanupDb() {
	const db = new Database(process.env.DATABASE_URL?.replace('file:', ''))
	try {
		// Disable FK constraints to avoid relation conflicts during deletion
		db.exec('PRAGMA foreign_keys = OFF')

		// Get all table names
		const tables = db
			.prepare(
				`
			SELECT name FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations'
		`,
			)
			.all() as { name: string }[]

		// Delete tables except the ones that are excluded above
		for (const { name } of tables) {
			db.exec(`DROP TABLE IF EXISTS "${name}"`)
		}

		// Get migration SQLs and run each migration
		const migrationSqls = await getMigrationSqls()
		for (const statements of migrationSqls) {
			// Run each sql statement in the migration
			db.transaction(() => {
				for (const statement of statements) {
					db.exec(statement)
				}
			})()
		}
	} finally {
		db.exec('PRAGMA foreign_keys = ON')
		db.close()
	}
}