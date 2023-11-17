import fs from 'node:fs/promises'
import { workerData } from 'node:worker_threads'

import { Node, Project } from 'ts-morph'

const { src, dst } = workerData
const project = new Project({ compilerOptions: { allowJs: false } })
const srcFile = project.addSourceFileAtPath(src)
for (const node of srcFile.getDescendants()) {
  if (Node.isExportable(node)) {
    node.setIsExported(true)
  }
}
const outputText = srcFile.getFullText()
await fs.writeFile(dst, outputText, 'utf8')
