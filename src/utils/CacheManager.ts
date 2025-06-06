import { TFile, Vault } from 'obsidian';
import { TaskInfo, NoteInfo, IndexedFile, FileEventHandlers } from '../types';
import { extractNoteInfo, extractTaskInfo, debounce } from './helpers';
import { FieldMapper } from '../services/FieldMapper';
import * as YAML from 'yaml';

/**
 * Unified cache manager that provides centralized data access and caching
 * for all file operations in the TaskNotes plugin. This eliminates redundant
 * file reads and provides instant data access for UI components.
 */
export class CacheManager {
    private vault: Vault;
    
    // Core cache structures
    private fileContentCache: Map<string, { content: string; mtime: number; }> = new Map();
    private yamlCache: Map<string, { data: any; timestamp: number; }> = new Map();
    private taskInfoCache: Map<string, TaskInfo> = new Map();
    private noteInfoCache: Map<string, NoteInfo> = new Map();
    private indexedFilesCache: Map<string, IndexedFile> = new Map();
    
    // Index caches for fast lookups
    private tasksByDate: Map<string, Set<string>> = new Map(); // date -> task paths
    private notesByDate: Map<string, Set<string>> = new Map(); // date -> note paths
    private tasksByStatus: Map<string, Set<string>> = new Map(); // status -> task paths
    private tasksByPriority: Map<string, Set<string>> = new Map(); // priority -> task paths
    private dailyNotes: Set<string> = new Set(); // daily note paths in YYYY-MM-DD format
    
    // Configuration
    private taskTag: string;
    private excludedFolders: string[];
    private dailyNotesPath: string;
    private dailyNoteTemplatePath: string;
    private fieldMapper: FieldMapper | null = null;
    
    // Cache settings
    private static readonly FILE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
    private static readonly YAML_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private static readonly MAX_CACHE_SIZE = 500; // files
    
    // Performance tracking
    private stats = {
        cacheHits: 0,
        cacheMisses: 0,
        fileReads: 0,
        yamlParses: 0
    };
    
    // Event handlers for cleanup
    private eventHandlers: FileEventHandlers = {};
    private subscribers: Map<string, Set<(data: any) => void>> = new Map();
    
    constructor(
        vault: Vault, 
        taskTag: string, 
        excludedFolders: string = '', 
        dailyNotesPath: string = '', 
        dailyNoteTemplatePath: string = '', 
        fieldMapper?: FieldMapper
    ) {
        this.vault = vault;
        this.taskTag = taskTag;
        this.excludedFolders = excludedFolders 
            ? excludedFolders.split(',').map(folder => folder.trim())
            : [];
        this.dailyNotesPath = dailyNotesPath.replace(/^\/+|\/+$/g, '');
        this.dailyNoteTemplatePath = dailyNoteTemplatePath;
        this.fieldMapper = fieldMapper || null;
        
        this.registerFileEvents();
    }
    
    /**
     * Subscribe to data changes for specific data types
     */
    subscribe(dataType: string, callback: (data: any) => void): () => void {
        if (!this.subscribers.has(dataType)) {
            this.subscribers.set(dataType, new Set());
        }
        this.subscribers.get(dataType)!.add(callback);
        
        // Return unsubscribe function
        return () => {
            const subscribers = this.subscribers.get(dataType);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    this.subscribers.delete(dataType);
                }
            }
        };
    }
    
    /**
     * Notify subscribers of data changes
     */
    private notifySubscribers(dataType: string, data: any): void {
        const subscribers = this.subscribers.get(dataType);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in cache subscriber for ${dataType}:`, error);
                }
            });
        }
    }
    
    /**
     * Get cached file content or read from disk if not cached
     */
    async getFileContent(path: string, forceRefresh = false): Promise<string | null> {
        const file = this.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile) || file.extension !== 'md') {
            return null;
        }
        
        const cached = this.fileContentCache.get(path);
        const now = Date.now();
        
        // Use cache if available, not expired, and not forcing refresh
        if (!forceRefresh && cached && (now - cached.mtime < CacheManager.FILE_CACHE_TTL)) {
            this.stats.cacheHits++;
            return cached.content;
        }
        
        try {
            const content = await this.vault.cachedRead(file);
            this.stats.fileReads++;
            
            // Update cache
            this.fileContentCache.set(path, {
                content,
                mtime: now
            });
            
            // Evict old entries if cache is too large
            this.evictFileCache();
            
            return content;
        } catch (error) {
            console.error(`Error reading file ${path}:`, error);
            return null;
        }
    }
    
    /**
     * Parse YAML content with caching
     */
    parseYAML(content: string, cacheKey: string): any {
        const cached = this.yamlCache.get(cacheKey);
        const now = Date.now();
        
        // Use cached value if available and not expired
        if (cached && now - cached.timestamp < CacheManager.YAML_CACHE_TTL) {
            return cached.data;
        }
        
        try {
            const result = YAML.parse(content);
            this.stats.yamlParses++;
            
            this.yamlCache.set(cacheKey, {
                data: result,
                timestamp: now
            });
            
            // Cleanup expired entries
            this.cleanupYAMLCache();
            
            return result;
        } catch (error) {
            console.error('Error parsing YAML content:', error);
            return null;
        }
    }
    
    /**
     * Extract and parse frontmatter from markdown content
     */
    extractFrontmatter(content: string, cacheKey: string): any {
        if (!content.startsWith('---')) {
            return null;
        }
        
        const endOfFrontmatter = content.indexOf('---', 3);
        if (endOfFrontmatter === -1) {
            return null;
        }
        
        const frontmatter = content.substring(3, endOfFrontmatter);
        return this.parseYAML(frontmatter, cacheKey);
    }
    
    /**
     * Get task info for a specific file
     */
    async getTaskInfo(path: string, forceRefresh = false): Promise<TaskInfo | null> {
        // Check cache first
        if (!forceRefresh && this.taskInfoCache.has(path)) {
            this.stats.cacheHits++;
            return this.taskInfoCache.get(path)!;
        }
        
        const content = await this.getFileContent(path, forceRefresh);
        if (!content) {
            return null;
        }
        
        try {
            const taskInfo = extractTaskInfo(content, path, this.fieldMapper || undefined);
            
            if (taskInfo) {
                this.taskInfoCache.set(path, taskInfo);
                this.updateTaskIndexes(path, taskInfo);
                this.stats.cacheMisses++;
                return taskInfo;
            }
        } catch (error) {
            console.error(`Error extracting task info from ${path}:`, error);
        }
        
        return null;
    }
    
    /**
     * Get note info for a specific file
     */
    async getNoteInfo(path: string, forceRefresh = false): Promise<NoteInfo | null> {
        // Check cache first
        if (!forceRefresh && this.noteInfoCache.has(path)) {
            this.stats.cacheHits++;
            return this.noteInfoCache.get(path)!;
        }
        
        const content = await this.getFileContent(path, forceRefresh);
        if (!content) {
            return null;
        }
        
        const file = this.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) {
            return null;
        }
        
        try {
            const noteInfo = extractNoteInfo(content, path, file);
            
            if (noteInfo) {
                this.noteInfoCache.set(path, noteInfo);
                this.updateNoteIndexes(path, noteInfo);
                this.stats.cacheMisses++;
                return noteInfo;
            }
        } catch (error) {
            console.error(`Error extracting note info from ${path}:`, error);
        }
        
        return null;
    }
    
    /**
     * Get all tasks (for compatibility with FileIndexer behavior)
     * The date parameter is kept for compatibility but filtering should happen in the view layer
     */
    async getTasksForDate(date: Date, forceRefresh = false): Promise<TaskInfo[]> {
        // Return ALL tasks, not filtered by date - let the view layer handle filtering
        // This matches the behavior of FileIndexer.getTaskInfoForDate()
        const results: TaskInfo[] = [];
        
        // Get all task paths from the indexed files cache
        const allTaskPaths = Array.from(this.taskInfoCache.keys());
        
        // If we don't have cached tasks, load them from indexed files
        if (allTaskPaths.length === 0) {
            const allIndexedPaths = Array.from(this.indexedFilesCache.keys())
                .filter(path => {
                    const indexed = this.indexedFilesCache.get(path);
                    return indexed?.isTask;
                });
            
            // Process in batches for better performance
            const batchSize = 20;
            for (let i = 0; i < allIndexedPaths.length; i += batchSize) {
                const batch = allIndexedPaths.slice(i, i + batchSize);
                const batchPromises = batch.map(path => this.getTaskInfo(path, forceRefresh));
                const batchResults = await Promise.all(batchPromises);
                
                batchResults.forEach(task => {
                    if (task) results.push(task);
                });
            }
        } else {
            // Use cached task info
            for (const taskInfo of this.taskInfoCache.values()) {
                results.push(taskInfo);
            }
        }
        
        return results;
    }
    
    /**
     * Get tasks that are due on a specific date (for calendar highlighting)
     */
    async getTasksDueOnDate(date: Date): Promise<TaskInfo[]> {
        const dateStr = date.toISOString().split('T')[0];
        const taskPaths = this.tasksByDate.get(dateStr) || new Set();
        const results: TaskInfo[] = [];
        
        // Process in batches for better performance
        const batchSize = 20;
        const pathArray = Array.from(taskPaths);
        
        for (let i = 0; i < pathArray.length; i += batchSize) {
            const batch = pathArray.slice(i, i + batchSize);
            const batchPromises = batch.map(path => this.getTaskInfo(path, false));
            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(task => {
                if (task) results.push(task);
            });
        }
        
        return results;
    }
    
    /**
     * Get notes for a specific date
     */
    async getNotesForDate(date: Date, forceRefresh = false): Promise<NoteInfo[]> {
        const dateStr = date.toISOString().split('T')[0];
        const notePaths = this.notesByDate.get(dateStr) || new Set();
        const results: NoteInfo[] = [];
        
        // Process in batches for better performance
        const batchSize = 50;
        const pathArray = Array.from(notePaths);
        
        for (let i = 0; i < pathArray.length; i += batchSize) {
            const batch = pathArray.slice(i, i + batchSize);
            const batchPromises = batch.map(path => this.getNoteInfo(path, forceRefresh));
            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(note => {
                if (note) results.push(note);
            });
        }
        
        return results;
    }
    
    /**
     * Get calendar data for a specific month
     */
    async getCalendarData(year: number, month: number, forceRefresh = false): Promise<{
        notes: Map<string, number>,
        tasks: Map<string, {
            count: number,
            hasDue: boolean,
            hasCompleted: boolean,
            hasArchived: boolean
        }>,
        dailyNotes: Set<string>
    }> {
        // This method aggregates data from the indexes
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        
        const notesMap = new Map<string, number>();
        const tasksMap = new Map<string, {
            count: number,
            hasDue: boolean,
            hasCompleted: boolean,
            hasArchived: boolean
        }>();
        
        // Aggregate notes by date
        for (const [dateStr, notePaths] of this.notesByDate) {
            const date = new Date(dateStr);
            if (date >= startOfMonth && date <= endOfMonth) {
                notesMap.set(dateStr, notePaths.size);
            }
        }
        
        // Aggregate tasks by date
        for (const [dateStr, taskPaths] of this.tasksByDate) {
            const date = new Date(dateStr);
            if (date >= startOfMonth && date <= endOfMonth) {
                const taskInfos = await Promise.all(
                    Array.from(taskPaths).map(path => this.getTaskInfo(path))
                );
                
                const validTasks = taskInfos.filter(Boolean) as TaskInfo[];
                if (validTasks.length > 0) {
                    tasksMap.set(dateStr, {
                        count: validTasks.length,
                        hasDue: true,
                        hasCompleted: validTasks.some(t => t.status === 'done'),
                        hasArchived: validTasks.some(t => t.archived)
                    });
                }
            }
        }
        
        // Filter daily notes for the month
        const monthlyDailyNotes = new Set<string>();
        this.dailyNotes.forEach(noteDate => {
            const date = new Date(noteDate);
            if (date.getFullYear() === year && date.getMonth() === month) {
                monthlyDailyNotes.add(noteDate);
            }
        });
        
        return {
            notes: notesMap,
            tasks: tasksMap,
            dailyNotes: monthlyDailyNotes
        };
    }
    
    /**
     * Initialize the cache by scanning all markdown files
     */
    async initializeCache(): Promise<void> {
        const start = performance.now();
        
        // Clear existing caches
        this.clearAllCaches();
        
        // Get all markdown files
        const files = this.vault.getMarkdownFiles();
        
        // Process files in batches for better responsiveness
        const batchSize = 50;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            await Promise.all(batch.map(file => this.indexFile(file)));
        }
        
        const end = performance.now();
        
        // Notify subscribers
        this.notifySubscribers('cache-initialized', {
            taskCount: this.taskInfoCache.size,
            noteCount: this.noteInfoCache.size,
            duration: end - start
        });
    }
    
    /**
     * Index a single file and update caches
     */
    async indexFile(file: TFile): Promise<void> {
        if (file.extension !== 'md' || this.isExcluded(file.path)) {
            return;
        }
        
        try {
            const content = await this.getFileContent(file.path, true);
            if (!content) return;
            
            // Check if this is a task file
            const frontmatter = this.extractFrontmatter(content, file.path);
            const isTask = frontmatter?.tags?.includes(this.taskTag);
            
            // Create indexed file entry
            const indexedFile: IndexedFile = {
                path: file.path,
                mtime: file.stat.mtime,
                ctime: file.stat.ctime,
                tags: frontmatter?.tags || [],
                isTask
            };
            
            this.indexedFilesCache.set(file.path, indexedFile);
            
            // Process as task or note
            if (isTask) {
                await this.getTaskInfo(file.path, true);
            } else {
                await this.getNoteInfo(file.path, true);
            }
            
            // Check if it's a daily note
            this.updateDailyNotesIndex(file.path);
            
        } catch (error) {
            console.error(`Error indexing file ${file.path}:`, error);
        }
    }
    
    /**
     * Update task indexes when task info changes
     */
    private updateTaskIndexes(path: string, taskInfo: TaskInfo): void {
        // Remove from old indexes
        this.removeFromIndexes(path, 'task');
        
        // Add to new indexes
        if (taskInfo.due) {
            const dateStr = taskInfo.due;
            if (!this.tasksByDate.has(dateStr)) {
                this.tasksByDate.set(dateStr, new Set());
            }
            this.tasksByDate.get(dateStr)!.add(path);
        }
        
        if (taskInfo.status) {
            if (!this.tasksByStatus.has(taskInfo.status)) {
                this.tasksByStatus.set(taskInfo.status, new Set());
            }
            this.tasksByStatus.get(taskInfo.status)!.add(path);
        }
        
        if (taskInfo.priority) {
            if (!this.tasksByPriority.has(taskInfo.priority)) {
                this.tasksByPriority.set(taskInfo.priority, new Set());
            }
            this.tasksByPriority.get(taskInfo.priority)!.add(path);
        }
    }
    
    /**
     * Update note indexes when note info changes
     */
    private updateNoteIndexes(path: string, noteInfo: NoteInfo): void {
        // Remove from old indexes
        this.removeFromIndexes(path, 'note');
        
        // Add to new indexes
        if (noteInfo.createdDate) {
            const dateStr = noteInfo.createdDate.split('T')[0];
            if (!this.notesByDate.has(dateStr)) {
                this.notesByDate.set(dateStr, new Set());
            }
            this.notesByDate.get(dateStr)!.add(path);
        }
    }
    
    /**
     * Update daily notes index
     */
    private updateDailyNotesIndex(path: string): void {
        const normalizedPath = this.dailyNotesPath.replace(/^\/+|\/+$/g, '');
        
        // Check if this file is in the daily notes folder with correct format
        const isInDailyNotesFolder = 
            path.startsWith(normalizedPath + '/') || 
            path === normalizedPath ||
            (normalizedPath === '' && !path.includes('/'));
        
        const fileName = path.split('/').pop() || '';
        const hasCorrectFormat = /^\d{4}-\d{2}-\d{2}\.md$/.test(fileName);
        
        if (isInDailyNotesFolder && hasCorrectFormat) {
            const dateStr = fileName.replace('.md', '');
            this.dailyNotes.add(dateStr);
        }
    }
    
    /**
     * Remove file from all indexes
     */
    private removeFromIndexes(path: string, type?: 'task' | 'note'): void {
        // Remove from date indexes
        for (const [dateStr, paths] of this.tasksByDate) {
            paths.delete(path);
            if (paths.size === 0) {
                this.tasksByDate.delete(dateStr);
            }
        }
        
        for (const [dateStr, paths] of this.notesByDate) {
            paths.delete(path);
            if (paths.size === 0) {
                this.notesByDate.delete(dateStr);
            }
        }
        
        // Remove from other task indexes
        for (const [status, paths] of this.tasksByStatus) {
            paths.delete(path);
            if (paths.size === 0) {
                this.tasksByStatus.delete(status);
            }
        }
        
        for (const [priority, paths] of this.tasksByPriority) {
            paths.delete(path);
            if (paths.size === 0) {
                this.tasksByPriority.delete(priority);
            }
        }
        
        // Remove from daily notes if applicable
        const fileName = path.split('/').pop() || '';
        if (/^\d{4}-\d{2}-\d{2}\.md$/.test(fileName)) {
            const dateStr = fileName.replace('.md', '');
            this.dailyNotes.delete(dateStr);
        }
    }
    
    /**
     * Register file system event handlers
     */
    private registerFileEvents(): void {
        const debouncedUpdate = debounce((file: TFile) => {
            this.handleFileUpdate(file);
        }, 300);
        
        const debouncedAdd = debounce((file: TFile) => {
            this.handleFileAdd(file);
        }, 300);
        
        this.eventHandlers.modify = (file) => {
            if (file instanceof TFile) {
                debouncedUpdate(file);
            }
        };
        
        this.eventHandlers.delete = (file) => {
            if (file instanceof TFile) {
                this.handleFileDelete(file);
            }
        };
        
        this.eventHandlers.rename = (file, oldPath) => {
            if (file instanceof TFile) {
                this.handleFileRename(file, oldPath);
            }
        };
        
        this.eventHandlers.create = (file) => {
            if (file instanceof TFile) {
                debouncedAdd(file);
            }
        };
        
        // Register the events
        this.vault.on('modify', this.eventHandlers.modify);
        this.vault.on('delete', this.eventHandlers.delete);
        this.vault.on('rename', this.eventHandlers.rename);
        this.vault.on('create', this.eventHandlers.create);
    }
    
    /**
     * Handle file update events
     */
    private async handleFileUpdate(file: TFile): Promise<void> {
        // Clear caches for this file
        this.clearCacheEntry(file.path);
        
        // Re-index the file
        await this.indexFile(file);
        
        // Notify subscribers
        this.notifySubscribers('file-updated', { path: file.path });
    }
    
    /**
     * Handle file addition events
     */
    private async handleFileAdd(file: TFile): Promise<void> {
        await this.indexFile(file);
        this.notifySubscribers('file-added', { path: file.path });
    }
    
    /**
     * Handle file deletion events
     */
    private handleFileDelete(file: TFile): void {
        this.clearCacheEntry(file.path);
        this.removeFromIndexes(file.path);
        this.notifySubscribers('file-deleted', { path: file.path });
    }
    
    /**
     * Handle file rename events
     */
    private async handleFileRename(file: TFile, oldPath: string): Promise<void> {
        // Clear old caches
        this.clearCacheEntry(oldPath);
        this.removeFromIndexes(oldPath);
        
        // Index with new path
        await this.indexFile(file);
        
        this.notifySubscribers('file-renamed', { 
            oldPath, 
            newPath: file.path 
        });
    }
    
    /**
     * Clear cache entry for a specific file
     */
    clearCacheEntry(path: string): void {
        this.fileContentCache.delete(path);
        this.yamlCache.delete(path);
        this.taskInfoCache.delete(path);
        this.noteInfoCache.delete(path);
        this.indexedFilesCache.delete(path);
    }
    
    /**
     * Clear all caches
     */
    clearAllCaches(): void {
        this.fileContentCache.clear();
        this.yamlCache.clear();
        this.taskInfoCache.clear();
        this.noteInfoCache.clear();
        this.indexedFilesCache.clear();
        this.tasksByDate.clear();
        this.notesByDate.clear();
        this.tasksByStatus.clear();
        this.tasksByPriority.clear();
        this.dailyNotes.clear();
    }
    
    /**
     * Evict old entries from file cache
     */
    private evictFileCache(): void {
        if (this.fileContentCache.size <= CacheManager.MAX_CACHE_SIZE) {
            return;
        }
        
        // Sort by mtime and remove oldest entries
        const entries = Array.from(this.fileContentCache.entries())
            .sort((a, b) => a[1].mtime - b[1].mtime);
        
        const toRemove = entries.slice(0, entries.length - CacheManager.MAX_CACHE_SIZE);
        toRemove.forEach(([path]) => {
            this.fileContentCache.delete(path);
        });
    }
    
    /**
     * Clean up expired YAML cache entries
     */
    private cleanupYAMLCache(): void {
        const now = Date.now();
        
        for (const [key, entry] of this.yamlCache.entries()) {
            if (now - entry.timestamp > CacheManager.YAML_CACHE_TTL) {
                this.yamlCache.delete(key);
            }
        }
    }
    
    /**
     * Check if a file path is excluded
     */
    private isExcluded(path: string): boolean {
        if (this.dailyNoteTemplatePath && path === this.dailyNoteTemplatePath) {
            return true;
        }
        
        return this.excludedFolders.some(folder => 
            folder && path.startsWith(folder)
        );
    }
    
    /**
     * Update configuration
     */
    updateConfig(
        taskTag?: string,
        excludedFolders?: string,
        dailyNotesPath?: string,
        dailyNoteTemplatePath?: string,
        fieldMapper?: FieldMapper
    ): void {
        if (taskTag !== undefined) this.taskTag = taskTag;
        if (excludedFolders !== undefined) {
            this.excludedFolders = excludedFolders 
                ? excludedFolders.split(',').map(folder => folder.trim())
                : [];
        }
        if (dailyNotesPath !== undefined) {
            this.dailyNotesPath = dailyNotesPath.replace(/^\/+|\/+$/g, '');
        }
        if (dailyNoteTemplatePath !== undefined) {
            this.dailyNoteTemplatePath = dailyNoteTemplatePath;
        }
        if (fieldMapper !== undefined) {
            this.fieldMapper = fieldMapper;
        }
    }
    
    /**
     * Get cache statistics
     */
    getStats(): {
        cacheHits: number;
        cacheMisses: number;
        fileReads: number;
        yamlParses: number;
        hitRatio: number;
        tasksCached: number;
        notesCached: number;
        filesCached: number;
    } {
        const total = this.stats.cacheHits + this.stats.cacheMisses;
        return {
            ...this.stats,
            hitRatio: total > 0 ? this.stats.cacheHits / total : 0,
            tasksCached: this.taskInfoCache.size,
            notesCached: this.noteInfoCache.size,
            filesCached: this.fileContentCache.size
        };
    }
    
    /**
     * Clean up and unregister event handlers
     */
    destroy(): void {
        // Unregister all event handlers
        if (this.eventHandlers.modify) {
            this.vault.off('modify', this.eventHandlers.modify);
        }
        if (this.eventHandlers.delete) {
            this.vault.off('delete', this.eventHandlers.delete);
        }
        if (this.eventHandlers.rename) {
            this.vault.off('rename', this.eventHandlers.rename);
        }
        if (this.eventHandlers.create) {
            this.vault.off('create', this.eventHandlers.create);
        }
        
        // Clear all caches
        this.clearAllCaches();
        
        // Clear subscribers
        this.subscribers.clear();
        
        // Clear event handlers object
        this.eventHandlers = {};
    }
}