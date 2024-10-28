import { remember } from '@epic-web/remember'
import { PrismaClient } from '@prisma/client'
import chalk from 'chalk'

export type QueryEvent = {
  timestamp: Date
  query: string // Query sent to the database
  params: string // Query parameters
  duration: number // Time elapsed (in milliseconds) between client issuing query and database responding - not only time taken to run query
  target: string
}

export const prisma = remember('prisma', () => {
	// NOTE: if you change anything in this function you'll need to restart
	// the dev server to see your changes.

	// Feel free to change this log threshold to something that makes sense for you
	const logThreshold = 20

	const client = new PrismaClient({
		log: [
			{ level: 'query', emit: 'stdout' },
			{ level: 'error', emit: 'stdout' },
			{ level: 'warn', emit: 'stdout' },
		],
	})
	// client.$on('query', async (e: QueryEvent) => {
	// 	if (e.duration < logThreshold) return
	// 	const color =
	// 		e.duration < logThreshold * 1.1
	// 			? 'green'
	// 			: e.duration < logThreshold * 1.2
	// 				? 'blue'
	// 				: e.duration < logThreshold * 1.3
	// 					? 'yellow'
	// 					: e.duration < logThreshold * 1.4
	// 						? 'redBright'
	// 						: 'red'
	// 	const dur = chalk[color](`${e.duration}ms`)
	// 	console.info(`prisma:query - ${dur} - ${e.query}`)
	// })
	void client.$connect()
	return client
})
