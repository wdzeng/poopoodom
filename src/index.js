import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import json5 from 'json5'
import { temporaryFile } from 'tempy'
import workerPool from 'workerpool'

async function mkdirp(p) {
  try {
    await fs.mkdir(p, { recursive: true })
  } catch (e) {
    if ('code' in e && e.code === 'EEXIST') {
      return
    }
    throw e
  }
}

const pool = workerPool.pool(path.join(path.dirname(fileURLToPath(import.meta.url)), 'worker.js'))

async function parseDtsInAnotherThread(src, dst) {
  await pool.exec('generate', [src, dst])
}

async function parseDomAndIterable(srcDom, srcDomIter, dstDir) {
  const dstDom = path.join(dstDir, 'dom.d.ts')
  const dstDomIter = path.join(dstDir, 'iterable.d.ts')

  const domTask = parseDtsInAnotherThread(srcDom, dstDom)
  const domIterTask = parseDtsInAnotherThread(srcDomIter, dstDomIter)
  await Promise.all([domTask, domIterTask])

  const tmpFile = temporaryFile({ extension: '.d.ts' })
  try {
    await fs.copyFile(dstDom, tmpFile)
    await fs.appendFile(tmpFile, '\n\n', 'utf8')
    await fs.appendFile(tmpFile, await fs.readFile(dstDomIter, 'utf8'), 'utf8')
    await fs.rename(tmpFile, dstDomIter)
  } finally {
    await fs.rm(tmpFile, { force: true })
  }
}

function downloadFile(url, dst) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      // Image will be stored at this path
      const filePath = createWriteStream(dst)
      res.pipe(filePath)
      filePath.on('finish', () => {
        filePath.close()
        resolve()
      })
      filePath.on('error', err => {
        filePath.close()
        reject(err)
      })
    })
  })
}

async function processVersion(urlDom, urlDomIter, dstDir) {
  const srcDom = temporaryFile({ extension: '.d.ts' })
  const srcDomIter = temporaryFile({ extension: '.d.ts' })
  try {
    await Promise.all([
      downloadFile(urlDom, srcDom),
      downloadFile(urlDomIter, srcDomIter),
      mkdirp(dstDir)
    ])
    await parseDomAndIterable(srcDom, srcDomIter, dstDir)
  } finally {
    await Promise.all([fs.rm(srcDom, { force: true }), fs.rm(srcDomIter, { force: true })])
  }
}

const versions = json5.parse(
  await fs.readFile(path.join(path.dirname(fileURLToPath(import.meta.url)), 'versions.json')),
  true
)

const distDir =
  process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist')
for (const [k, v] of Object.entries(versions)) {
  const version = k
  const urlDom = v.dom
  const urlDomIter = v['dom.iterable']
  // TODO: consider using worker pool
  // eslint-disable-next-line unicorn/prefer-top-level-await
  processVersion(urlDom, urlDomIter, path.join(distDir, 'types', `v${version}`))
}

const jsContent = 'throw new Error("you cannot import poopoodom");'
await mkdirp(distDir)
fs.writeFile(path.join(distDir, 'dom.js'), jsContent, 'utf8')
fs.writeFile(path.join(distDir, 'iterable.js'), jsContent, 'utf8')
