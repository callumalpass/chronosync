// View types
export const CALENDAR_VIEW_TYPE = 'tasknotes-calendar-view';
export const TASK_LIST_VIEW_TYPE = 'tasknotes-task-list-view';
export const NOTES_VIEW_TYPE = 'tasknotes-notes-view';
export const AGENDA_VIEW_TYPE = 'tasknotes-agenda-view';
export const POMODORO_VIEW_TYPE = 'tasknotes-pomodoro-view';

// Event types
export const EVENT_DATE_SELECTED = 'date-selected';
export const EVENT_TAB_CHANGED = 'tab-changed';
export const EVENT_DATA_CHANGED = 'data-changed';
export const EVENT_TASK_UPDATED = 'task-updated';
export const EVENT_POMODORO_START = 'pomodoro-start';
export const EVENT_POMODORO_COMPLETE = 'pomodoro-complete';
export const EVENT_POMODORO_INTERRUPT = 'pomodoro-interrupt';
export const EVENT_POMODORO_TICK = 'pomodoro-tick';

// Calendar colorization modes
export type ColorizeMode = 'tasks' | 'notes' | 'daily';

// Calendar display modes
export type CalendarDisplayMode = 'month' | 'agenda';

// Task sorting and grouping types
export type TaskSortKey = 'due' | 'priority' | 'title';
export type TaskGroupKey = 'none' | 'priority' | 'context' | 'due' | 'status';

// Time and date related types
export interface TimeInfo {
	hours: number;
	minutes: number;
}

// Task types
export interface RecurrenceInfo {
	frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
	days_of_week?: string[];  // For weekly recurrence: ['mon', 'tue', etc.]
	day_of_month?: number;    // For monthly/yearly recurrence: 1-31
	month_of_year?: number;   // For yearly recurrence: 1-12
}

export interface TaskInfo {
	title: string;
	status: string;
	priority: string;
	due?: string;
	path: string;
	archived: boolean;
	tags?: string[];
	contexts?: string[];
	recurrence?: RecurrenceInfo;
	complete_instances?: string[]; // Array of dates (YYYY-MM-DD) when recurring task was completed
	completedDate?: string; // Date (YYYY-MM-DD) when task was marked as done
	timeEstimate?: number; // Estimated time in minutes
	timeEntries?: TimeEntry[]; // Individual time tracking sessions
	dateCreated?: string; // Creation date (ISO timestamp)
	dateModified?: string; // Last modification date (ISO timestamp)
}

export interface TimeEntry {
	startTime: string; // ISO timestamp
	endTime?: string; // ISO timestamp, undefined if currently running
	description?: string; // Optional description of what was worked on
}

// Note types
export interface NoteInfo {
	title: string;
	tags: string[];
	path: string;
	createdDate?: string;
	lastModified?: number; // Timestamp of last modification
}

// File index types
export interface FileIndex {
	taskFiles: IndexedFile[];
	noteFiles: IndexedFile[];
	lastIndexed: number;
}

export interface IndexedFile {
	path: string;
	mtime: number;
	ctime: number;
	tags?: string[];
	isTask?: boolean;
	cachedInfo?: TaskInfo | NoteInfo;
}

// YAML Frontmatter types
export interface DailyNoteFrontmatter {
	date?: string;
	tags?: string[];
	important?: boolean;
}

export interface TaskFrontmatter {
	title: string;
	dateCreated: string;
	dateModified: string;
	status: 'open' | 'in-progress' | 'done';
	due?: string;
	tags: string[];
	priority: 'low' | 'normal' | 'high';
	contexts?: string[];
	recurrence?: RecurrenceInfo;
	complete_instances?: string[];
	completedDate?: string;
	timeEstimate?: number;
	timeEntries?: TimeEntry[];
}

export interface NoteFrontmatter {
	title: string;
	dateCreated: string;
	dateModified?: string;
	tags?: string[];
}

// Event handler types
export interface FileEventHandlers {
	modify?: (file: any) => void;
	delete?: (file: any) => void;
	rename?: (file: any, oldPath: string) => void;
	create?: (file: any) => void;
}

// Pomodoro types
export interface PomodoroSession {
	id: string;
	taskPath?: string; // optional, can run timer without task
	startTime: string; // ISO datetime
	endTime?: string; // ISO datetime when completed
	duration: number; // planned duration in minutes
	type: 'work' | 'short-break' | 'long-break';
	completed: boolean;
	interrupted?: boolean;
}

export interface PomodoroState {
	isRunning: boolean;
	currentSession?: PomodoroSession;
	timeRemaining: number; // seconds
	pomodorosCompleted: number; // today's count
	currentStreak: number; // consecutive pomodoros
	totalMinutesToday: number; // total focused minutes today
}

// Field mapping and customization types
export interface FieldMapping {
	title: string;
	status: string;
	priority: string;
	due: string;
	contexts: string;
	timeEstimate: string;
	completedDate: string;
	dateCreated: string;
	dateModified: string;
	recurrence: string;
	archiveTag: string;  // For the archive tag in the tags array
}

export interface StatusConfig {
	id: string;           // Unique identifier
	value: string;        // What gets written to YAML
	label: string;        // What displays in UI
	color: string;        // Hex color for UI elements
	isCompleted: boolean; // Whether this counts as "done"
	order: number;        // Sort order (for cycling)
}

export interface PriorityConfig {
	id: string;          // Unique identifier
	value: string;       // What gets written to YAML
	label: string;       // What displays in UI
	color: string;       // Hex color for indicators
	weight: number;      // For sorting (higher = more important)
}

// Template configuration for quick setup
export interface Template {
	id: string;
	name: string;
	description: string;
	config: {
		fieldMapping: Partial<FieldMapping>;
		customStatuses: StatusConfig[];
		customPriorities: PriorityConfig[];
	};
}

// Configuration export/import
export interface ExportedConfig {
	version: string;
	fieldMapping: FieldMapping;
	customStatuses: StatusConfig[];
	customPriorities: PriorityConfig[];
}