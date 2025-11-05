/**
 * Scenario Test Suite Exports
 *
 * Central export point for all test scenarios
 */

export {
  testBashTool,
  testReadTool,
  testWriteTool,
  testGlobTool,
  runAllSingleToolTests
} from './single-tool.js'

export {
  testGlobReadWorkflow,
  testWriteReadEditWorkflow,
  testBashGrepReadWorkflow,
  testProjectCreationWorkflow,
  runAllMultiToolTests
} from './multi-tool.js'

export {
  testExactReadFileScenario,
  testMultiTurnConversation,
  testEmptyBashResultHandling,
  testComplexParameterHandling,
  runAllExactTests
} from './opencode-exact.js'

/**
 * Run all test scenarios across all categories
 */
export async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════╗')
  console.log('║                                                   ║')
  console.log('║     QWEN PROXY TEST CLIENT - FULL TEST SUITE     ║')
  console.log('║                                                   ║')
  console.log('╚═══════════════════════════════════════════════════╝\n')

  const { runAllSingleToolTests } = await import('./single-tool.js')
  const { runAllMultiToolTests } = await import('./multi-tool.js')
  const { runAllExactTests } = await import('./opencode-exact.js')

  const results = []

  // Run single tool tests
  console.log('\n🔹 Phase 1: Single Tool Tests')
  const singleResult = await runAllSingleToolTests()
  results.push({ category: 'Single Tool Tests', passed: singleResult })

  // Run multi-tool tests
  console.log('\n🔹 Phase 2: Multi-Tool Workflow Tests')
  const multiResult = await runAllMultiToolTests()
  results.push({ category: 'Multi-Tool Tests', passed: multiResult })

  // Run exact OpenCode tests
  console.log('\n🔹 Phase 3: OpenCode-Exact Tests')
  const exactResult = await runAllExactTests()
  results.push({ category: 'OpenCode-Exact Tests', passed: exactResult })

  // Final summary
  console.log('\n\n╔═══════════════════════════════════════════════════╗')
  console.log('║            FINAL TEST SUITE SUMMARY              ║')
  console.log('╚═══════════════════════════════════════════════════╝\n')

  results.forEach(({ category, passed }) => {
    console.log(`  ${passed ? '✅' : '❌'} ${category}`)
  })

  const allPassed = results.every(r => r.passed)
  const passedCount = results.filter(r => r.passed).length

  console.log(`\n  Total: ${passedCount}/${results.length} test categories passed\n`)

  if (allPassed) {
    console.log('  🎉 ALL TESTS PASSED! Qwen proxy is working correctly.\n')
  } else {
    console.log('  ⚠️  Some tests failed. Review the logs above for details.\n')
  }

  return allPassed
}
