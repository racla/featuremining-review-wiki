/**
 * Wiki 文件整理脚本
 * 根据 frontmatter type 将 wiki 根目录下的 .md 文件移动到对应分类目录
 * 用法: node scripts/reorganize-wiki.js <wiki目录路径>
 * 示例: node scripts/reorganize-wiki.js "C:/Users/Administrator/Documents/杰杰杰/wiki"
 */

const fs = require('fs')
const path = require('path')

const TYPE_TO_DIR = {
  '股票': '股票',
  '策略': '策略',
  '模式': '模式',
  '错误': '错误',
  '市场环境': '市场环境',
  '进化': '进化',
  '总结': '总结',
  'source': 'sources',
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const fm = {}
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
    value = value.replace(/^["']|["']$/g, '')
    fm[key] = value
  }
  return fm
}

function scanAllMdFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanAllMdFiles(fullPath, files)
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

function main() {
  const wikiPath = process.argv[2]
  if (!wikiPath) {
    console.error('用法: node reorganize-wiki.js <wiki目录路径>')
    console.error('示例: node reorganize-wiki.js "C:/Users/Administrator/Documents/杰杰杰/wiki"')
    process.exit(1)
  }

  const resolvedWikiPath = path.resolve(wikiPath)
  if (!fs.existsSync(resolvedWikiPath)) {
    console.error(`目录不存在: ${resolvedWikiPath}`)
    process.exit(1)
  }

  // 1. 扫描根目录下的 .md 文件
  const rootEntries = fs.readdirSync(resolvedWikiPath, { withFileTypes: true })
  const rootFiles = rootEntries
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .filter(e => !['index.md', 'log.md', 'overview.md', 'schema.md', 'purpose.md'].includes(e.name))
    .map(e => e.name)

  if (rootFiles.length === 0) {
    console.log('✅ wiki 根目录下没有需要整理的 .md 文件')
    return
  }

  console.log(`发现 ${rootFiles.length} 个需要整理的文件:\n`)

  const moves = []

  // 2. 读取每个文件的 frontmatter，确定目标目录
  for (const file of rootFiles) {
    const filePath = path.join(resolvedWikiPath, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const fm = parseFrontmatter(content)
    const type = fm.type

    if (!type) {
      console.log(`⚠️  跳过（无 frontmatter type）: ${file}`)
      continue
    }

    const dirName = TYPE_TO_DIR[type]
    if (!dirName) {
      console.log(`⚠️  跳过（未知 type "${type}"）: ${file}`)
      continue
    }

    const targetDir = path.join(resolvedWikiPath, dirName)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
      console.log(`📁 创建目录: ${dirName}`)
    }

    const targetPath = path.join(targetDir, file)
    if (fs.existsSync(targetPath)) {
      console.log(`⚠️  跳过（目标已存在）: ${file} → ${dirName}/${file}`)
      continue
    }

    // 执行移动
    fs.renameSync(filePath, targetPath)
    const baseName = file.replace(/\.md$/, '')
    moves.push({
      fileName: file,
      baseName: baseName,
      oldRef: baseName,
      newRef: `${dirName}/${baseName}`,
      from: filePath,
      to: targetPath,
    })
    console.log(`✅ 移动: ${file} → ${dirName}/${file}  (type: ${type})`)
  }

  if (moves.length === 0) {
    console.log('\n没有文件被移动')
    return
  }

  // 3. 扫描所有 wiki 文件，更新 wikilink 引用
  console.log(`\n🔍 扫描所有文件更新 wikilink 引用...`)
  const allMdFiles = scanAllMdFiles(resolvedWikiPath)
  let updatedCount = 0

  for (const filePath of allMdFiles) {
    let content = fs.readFileSync(filePath, 'utf-8')
    let changed = false

    for (const move of moves) {
      // 匹配 [[旧文件名]] 或 [[旧文件名|显示文本]]
      const regex = new RegExp(
        `\\[\\[${escapeRegex(move.oldRef)}(\\|[^\\]]*)?\\]\\]`,
        'g'
      )
      if (regex.test(content)) {
        content = content.replace(regex, (match, display) => {
          return `[[${move.newRef}${display || ''}]]`
        })
        changed = true
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content)
      const relPath = path.relative(resolvedWikiPath, filePath)
      console.log(`📝 更新引用: ${relPath}`)
      updatedCount++
    }
  }

  console.log(`\n✨ 完成!`)
  console.log(`   移动了 ${moves.length} 个文件`)
  console.log(`   更新了 ${updatedCount} 个文件中的引用`)
  console.log(`\n⚠️  提示: 请刷新应用文件树确认整理结果`)
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

main()
