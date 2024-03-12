import fs from 'node:fs/promises'

import { Node, Project } from 'ts-morph'
import workerPool from 'workerpool'

function generate(src, dst) {
  console.log('Processing', dst)
  const project = new Project({ compilerOptions: { allowJs: false } })
  const srcFile = project.addSourceFileAtPath(src)
  for (const node of srcFile.getDescendants()) {
    if (Node.isExportable(node)) {
      node.setIsExported(true)
    }
  }
  const outputText = srcFile.getFullText()
  return fs.writeFile(dst, outputText, 'utf8')
}

workerPool.worker({
  generate: generate
})
