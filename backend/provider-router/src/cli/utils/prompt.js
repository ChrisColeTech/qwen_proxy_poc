/**
 * Prompt Utility
 * Interactive command-line prompts using Node.js readline
 */

import readline from 'readline'

/**
 * Create readline interface
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

/**
 * Ask a question and return the answer
 * @param {string} question - Question to ask
 * @returns {Promise<string>} User's answer
 */
export function ask(question) {
  const rl = createInterface()

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

/**
 * Ask a yes/no question
 * @param {string} question - Question to ask
 * @param {boolean} defaultValue - Default value if user just presses enter
 * @returns {Promise<boolean>} True for yes, false for no
 */
export async function confirm(question, defaultValue = false) {
  const defaultText = defaultValue ? 'Y/n' : 'y/N'
  const answer = await ask(`${question} (${defaultText}): `)

  if (answer === '') {
    return defaultValue
  }

  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
}

/**
 * Ask for a choice from a list
 * @param {string} question - Question to ask
 * @param {Array<string>} choices - Array of choices
 * @param {string} defaultValue - Default choice
 * @returns {Promise<string>} Selected choice
 */
export async function choice(question, choices, defaultValue = null) {
  console.log(`\n${question}`)
  choices.forEach((choice, index) => {
    const isDefault = choice === defaultValue
    const marker = isDefault ? '*' : ' '
    console.log(`  ${marker}${index + 1}. ${choice}`)
  })

  if (defaultValue) {
    console.log(`\n(* = default, press enter to select default)`)
  }

  const answer = await ask('\nEnter number: ')

  if (answer === '' && defaultValue) {
    return defaultValue
  }

  const index = parseInt(answer, 10) - 1

  if (index >= 0 && index < choices.length) {
    return choices[index]
  }

  throw new Error('Invalid choice')
}

/**
 * Ask for input with validation
 * @param {string} question - Question to ask
 * @param {Object} options - Options
 * @param {Function} options.validate - Validation function
 * @param {string} options.defaultValue - Default value
 * @param {boolean} options.required - Whether input is required
 * @returns {Promise<string>} Validated input
 */
export async function input(question, options = {}) {
  const {
    validate = null,
    defaultValue = null,
    required = true
  } = options

  const questionText = defaultValue
    ? `${question} [${defaultValue}]: `
    : `${question}: `

  const answer = await ask(questionText)

  const value = answer === '' && defaultValue ? defaultValue : answer

  if (required && !value) {
    console.log('This field is required.')
    return input(question, options)
  }

  if (validate && value) {
    const validation = validate(value)
    if (validation !== true) {
      console.log(validation || 'Invalid input')
      return input(question, options)
    }
  }

  return value
}

/**
 * Display a list and ask user to select one item
 * @param {string} message - Message to display
 * @param {Array<Object>} items - Array of items with 'name' and 'value' properties
 * @param {string} defaultValue - Default value
 * @returns {Promise<any>} Selected item value
 */
export async function select(message, items, defaultValue = null) {
  console.log(`\n${message}`)

  items.forEach((item, index) => {
    const isDefault = item.value === defaultValue
    const marker = isDefault ? '*' : ' '
    console.log(`  ${marker}${index + 1}. ${item.name}`)
  })

  if (defaultValue) {
    console.log(`\n(* = default, press enter to select default)`)
  }

  const answer = await ask('\nEnter number: ')

  if (answer === '' && defaultValue !== null) {
    return defaultValue
  }

  const index = parseInt(answer, 10) - 1

  if (index >= 0 && index < items.length) {
    return items[index].value
  }

  throw new Error('Invalid selection')
}
