import { App, PluginSettingTab, Setting, Notice, setIcon } from 'obsidian';
import TaskNotesPlugin from '../main';
import { FieldMapping, StatusConfig, PriorityConfig } from '../types';
import { StatusManager } from '../services/StatusManager';
import { PriorityManager } from '../services/PriorityManager';

export interface TaskNotesSettings {
	tasksFolder: string;  // Now just a default location for new tasks
	taskTag: string;      // The tag that identifies tasks
	excludedFolders: string;  // Comma-separated list of folders to exclude from Notes tab
	defaultTaskPriority: string;  // Changed to string to support custom priorities
	defaultTaskStatus: string;    // Changed to string to support custom statuses
	taskOrgFiltersCollapsed: boolean;  // Save collapse state of task organization filters
	// Task filename settings
	taskFilenameFormat: 'title' | 'zettel' | 'timestamp' | 'custom';
	customFilenameTemplate: string; // Template for custom format
	// Task creation defaults
	taskCreationDefaults: TaskCreationDefaults;
	// Calendar view settings
	calendarViewSettings: CalendarViewSettings;
	// Pomodoro settings
	pomodoroWorkDuration: number; // minutes
	pomodoroShortBreakDuration: number; // minutes
	pomodoroLongBreakDuration: number; // minutes
	pomodoroLongBreakInterval: number; // after X pomodoros
	pomodoroAutoStartBreaks: boolean;
	pomodoroAutoStartWork: boolean;
	pomodoroNotifications: boolean;
	pomodoroSoundEnabled: boolean;
	pomodoroSoundVolume: number; // 0-100
	pomodoroStorageLocation: 'plugin' | 'daily-notes'; // where to store pomodoro history data
	// Editor settings
	enableTaskLinkOverlay: boolean;
	enableInstantTaskConvert: boolean;
	useDefaultsOnInstantConvert: boolean;
	// Customization settings
	fieldMapping: FieldMapping;
	customStatuses: StatusConfig[];
	customPriorities: PriorityConfig[];
}

export interface TaskCreationDefaults {
	// Pre-fill options
	defaultContexts: string;  // Comma-separated list
	defaultTags: string;      // Comma-separated list
	defaultTimeEstimate: number; // minutes, 0 = no default
	defaultRecurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
	defaultFolder: string;    // Override default tasks folder for new tasks
	// Date defaults
	defaultDueDate: 'none' | 'today' | 'tomorrow' | 'next-week';
	defaultScheduledDate: 'none' | 'today' | 'tomorrow' | 'next-week';
	// Body template settings
	bodyTemplate: string;     // Path to template file for task body, empty = no template
	useBodyTemplate: boolean; // Whether to use body template by default
}

export interface CalendarViewSettings {
	// Default view
	defaultView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'multiMonthYear';
	// Time settings
	slotDuration: '00:15:00' | '00:30:00' | '01:00:00'; // 15, 30, or 60 minutes
	slotMinTime: string; // Start time (HH:MM:SS format)
	slotMaxTime: string; // End time (HH:MM:SS format)
	scrollTime: string; // Initial scroll position (HH:MM:SS format)
	// Week settings
	firstDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
	// Display preferences
	timeFormat: '12' | '24'; // 12-hour or 24-hour format
	showWeekends: boolean;
	// Default event type visibility
	defaultShowScheduled: boolean;
	defaultShowDue: boolean;
	defaultShowTimeEntries: boolean;
	defaultShowRecurring: boolean;
	defaultShowICSEvents: boolean;
	// Calendar behavior
	nowIndicator: boolean;
	selectMirror: boolean;
	weekNumbers: boolean;
}

// Default field mapping maintains backward compatibility
export const DEFAULT_FIELD_MAPPING: FieldMapping = {
	title: 'title',
	status: 'status',
	priority: 'priority',
	due: 'due',
	scheduled: 'scheduled',
	contexts: 'contexts',
	timeEstimate: 'timeEstimate',
	completedDate: 'completedDate',
	dateCreated: 'dateCreated',
	dateModified: 'dateModified',
	recurrence: 'recurrence',
	archiveTag: 'archived',
	timeEntries: 'timeEntries',
	completeInstances: 'complete_instances',
	pomodoros: 'pomodoros'
};

// Default status configuration matches current hardcoded behavior
export const DEFAULT_STATUSES: StatusConfig[] = [
	{
		id: 'none',
		value: 'none',
		label: 'None',
		color: '#cccccc',
		isCompleted: false,
		order: 0
	},
	{
		id: 'open',
		value: 'open',
		label: 'Open',
		color: '#808080',
		isCompleted: false,
		order: 1
	},
	{
		id: 'in-progress',
		value: 'in-progress',
		label: 'In progress',
		color: '#0066cc',
		isCompleted: false,
		order: 2
	},
	{
		id: 'done',
		value: 'done',
		label: 'Done',
		color: '#00aa00',
		isCompleted: true,
		order: 3
	}
];

// Default priority configuration matches current hardcoded behavior
export const DEFAULT_PRIORITIES: PriorityConfig[] = [
	{
		id: 'none',
		value: 'none',
		label: 'None',
		color: '#cccccc',
		weight: 0
	},
	{
		id: 'low',
		value: 'low',
		label: 'Low',
		color: '#00aa00',
		weight: 1
	},
	{
		id: 'normal',
		value: 'normal',
		label: 'Normal',
		color: '#ffaa00',
		weight: 2
	},
	{
		id: 'high',
		value: 'high',
		label: 'High',
		color: '#ff0000',
		weight: 3
	}
];

export const DEFAULT_TASK_CREATION_DEFAULTS: TaskCreationDefaults = {
	defaultContexts: '',
	defaultTags: '',
	defaultTimeEstimate: 0,
	defaultRecurrence: 'none',
	defaultFolder: '',
	defaultDueDate: 'none',
	defaultScheduledDate: 'today',
	bodyTemplate: '',
	useBodyTemplate: false
};

export const DEFAULT_CALENDAR_VIEW_SETTINGS: CalendarViewSettings = {
	// Default view
	defaultView: 'dayGridMonth',
	// Time settings
	slotDuration: '00:30:00', // 30-minute slots
	slotMinTime: '00:00:00', // Start at midnight
	slotMaxTime: '24:00:00', // End at midnight next day
	scrollTime: '08:00:00', // Scroll to 8 AM
	// Week settings
	firstDay: 1, // Monday
	// Display preferences
	timeFormat: '24', // 24-hour format
	showWeekends: true,
	// Default event type visibility
	defaultShowScheduled: true,
	defaultShowDue: true,
	defaultShowTimeEntries: false,
	defaultShowRecurring: true,
	defaultShowICSEvents: true,
	// Calendar behavior
	nowIndicator: true,
	selectMirror: true,
	weekNumbers: false
};

export const DEFAULT_SETTINGS: TaskNotesSettings = {
	tasksFolder: 'TaskNotes/Tasks',
	taskTag: 'task',
	excludedFolders: '',  // Default to no excluded folders
	defaultTaskPriority: 'normal',
	defaultTaskStatus: 'open',
	taskOrgFiltersCollapsed: false,  // Default to expanded
	// Task filename defaults
	taskFilenameFormat: 'zettel',  // Keep existing behavior as default
	customFilenameTemplate: '{title}',  // Simple title template
	// Task creation defaults
	taskCreationDefaults: DEFAULT_TASK_CREATION_DEFAULTS,
	// Calendar view defaults
	calendarViewSettings: DEFAULT_CALENDAR_VIEW_SETTINGS,
	// Pomodoro defaults
	pomodoroWorkDuration: 25,
	pomodoroShortBreakDuration: 5,
	pomodoroLongBreakDuration: 15,
	pomodoroLongBreakInterval: 4,
	pomodoroAutoStartBreaks: true,
	pomodoroAutoStartWork: false,
	pomodoroNotifications: true,
	pomodoroSoundEnabled: true,
	pomodoroSoundVolume: 50,
	pomodoroStorageLocation: 'plugin',
	// Editor defaults
	enableTaskLinkOverlay: true,
	enableInstantTaskConvert: true,
	useDefaultsOnInstantConvert: false,
	// Customization defaults
	fieldMapping: DEFAULT_FIELD_MAPPING,
	customStatuses: DEFAULT_STATUSES,
	customPriorities: DEFAULT_PRIORITIES
};


export class TaskNotesSettingTab extends PluginSettingTab {
	plugin: TaskNotesPlugin;
	private activeTab: string = 'task-defaults';
	private tabContents: Record<string, HTMLElement> = {};
  
	constructor(app: App, plugin: TaskNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
  
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('tasknotes-settings');
		containerEl.addClass('tasknotes-plugin');
		containerEl.addClass('settings-view');
		
		// Create tab navigation
		const tabNav = containerEl.createDiv('settings-tab-nav settings-view__tab-nav');
		
		const tabs = [
			{ id: 'task-defaults', name: 'Task defaults' },
			{ id: 'general', name: 'Inline tasks' },
			{ id: 'calendar', name: 'Calendar' },
			{ id: 'field-mapping', name: 'Field mapping' },
			{ id: 'statuses', name: 'Statuses' },
			{ id: 'priorities', name: 'Priorities' },
			{ id: 'pomodoro', name: 'Pomodoro' }
		];
		
		tabs.forEach(tab => {
			const isActive = this.activeTab === tab.id;
			const tabButton = tabNav.createEl('button', {
				text: tab.name,
				cls: isActive ? 'settings-tab-button settings-view__tab-button active settings-view__tab-button--active' : 'settings-tab-button settings-view__tab-button',
				attr: {
					'role': 'tab',
					'aria-selected': isActive.toString(),
					'aria-controls': `settings-tab-${tab.id}`,
					'id': `tab-button-${tab.id}`,
					'tabindex': isActive ? '0' : '-1'
				}
			});
			
			tabButton.addEventListener('click', () => {
				this.switchTab(tab.id);
			});
			
			tabButton.addEventListener('keydown', (e) => {
				if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
					e.preventDefault();
					const currentIndex = tabs.findIndex(t => t.id === tab.id);
					const nextIndex = e.key === 'ArrowRight' 
						? (currentIndex + 1) % tabs.length
						: (currentIndex - 1 + tabs.length) % tabs.length;
					const nextTabId = tabs[nextIndex].id;
					this.switchTab(nextTabId);
					// Focus will be set in switchTab
				}
			});
		});
		
		// Create tab content containers
		const tabContentsEl = containerEl.createDiv('settings-tab-contents settings-view__tab-contents');
		
		// Create all tab content containers
		tabs.forEach(tab => {
			const tabContent = tabContentsEl.createDiv('settings-tab-content settings-view__tab-content');
			tabContent.setAttribute('role', 'tabpanel');
			tabContent.setAttribute('id', `settings-tab-${tab.id}`);
			tabContent.setAttribute('aria-labelledby', `tab-button-${tab.id}`);
			if (this.activeTab === tab.id) {
				tabContent.addClass('active');
				tabContent.addClass('settings-view__tab-content--active');
			}
			this.tabContents[tab.id] = tabContent;
		});
		
		this.renderActiveTab();
	}
	
	private switchTab(tabId: string): void {
		this.activeTab = tabId;
		this.display(); // Re-render the entire settings tab
		
		// Focus the newly active tab button
		setTimeout(() => {
			const activeTabButton = this.containerEl.querySelector(`#tab-button-${tabId}`) as HTMLElement;
			if (activeTabButton) {
				activeTabButton.focus();
			}
		}, 50);
	}
	
	private renderActiveTab(): void {
		// Clear current tab content
		Object.values(this.tabContents).forEach(content => content.empty());
		
		switch (this.activeTab) {
			case 'general':
				this.renderGeneralTab();
				break;
			case 'task-defaults':
				this.renderTaskDefaultsTab();
				break;
			case 'calendar':
				this.renderCalendarTab();
				break;
			case 'field-mapping':
				this.renderFieldMappingTab();
				break;
			case 'statuses':
				this.renderStatusesTab();
				break;
			case 'priorities':
				this.renderPrioritiesTab();
				break;
			case 'pomodoro':
				this.renderPomodoroTab();
				break;
		}
	}
	
	private renderGeneralTab(): void {
		const container = this.tabContents['general'];
		
		// Inline task settings
		new Setting(container).setName('Inline task settings').setHeading();
		
		container.createEl('p', { 
			text: 'Configure how TaskNotes integrates with your editor and existing Markdown tasks.',
			cls: 'settings-help-note'
		});
		
		new Setting(container)
			.setName('Task link overlay')
			.setDesc('Replace wikilinks to task files with interactive task cards in live preview mode')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Enable task link overlay in live preview mode');
				return toggle
					.setValue(this.plugin.settings.enableTaskLinkOverlay)
					.onChange(async (value) => {
						this.plugin.settings.enableTaskLinkOverlay = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Instant task convert')
			.setDesc('Show a convert button next to checkbox tasks for instant conversion to TaskNotes')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Enable instant task conversion buttons');
				return toggle
					.setValue(this.plugin.settings.enableInstantTaskConvert)
					.onChange(async (value) => {
						this.plugin.settings.enableInstantTaskConvert = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Use task defaults on instant convert')
			.setDesc('Apply your configured task creation defaults when converting checkbox tasks to TaskNotes (contexts, tags, dates, folder, etc.)')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Apply task creation defaults during instant conversion');
				return toggle
					.setValue(this.plugin.settings.useDefaultsOnInstantConvert)
					.onChange(async (value) => {
						this.plugin.settings.useDefaultsOnInstantConvert = value;
						await this.plugin.saveSettings();
					});
			});
		
		// Help section
		const helpContainer = container.createDiv('settings-help-section');
		helpContainer.createEl('h4', { text: 'How inline task features work:' });
		const helpList = helpContainer.createEl('ul');
		helpList.createEl('li', { text: 'Task link overlay: When you link to a task file like [[My Task]], it shows an interactive task card instead of a plain link' });
		helpList.createEl('li', { text: 'Instant task convert: Shows a "Convert to TaskNote" button next to standard Markdown checkboxes like - [ ] My task' });
		
		helpContainer.createEl('p', { 
			text: 'These features help bridge regular Markdown tasks with the full TaskNotes system.',
			cls: 'settings-help-note'
		});
	}
	
	private renderTaskDefaultsTab(): void {
		const container = this.tabContents['task-defaults'];
		
		// Task organization section
		new Setting(container).setName('Task organization').setHeading();
		
		new Setting(container)
			.setName('Default tasks folder')
			.setDesc('Default folder for new tasks (tasks are identified by tag, not folder)')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Default tasks folder path');
				return text
					.setPlaceholder('TaskNotes/Tasks')
					.setValue(this.plugin.settings.tasksFolder)
					.onChange(async (value) => {
						this.plugin.settings.tasksFolder = value;
						await this.plugin.saveSettings();
					});
			});
		
		new Setting(container)
			.setName('Task tag')
			.setDesc('Tag that identifies notes as tasks (without #)')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Task identification tag');
				return text
					.setPlaceholder('task')
					.setValue(this.plugin.settings.taskTag)
					.onChange(async (value) => {
						this.plugin.settings.taskTag = value;
						await this.plugin.saveSettings();
					});
			});
		
		new Setting(container)
			.setName('Excluded folders')
			.setDesc('Comma-separated list of folder paths to exclude from Notes tab')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Comma-separated list of folders to exclude');
				return text
					.setPlaceholder('Templates,Archive')
					.setValue(this.plugin.settings.excludedFolders)
					.onChange(async (value) => {
						this.plugin.settings.excludedFolders = value;
						await this.plugin.saveSettings();
					});
			});
		
		// Task filename settings
		new Setting(container).setName('Task filenames').setHeading();

		new Setting(container)
			.setName('Filename format')
			.setDesc('How task filenames should be generated')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Task filename generation format');
				return dropdown
					.addOption('title', 'Task title')
					.addOption('zettel', 'Zettelkasten format (YYMMDD + base36 seconds since midnight)')
					.addOption('timestamp', 'Full timestamp (YYYY-MM-DD-HHMMSS)')
					.addOption('custom', 'Custom template')
					.setValue(this.plugin.settings.taskFilenameFormat)
					.onChange(async (value: any) => {
						this.plugin.settings.taskFilenameFormat = value;
						await this.plugin.saveSettings();
						this.renderActiveTab(); // Re-render to update visibility
					});
			});

		if (this.plugin.settings.taskFilenameFormat === 'custom') {
			new Setting(container)
				.setName('Custom filename template')
				.setDesc('Template for custom filenames. Available variables: {title}, {date}, {time}, {priority}, {status}, {timestamp}, etc.')
				.addText(text => {
					text.inputEl.setAttribute('aria-label', 'Custom filename template with variables');
					return text
						.setPlaceholder('{date}-{title}')
						.setValue(this.plugin.settings.customFilenameTemplate)
						.onChange(async (value) => {
							this.plugin.settings.customFilenameTemplate = value;
							await this.plugin.saveSettings();
						});
				});
		}
		
		// Basic defaults section
		new Setting(container).setName('Basic defaults').setHeading();
		
		new Setting(container)
			.setName('Default task status')
			.setDesc('Default status for new tasks')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Default status for new tasks');
				// Populate with custom statuses
				this.plugin.settings.customStatuses.forEach(status => {
					dropdown.addOption(status.value, status.label);
				});
				return dropdown
					.setValue(this.plugin.settings.defaultTaskStatus)
					.onChange(async (value: any) => {
						this.plugin.settings.defaultTaskStatus = value;
						await this.plugin.saveSettings();
					});
			});
		
		new Setting(container)
			.setName('Default task priority')
			.setDesc('Default priority for new tasks')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Default priority for new tasks');
				// Populate with custom priorities
				this.plugin.settings.customPriorities.forEach(priority => {
					dropdown.addOption(priority.value, priority.label);
				});
				return dropdown
					.setValue(this.plugin.settings.defaultTaskPriority)
					.onChange(async (value: any) => {
						this.plugin.settings.defaultTaskPriority = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Default contexts')
			.setDesc('Default contexts for new tasks (comma-separated)')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Default contexts for new tasks');
				return text
					.setPlaceholder('@work, @personal')
					.setValue(this.plugin.settings.taskCreationDefaults.defaultContexts)
					.onChange(async (value) => {
						this.plugin.settings.taskCreationDefaults.defaultContexts = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Default tags')
			.setDesc('Default tags for new tasks (comma-separated)')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Default tags for new tasks');
				return text
					.setPlaceholder('#project, #urgent')
					.setValue(this.plugin.settings.taskCreationDefaults.defaultTags)
					.onChange(async (value) => {
						this.plugin.settings.taskCreationDefaults.defaultTags = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Default time estimate')
			.setDesc('Default time estimate for new tasks in minutes (0 = no default)')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Default time estimate in minutes');
				return text
					.setPlaceholder('0')
					.setValue(this.plugin.settings.taskCreationDefaults.defaultTimeEstimate.toString())
					.onChange(async (value) => {
						const num = parseInt(value) || 0;
						this.plugin.settings.taskCreationDefaults.defaultTimeEstimate = num;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Default recurrence')
			.setDesc('Default recurrence pattern for new tasks')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Default recurrence pattern');
				return dropdown
					.addOption('none', 'None')
					.addOption('daily', 'Daily')
					.addOption('weekly', 'Weekly')
					.addOption('monthly', 'Monthly')
					.addOption('yearly', 'Yearly')
					.setValue(this.plugin.settings.taskCreationDefaults.defaultRecurrence)
					.onChange(async (value: any) => {
						this.plugin.settings.taskCreationDefaults.defaultRecurrence = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Default folder')
			.setDesc('Override default tasks folder for new tasks (leave empty to use general tasks folder)')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Default folder for new tasks');
				return text
					.setPlaceholder('TaskNotes/Projects')
					.setValue(this.plugin.settings.taskCreationDefaults.defaultFolder)
					.onChange(async (value) => {
						this.plugin.settings.taskCreationDefaults.defaultFolder = value;
						await this.plugin.saveSettings();
					});
			});

		// Date defaults section
		new Setting(container).setName('Date defaults').setHeading();

		new Setting(container)
			.setName('Default due date')
			.setDesc('Default due date for new tasks')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Default due date for new tasks');
				return dropdown
					.addOption('none', 'None')
					.addOption('today', 'Today')
					.addOption('tomorrow', 'Tomorrow')
					.addOption('next-week', 'Next week')
					.setValue(this.plugin.settings.taskCreationDefaults.defaultDueDate)
					.onChange(async (value: any) => {
						this.plugin.settings.taskCreationDefaults.defaultDueDate = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Default scheduled date')
			.setDesc('Default scheduled date for new tasks')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Default scheduled date for new tasks');
				return dropdown
					.addOption('none', 'None')
					.addOption('today', 'Today')
					.addOption('tomorrow', 'Tomorrow')
					.addOption('next-week', 'Next week')
					.setValue(this.plugin.settings.taskCreationDefaults.defaultScheduledDate)
					.onChange(async (value: any) => {
						this.plugin.settings.taskCreationDefaults.defaultScheduledDate = value;
						await this.plugin.saveSettings();
					});
			});

		// Body template section
		new Setting(container).setName('Body template').setHeading();
		
		new Setting(container)
			.setName('Use body template')
			.setDesc('Pre-fill task details with content from a template file')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Enable body template for new tasks');
				return toggle
					.setValue(this.plugin.settings.taskCreationDefaults.useBodyTemplate)
					.onChange(async (value) => {
						this.plugin.settings.taskCreationDefaults.useBodyTemplate = value;
						await this.plugin.saveSettings();
						this.renderActiveTab(); // Re-render to show/hide template path
					});
			});

		if (this.plugin.settings.taskCreationDefaults.useBodyTemplate) {
			new Setting(container)
				.setName('Body template file')
				.setDesc('Path to template file for task body content. Supports template variables like {{title}}, {{date}}, {{time}}, {{priority}}, {{status}}, etc.')
				.addText(text => {
					text.inputEl.setAttribute('aria-label', 'Path to body template file');
					return text
						.setPlaceholder('Templates/Task Template.md')
						.setValue(this.plugin.settings.taskCreationDefaults.bodyTemplate)
						.onChange(async (value) => {
							this.plugin.settings.taskCreationDefaults.bodyTemplate = value;
							await this.plugin.saveSettings();
						});
				});
		}

		// Help section
		const helpContainer = container.createDiv('settings-help-section');
		helpContainer.createEl('h4', { text: 'Template variables:' });
		const helpList = helpContainer.createEl('ul');
		helpList.createEl('li', { text: '{{title}} - Task title' });
		helpList.createEl('li', { text: '{{details}} - User-provided details from modal' });
		helpList.createEl('li', { text: '{{date}} - Current date (YYYY-MM-DD)' });
		helpList.createEl('li', { text: '{{time}} - Current time (HH:MM)' });
		helpList.createEl('li', { text: '{{priority}} - Task priority' });
		helpList.createEl('li', { text: '{{status}} - Task status' });
		helpList.createEl('li', { text: '{{contexts}} - Task contexts' });
		helpList.createEl('li', { text: '{{tags}} - Task tags' });
		helpList.createEl('li', { text: '{{timeEstimate}} - Time estimate in minutes' });
		helpList.createEl('li', { text: '{{dueDate}} - Task due date' });
		helpList.createEl('li', { text: '{{scheduledDate}} - Task scheduled date' });
		helpList.createEl('li', { text: '{{parentNote}} - Parent note name (only for instant convert)' });
		
		helpContainer.createEl('p', { 
			text: 'Template is applied when the task is created with all final values from the form. Use {{details}} to include user content from the Details field.\n{{parentNote}} will resolve to the name of the note where a checkbox task was converted to a tasknote (empty for manually created tasks). Variables use the same format as daily note templates.',
			cls: 'settings-help-note'
		});
	}
	
	private renderCalendarTab(): void {
		const container = this.tabContents['calendar'];
		
		// Calendar view section
		new Setting(container).setName('Calendar view settings').setHeading();
		
		new Setting(container)
			.setName('Default view')
			.setDesc('Initial view when opening the Advanced Calendar')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Default calendar view');
				return dropdown
					.addOption('dayGridMonth', 'Month')
					.addOption('timeGridWeek', 'Week')
					.addOption('timeGridDay', 'Day')
					.addOption('multiMonthYear', 'Year')
					.setValue(this.plugin.settings.calendarViewSettings.defaultView)
					.onChange(async (value: any) => {
						this.plugin.settings.calendarViewSettings.defaultView = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('First day of week')
			.setDesc('Which day should be the first column in week and month views')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'First day of week');
				return dropdown
					.addOption('0', 'Sunday')
					.addOption('1', 'Monday')
					.addOption('2', 'Tuesday')
					.addOption('3', 'Wednesday')
					.addOption('4', 'Thursday')
					.addOption('5', 'Friday')
					.addOption('6', 'Saturday')
					.setValue(this.plugin.settings.calendarViewSettings.firstDay.toString())
					.onChange(async (value: any) => {
						this.plugin.settings.calendarViewSettings.firstDay = parseInt(value) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Show weekends')
			.setDesc('Display Saturday and Sunday in calendar views')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show weekends in calendar');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.showWeekends)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.showWeekends = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Show week numbers')
			.setDesc('Display week numbers on the left side of calendar views')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show week numbers');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.weekNumbers)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.weekNumbers = value;
						await this.plugin.saveSettings();
					});
			});

		// Time settings section
		new Setting(container).setName('Time settings').setHeading();

		new Setting(container)
			.setName('Time format')
			.setDesc('Display times in 12-hour or 24-hour format')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Time format');
				return dropdown
					.addOption('12', '12-hour (9:00 AM)')
					.addOption('24', '24-hour (09:00)')
					.setValue(this.plugin.settings.calendarViewSettings.timeFormat)
					.onChange(async (value: any) => {
						this.plugin.settings.calendarViewSettings.timeFormat = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Time slot duration')
			.setDesc('Duration of each time slot in week and day views')
			.addDropdown(dropdown => {
				dropdown.selectEl.setAttribute('aria-label', 'Time slot duration');
				return dropdown
					.addOption('00:15:00', '15 minutes')
					.addOption('00:30:00', '30 minutes')
					.addOption('01:00:00', '1 hour')
					.setValue(this.plugin.settings.calendarViewSettings.slotDuration)
					.onChange(async (value: any) => {
						this.plugin.settings.calendarViewSettings.slotDuration = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Day start time')
			.setDesc('First time slot to display in day/week views')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Day start time (HH:MM:SS format)');
				return text
					.setPlaceholder('00:00:00')
					.setValue(this.plugin.settings.calendarViewSettings.slotMinTime)
					.onChange(async (value) => {
						// Validate time format
						if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(value)) {
							return; // Invalid format, don't save
						}
						this.plugin.settings.calendarViewSettings.slotMinTime = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Day end time')
			.setDesc('Last time slot to display in day/week views')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Day end time (HH:MM:SS format)');
				return text
					.setPlaceholder('24:00:00')
					.setValue(this.plugin.settings.calendarViewSettings.slotMaxTime)
					.onChange(async (value) => {
						// Validate time format
						if (!/^([0-1]?[0-9]|2[0-4]):[0-5][0-9]:[0-5][0-9]$/.test(value)) {
							return; // Invalid format, don't save
						}
						this.plugin.settings.calendarViewSettings.slotMaxTime = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Initial scroll time')
			.setDesc('Time to scroll to when opening day/week views')
			.addText(text => {
				text.inputEl.setAttribute('aria-label', 'Initial scroll time (HH:MM:SS format)');
				return text
					.setPlaceholder('08:00:00')
					.setValue(this.plugin.settings.calendarViewSettings.scrollTime)
					.onChange(async (value) => {
						// Validate time format
						if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(value)) {
							return; // Invalid format, don't save
						}
						this.plugin.settings.calendarViewSettings.scrollTime = value;
						await this.plugin.saveSettings();
					});
			});

		// Event visibility section
		new Setting(container).setName('Default event visibility').setHeading();
		
		container.createEl('p', { 
			text: 'Configure which event types are visible by default when opening the Advanced Calendar. Users can still toggle these on/off in the calendar view.',
			cls: 'settings-help-note'
		});

		new Setting(container)
			.setName('Show scheduled tasks')
			.setDesc('Display tasks with scheduled dates by default')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show scheduled tasks by default');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.defaultShowScheduled)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.defaultShowScheduled = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Show due dates')
			.setDesc('Display task due dates by default')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show due dates by default');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.defaultShowDue)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.defaultShowDue = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Show time entries')
			.setDesc('Display completed time tracking entries by default')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show time entries by default');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.defaultShowTimeEntries)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.defaultShowTimeEntries = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Show recurring tasks')
			.setDesc('Display recurring task instances by default')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show recurring tasks by default');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.defaultShowRecurring)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.defaultShowRecurring = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Show ICS events')
			.setDesc('Display events from ICS subscriptions by default')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show ICS events by default');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.defaultShowICSEvents)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.defaultShowICSEvents = value;
						await this.plugin.saveSettings();
					});
			});

		// Calendar behavior section
		new Setting(container).setName('Calendar behavior').setHeading();

		new Setting(container)
			.setName('Current time indicator')
			.setDesc('Show a line indicating the current time in week and day views')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Show current time indicator');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.nowIndicator)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.nowIndicator = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(container)
			.setName('Selection mirror')
			.setDesc('Show a visual preview while dragging to select time ranges')
			.addToggle(toggle => {
				toggle.toggleEl.setAttribute('aria-label', 'Enable selection mirror');
				return toggle
					.setValue(this.plugin.settings.calendarViewSettings.selectMirror)
					.onChange(async (value) => {
						this.plugin.settings.calendarViewSettings.selectMirror = value;
						await this.plugin.saveSettings();
					});
			});

		// ICS Calendar Subscriptions section
		new Setting(container).setName('Calendar subscriptions').setHeading();
		
		// Description section
		container.createEl('p', { 
			text: 'Subscribe to external calendar feeds (ICS/iCal format) to display events alongside your tasks.',
			cls: 'settings-help-note'
		});
		
		// Subscription list
		const subscriptionList = container.createDiv('settings-list settings-view__list');
		this.renderSubscriptionList(subscriptionList);
		
		// Add subscription form
		new Setting(container)
			.setName('Add calendar subscription')
			.setDesc('Subscribe to an external calendar feed');
		
		const addForm = container.createDiv('ics-add-subscription-form');
		
		// Name input
		const nameRow = addForm.createDiv('ics-form-row');
		nameRow.createEl('label', { text: 'Name:', cls: 'ics-form-label' });
		const nameInput = nameRow.createEl('input', {
			type: 'text',
			placeholder: 'My Calendar',
			cls: 'ics-form-input'
		});
		
		// URL input
		const urlRow = addForm.createDiv('ics-form-row');
		urlRow.createEl('label', { text: 'ICS URL:', cls: 'ics-form-label' });
		const urlInput = urlRow.createEl('input', {
			type: 'url',
			placeholder: 'https://example.com/calendar.ics',
			cls: 'ics-form-input'
		});
		
		// Color and settings row
		const settingsRow = addForm.createDiv('ics-form-row ics-form-row-multi');
		
		// Color input
		const colorGroup = settingsRow.createDiv('ics-form-group');
		colorGroup.createEl('label', { text: 'Color:', cls: 'ics-form-label' });
		const colorInput = colorGroup.createEl('input', {
			type: 'color',
			value: '#3788d8',
			cls: 'ics-form-color'
		});
		
		// Refresh interval input
		const intervalGroup = settingsRow.createDiv('ics-form-group');
		intervalGroup.createEl('label', { text: 'Refresh (min):', cls: 'ics-form-label' });
		const intervalInput = intervalGroup.createEl('input', {
			type: 'number',
			value: '60',
			cls: 'ics-form-number'
		});
		intervalInput.setAttribute('min', '15');
		intervalInput.setAttribute('max', '1440');
		intervalInput.setAttribute('step', '15');
		
		// Enabled checkbox
		const enabledGroup = settingsRow.createDiv('ics-form-group');
		const enabledLabel = enabledGroup.createEl('label', { cls: 'ics-form-checkbox-label' });
		const enabledCheckbox = enabledLabel.createEl('input', {
			type: 'checkbox',
			cls: 'ics-form-checkbox'
		});
		enabledCheckbox.checked = true;
		enabledLabel.createSpan({ text: ' Enabled' });
		
		// Add button
		const buttonRow = addForm.createDiv('ics-form-row');
		const addButton = buttonRow.createEl('button', {
			text: 'Add Subscription',
			cls: 'ics-form-button mod-cta'
		});
		
		addButton.addEventListener('click', async () => {
			const name = nameInput.value.trim();
			const url = urlInput.value.trim();
			const color = colorInput.value;
			const refreshInterval = parseInt(intervalInput.value);
			const enabled = enabledCheckbox.checked;
			
			if (!name || !url) {
				new Notice('Name and URL are required');
				return;
			}
			
			if (refreshInterval < 15 || refreshInterval > 1440) {
				new Notice('Refresh interval must be between 15 and 1440 minutes');
				return;
			}
			
			try {
				addButton.textContent = 'Adding...';
				addButton.disabled = true;
				
				await this.plugin.icsSubscriptionService!.addSubscription({
					name, url, color, refreshInterval, enabled
				});
				
				new Notice(`Added subscription "${name}"`);
				
				// Clear the form
				nameInput.value = '';
				urlInput.value = '';
				colorInput.value = '#3788d8';
				intervalInput.value = '60';
				enabledCheckbox.checked = true;
				
				// Refresh the subscription list
				this.renderActiveTab();
			} catch (error) {
				console.error('Error adding subscription:', error);
				new Notice('Failed to add subscription');
			} finally {
				addButton.textContent = 'Add Subscription';
				addButton.disabled = false;
			}
		});
		
		// Refresh all button
		new Setting(container)
			.setName('Refresh all subscriptions')
			.setDesc('Manually refresh all enabled calendar subscriptions')
			.addButton(button => button
				.setButtonText('Refresh all')
				.onClick(async () => {
					if (this.plugin.icsSubscriptionService) {
						button.setButtonText('Refreshing...');
						button.setDisabled(true);
						try {
							await this.plugin.icsSubscriptionService.refreshAllSubscriptions();
							new Notice('All calendar subscriptions refreshed successfully');
						} catch (error) {
							console.error('Error refreshing subscriptions:', error);
							new Notice('Failed to refresh some calendar subscriptions');
						} finally {
							button.setButtonText('Refresh all');
							button.setDisabled(false);
						}
					}
				}));
		
		// Help section
		const helpContainer = container.createDiv('settings-help-section');
		helpContainer.createEl('h4', { text: 'How to get calendar subscription URLs:' });
		const helpList = helpContainer.createEl('ul');
		helpList.createEl('li', { text: 'Google Calendar: Settings → Calendar settings → Integrate calendar → Secret address in iCal format' });
		helpList.createEl('li', { text: 'Outlook/Office 365: Calendar settings → Share calendar → Publish a calendar → ICS format' });
		helpList.createEl('li', { text: 'Apple iCloud: Calendar.app → File → Export → Export as .ics file' });
		helpList.createEl('li', { text: 'Other services: Look for "Calendar subscription", "ICS feed", "iCal URL", or "Webcal" options' });
		
		helpContainer.createEl('p', { 
			text: 'Important: For Google Calendar, you must use the "Secret address" (private URL) from your calendar settings, not the public URL. The calendar must be set to "Make available to public" for the secret URL to work.',
			cls: 'settings-help-note'
		});
		
		helpContainer.createEl('p', { 
			text: 'Note: Only read-only access is supported. You cannot edit external calendar events from within TaskNotes.',
			cls: 'settings-help-note'
		});
	}
	
	private renderFieldMappingTab(): void {
		const container = this.tabContents['field-mapping'];
		
		// Warning message
		const warning = container.createDiv('settings-warning settings-view__warning');
		const warningIcon = warning.createEl('strong', { cls: 'settings-view__warning-icon' });
		setIcon(warningIcon, 'alert-triangle');
		warningIcon.createSpan({ text: ' Warning:' });
		warning.createSpan({ text: ' TaskNotes will read AND write using these property names. Changing these after creating tasks may cause inconsistencies.' });
		
		new Setting(container)
			.setName('Field mapping')
			.setHeading();
		container.createEl('p', { 
			text: 'Configure which frontmatter properties TaskNotes should use for each field.'
		});
		
		// Create mapping table
		const table = container.createEl('table', { cls: 'settings-table settings-view__table' });
		
		const header = table.createEl('tr');
		header.createEl('th', { cls: 'settings-view__table-header', text: 'TaskNotes field' });
		header.createEl('th', { cls: 'settings-view__table-header', text: 'Your property name' });
		
		const fieldMappings: Array<[keyof FieldMapping, string]> = [
			['title', 'Title'],
			['status', 'Status'],
			['priority', 'Priority'],
			['due', 'Due date'],
			['scheduled', 'Scheduled date'],
			['contexts', 'Contexts'],
			['timeEstimate', 'Time estimate'],
				['completedDate', 'Completed date'],
			['dateCreated', 'Created date'],
			['dateModified', 'Modified date'],
			['recurrence', 'Recurrence'],
			['archiveTag', 'Archive tag']
		];
		
		fieldMappings.forEach(([field, label]) => {
			const row = table.createEl('tr', { cls: 'settings-view__table-row' });
			const labelCell = row.createEl('td', { cls: 'settings-view__table-cell' });
			labelCell.textContent = label;
			
			const inputCell = row.createEl('td', { cls: 'settings-view__table-cell' });
			
			const input = inputCell.createEl('input', {
				type: 'text',
				value: this.plugin.settings.fieldMapping[field],
				cls: 'settings-view__table-input',
				attr: {
					'aria-label': `Property name for ${label}`,
					'id': `field-mapping-${field}`
				}
			});
			
			input.addEventListener('change', async () => {
				try {
					this.plugin.settings.fieldMapping[field] = input.value;
					await this.plugin.saveSettings();
				} catch (error) {
					console.error(`Error updating field mapping for ${field}:`, error);
					new Notice(`Failed to update field mapping for ${label}. Please try again.`);
				}
			});
		});
		
		// Reset button
		new Setting(container)
			.setName('Reset to defaults')
			.setDesc('Reset all field mappings to default values')
			.addButton(button => button
				.setButtonText('Reset')
				.setWarning()
				.onClick(async () => {
					this.plugin.settings.fieldMapping = { ...DEFAULT_FIELD_MAPPING };
					await this.plugin.saveSettings();
					this.renderActiveTab();
				}));
	}
	
	private renderStatusesTab(): void {
		const container = this.tabContents['statuses'];
		
		new Setting(container)
			.setName('Task statuses')
			.setHeading();
		
		// Description section
		container.createEl('p', { 
			text: 'Customize the status options available for your tasks. These statuses control the task lifecycle and determine when tasks are considered complete.'
		});
		
		// Help section
		const helpContainer = container.createDiv('settings-help-section');
		helpContainer.createEl('h4', { text: 'How statuses work:' });
		const helpList = helpContainer.createEl('ul');
		helpList.createEl('li', { text: 'Value: The internal identifier stored in your task files (e.g., "in-progress")' });
		helpList.createEl('li', { text: 'Label: The display name shown in the interface (e.g., "In Progress")' });
		helpList.createEl('li', { text: 'Color: Visual indicator color for the status dot and badges' });
		helpList.createEl('li', { text: 'Completed: When checked, tasks with this status are considered finished and may be filtered differently' });
		
		helpContainer.createEl('p', { 
			text: 'The order below determines the sequence when cycling through statuses by clicking on task status badges.',
			cls: 'settings-help-note'
		});
		
		// Column headers
		const headersRow = container.createDiv('settings-headers-row settings-view__list-headers');
		headersRow.createDiv('settings-header-spacer settings-view__header-spacer'); // For color indicator space
		headersRow.createEl('span', { text: 'Value', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createEl('span', { text: 'Display Label', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createEl('span', { text: 'Color', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createEl('span', { text: 'Mark as Completed', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createDiv('settings-header-spacer settings-view__header-spacer'); // For delete button space
		
		// Status list
		const statusList = container.createDiv('settings-list settings-view__list');
		
		this.renderStatusList(statusList);
		
		// Add status button
		new Setting(container)
			.setName('Add new status')
			.setDesc('Create a new status option for your tasks')
			.addButton(button => button
				.setButtonText('Add status')
				.onClick(async () => {
					const newStatus = StatusManager.createDefaultStatus(this.plugin.settings.customStatuses);
					this.plugin.settings.customStatuses.push(newStatus);
					await this.plugin.saveSettings();
					this.renderActiveTab();
				}));
		
		// Validation note
		container.createEl('p', { 
			text: 'Note: You must have at least 2 statuses, and at least one status must be marked as "Completed".',
			cls: 'settings-validation-note'
		});
	}
	
	private renderStatusList(container: HTMLElement): void {
		container.empty();
		
		const sortedStatuses = [...this.plugin.settings.customStatuses].sort((a, b) => a.order - b.order);
		
		sortedStatuses.forEach((status, index) => {
			const statusRow = container.createDiv('settings-item-row settings-view__item-row');
			
			// Color indicator
			const colorIndicator = statusRow.createDiv('settings-color-indicator settings-view__color-indicator');
			colorIndicator.style.setProperty('--indicator-color', status.color);
			
			// Status value input
			const valueInput = statusRow.createEl('input', {
				type: 'text',
				value: status.value,
				cls: 'settings-input value-input settings-view__input settings-view__input--value',
				attr: {
					'aria-label': `Status value for ${status.label}`,
					'id': `status-value-${status.id}`
				}
			});
			
			// Status label input
			const labelInput = statusRow.createEl('input', {
				type: 'text',
				value: status.label,
				cls: 'settings-input label-input settings-view__input settings-view__input--label',
				attr: {
					'aria-label': `Display label for ${status.label} status`,
					'id': `status-label-${status.id}`
				}
			});
			
			// Color input
			const colorInput = statusRow.createEl('input', {
				type: 'color',
				value: status.color,
				cls: 'settings-input color-input settings-view__input settings-view__input--color',
				attr: {
					'aria-label': `Color for ${status.label} status`,
					'id': `status-color-${status.id}`
				}
			});
			
			// Completed checkbox
			const completedLabel = statusRow.createEl('label', { 
				cls: 'settings-checkbox-label settings-view__checkbox-label',
				attr: { 'for': `status-completed-${status.id}` }
			});
			
			const completedCheckbox = completedLabel.createEl('input', {
				type: 'checkbox',
				cls: 'settings-view__checkbox',
				attr: {
					'id': `status-completed-${status.id}`,
					'aria-label': `Mark ${status.label} as completed status`
				}
			});
			completedCheckbox.checked = status.isCompleted;
			
			completedLabel.createSpan({ text: 'Completed' });
			
			// Delete button
			const deleteButton = statusRow.createEl('button', {
				text: 'Delete',
				cls: 'settings-delete-button settings-view__delete-button'
			});
			
			// Event listeners
			const updateStatus = async () => {
				try {
					status.value = valueInput.value;
					status.label = labelInput.value;
					status.color = colorInput.value;
					status.isCompleted = completedCheckbox.checked;
					await this.plugin.saveSettings();
					colorIndicator.style.setProperty('--indicator-color', status.color);
				} catch (error) {
					console.error('Error updating status configuration:', error);
					new Notice('Failed to update status configuration. Please try again.');
				}
			};
			
			valueInput.addEventListener('change', updateStatus);
			labelInput.addEventListener('change', updateStatus);
			colorInput.addEventListener('change', updateStatus);
			completedCheckbox.addEventListener('change', updateStatus);
			
			deleteButton.addEventListener('click', async () => {
				if (this.plugin.settings.customStatuses.length <= 2) {
					new Notice('You must have at least 2 statuses');
					return;
				}
				
				// Create confirmation dialog
				const confirmModal = document.createElement('div');
				confirmModal.className = 'modal-container mod-confirmation';
				confirmModal.innerHTML = `
					<div class="modal-bg"></div>
					<div class="modal">
						<div class="modal-title">Delete Status</div>
						<div class="modal-content">
							<p>Are you sure you want to delete the status "${status.label}"?</p>
							<p>This action cannot be undone and may affect existing tasks.</p>
						</div>
						<div class="modal-button-container">
							<button class="mod-cta" data-action="delete">Delete</button>
							<button data-action="cancel">Cancel</button>
						</div>
					</div>
				`;
				
				document.body.appendChild(confirmModal);
				
				confirmModal.addEventListener('click', async (e) => {
					const target = e.target as HTMLElement;
					if (target.dataset.action === 'delete') {
						const statusIndex = this.plugin.settings.customStatuses.findIndex(s => s.id === status.id);
						if (statusIndex !== -1) {
							this.plugin.settings.customStatuses.splice(statusIndex, 1);
							await this.plugin.saveSettings();
							this.renderActiveTab();
						}
						confirmModal.remove();
					} else if (target.dataset.action === 'cancel' || target.classList.contains('modal-bg')) {
						confirmModal.remove();
					}
				});
			});
		});
	}
	
	private renderPrioritiesTab(): void {
		const container = this.tabContents['priorities'];
		
		new Setting(container)
			.setName('Task priorities')
			.setHeading();
		
		// Description section
		container.createEl('p', { 
			text: 'Customize the priority levels available for your tasks. Priority weights determine sorting order and visual hierarchy in your task views.'
		});
		
		// Help section
		const helpContainer = container.createDiv('settings-help-section');
		helpContainer.createEl('h4', { text: 'How priorities work:' });
		const helpList = helpContainer.createEl('ul');
		helpList.createEl('li', { text: 'Value: The internal identifier stored in your task files (e.g., "high")' });
		helpList.createEl('li', { text: 'Display Label: The display name shown in the interface (e.g., "High Priority")' });
		helpList.createEl('li', { text: 'Color: Visual indicator color for the priority dot and badges' });
		helpList.createEl('li', { text: 'Weight: Numeric value for sorting (higher weights appear first in lists)' });
		
		helpContainer.createEl('p', { 
			text: 'Tasks are automatically sorted by priority weight in descending order (highest weight first). Weights can be any positive number.',
			cls: 'settings-help-note'
		});
		
		// Column headers
		const headersRow = container.createDiv('settings-headers-row settings-view__list-headers');
		headersRow.createDiv('settings-header-spacer settings-view__header-spacer'); // For color indicator space
		headersRow.createEl('span', { text: 'Value', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createEl('span', { text: 'Display Label', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createEl('span', { text: 'Color', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createEl('span', { text: 'Weight', cls: 'settings-column-header settings-view__column-header' });
		headersRow.createDiv('settings-header-spacer settings-view__header-spacer'); // For delete button space
		
		// Priority list
		const priorityList = container.createDiv('settings-list settings-view__list');
		
		this.renderPriorityList(priorityList);
		
		// Add priority button
		new Setting(container)
			.setName('Add new priority')
			.setDesc('Create a new priority level for your tasks')
			.addButton(button => button
				.setButtonText('Add priority')
				.onClick(async () => {
					const newPriority = PriorityManager.createDefaultPriority(this.plugin.settings.customPriorities);
					this.plugin.settings.customPriorities.push(newPriority);
					await this.plugin.saveSettings();
					this.renderActiveTab();
				}));
		
		// Validation note
		container.createEl('p', { 
			text: 'Note: You must have at least 1 priority. Higher weights take precedence in sorting and visual hierarchy.',
			cls: 'settings-validation-note'
		});
	}
	
	private renderPriorityList(container: HTMLElement): void {
		container.empty();
		
		const sortedPriorities = [...this.plugin.settings.customPriorities].sort((a, b) => b.weight - a.weight);
		
		sortedPriorities.forEach((priority, index) => {
			const priorityRow = container.createDiv('settings-item-row');
			
			// Color indicator
			const colorIndicator = priorityRow.createDiv('settings-color-indicator');
			colorIndicator.style.setProperty('--indicator-color', priority.color);
			
			// Priority value input
			const valueInput = priorityRow.createEl('input', {
				type: 'text',
				value: priority.value,
				cls: 'settings-input value-input',
				attr: {
					'aria-label': `Priority value for ${priority.label}`,
					'id': `priority-value-${priority.id}`
				}
			});
			
			// Priority label input
			const labelInput = priorityRow.createEl('input', {
				type: 'text',
				value: priority.label,
				cls: 'settings-input label-input',
				attr: {
					'aria-label': `Display label for ${priority.label} priority`,
					'id': `priority-label-${priority.id}`
				}
			});
			
			// Color input
			const colorInput = priorityRow.createEl('input', {
				type: 'color',
				value: priority.color,
				cls: 'settings-input color-input',
				attr: {
					'aria-label': `Color for ${priority.label} priority`,
					'id': `priority-color-${priority.id}`
				}
			});
			
			// Weight input
			const weightInput = priorityRow.createEl('input', {
				type: 'number',
				value: priority.weight.toString(),
				cls: 'settings-input weight-input',
				attr: { 
					min: '0', 
					step: '1',
					'aria-label': `Weight for ${priority.label} priority`,
					'id': `priority-weight-${priority.id}`
				}
			});
			
			// Delete button
			const deleteButton = priorityRow.createEl('button', {
				text: 'Delete',
				cls: 'settings-delete-button'
			});
			
			// Event listeners
			const updatePriority = async () => {
				try {
					priority.value = valueInput.value;
					priority.label = labelInput.value;
					priority.color = colorInput.value;
					const weightValue = parseInt(weightInput.value);
					if (isNaN(weightValue) || weightValue < 0) {
						new Notice('Priority weight must be a valid positive number.');
						return;
					}
					priority.weight = weightValue;
					await this.plugin.saveSettings();
					colorIndicator.style.setProperty('--indicator-color', priority.color);
				} catch (error) {
					console.error('Error updating priority configuration:', error);
					new Notice('Failed to update priority configuration. Please try again.');
				}
			};
			
			valueInput.addEventListener('change', updatePriority);
			labelInput.addEventListener('change', updatePriority);
			colorInput.addEventListener('change', updatePriority);
			weightInput.addEventListener('change', updatePriority);
			
			deleteButton.addEventListener('click', async () => {
				if (this.plugin.settings.customPriorities.length <= 1) {
					new Notice('You must have at least 1 priority');
					return;
				}
				
				// Create confirmation dialog
				const confirmModal = document.createElement('div');
				confirmModal.className = 'modal-container mod-confirmation';
				confirmModal.innerHTML = `
					<div class="modal-bg"></div>
					<div class="modal">
						<div class="modal-title">Delete Priority</div>
						<div class="modal-content">
							<p>Are you sure you want to delete the priority "${priority.label}"?</p>
							<p>This action cannot be undone and may affect existing tasks.</p>
						</div>
						<div class="modal-button-container">
							<button class="mod-cta" data-action="delete">Delete</button>
							<button data-action="cancel">Cancel</button>
						</div>
					</div>
				`;
				
				document.body.appendChild(confirmModal);
				
				confirmModal.addEventListener('click', async (e) => {
					const target = e.target as HTMLElement;
					if (target.dataset.action === 'delete') {
						const priorityIndex = this.plugin.settings.customPriorities.findIndex(p => p.id === priority.id);
						if (priorityIndex !== -1) {
							this.plugin.settings.customPriorities.splice(priorityIndex, 1);
							await this.plugin.saveSettings();
							this.renderActiveTab();
						}
						confirmModal.remove();
					} else if (target.dataset.action === 'cancel' || target.classList.contains('modal-bg')) {
						confirmModal.remove();
					}
				});
			});
		});
	}
	
	
	private renderPomodoroTab(): void {
		const container = this.tabContents['pomodoro'];
		
		new Setting(container)
			.setName('Work duration')
			.setDesc('Duration of work intervals in minutes')
			.addText(text => text
				.setPlaceholder('25')
				.setValue(this.plugin.settings.pomodoroWorkDuration.toString())
				.onChange(async (value) => {
					try {
						const num = parseInt(value);
						if (isNaN(num) || num <= 0) {
							new Notice('Work duration must be a positive number.');
							return;
						}
						this.plugin.settings.pomodoroWorkDuration = num;
						await this.plugin.saveSettings();
					} catch (error) {
						console.error('Error updating pomodoro work duration:', error);
						new Notice('Failed to update work duration setting.');
					}
				}));

		new Setting(container)
			.setName('Short break duration')
			.setDesc('Duration of short breaks in minutes')
			.addText(text => text
				.setPlaceholder('5')
				.setValue(this.plugin.settings.pomodoroShortBreakDuration.toString())
				.onChange(async (value) => {
					try {
						const num = parseInt(value);
						if (isNaN(num) || num <= 0) {
							new Notice('Short break duration must be a positive number.');
							return;
						}
						this.plugin.settings.pomodoroShortBreakDuration = num;
						await this.plugin.saveSettings();
					} catch (error) {
						console.error('Error updating pomodoro short break duration:', error);
						new Notice('Failed to update short break duration setting.');
					}
				}));

		new Setting(container)
			.setName('Long break duration')
			.setDesc('Duration of long breaks in minutes')
			.addText(text => text
				.setPlaceholder('15')
				.setValue(this.plugin.settings.pomodoroLongBreakDuration.toString())
				.onChange(async (value) => {
					try {
						const num = parseInt(value);
						if (isNaN(num) || num <= 0) {
							new Notice('Long break duration must be a positive number.');
							return;
						}
						this.plugin.settings.pomodoroLongBreakDuration = num;
						await this.plugin.saveSettings();
					} catch (error) {
						console.error('Error updating pomodoro long break duration:', error);
						new Notice('Failed to update long break duration setting.');
					}
				}));

		new Setting(container)
			.setName('Long break interval')
			.setDesc('Take a long break after this many pomodoros')
			.addText(text => text
				.setPlaceholder('4')
				.setValue(this.plugin.settings.pomodoroLongBreakInterval.toString())
				.onChange(async (value) => {
					try {
						const num = parseInt(value);
						if (isNaN(num) || num <= 0) {
							new Notice('Long break interval must be a positive number.');
							return;
						}
						this.plugin.settings.pomodoroLongBreakInterval = num;
						await this.plugin.saveSettings();
					} catch (error) {
						console.error('Error updating pomodoro long break interval:', error);
						new Notice('Failed to update long break interval setting.');
					}
				}));

		new Setting(container)
			.setName('Auto-start breaks')
			.setDesc('Automatically start break timer after work session')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.pomodoroAutoStartBreaks)
				.onChange(async (value) => {
					this.plugin.settings.pomodoroAutoStartBreaks = value;
					await this.plugin.saveSettings();
				}));

		new Setting(container)
			.setName('Auto-start work')
			.setDesc('Automatically start work timer after break')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.pomodoroAutoStartWork)
				.onChange(async (value) => {
					this.plugin.settings.pomodoroAutoStartWork = value;
					await this.plugin.saveSettings();
				}));

		new Setting(container)
			.setName('Enable notifications')
			.setDesc('Show notifications when pomodoro sessions complete')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.pomodoroNotifications)
				.onChange(async (value) => {
					this.plugin.settings.pomodoroNotifications = value;
					await this.plugin.saveSettings();
				}));

		new Setting(container)
			.setName('Enable sound')
			.setDesc('Play sound when pomodoro sessions complete')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.pomodoroSoundEnabled)
				.onChange(async (value) => {
					this.plugin.settings.pomodoroSoundEnabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(container)
			.setName('Sound volume')
			.setDesc('Volume for completion sounds (0-100)')
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue(this.plugin.settings.pomodoroSoundVolume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					try {
						this.plugin.settings.pomodoroSoundVolume = value;
						await this.plugin.saveSettings();
					} catch (error) {
						console.error('Error updating pomodoro sound volume:', error);
						new Notice('Failed to update sound volume setting.');
					}
				}));

		new Setting(container)
			.setName('Data storage location')
			.setDesc('Choose where to store pomodoro session data. Daily notes provides better data longevity as the data stays with your notes, but requires the Daily Notes core plugin to be enabled.')
			.addDropdown(dropdown => dropdown
				.addOption('plugin', 'Plugin data file (default)')
				.addOption('daily-notes', 'Daily notes frontmatter')
				.setValue(this.plugin.settings.pomodoroStorageLocation)
				.onChange(async (value: 'plugin' | 'daily-notes') => {
					try {
						// Check if Daily Notes plugin is enabled when switching to daily-notes
						if (value === 'daily-notes') {
							const { appHasDailyNotesPluginLoaded } = await import('obsidian-daily-notes-interface');
							if (!appHasDailyNotesPluginLoaded()) {
								new Notice('Daily Notes core plugin must be enabled to use this storage option. Please enable it in Settings > Core plugins and try again.');
								dropdown.setValue('plugin'); // Reset to plugin storage
								return;
							}
							
							// Check if there's existing data to migrate
							const data = await this.plugin.loadData();
							const hasExistingData = data?.pomodoroHistory && Array.isArray(data.pomodoroHistory) && data.pomodoroHistory.length > 0;
							
							// Show confirmation dialog
							const confirmed = await this.showStorageLocationConfirmation(hasExistingData);
							if (!confirmed) {
								dropdown.setValue('plugin'); // Reset to plugin storage if user cancels
								return;
							}
						}
						
						this.plugin.settings.pomodoroStorageLocation = value;
						await this.plugin.saveSettings();
						
						// Trigger migration if switching to daily-notes and there's data to migrate
						if (value === 'daily-notes') {
							await this.plugin.pomodoroService.migrateTodailyNotes();
						}
						
					} catch (error) {
						console.error('Error updating pomodoro storage location:', error);
						new Notice('Failed to update storage location setting.');
						dropdown.setValue('plugin'); // Reset to plugin storage on error
					}
				}));
	}

	/**
	 * Show confirmation dialog for switching to daily notes storage
	 */
	private async showStorageLocationConfirmation(hasExistingData: boolean): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = document.createElement('div');
			modal.className = 'modal-container mod-confirmation';
			
			// Create modal background
			const modalBg = modal.createDiv('modal-bg');
			
			// Create modal content container
			const modalContent = modal.createDiv('modal');
			
			// Create title
			const title = hasExistingData ? 'Migrate pomodoro data?' : 'Switch to daily notes storage?';
			modalContent.createDiv('modal-title').textContent = title;
			
			// Create content area
			const content = modalContent.createDiv('modal-content');
			
			// Main message
			const message = hasExistingData 
				? 'This will migrate your existing pomodoro session data to daily notes frontmatter. The data will be grouped by date and stored in each daily note.'
				: 'Pomodoro session data will be stored in daily notes frontmatter instead of the plugin data file.';
			const messageP = content.createEl('p');
			const strongMessage = messageP.createEl('strong');
			strongMessage.textContent = message;
			
			content.createEl('br');
			
			// "What this means" section
			content.createEl('p').textContent = 'What this means:';
			const warningsList = content.createEl('ul');
			
			const warnings = [
				'Daily Notes core plugin must remain enabled',
				'Data will be stored in your daily notes frontmatter',
				hasExistingData ? 'Existing plugin data will be migrated and then cleared' : 'Future sessions will be saved to daily notes',
				'This provides better data longevity with your notes'
			];
			
			warnings.forEach(warning => {
				const listItem = warningsList.createEl('li');
				listItem.textContent = `• ${warning}`;
			});
			
			content.createEl('br');
			
			// Final warning/note
			const finalNote = content.createEl('p');
			if (hasExistingData) {
				const strongWarning = finalNote.createEl('strong');
				strongWarning.textContent = '⚠️ Make sure you have backups if needed. This change cannot be automatically undone.';
			} else {
				finalNote.textContent = 'You can switch back to plugin storage at any time in the future.';
			}
			
			// Create buttons
			const buttonContainer = modalContent.createDiv('modal-button-container');
			const confirmButton = buttonContainer.createEl('button', { cls: 'mod-cta' });
			confirmButton.textContent = hasExistingData ? 'Migrate data' : 'Switch storage';
			confirmButton.setAttribute('data-action', 'confirm');
			
			const cancelButton = buttonContainer.createEl('button');
			cancelButton.textContent = 'Cancel';
			cancelButton.setAttribute('data-action', 'cancel');

			document.body.appendChild(modal);

			const handleClick = (e: Event) => {
				const target = e.target as HTMLElement;
				if (target.dataset.action === 'confirm') {
					modal.remove();
					resolve(true);
				} else if (target.dataset.action === 'cancel' || target.classList.contains('modal-bg')) {
					modal.remove();
					resolve(false);
				}
			};

			modal.addEventListener('click', handleClick);

			// Handle escape key
			const handleKeydown = (e: KeyboardEvent) => {
				if (e.key === 'Escape') {
					modal.remove();
					document.removeEventListener('keydown', handleKeydown);
					resolve(false);
				}
			};
			document.addEventListener('keydown', handleKeydown);

			// Focus the confirm button
			setTimeout(() => {
				const confirmButton = modal.querySelector('[data-action="confirm"]') as HTMLElement;
				if (confirmButton) {
					confirmButton.focus();
				}
			}, 50);
		});
	}


	private renderSubscriptionList(container: HTMLElement): void {
		container.empty();
		
		if (!this.plugin.icsSubscriptionService) {
			container.createEl('p', { text: 'ICS Subscription service not available', cls: 'settings-help-note' });
			return;
		}
		
		const subscriptions = this.plugin.icsSubscriptionService.getSubscriptions();
		
		if (subscriptions.length === 0) {
			container.createEl('p', { text: 'No calendar subscriptions configured', cls: 'settings-help-note' });
			return;
		}
		
		subscriptions.forEach(subscription => {
			const subRow = container.createDiv('settings-item-row ics-subscription-row');
			
			// Status indicator
			const statusIndicator = subRow.createDiv('settings-status-indicator');
			if (subscription.enabled) {
				statusIndicator.addClass('enabled');
				statusIndicator.title = subscription.lastError ? `Error: ${subscription.lastError}` : 'Active';
				if (subscription.lastError) {
					statusIndicator.addClass('error');
				}
			} else {
				statusIndicator.addClass('disabled');
				statusIndicator.title = 'Disabled';
			}
			
			// Subscription info
			const infoContainer = subRow.createDiv('ics-subscription-info');
			const nameEl = infoContainer.createEl('div', { cls: 'ics-subscription-name', text: subscription.name });
			const urlEl = infoContainer.createEl('div', { cls: 'ics-subscription-url', text: subscription.url });
			const metaEl = infoContainer.createEl('div', { cls: 'ics-subscription-meta' });
			
			// Meta information
			const refreshText = `Refresh: ${subscription.refreshInterval}min`;
			const lastFetched = subscription.lastFetched ? ` • Last: ${new Date(subscription.lastFetched).toLocaleString()}` : '';
			metaEl.textContent = refreshText + lastFetched;
			
			if (subscription.lastError) {
				const errorEl = infoContainer.createEl('div', { cls: 'ics-subscription-error', text: `Error: ${subscription.lastError}` });
			}
			
			// Actions
			const actionsContainer = subRow.createDiv('ics-subscription-actions');
			
			// Enable/disable toggle
			const enableButton = actionsContainer.createEl('button', {
				text: subscription.enabled ? 'Disable' : 'Enable',
				cls: `ics-subscription-toggle ${subscription.enabled ? 'enabled' : 'disabled'}`
			});
			enableButton.addEventListener('click', async () => {
				try {
					await this.plugin.icsSubscriptionService!.updateSubscription(subscription.id, {
						enabled: !subscription.enabled
					});
					this.renderActiveTab();
				} catch (error) {
					console.error('Error toggling subscription:', error);
					new Notice('Failed to update subscription');
				}
			});
			
			// Refresh button
			const refreshButton = actionsContainer.createEl('button', {
				text: 'Refresh',
				cls: 'ics-subscription-refresh'
			});
			refreshButton.addEventListener('click', async () => {
				if (!subscription.enabled) {
					new Notice('Enable the subscription first');
					return;
				}
				
				refreshButton.textContent = 'Refreshing...';
				refreshButton.disabled = true;
				try {
					await this.plugin.icsSubscriptionService!.refreshSubscription(subscription.id);
					new Notice(`Refreshed "${subscription.name}"`);
					this.renderActiveTab();
				} catch (error) {
					console.error('Error refreshing subscription:', error);
					new Notice('Failed to refresh subscription');
				} finally {
					refreshButton.textContent = 'Refresh';
					refreshButton.disabled = false;
				}
			});
			
			// Edit button
			const editButton = actionsContainer.createEl('button', {
				text: 'Edit',
				cls: 'ics-subscription-edit'
			});
			editButton.addEventListener('click', () => {
				this.showInlineEditForm(subscription, subRow);
			});
			
			// Delete button
			const deleteButton = actionsContainer.createEl('button', {
				text: 'Delete',
				cls: 'ics-subscription-delete'
			});
			deleteButton.addEventListener('click', () => {
				this.showDeleteSubscriptionConfirmation(subscription);
			});
		});
	}

	private showInlineEditForm(subscription: any, rowElement: HTMLElement): void {
		// Save the original content
		const originalContent = rowElement.innerHTML;
		
		// Clear the row and create edit form
		rowElement.empty();
		rowElement.addClass('ics-subscription-editing');
		
		const editForm = rowElement.createDiv('ics-edit-form');
		
		// Name input
		const nameRow = editForm.createDiv('ics-edit-row');
		nameRow.createEl('label', { text: 'Name:', cls: 'ics-edit-label' });
		const nameInput = nameRow.createEl('input', {
			type: 'text',
			value: subscription.name,
			cls: 'ics-edit-input'
		});
		
		// URL input
		const urlRow = editForm.createDiv('ics-edit-row');
		urlRow.createEl('label', { text: 'URL:', cls: 'ics-edit-label' });
		const urlInput = urlRow.createEl('input', {
			type: 'url',
			value: subscription.url,
			cls: 'ics-edit-input'
		});
		
		// Settings row
		const settingsRow = editForm.createDiv('ics-edit-row ics-edit-settings');
		
		// Color
		const colorGroup = settingsRow.createDiv('ics-edit-group');
		colorGroup.createEl('label', { text: 'Color:', cls: 'ics-edit-label' });
		const colorInput = colorGroup.createEl('input', {
			type: 'color',
			value: subscription.color,
			cls: 'ics-edit-color'
		});
		
		// Refresh interval
		const intervalGroup = settingsRow.createDiv('ics-edit-group');
		intervalGroup.createEl('label', { text: 'Refresh (min):', cls: 'ics-edit-label' });
		const intervalInput = intervalGroup.createEl('input', {
			type: 'number',
			value: subscription.refreshInterval.toString(),
			cls: 'ics-edit-number'
		});
		intervalInput.setAttribute('min', '15');
		intervalInput.setAttribute('max', '1440');
		intervalInput.setAttribute('step', '15');
		
		// Enabled checkbox
		const enabledGroup = settingsRow.createDiv('ics-edit-group');
		const enabledLabel = enabledGroup.createEl('label', { cls: 'ics-edit-checkbox-label' });
		const enabledCheckbox = enabledLabel.createEl('input', {
			type: 'checkbox',
			cls: 'ics-edit-checkbox'
		});
		enabledCheckbox.checked = subscription.enabled;
		enabledLabel.createSpan({ text: ' Enabled' });
		
		// Buttons row
		const buttonsRow = editForm.createDiv('ics-edit-row ics-edit-buttons');
		const saveButton = buttonsRow.createEl('button', {
			text: 'Save',
			cls: 'ics-edit-button mod-cta'
		});
		const cancelButton = buttonsRow.createEl('button', {
			text: 'Cancel',
			cls: 'ics-edit-button'
		});
		
		// Save handler
		saveButton.addEventListener('click', async () => {
			const name = nameInput.value.trim();
			const url = urlInput.value.trim();
			const color = colorInput.value;
			const refreshInterval = parseInt(intervalInput.value);
			const enabled = enabledCheckbox.checked;
			
			if (!name || !url) {
				new Notice('Name and URL are required');
				return;
			}
			
			if (refreshInterval < 15 || refreshInterval > 1440) {
				new Notice('Refresh interval must be between 15 and 1440 minutes');
				return;
			}
			
			try {
				saveButton.textContent = 'Saving...';
				saveButton.disabled = true;
				
				await this.plugin.icsSubscriptionService!.updateSubscription(subscription.id, {
					name, url, color, refreshInterval, enabled
				});
				
				new Notice(`Updated subscription "${name}"`);
				this.renderActiveTab();
			} catch (error) {
				console.error('Error updating subscription:', error);
				new Notice('Failed to update subscription');
			}
		});
		
		// Cancel handler
		cancelButton.addEventListener('click', () => {
			rowElement.innerHTML = originalContent;
			rowElement.removeClass('ics-subscription-editing');
			// Re-attach event listeners by re-rendering
			this.renderActiveTab();
		});
		
		// Focus the name input
		setTimeout(() => nameInput.focus(), 50);
	}


	private showDeleteSubscriptionConfirmation(subscription: any): void {
		const modal = document.createElement('div');
		modal.className = 'modal-container mod-confirmation';
		
		const modalBg = modal.createDiv('modal-bg');
		const modalContent = modal.createDiv('modal');
		
		modalContent.createDiv('modal-title').textContent = 'Delete Subscription';
		
		const content = modalContent.createDiv('modal-content');
		content.createEl('p', { text: `Are you sure you want to delete the subscription "${subscription.name}"?` });
		content.createEl('p', { text: 'This action cannot be undone.' });
		
		const buttonContainer = modalContent.createDiv('modal-button-container');
		const deleteButton = buttonContainer.createEl('button', { cls: 'mod-cta', text: 'Delete' });
		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		
		document.body.appendChild(modal);
		
		const handleDelete = async () => {
			try {
				await this.plugin.icsSubscriptionService!.removeSubscription(subscription.id);
				new Notice(`Deleted subscription "${subscription.name}"`);
				modal.remove();
				this.renderActiveTab();
			} catch (error) {
				console.error('Error deleting subscription:', error);
				new Notice('Failed to delete subscription');
			}
		};
		
		const handleCancel = () => {
			modal.remove();
		};
		
		deleteButton.addEventListener('click', handleDelete);
		cancelButton.addEventListener('click', handleCancel);
		modalBg.addEventListener('click', handleCancel);
		
		// Handle escape key
		modal.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				handleCancel();
			}
		});
		
		// Focus delete button
		setTimeout(() => deleteButton.focus(), 50);
	}
}
