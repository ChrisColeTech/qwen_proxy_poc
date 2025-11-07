# Quick Start Guide Specification

**Purpose**: Specification for the in-app Quick Start Guide shown within the running application
**Target**: New users who need to get started in under 60 seconds
**Date**: 2025-11-06

---

## 1. Overview - What This System Does

The Qwen Proxy is an OpenAI-compatible API server that lets you use Qwen's AI models through any OpenAI client library. It handles authentication and translates OpenAI API calls to work with Qwen's service.

**Three ways to use it:**
1. **Web Dashboard** - Manage credentials and proxy server through your browser
2. **Desktop App** - Same features with easier credential extraction via Electron
3. **External Clients** - Integrate with your own code using the OpenAI-compatible API

---

## 2. For Web Users - Browser Quick Start

**Goal**: Get authenticated and running in 60 seconds

### Prerequisites
- Chrome browser
- Chrome extension installed (one-time setup)

### Step 1: Install Chrome Extension (First Time Only)
1. Click "Connect to Qwen" button
2. If extension not detected, follow installation link
3. Install "Qwen Credential Extractor" from Chrome Web Store
4. Refresh the dashboard page

### Step 2: Authenticate
1. Click "Connect to Qwen" or "Re-login" button
2. New page opens to `chat.qwen.ai`
3. Log in with your Qwen account credentials
4. Extension auto-extracts credentials and closes page
5. Dashboard updates within 5 seconds showing "Authenticated" status

### Step 3: Start Proxy
1. Click "Start Proxy" button
2. Wait for "Running" status (3-5 seconds)
3. Note the proxy endpoint: `http://localhost:3001`

### Step 4: Use the API
Point your OpenAI client to `http://localhost:3001`:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="any-key"  # Not validated
)
```

### Next Steps
- Credentials expire automatically - re-authenticate when needed
- Stop proxy when not in use to save resources
- Credentials are stored locally and securely

---

## 3. For Electron Users - Desktop Quick Start

**Goal**: Faster authentication with native credential extraction

### Prerequisites
- Desktop app installed and running

### Step 1: Authenticate
1. Click "Connect to Qwen" or "Re-login" button
2. Secure browser window opens to `chat.qwen.ai`
3. Log in with your Qwen account credentials
4. Window closes automatically after login detected
5. Credentials extracted and saved instantly
6. Dashboard shows "Authenticated" status immediately

### Step 2: Start Proxy
1. Click "Start Proxy" button
2. Wait for "Running" status (3-5 seconds)
3. Note the proxy endpoint: `http://localhost:3001`

### Step 3: Use the API
Same as web users - point your OpenAI client to the local proxy:
```javascript
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  basePath: "http://localhost:3001/v1",
  apiKey: "any-key"
});

const openai = new OpenAIApi(configuration);
```

### Advantages Over Browser
- No Chrome extension needed
- Faster credential extraction (no polling delay)
- More secure (credentials never leave Electron process)
- Better reliability (no cross-origin issues)

---

## 4. For External Client Users - API Integration

**Goal**: Integrate Qwen into your existing OpenAI-based code

### Prerequisites
- Proxy server running (via Web/Desktop app)
- Valid Qwen credentials configured

### API Endpoint
```
Base URL: http://localhost:3001/v1
API Key: Any value (not validated)
```

### Authentication
The API key is not validated by the proxy - authentication happens through stored Qwen credentials. Use any string as the API key for compatibility.

### Example Code

**Python (OpenAI SDK)**
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="qwen3-max",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

**Node.js (OpenAI SDK)**
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3001/v1',
  apiKey: 'dummy-key'
});

const completion = await openai.chat.completions.create({
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(completion.choices[0].message.content);
```

**cURL (Direct HTTP)**
```bash
curl http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**LangChain (Python)**
```python
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage

chat = ChatOpenAI(
    openai_api_base="http://localhost:3001/v1",
    openai_api_key="dummy-key",
    model_name="qwen3-max"
)

messages = [HumanMessage(content="Hello!")]
response = chat(messages)
print(response.content)
```

### Available Models
Check available models:
```bash
curl http://localhost:3001/v1/models
```

Common Qwen models:
- `qwen3-max` - Most capable model
- `qwen-turbo` - Faster, cost-effective
- `qwen-plus` - Balanced performance

### Supported Endpoints
- `POST /v1/chat/completions` - Chat completions (streaming supported)
- `GET /v1/models` - List available models
- `GET /health` - Server health check

### Error Handling
```python
from openai import OpenAI
from openai.error import OpenAIError

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="dummy-key"
)

try:
    response = client.chat.completions.create(
        model="qwen3-max",
        messages=[{"role": "user", "content": "Hello"}]
    )
except OpenAIError as e:
    print(f"Error: {e}")
    # Check if proxy is running
    # Check if credentials are valid
```

### Common Issues
- **Connection refused**: Proxy server not running - start via dashboard
- **401 Unauthorized**: Qwen credentials expired - re-authenticate
- **Empty responses**: Qwen service issue or invalid credentials

---

## 5. Common Next Steps - After Quick Start

### Understanding Credential Status
- **Active (Green)**: Credentials valid, ready to use
- **Expired (Red)**: Need to re-authenticate
- **Not Connected (Gray)**: No credentials stored

### Managing the Proxy
- **Start Proxy**: Makes API available on port 3001
- **Stop Proxy**: Stops the server to save resources
- **Re-authenticate**: Updates credentials before expiry
- **Revoke**: Deletes stored credentials (use before signing out)

### Monitoring Usage
- Dashboard shows real-time proxy status
- Check "System Status" card for current state
- Status bar at bottom shows active operations

### Switching Providers (Advanced)
The system supports multiple AI providers:
- **Qwen Proxy** (default): Uses your Qwen credentials
- **LM Studio**: Local models if you have LM Studio running
- **Direct Qwen**: Direct API calls (requires separate API key)

To switch providers, use the API:
```bash
curl -X PUT http://localhost:3002/api/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "lm-studio-default"}'
```

### Testing Your Setup
Simple health check:
```bash
# Check proxy is running
curl http://localhost:3001/health

# Test a simple completion
curl http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Say hello"}]}'
```

### Getting Help
- Check the dashboard for error messages
- Review credential expiration dates
- Restart proxy if experiencing issues
- Re-authenticate if credentials expired

---

## 6. What NOT to Include in In-App Guide

**Keep these topics in external documentation only:**

### Technical Implementation Details
- ❌ How the Chrome extension works internally
- ❌ Dapagease schema and storage details
- ❌ IPC communication between Electron processes
- ❌ Cookie extraction mechanisms
- ❌ JWT token parsing logic
- ❌ Backend architecture diagrams

### Advanced Configuration
- ❌ Customizing port numbers
- ❌ Environment variable configuration
- ❌ Backend server setup from scratch
- ❌ Provider router internals
- ❌ Dapagease management
- ❌ Log file locations and rotation

### Development Topics
- ❌ Building from source
- ❌ Contributing guidelines
- ❌ Testing procedures
- ❌ Code architecture
- ❌ API implementation details
- ❌ Debugging techniques

### Troubleshooting Deep Dives
- ❌ Network debugging steps
- ❌ Dapagease query examples
- ❌ Process management commands
- ❌ System logs analysis
- ❌ Performance tuning

### Security Implementation
- ❌ Credential encryption details
- ❌ Storage security mechanisms
- ❌ Network security configurations
- ❌ CORS setup details

**Rationale**: The in-app guide should focus on user-facing tasks that help achieve quick success. Technical details belong in separate developer/admin documentation accessible via external links.

---

## 7. 60-Second Quick Start Structure (In-App Format)

This is the exact format and structure to display inside the running application.

### Component: QuickStartGuide.tsx

**Location**: Modal/Sidebar triggered by "?" or "Quick Start" button

**Layout**: pagebed interface with 3 pages

---

### page 1: Browser Setup (Default)

**Title**: Get Started in 60 Seconds

**Icon**: Browser/Globe icon

**Content Structure**:

```
┌─────────────────────────────────────────────────────┐
│ 🌐 Browser Quick Start                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Step 1: Install Extension (First Time)              │
│ ┌──────────────────────────────────────────┐       │
│ │ • Click "Connect to Qwen" button         │       │
│ │ • Install Chrome extension when prompted │       │
│ │ • Refresh this page                       │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ Step 2: Authenticate                                │
│ ┌──────────────────────────────────────────┐       │
│ │ • Click "Connect to Qwen"                │       │
│ │ • Log in at chat.qwen.ai                 │       │
│ │ • Dashboard updates automatically         │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ Step 3: Start Proxy                                 │
│ ┌──────────────────────────────────────────┐       │
│ │ • Click "Start Proxy" button             │       │
│ │ • Wait for "Running" status              │       │
│ │ • Copy endpoint: localhost:3001          │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ [Start Now →]    [Need Desktop App? →]              │
└─────────────────────────────────────────────────────┘
```

**Interactive Elements**:
- "Start Now" button → Closes guide and highlights "Connect to Qwen" button
- "Need Desktop App?" link → Opens Electron download page

---

### page 2: Desktop Setup

**Title**: Desktop App Quick Start

**Icon**: Desktop/Monitor icon

**Content Structure**:

```
┌─────────────────────────────────────────────────────┐
│ 🖥️  Desktop Quick Start                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Faster authentication. No extension needed.         │
│                                                      │
│ Step 1: Authenticate                                │
│ ┌──────────────────────────────────────────┐       │
│ │ • Click "Connect to Qwen"                │       │
│ │ • Log in when window opens               │       │
│ │ • Credentials saved instantly            │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ Step 2: Start Proxy                                 │
│ ┌──────────────────────────────────────────┐       │
│ │ • Click "Start Proxy"                    │       │
│ │ • Endpoint: localhost:3001               │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ ✨ Benefits                                         │
│ • No Chrome extension required                     │
│ • Instant credential extraction                    │
│ • More secure and reliable                         │
│                                                      │
│ [Start Now →]                                       │
└─────────────────────────────────────────────────────┘
```

**Interactive Elements**:
- "Start Now" button → Closes guide and highlights "Connect to Qwen" button

---

### page 3: API Integration

**Title**: Use with Your Code

**Icon**: Code/Terminal icon

**Content Structure**:

```
┌─────────────────────────────────────────────────────┐
│ 💻 API Integration                                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Endpoint: http://localhost:3001/v1                  │
│ API Key: any-key (not validated)                    │
│                                                      │
│ Quick Test:                                          │
│ ┌──────────────────────────────────────────┐       │
│ │ curl http://localhost:3001/v1/\          │       │
│ │   chat/completions \                     │       │
│ │   -H "Content-Type: application/json" \  │       │
│ │   -H "Authorization: Bearer test" \      │       │
│ │   -d '{"model":"qwen3-max",\             │       │
│ │        "messages":[{"role":"user",\      │       │
│ │                     "content":"Hi"}]}'   │       │
│ │                                          │       │
│ │ [Copy]                                    │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ Python Example:                                      │
│ ┌──────────────────────────────────────────┐       │
│ │ from openai import OpenAI                │       │
│ │                                          │       │
│ │ client = OpenAI(                         │       │
│ │   base_url="http://localhost:3001/v1",  │       │
│ │   api_key="any-key"                      │       │
│ │ )                                        │       │
│ │                                          │       │
│ │ response = client.chat.completions\      │       │
│ │   .create(                               │       │
│ │     model="qwen3-max",                   │       │
│ │     messages=[{"role": "user",           │       │
│ │                "content": "Hello"}]      │       │
│ │   )                                      │       │
│ │                                          │       │
│ │ [Copy]                                    │       │
│ └──────────────────────────────────────────┘       │
│                                                      │
│ [View More Examples →]                              │
└─────────────────────────────────────────────────────┘
```

**Interactive Elements**:
- "Copy" buttons → Copy code to clipboard with confirmation
- "View More Examples" link → Opens modal with Node.js, LangChain examples
- Code blocks have syntax highlighting

---

### Visual Design Guidelines

**Colors**:
- Use theme-aware colors (light/dark mode)
- Step numbers: Primary color (`text-primary`)
- Success states: Green (`text-success`)
- Code blocks: Muted background (`bg-muted`)

**Typography**:
- Headers: `text-lg font-semibold`
- Step labels: `text-sm font-medium`
- Body text: `text-sm text-muted-foreground`
- Code: `font-mono text-xs`

**Spacing**:
- Between steps: `space-y-4`
- Inside boxes: `p-3`
- page content padding: `p-6`

**Components to Use**:
- pages from shadcn/ui
- Card for step containers
- Button for "Copy" and CTAs
- Code block with syntax highlighting

---

### Behavior Specifications

**Opening the Guide**:
- Trigger: Click "?" icon in title bar OR "Quick Start Guide" button
- Animation: Slide in from right (desktop) or full-screen modal (mobile)
- Default page: Auto-detect mode (Browser vs Desktop) and show appropriate page
- First-time users: Auto-show on app launch

**page Switching**:
- Smooth transition animation
- Preserve scroll position per page
- Remember last viewed page in localStorage

**Code Copying**:
- Click "Copy" button → Copy to clipboard
- Show checkmark icon for 2 seconds
- Display toast notification: "Copied to clipboard"

**CTA Buttons**:
- "Start Now" → Close guide, highlight relevant dashboard button with pulse animation
- "View More Examples" → Open expanded examples modal
- External links → Open in new page/window

**Responsive Design**:
- Desktop (>768px): Right sidebar overlay (400px width)
- Mobile (<768px): Full-screen modal
- Code blocks: Horizontal scroll if needed
- page labels: Icon + text on desktop, icon only on mobile

**Accessibility**:
- Keyboard navigation: page through steps, Esc to close
- Screen reader: Proper ARIA labels for pages and steps
- Focus management: Return focus to trigger button on close
- High contrast mode support

---

### State Management

**Component State**:
```typescript
interface QuickStartState {
  isOpen: boolean;
  activepage: 'browser' | 'desktop' | 'api';
  hasSeenBefore: boolean;
  currentStep: number; // For progress tracking
}
```

**Persistence**:
- `hasSeenBefore` → localStorage
- `activepage` → sessionStorage
- Reset on app update/version change

**Auto-Show Logic**:
```typescript
if (!hasSeenBefore && !hasValidCredentials) {
  showQuickStart();
  setHasSeenBefore(true);
}
```

---

### Content Principles

**Writing Style**:
- Active voice, imperative mood ("Click", "Copy", "Start")
- Second person ("You can", "Your code")
- Short sentences (<15 words)
- Bullet points over paragraphs
- No jargon or technical terms

**Information Hierarchy**:
1. What to do (action)
2. Where to do it (location)
3. What happens (result)
4. Why it matters (benefit)

**Success Criteria**:
- User can authenticate in <60 seconds
- User knows their endpoint URL
- User can copy working code example
- User knows next steps if stuck

---

## 8. Implementation Checklist

### Component Files
- [ ] `QuickStartGuide.tsx` - Main component with pages
- [ ] `BrowserQuickStart.tsx` - Browser setup content
- [ ] `DesktopQuickStart.tsx` - Desktop setup content
- [ ] `APIQuickStart.tsx` - API integration content
- [ ] `CodeBlock.tsx` - Syntax-highlighted code with copy button
- [ ] `useQuickStart.ts` - Hook for state management

### Features
- [ ] Auto-detect environment (browser vs desktop)
- [ ] Default to appropriate page based on mode
- [ ] Copy to clipboard functionality
- [ ] Syntax highlighting for code blocks
- [ ] Responsive layout (sidebar/modal)
- [ ] Keyboard navigation
- [ ] First-time auto-show logic
- [ ] Close and highlight CTA button

### Content
- [ ] All code examples tested and working
- [ ] All endpoint URLs correct
- [ ] All button labels match dashboard
- [ ] All steps accurate for current version
- [ ] Examples cover Python, Node.js, cURL
- [ ] Error messages helpful and actionable

### Styling
- [ ] Theme-aware (light/dark mode)
- [ ] Uses shadcn/ui pages component
- [ ] Proper spacing and typography
- [ ] Smooth animations
- [ ] Mobile-friendly
- [ ] High contrast mode support

### Testing
- [ ] Test on browser mode
- [ ] Test on desktop mode
- [ ] Test all copy buttons
- [ ] Test page switching
- [ ] Test responsive breakpoints
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test first-time auto-show
- [ ] Verify all code examples work

---

## Summary

This specification provides everything needed to implement an in-app Quick Start Guide that:

1. **Helps users succeed in under 60 seconds** with clear, actionable steps
2. **Adapts to user context** (browser vs desktop vs API integration)
3. **Provides working code examples** that can be copied and used immediately
4. **Focuses on user goals** rather than technical implementation
5. **Maintains consistency** with the rest of the application UI

The guide should be implemented as a component that can be triggered from the main dashboard and provides contextual help based on the user's current environment and needs.

