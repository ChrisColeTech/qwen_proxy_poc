### Instructions
YOU are the architect. Your job is to assign each task to subagents. The subagents job is to read and complete the work in the task files.

## Steps
1.) read the `TASK_SUMMARY.md` file

2.) assign one file path per sub agent using the message template.

**Note: replace the macros in the template with the correct `[phase]` and `(file path)`. do not read the task files yourself. only the subagents should read the task files.**

## Here is the message template:

```bash
[phase](file path)

1.) read the file, create a todo list for the steps, and systematically complete the work on the todo list

2.) follow the **instructions and exact commands** in the document explicitly

3.) run 'npm run build' after completing the work and resolve all warnings and errors.
```

## Assign one file path per agent

[PHASE 01](docs/tasks-v2/01_PHASE_1_Type_Definitions_and_Interfaces.md)
[PHASE 02](docs/tasks-v2/02_PHASE_2_API_Configuration.md)
[PHASE 03](docs/tasks-v2/03_PHASE_3_API_Service_Layer.md)
[PHASE 04](docs/tasks-v2/04_PHASE_4_Electron_IPC_Service_Layer.md)
[PHASE 05](docs/tasks-v2/05_PHASE_5_Status_and_Health_Hooks.md)
[PHASE 06](docs/tasks-v2/06_PHASE_6_Proxy_Control_Hook.md)
[PHASE 07](docs/tasks-v2/07_PHASE_7_Credentials_Service.md)
[PHASE 08](docs/tasks-v2/08_PHASE_8_Proxy_Control_Components.md)
[PHASE 09](docs/tasks-v2/09_PHASE_9_Credentials_Management_Components.md)
[PHASE 10](docs/tasks-v2/10_PHASE_10_Dashboard_Page.md)
[PHASE 11](docs/tasks-v2/11_PHASE_11_Settings_Page.md)
[PHASE 12](docs/tasks-v2/12_PHASE_12_Providers_Page.md)
[PHASE 14](docs/tasks-v2/14_PHASE_14_Activity_Page.md)
[PHASE 16](docs/tasks-v2/16_PHASE_16_Navigation_and_Routing.md)
[PHASE 17](docs/tasks-v2/17_PHASE_17_Electron_Qwen_Authentication.md)
[PHASE 18](docs/tasks-v2/18_PHASE_18_Electron_API_Server_Lifecycle.md)

---

## Notes

### Phase 13 Removed
Phase 13 (Models Page) has been combined with Phase 12 (Providers Page) as Models is now a child page of Providers. See Phase 12 for the complete implementation.

### Phase 15 Removed
Phase 15 (Activity Page) has been combined with Phase 14. Activity is now a parent page with Sessions, Requests, and Responses as sibling children (not grandchildren). This provides better organization of monitoring/logging features under a single Activity tab.

### Page Structure
All page phases (10-15) now follow a parent-child router pattern with:
- Parent router component (e.g., `DashboardPage.tsx`)
- Desktop main page with 3x3 grid layout (e.g., `DashboardMainPage.tsx`)
- Mobile main page with single column (e.g., `MobileDashboardMainPage.tsx`)
- Child pages where applicable (e.g., Models under Providers, Requests/Responses under Sessions)

### Priority Levels
- **P0** (Phases 1-4): Foundation - blocking all other work
- **P1** (Phases 5-7): Core functionality - blocking feature components
- **P2** (Phases 8-9): Feature components - blocking pages
- **P3** (Phases 10-16): Pages and navigation - user-facing features
- **P4** (Phases 17-18): Electron lifecycle - production readiness

### Implementation Order
Phases should be completed in order as each phase depends on previous phases. See the "Dependencies" section in each phase document for specific requirements.

### Architecture References
- **Doc 27**: Frontend Architecture Guide (communication patterns, service layer separation)
- **Doc 44**: Frontend Feature Implementation Plan (master reference for all phases)
- **Doc 43**: Database Schema Reference (database structure)
- **Doc 26**: Backend Architecture Guide (API endpoints)
