import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import {
	cleanupDb,
	createContact,
} from '#tests/db-utils.ts'

async function seed() {
  console.log('🌱 Seeding...')
	console.time('🌱 Database has been seeded')

	console.time('🧹 Cleaned up the database...')
	await cleanupDb()
	console.timeEnd('🧹 Cleaned up the database...')

  const totalUsers = 16
	console.time(`👤 Created ${totalUsers} users...`)
  for (let index = 0; index < totalUsers; index++) {
    const contactData = createContact()
    await prisma.contact.create({
      select: {id: true},
      data: contactData
    })
    .catch((e) => {
      console.error('Error creating a user:', e)
      return null
    })
  }
  console.timeEnd(`👤 Created ${totalUsers} users...`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})