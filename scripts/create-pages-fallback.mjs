import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const distDir = join(process.cwd(), 'dist')
const indexPath = join(distDir, 'index.html')
const fallbackPath = join(distDir, '404.html')

if (!existsSync(indexPath)) {
  throw new Error('dist/index.html nao encontrado. Execute o build antes de criar o fallback do GitHub Pages.')
}

copyFileSync(indexPath, fallbackPath)
console.log('GitHub Pages SPA fallback criado em dist/404.html')
