/**
 * Tool Registry
 *
 * This file exports all 11 tools matching OpenCode's exact tool definitions.
 * Each tool has:
 * - schema: Zod schema for validation
 * - definition: OpenAI-compatible tool definition for API requests
 * - execute: Client-side execution function
 */

import * as bash from './bash.js'
import * as read from './read.js'
import * as write from './write.js'
import * as edit from './edit.js'
import * as glob from './glob.js'
import * as grep from './grep.js'
import * as list from './list.js'
import * as webfetch from './webfetch.js'
import * as todowrite from './todowrite.js'
import * as todoread from './todoread.js'
import * as task from './task.js'

// Export all tools as modules
export const tools = {
  bash,
  read,
  write,
  edit,
  glob,
  grep,
  list,
  webfetch,
  todowrite,
  todoread,
  task
}

// Export tool definitions array for OpenAI API format
export const toolDefinitions = [
  bash.definition,
  read.definition,
  write.definition,
  edit.definition,
  glob.definition,
  grep.definition,
  list.definition,
  webfetch.definition,
  todowrite.definition,
  todoread.definition,
  task.definition
]

/**
 * Get all tools as an object (for AI SDK tool calling)
 * This format includes the execute function for each tool
 *
 * AI SDK v5 expects tools with:
 * - description: string
 * - parameters: Zod schema (NOT JSON schema)
 * - execute: async function
 */
export function getAllTools() {
  return {
    bash: {
      description: bash.definition.function.description,
      parameters: bash.schema,
      execute: bash.execute
    },
    read: {
      description: read.definition.function.description,
      parameters: read.schema,
      execute: read.execute
    },
    write: {
      description: write.definition.function.description,
      parameters: write.schema,
      execute: write.execute
    },
    edit: {
      description: edit.definition.function.description,
      parameters: edit.schema,
      execute: edit.execute
    },
    glob: {
      description: glob.definition.function.description,
      parameters: glob.schema,
      execute: glob.execute
    },
    grep: {
      description: grep.definition.function.description,
      parameters: grep.schema,
      execute: grep.execute
    },
    list: {
      description: list.definition.function.description,
      parameters: list.schema,
      execute: list.execute
    },
    webfetch: {
      description: webfetch.definition.function.description,
      parameters: webfetch.schema,
      execute: webfetch.execute
    },
    todowrite: {
      description: todowrite.definition.function.description,
      parameters: todowrite.schema,
      execute: todowrite.execute
    },
    todoread: {
      description: todoread.definition.function.description,
      parameters: todoread.schema,
      execute: todoread.execute
    },
    task: {
      description: task.definition.function.description,
      parameters: task.schema,
      execute: task.execute
    }
  }
}

/**
 * Get all tools as an array (for raw HTTP requests)
 * This format is what gets sent in the 'tools' parameter to the API
 */
export function getAllToolsArray() {
  return toolDefinitions
}

/**
 * Tool executor - executes any tool by name
 */
export async function executeTool(toolName, args, context = {}) {
  const tool = tools[toolName]
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }
  return await tool.execute(args, context)
}

/**
 * Get tool count
 */
export function getToolCount() {
  return Object.keys(tools).length
}

/**
 * Get tool names
 */
export function getToolNames() {
  return Object.keys(tools)
}

/**
 * Validate tool arguments
 */
export function validateToolArgs(toolName, args) {
  const tool = tools[toolName]
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`)
  }
  return tool.schema.parse(args)
}

// Export individual tools for direct access
export { bash, read, write, edit, glob, grep, list, webfetch, todowrite, todoread, task }

// Legacy exports for compatibility with existing code
export const bashTool = { ...bash.definition, execute: bash.execute }
export const readTool = { ...read.definition, execute: read.execute }
export const writeTool = { ...write.definition, execute: write.execute }
export const editTool = { ...edit.definition, execute: edit.execute }
export const globTool = { ...glob.definition, execute: glob.execute }
export const grepTool = { ...grep.definition, execute: grep.execute }
export const listTool = { ...list.definition, execute: list.execute }
export const webfetchTool = { ...webfetch.definition, execute: webfetch.execute }
export const todoWriteTool = { ...todowrite.definition, execute: todowrite.execute }
export const todoReadTool = { ...todoread.definition, execute: todoread.execute }
export const taskTool = { ...task.definition, execute: task.execute }
