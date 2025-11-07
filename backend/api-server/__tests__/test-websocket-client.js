/**
 * WebSocket Test Client
 * Simple test to verify WebSocket connectivity and event reception
 */

import { io } from 'socket.io-client'

const socket = io('http://localhost:3002', {
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
  console.log('[Test Client] Connected to WebSocket server')
  console.log('[Test Client] Socket ID:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('[Test Client] Disconnected:', reason)
})

socket.on('error', (error) => {
  console.error('[Test Client] Error:', error)
})

// Listen for proxy status events
socket.on('proxy:status', (data) => {
  console.log('[Test Client] Received proxy:status event:')
  console.log(JSON.stringify(data, null, 2))
})

// Listen for credentials updated events
socket.on('credentials:updated', (data) => {
  console.log('[Test Client] Received credentials:updated event:')
  console.log(JSON.stringify(data, null, 2))
})

// Listen for providers updated events
socket.on('providers:updated', (data) => {
  console.log('[Test Client] Received providers:updated event:')
  console.log(JSON.stringify(data, null, 2))
})

// Listen for models updated events
socket.on('models:updated', (data) => {
  console.log('[Test Client] Received models:updated event:')
  console.log(JSON.stringify(data, null, 2))
})

// Keep the client running for 30 seconds
setTimeout(() => {
  console.log('[Test Client] Test complete, disconnecting...')
  socket.disconnect()
  process.exit(0)
}, 30000)

console.log('[Test Client] Starting WebSocket test client...')
console.log('[Test Client] Connecting to http://localhost:3002')
console.log('[Test Client] Listening for events for 30 seconds...')
