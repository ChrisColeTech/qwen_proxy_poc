/**
 * Table Formatter Utility
 * Formats data as ASCII tables for CLI output
 */

import { colors } from './colors.js'

/**
 * Format array of objects as a table
 */
export function formatTable(data, columns, options = {}) {
  if (!data || data.length === 0) {
    return 'No data to display'
  }

  const {
    headerColor = colors.cyan,
    borderColor = colors.gray,
    padding = 2,
    maxWidth = 50,
  } = options

  // Calculate column widths
  const widths = {}
  columns.forEach(col => {
    const header = col.length
    const maxContent = Math.max(...data.map(row => String(row[col] || '').length))
    widths[col] = Math.min(Math.max(header, maxContent), maxWidth)
  })

  // Helper to pad text
  const pad = (text, width) => {
    const str = String(text || '')
    if (str.length > width) {
      return str.substring(0, width - 3) + '...'
    }
    return str + ' '.repeat(width - str.length)
  }

  // Build table
  const lines = []
  const totalWidth = Object.values(widths).reduce((a, b) => a + b, 0) + 
                     (columns.length - 1) * padding + 2

  // Top border
  lines.push(borderColor + '┌' + '─'.repeat(totalWidth) + '┐' + colors.reset)

  // Header
  const header = columns.map(col => pad(col, widths[col])).join(' '.repeat(padding))
  lines.push(borderColor + '│' + colors.reset + ' ' + headerColor + header + colors.reset + ' ' + borderColor + '│' + colors.reset)

  // Header separator
  lines.push(borderColor + '├' + '─'.repeat(totalWidth) + '┤' + colors.reset)

  // Rows
  data.forEach(row => {
    const rowText = columns.map(col => pad(row[col], widths[col])).join(' '.repeat(padding))
    lines.push(borderColor + '│' + colors.reset + ' ' + rowText + ' ' + borderColor + '│' + colors.reset)
  })

  // Bottom border
  lines.push(borderColor + '└' + '─'.repeat(totalWidth) + '┘' + colors.reset)

  return lines.join('\n')
}

/**
 * Format key-value pairs
 */
export function formatKeyValue(data, options = {}) {
  const { keyColor = colors.cyan, borderColor = colors.gray } = options
  const entries = Object.entries(data)
  if (entries.length === 0) return 'No data to display'

  const maxKeyLength = Math.max(...entries.map(([k]) => k.length))
  const lines = []

  entries.forEach(([key, value]) => {
    const paddedKey = key + ' '.repeat(maxKeyLength - key.length)
    lines.push(`${keyColor}${paddedKey}${colors.reset} ${borderColor}:${colors.reset} ${value}`)
  })

  return lines.join('\n')
}

/**
 * Format a list with bullet points
 */
export function formatList(items, options = {}) {
  const { bullet = '•', bulletColor = colors.cyan, indent = 2 } = options
  if (!items || items.length === 0) return 'No items to display'

  return items.map(item => 
    `${' '.repeat(indent)}${bulletColor}${bullet}${colors.reset} ${item}`
  ).join('\n')
}

/**
 * Format a box around text
 */
export function formatBox(text, options = {}) {
  const { borderColor = colors.cyan, padding = 1, title = null } = options
  const lines = text.split('\n')
  const maxLength = Math.max(...lines.map(l => l.length))

  // Ensure width is at least as wide as the title
  let width = maxLength + (padding * 2)
  if (title && title.length + 4 > width) {
    width = title.length + 4
  }

  const output = []

  // Top border
  if (title) {
    const titlePadding = Math.floor((width - title.length) / 2)
    const rightPadding = Math.max(0, width - titlePadding - title.length)
    output.push(borderColor + '┌' + '─'.repeat(titlePadding) + colors.reset + title + borderColor + '─'.repeat(rightPadding) + '┐' + colors.reset)
  } else {
    output.push(borderColor + '┌' + '─'.repeat(width) + '┐' + colors.reset)
  }

  // Content
  lines.forEach(line => {
    const contentWidth = width - (padding * 2)
    const padded = line + ' '.repeat(Math.max(0, contentWidth - line.length))
    output.push(borderColor + '│' + colors.reset + ' '.repeat(padding) + padded + ' '.repeat(padding) + borderColor + '│' + colors.reset)
  })

  // Bottom border
  output.push(borderColor + '└' + '─'.repeat(width) + '┘' + colors.reset)

  return output.join('\n')
}
