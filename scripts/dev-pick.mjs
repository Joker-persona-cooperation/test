#!/usr/bin/env node
// 交互式选择后端开发环境并启动 Vite。
// 用法：npm run dev:pick
import { spawn } from 'node:child_process'
import { stdin as input, stdout as output } from 'node:process'
import readline from 'node:readline/promises'

const choices = [
  { name: '本地后端      http://127.0.0.1:8888', mode: 'development' },
  { name: '服务器 dev    https://dev.taskpilot.1kuansi.cn', mode: 'remote' },
]

const rl = readline.createInterface({ input, output })
console.log('请选择后端开发环境：')
choices.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}`))
const answer = await rl.question('输入序号回车（默认 1）：')
rl.close()

const idx = Number.parseInt(answer, 10) - 1
const chosen = choices[idx] ?? choices[0]
console.log(`\n>> 使用：${chosen.name}\n`)

const child = spawn('vite', ['--mode', chosen.mode], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
child.on('exit', (code) => process.exit(code ?? 0))
