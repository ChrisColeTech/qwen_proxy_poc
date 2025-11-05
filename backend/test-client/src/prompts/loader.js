import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Load system prompt from file
 */
export async function loadSystemPrompt() {
  const promptPath = join(__dirname, 'qwen.txt')
  const prompt = await readFile(promptPath, 'utf-8')
  return prompt
}

/**
 * Format system prompt with environment variables
 *
 * OpenCode injects:
 * - Working directory
 * - Platform info
 * - Date
 */
export function formatSystemPrompt(prompt, env = {}) {
  const {
    workingDir = process.cwd(),
    platform = process.platform,
    date = new Date().toDateString(),
    isGitRepo = false,
  } = env

  // Replace placeholders if prompt contains them
  return prompt
    .replace(/\{WORKING_DIR\}/g, workingDir)
    .replace(/\{PLATFORM\}/g, platform)
    .replace(/\{DATE\}/g, date)
    .replace(/\{IS_GIT_REPO\}/g, isGitRepo ? 'yes' : 'no')
}

/**
 * Get system message for API request
 */
export async function getSystemMessage() {
  const prompt = await loadSystemPrompt()
  const formatted = formatSystemPrompt(prompt, {
    workingDir: process.cwd(),
    platform: process.platform,
    date: new Date().toDateString(),
  })

  return {
    role: 'system',
    content: formatted,
  }
}
