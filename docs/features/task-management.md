# Task Management

TaskNotes provides a system for managing tasks, which is built on the principle of "one note per task." This approach allows you to create, edit, and organize your tasks with a set of properties, while maintaining the portability and extensibility of plain text files.

## Creating and Editing Tasks

You can create and edit tasks in a variety of ways. The primary method is through the **Task Creation Modal**, which can be accessed via the "Create new task" command or by clicking on dates or time slots in the calendar views. This modal provides an interface for setting all available task properties, including title, status, priority, and due dates.

TaskNotes also supports **Natural Language Creation**, which allows you to create tasks by typing descriptions in plain English. The built-in parser can extract structured data from phrases like "Buy groceries tomorrow at 3pm @home #errands high priority."

Additionally, you can convert existing checkbox tasks in your notes to TaskNotes using the **Instant Conversion** feature.

## Task Properties

Each task in TaskNotes is a Markdown file with a YAML frontmatter block that stores its properties. The core properties include:

- **Title**: The main description of the task.
- **Status**: The current state of the task (e.g., "Open," "In Progress," "Done").
- **Priority**: The importance of the task (e.g., "Low," "Normal," "High").
- **Due Date**: The date by which the task must be completed.
- **Scheduled Date**: The date on which you plan to work on the task.
- **Contexts**: Location or tool-based groupings (e.g., "@home", "@work").
- **Tags**: Standard Obsidian tags for categorization.
- **Time Estimate**: The estimated time required to complete the task, in minutes.
- **Recurrence**: The pattern for repeating tasks, using the RRule standard.
- **Time Entries**: An array of recorded work sessions, with start and stop times.

You can also add your own custom fields to the YAML frontmatter, and use the **Field Mapping** feature to map them to TaskNotes' internal properties.

## File Management and Templates

TaskNotes provides a system for managing your task files. You can specify a **Default Tasks Folder** where all new tasks will be created, and you can choose from a variety of **Filename Generation** patterns, including title-based, timestamp-based, and Zettelkasten-style.

TaskNotes also supports **Templates** for both the YAML frontmatter and the body of your task notes. You can use templates to pre-fill common values, add boilerplate text, and create a consistent structure for your tasks. Templates can also include variables, such as `{{title}}`, `{{date}}`, and `{{parentNote}}`, which will be automatically replaced with the appropriate values when a new task is created.