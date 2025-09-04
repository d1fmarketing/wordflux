import { chromium } from 'playwright'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const baseURL = process.env.TARGET || 'https://54-163-132-143.nip.io'
const outDir = path.resolve(process.cwd(), 'playwright-artifacts')

async function snap(page, name){
  await mkdir(outDir, { recursive: true })
  const file = path.join(outDir, `${Date.now()}-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('snap:', file)
}

async function main(){
  await mkdir(outDir, { recursive: true })
  const logs = []
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const context = await browser.newContext({ recordVideo: { dir: path.join(outDir, 'video') } })
  await context.tracing.start({ screenshots: true, snapshots: true })
  const page = await context.newPage()
  page.on('console', msg => logs.push(`[console] ${msg.type()}: ${msg.text()}`))
  page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`))
  page.on('requestfailed', req => logs.push(`[requestfailed] ${req.method()} ${req.url()} => ${req.failure()?.errorText}`))

  // Visit site
  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForLoadState('networkidle', { timeout: 90_000 })
  await snap(page, 'home')

  // Add Column
  const colName = `QA-${Date.now().toString().slice(-4)}`
  const addColBtn = page.getByRole('button', { name: '+ Add Column' })
  if(await addColBtn.isVisible()){
    await addColBtn.click()
    const nameInput = page.getByLabel('New column name')
    await nameInput.waitFor({ timeout: 5000 })
    await nameInput.fill(colName)
    const form = page.locator('form', { has: nameInput })
    await form.getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(600)
    await snap(page, 'after-add-column')
  }

  // Try to add a card to Backlog (best-effort)
  const demoTitle = `Demo Card ${Date.now().toString().slice(-5)}`
  try{
    const backlogHeading = page.getByRole('heading', { name: 'Backlog' })
    await backlogHeading.waitFor({ timeout: 10_000 })
    const backlogCard = backlogHeading.locator('xpath=ancestor::div[contains(@class, "card")]').first()
    await backlogCard.getByRole('button', { name: '+ Add card' }).click()
    const titleInput = backlogCard.getByLabel('New card title')
    await titleInput.waitFor({ timeout: 5000 })
    await titleInput.fill(demoTitle)
    await backlogCard.locator('form', { has: titleInput }).getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(600)
    await snap(page, 'after-add-card')
  }catch(e){
    console.log('Add card step skipped:', e?.message || e)
  }

  // Drag the card into new column if present
  try{
    const targetHeading = page.getByRole('heading', { name: colName })
    await targetHeading.waitFor({ timeout: 5000 })
    const targetColumn = targetHeading.locator('xpath=ancestor::div[contains(@class, "card")]').first()
    await page.dragAndDrop(`text=${demoTitle}`, await targetColumn.evaluate(el=>{ return '#'+(el.id||'') }))
  }catch{
    // fallback: try using source/target bounding boxes
    try{
      const src = page.locator(`text=${demoTitle}`).first()
      const targetHeading = page.getByRole('heading', { name: colName })
      const targetColumn = targetHeading.locator('xpath=ancestor::div[contains(@class, "card")]').first()
      const srcBox = await src.boundingBox()
      const dstBox = await targetColumn.boundingBox()
      if(srcBox && dstBox){
        await page.mouse.move(srcBox.x + srcBox.width/2, srcBox.y + srcBox.height/2)
        await page.mouse.down()
        await page.mouse.move(dstBox.x + dstBox.width/2, dstBox.y + 40, { steps: 10 })
        await page.mouse.up()
      }
    }catch{}
  }
  await page.waitForTimeout(800)
  await snap(page, 'after-dnd')

  // Open column menu and rename
  try{
    const targetHeading = page.getByRole('heading', { name: colName })
    const column = targetHeading.locator('xpath=ancestor::div[contains(@class, "card")]').first()
    await column.getByRole('button', { name: '•••' }).click()
    await page.getByRole('button', { name: 'Rename column' }).click()
    await page.getByLabel('New name').fill(colName + ' Review')
    await page.getByRole('button', { name: 'Save' }).click()
  }catch{}
  await snap(page, 'after-rename')

  await context.tracing.stop({ path: path.join(outDir, 'trace.zip') })
  await writeFile(path.join(outDir, 'console.log'), logs.join('\n'))
  await browser.close()
  console.log('Artifacts in', outDir)
}

main().catch(err=>{ console.error(err); process.exit(1) })
