import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Set env vars before importing board module
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1'
process.env.DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'Wordflux'

const { seedIfMissing, getBoard } = await import('../app/lib/board.js')

async function main(){
  await seedIfMissing()
  const b = await getBoard()
  console.log('Seeded board with columns:', b.columns.map(c=>c.name).join(', '))
}
main().catch(e=>{ console.error(e); process.exit(1) })