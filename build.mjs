import archiver from 'archiver'
import autoprefixer from 'autoprefixer'
import * as dotenv from 'dotenv'
import esbuild from 'esbuild'
import postcssPlugin from 'esbuild-style-plugin'
import fs from 'fs-extra'
import process from 'node:process'
import tailwindcss from 'tailwindcss'
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()

const outdir = 'build'

async function deleteOldDir() {
  await fs.remove(outdir)
}

async function runEsbuild() {
  await esbuild.build({
    entryPoints: [
      // 'src/codemirror/lib/codemirror.js',
      // 'src/codemirror/mode/python/python.js',
      'src/codemirror/codemirror.min.js',
      'src/codemirror/codemirror.min2.css',
      'src/codemirror/python.min.js',
      'src/highlight/highlight.min.js',
      // 'src/pyodide',
      // path.resolve(__dirname, './src/pyodide/**'),
      'src/content-script/index.tsx',
      'src/background/index.ts',
      'src/options/index.tsx',
      'src/popup/index.tsx',
    ],
    bundle: true,
    outdir: outdir,
    treeShaking: true,
    minify: true,
    drop: ['console', 'debugger'],
    legalComments: 'none',
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.AXIOM_TOKEN': JSON.stringify(process.env.AXIOM_TOKEN || 'UNDEFINED'),
    },
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsx: 'automatic',
    loader: {
      '.png': 'dataurl',
      '.css': 'text',
    },
    plugins: [
      postcssPlugin({
        // postcss: {
        //   plugins: [tailwindcss, autoprefixer],
        //   filter: /\.scss$/,
        //   type: 'stylesheet'
        // },
      }),
    ],
  })
}

async function zipFolder(dir) {
  const output = fs.createWriteStream(`${dir}.zip`)
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })
  archive.pipe(output)
  archive.directory(dir, false)
  await archive.finalize()
}

async function copyFiles(entryPoints, targetDir) {
  await fs.ensureDir(targetDir)
  await Promise.all(
    entryPoints.map(async (entryPoint) => {
      await fs.copy(entryPoint.src, `${targetDir}/${entryPoint.dst}`)
    }),
  )
}

async function build() {
  await deleteOldDir()
  await runEsbuild()

  const commonFiles = [
    { src: 'build/codemirror', dst: 'codemirror' },
    { src: 'build/highlight', dst: 'highlight' },
    // { src: 'build/pyodide', dst: 'pyodide' },
    { src: 'build/content-script/index.js', dst: 'content-script.js' },
    { src: 'build/content-script/index.css', dst: 'content-script.css' },
    { src: 'build/background/index.js', dst: 'background.js' },
    { src: 'build/options/index.js', dst: 'options.js' },
    { src: 'build/options/index.css', dst: 'options.css' },
    { src: 'src/options/index.html', dst: 'options.html' },
    { src: 'build/popup/index.js', dst: 'popup.js' },
    { src: 'build/popup/index.css', dst: 'popup.css' },
    { src: 'src/popup/index.html', dst: 'popup.html' },
    { src: 'src/logo.png', dst: 'logo.png' },
    { src: 'src/_locales', dst: '_locales' },
  ]

  // chromium
  await copyFiles(
    [...commonFiles, { src: 'src/manifest.json', dst: 'manifest.json' }],
    `./${outdir}/chromium`,
  )

  await zipFolder(`./${outdir}/chromium`)

  // firefox
  await copyFiles(
    [...commonFiles, { src: 'src/manifest.v2.json', dst: 'manifest.json' }],
    `./${outdir}/firefox`,
  )

  await zipFolder(`./${outdir}/firefox`)

  console.log('Build success.')
}

build()
