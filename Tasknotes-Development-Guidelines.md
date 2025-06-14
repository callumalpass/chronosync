# TaskNotes Plugin: Architecture & Developer's Guide

## 1. Introduction & Guiding Principles

This guide is designed to help you understand the architecture of the TaskNotes plugin, ensuring that new features and updates are implemented in a way that is consistent, maintainable, and performant.

The architecture of this plugin is built on several key principles:

*   **Separation of Concerns:** Logic is separated into distinct layers: UI (Views & Components), Business Logic (Services), and Data (Cache & File System). This makes the codebase easier to reason about and test.
*   **Single Source of Truth:** The `CacheManager` is the canonical source for all task and note data at runtime. All reads should go through the cache, and all writes must be funneled through a `Service` that updates both the file system and the cache.
*   **Unidirectional Data Flow:** Changes flow in one direction: User Action -> Service -> File System -> Cache -> Event -> UI Update. This predictable pattern prevents complex state management issues and race conditions.
*   **Event-Driven Communication:** Components are decoupled. Instead of calling each other directly, they emit and listen for events via a central `EventEmitter`. This allows new components to be added without modifying existing ones.
*   **Performance First:** The architecture is designed to be highly performant, especially for users with large vaults. This is achieved through aggressive caching, request deduplication, and an efficient DOM reconciliation strategy.
*   **Configuration-Driven:** Core functionalities like statuses, priorities, and field names are not hard-coded. They are managed by dedicated services (`StatusManager`, `PriorityManager`, `FieldMapper`) that interpret user settings, making the plugin highly customizable.

## 2. High-Level Architecture Diagram

This diagram illustrates the flow of data and events within the plugin.

```
+----------------+       +------------------+       +------------------+
|   User Input   |------>|   UI / Views     |------>|   Services       |
| (Click, Drag)  |       | (Agenda, Kanban) |       | (TaskService, etc) |
+----------------+       +------------------+       +------------------+
      ^                                                     |
      |                                                     | (1. Write to file)
      |                                                     v
      |                                               +------------+
      | (5. UI Update via                               | File System|
      |     DOMReconciler)                              |  (.md)     |
      |                                               +------------+
      |                                                     ^
      |                                                     | (2. Update cache)
      +---------------------+                               |
+---------------------+     |                         +------------------+
|    DOMReconciler    |     | (4. Views listen        |  CacheManager    | (Single Source
| (Efficient Updates) |<----+     for events)         | (In-memory data) |  of Truth)
+---------------------+     |                         +------------------+
                            |                               |
                            |                               | (3. Emit event)
                            v                               v
                          +-----------------------------------+
                          |     EventEmitter (Decouples)      |
                          +-----------------------------------+
```

## 3. Directory Structure

The project is organized to reflect the architectural layers:

*   `/src/`
    *   `main.ts`: The plugin's entry point. It initializes all services, views, and commands.
    *   `types.ts`: **Crucial.** Contains all shared type definitions. All new types should be added here.
    *   `/views/`: Contains the primary UI views (`TaskListView`, `AgendaView`, `KanbanView`, etc.), which are `ItemView` implementations registered with Obsidian.
    *   `/ui/`: Contains reusable, "dumb" UI components like `TaskCard`, `NoteCard`, and `FilterBar`. These components are responsible for rendering data, not fetching it.
    *   `/modals/`: Contains all modals for user interaction (`TaskCreationModal`, `TaskEditModal`, etc.).
    *   `/services/`: The core business logic of the plugin resides here. Each service has a specific responsibility (e.g., `TaskService` for CRUD, `FilterService` for querying, `PomodoroService` for timers).
    *   `/editor/`: Contains CodeMirror extensions that enhance the Obsidian editor, like `TaskLinkWidget` and `InstantConvertButtons`.
    *   `/utils/`: Contains helper classes and functions that support the entire plugin, such as `CacheManager`, `EventEmitter`, `dateUtils`, and `DOMReconciler`.
    *   `/settings/`: Contains the settings tab UI and default settings configuration.
*   `/styles/`: Contains all CSS files, which are compiled into a single `styles.css`.

## 4. Key Architectural Concepts

### 4.1. The Data Flow: A Step-by-Step Guide

Understanding this flow is the most important part of contributing to the plugin.

1.  **User Action**: A user interacts with the UI (e.g., clicks "Archive" on a `TaskCard`).
2.  **Service Call**: The UI component's event handler calls the relevant method in a service (e.g., `plugin.taskService.toggleArchive(task)`). **UI components should never modify data directly.**
3.  **File System Write**: The service performs the necessary changes on the Markdown file's frontmatter.
4.  **Cache Update**: After a successful file write, the service **proactively updates the `CacheManager`** with the new `TaskInfo` object. This is critical for keeping the UI instantly responsive.
5.  **Event Emission**: The service emits a global event via `plugin.emitter` (e.g., `EVENT_TASK_UPDATED`) with the updated data.
6.  **View Refresh**: All active views listen for relevant events. Upon receiving an event, they trigger a refresh, fetching the new, authoritative data from the `CacheManager`.
7.  **DOM Reconciliation**: Views use the `DOMReconciler` to efficiently update only the parts of the UI that have changed, preventing full-page re-renders and preserving UI state like scroll position.

### 4.2. The Cache (`CacheManager`) - The Single Source of Truth

The `CacheManager` is the heart of the plugin's data layer. It provides a fast, in-memory representation of all tasks and notes.

*   **Purpose**: To minimize disk I/O and provide instantaneous data access to the UI. It prevents every view from having to read and parse files independently.
*   **How it Works**:
    *   On startup, it performs an initial scan of the vault to build its indexes.
    *   It maintains several caches: raw file content, parsed YAML, and fully processed `TaskInfo` and `NoteInfo` objects.
    *   It creates and maintains several indexes for fast lookups (e.g., `tasksByDate`, `tasksByStatus`, `overdueTasks`).
    *   It listens to `vault` events (`modify`, `delete`, `rename`) to automatically keep the cache up-to-date.
*   **Developer Best Practices**:
    *   **Always read from the cache**. Use `cacheManager.getCachedTaskInfo(path)` for synchronous access or `cacheManager.getTaskInfo(path)` for an async call that reads from the file if not cached.
    *   **NEVER write to the cache directly**. All writes must go through a service (e.g., `TaskService`).
    *   Services are responsible for calling `cacheManager.updateTaskInfoInCache(path, newTaskInfo)` after a file has been successfully modified. This proactive update is key to UI responsiveness.
    *   When adding a new indexed property, ensure you add logic to both `updateTaskIndexes` and `removeFromIndexes` in `CacheManager` for it to be maintained correctly.

### 4.3. The Event System (`EventEmitter`)

The `EventEmitter` is the nervous system of the plugin, enabling decoupled communication.

*   **Purpose**: To allow components to react to changes without having direct references to each other. For example, when `TaskService` updates a task, it doesn't need to know which views are open; it just emits an `EVENT_TASK_UPDATED` event.
*   **How it Works**: It's a simple pub/sub model. Components `on()` an event and provide a callback. Other components `emit()` an event, triggering all subscribed callbacks.
*   **Developer Best Practices**:
    *   **Use predefined event types** from `/src/types.ts`. If you need a new event, add it there first.
    *   Keep event payloads minimal and consistent. Pass the essential data needed for subscribers to react (e.g., `{ path, updatedTask }`).
    *   Remember to clean up listeners. All views that register listeners should call the returned `unsubscribe` function in their `onClose()` or `destroy()` methods. The provided code already does this correctly in a `listeners` array.

### 4.4. Date and Time Management (`dateUtils.ts`)

Handling dates and times is notoriously difficult due to timezones and different formats. This plugin standardizes date/time handling through `dateUtils.ts`.

*   **The Problem**: JavaScript's `new Date()` is inconsistent. `new Date('2023-10-27')` creates a UTC date, while `new Date('2023-10-27T10:00:00')` creates a local timezone date. This leads to "off-by-one-day" errors.
*   **The Solution**: A set of centralized utility functions in `dateUtils.ts` that handle these nuances.
*   **Developer Best Practices**:
    *   **Never use `new Date(dateString)` directly.** Always use `parseDate(dateString)` from `dateUtils.ts`. It intelligently handles both date-only and full ISO timestamp strings.
    *   For comparisons, use the provided safe functions: `isSameDateSafe`, `isBeforeDateSafe`, `isOverdueTimeAware`. These functions correctly normalize dates before comparing.
    *   When creating a new timestamp for `dateCreated` or `dateModified`, always use `getCurrentTimestamp()`. This generates a consistent, timezone-aware ISO string.
    *   When you only need the date part (e.g., `YYYY-MM-DD`), use `getDatePart(dateString)`.
    *   Use `hasTimeComponent(dateString)` to determine if a date string includes time information, and branch your logic accordingly.

### 4.5. The UI Layer (Views and Components)

*   **Views (`/views/`)**: These are the main panels of the plugin (e.g., `AgendaView`). They are stateful and responsible for fetching data (via `FilterService`), managing user interactions, and orchestrating the rendering of their content. They should contain the `FilterBar` and the main content display.
*   **Reusable Components (`/ui/`)**: These are "dumb" components like `TaskCard` and `NoteCard`.
    *   They receive data as props (`createTaskCard(task, plugin, options)`).
    *   They are responsible only for rendering that data into HTML.
    *   They should not contain business logic. Any user interaction (like a button click) should call a method on the `plugin` or a `service` passed in as a prop.
*   **DOMReconciler**: To ensure high performance, views do not re-render their entire HTML on every data change. Instead, they use `plugin.domReconciler.updateList()`. This utility efficiently diffs the new data against the existing DOM, only adding, removing, or updating the elements that have changed. When creating new list-based UIs, you should use this reconciler.

### 4.6. The Field Mapper (`FieldMapper.ts`) - The Data Translator

This is a critical architectural component that enables user customization.

*   **Purpose**: The `FieldMapper` is a "translator" service. Its primary purpose is to decouple the plugin's internal `TaskInfo` property names (e.g., `scheduled`, `timeEstimate`) from the user-configurable property names in the YAML frontmatter of their task files. This allows users to name their properties whatever they like (e.g., `schedule_on`, `estimate_minutes`) without breaking the plugin.

*   **How it Works**: It provides a two-way mapping.
    *   **Reading (File -> `TaskInfo`)**: When `CacheManager` reads a file, its frontmatter is passed to `fieldMapper.mapFromFrontmatter(frontmatter)`. The service uses the mapping in `settings.fieldMapping` to create a standardized `TaskInfo` object. For example, if the user setting is `{ due: "deadline" }`, the mapper will take `frontmatter.deadline` and put its value into the `taskInfo.due` field.
    *   **Writing (`TaskInfo` -> File)**: When `TaskService` saves a task, it passes the internal `TaskInfo` object to `fieldMapper.mapToFrontmatter(taskInfo)`. This creates a frontmatter object ready for serialization. For example, `taskInfo.due` will be written as `deadline: ...` in the YAML.

*   **Developer Best Practices**:
    *   **Central Point of Interaction**: Any service that directly reads or writes task frontmatter (`CacheManager`, `TaskService`) **must** use the `FieldMapper`.
    *   **Stable Internal API**: Within the plugin's TypeScript code (views, components, other services), you should **always** interact with the standardized `TaskInfo` properties (`task.due`, `task.priority`, etc.). The `FieldMapper` is the boundary layer that handles the translation to/from the user's world.
    *   **Avoid Hard-coding**: **Never** write code that directly accesses a frontmatter property like `frontmatter.due`. Always use the mapper to get the user-configured field name first.
    *   **Extensibility**: When adding a new persistent property to tasks, you must add it to the `FieldMapping` type in `types.ts`, the `DEFAULT_FIELD_MAPPING` in `settings.ts`, and the mapping logic in `FieldMapper.ts`.

## 5. Developer's Guide: How to Implement Common Changes

### 5.1. Adding a New Property to Tasks

Let's say you want to add a `complexity: 'simple' | 'medium' | 'hard'` property to tasks.

1.  **Update `types.ts`**: Add `complexity?: string;` to the `TaskInfo` interface.
2.  **Update `settings.ts`**:
    *   Add `complexity: string;` to the `FieldMapping` interface in `DEFAULT_FIELD_MAPPING`.
    *   Add a new setting in the `TaskNotesSettingTab` to allow users to configure the property name.
3.  **Update `FieldMapper.ts`**: Add logic to `mapFromFrontmatter` and `mapToFrontmatter` to handle the new `complexity` field.
4.  **Update `TaskService.ts`**:
    *   In `createTask`, handle the new property, possibly applying a default value.
    *   In `updateTask`, ensure the new property can be updated.
5.  **Update `BaseTaskModal.ts`**: Add a dropdown or input field to `TaskCreationModal` and `TaskEditModal` to allow users to set the complexity.
6.  **Update `TaskCard.ts`**: In `createTaskCard` and `updateTaskCard`, add logic to display the new complexity information (e.g., an icon or text in the metadata line).
7.  **Update `FilterService.ts` (Optional)**: If you want to filter by complexity, you'll need to:
    *   Add a `complexity` index to `CacheManager`.
    *   Update `updateTaskIndexes` and `removeFromIndexes` in `CacheManager` to maintain the new index.
    *   Add logic to `FilterService.matchesQuery` to filter by complexity.
    *   Add a complexity filter control to `FilterBar.ts`.

### 5.2. Walkthrough: Modifying a Task Property

Let's trace the flow of changing a task's priority from a `TaskCard`.

1.  **UI (`TaskCard.ts`)**: The user right-clicks the card and selects a new priority from the context menu.
2.  **Event Handler**: The `onClick` handler for the menu item calls `plugin.updateTaskProperty(task, 'priority', newPriorityValue)`.
3.  **Main Plugin (`main.ts`)**: The `updateTaskProperty` method is a convenience wrapper that calls `this.taskService.updateProperty(...)`.
4.  **Service (`TaskService.ts`)**: The `updateProperty` method is executed.
    a. It finds the `TFile` for the task.
    b. It uses `app.fileManager.processFrontMatter()` to open the file and update the YAML. It uses the `fieldMapper` to get the correct property name (e.g., it might write `prio: high` instead of `priority: high` if the user configured it that way). It also updates the `dateModified` property.
    c. After the file write is successful, it calls `this.plugin.cacheManager.updateTaskInfoInCache(path, updatedTask)` to **proactively update the cache**.
    d. It then calls `this.plugin.emitter.emit(EVENT_TASK_UPDATED, { path, updatedTask })`.
5.  **Event Listeners**:
    *   **`TaskListView.ts`**: The view's listener for `EVENT_TASK_UPDATED` fires. It finds the corresponding `HTMLElement` for the task in its `taskElements` map and calls `updateTaskCard(element, updatedTask, ...)` to efficiently re-render just that one card.
    *   **`AgendaView.ts`**: Its listener fires. Since a priority change might affect sorting, it triggers a full `refresh()`, which re-fetches data from `FilterService` and uses the `DOMReconciler` to update the view.
    *   **Editor (`TaskLinkOverlay.ts`)**: The global listener in `main.ts` dispatches a `taskUpdateEffect` to all open editors. The `TaskLinkField` sees this effect and redraws any `TaskLinkWidget`s for the affected task path.

This entire flow happens almost instantaneously, giving the user immediate feedback while ensuring data integrity and consistency across the entire plugin. By following this pattern, you ensure your new features will be robust and well-integrated.
