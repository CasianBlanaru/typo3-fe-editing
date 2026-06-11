/**
 * PixelCoda Frontend Editor - Modern JavaScript Architecture
 * Inspired by the original frontend_editing extension but simplified and modernized
 */

class PixelCodaFE {
    constructor() {
        this.editMode = false;
        this.toolbar = null;
        this.elementToolbar = null;
        this.activeRecord = null;
        this.editableElements = [];
        this.eventDispatcher = new EventTarget();
        this.config = {
            ajaxUrl: null,
            csrfToken: null,
            autoSave: false, // Default to false to use draft state
            autoSaveDelay: 1000
        };
        this.storageKey = 'pc_fe_editor_draft';
        this.draft = {};

        this.init();
    }

    /**
     * Initialize the frontend editor
     */
    init() {
        this.loadConfig();
        this.initToolbar();
        this.initElementToolbar();
        this.loadDraft();
        this.bindEvents();
        this.scanEditableElements();
        this.wrapRecords();
        this.applyDraft();
        this.updateSaveButtonState();

        // Dispatch ready event
        this.dispatchEvent('ready');
    }

    /**
     * Load configuration from TYPO3 globals
     */
    loadConfig() {
        if (window.TYPO3 ? .settings ? .ajaxUrls ? . ['fe_editor_save']) {
            this.config.ajaxUrl = window.TYPO3.settings.ajaxUrls['fe_editor_save'];
        }

        if (window.TYPO3 ? .security ? .csrfToken) {
            this.config.csrfToken = window.TYPO3.security.csrfToken;
        }

        console.log('PixelCoda FE: Configuration loaded', this.config);
    }

    /**
     * Initialize toolbar
     */
    initToolbar() {
        this.toolbar = document.getElementById('pc-fe-toolbar-root');
        if (this.toolbar) {
            this.toolbar.hidden = false;
            console.log('PixelCoda FE: Toolbar initialized');
        }
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Custom events
        this.addEventListener('editModeChanged', this.onEditModeChanged.bind(this));
        this.addEventListener('elementSaved', this.onElementSaved.bind(this));
        this.addEventListener('elementCreated', this.onElementCreated.bind(this));
    }

    /**
     * Handle click events
     */
    async handleClick(event) {
        const target = event.target;

        // Edit toggle button
        if (target.closest('#pc-edit-toggle')) {
            this.toggleEditMode();
            return;
        }

        // Save button
        if (target.closest('#pc-save')) {
            await this.saveAll();
            return;
        }

        // AI button
        if (target.closest('#pc-ai')) {
            await this.handleAIAction();
            return;
        }

        // Add element buttons
        if (target.closest('.pc-add')) {
            const dropzone = target.closest('[data-pc-dropzone]');
            if (dropzone) {
                await this.createContentElement(dropzone.dataset.targetPid, dropzone.dataset.colPos);
            }
            return;
        }

        // Global add button
        if (target.closest('#pc-add-global')) {
            await this.createGlobalElement();
            return;
        }

        // Element actions
        if (target.closest('.pc-fe-move-up')) {
            await this.moveElement('up');
            return;
        }
        if (target.closest('.pc-fe-move-down')) {
            await this.moveElement('down');
            return;
        }
        if (target.closest('.pc-fe-delete')) {
            await this.deleteElement();
            return;
        }
    }

    /**
     * Handle mouse over events
     */
    handleMouseOver(event) {
        if (!this.editMode) return;

        const record = event.target.closest('[data-pc-record]');
        if (record && record !== this.activeRecord) {
            this.activeRecord = record;
            this.showElementToolbar(record);
        }
    }

    /**
     * Handle focus in events
     */
    handleFocusIn(event) {
        if (!this.editMode) return;

        const record = event.target.closest('[data-pc-record]');
        if (record && record !== this.activeRecord) {
            this.activeRecord = record;
            this.showElementToolbar(record);
        }
    }

    /**
     * Handle drag start
     */
    handleDragStart(event) {
        if (!this.editMode) return;
        const dragHandle = event.target.closest('.pc-fe-drag-handle');
        if (!dragHandle) return;

        const record = dragHandle.closest('[data-pc-record]');
        if (!record) return;

        event.dataTransfer.setData('text/plain', record.dataset.uid);
        event.dataTransfer.effectAllowed = 'move';

        record.classList.add('pc-fe-dragging');
        document.body.classList.add('pc-fe-is-dragging');
    }

    /**
     * Handle drag over
     */
    handleDragOver(event) {
        if (!this.editMode) return;
        const record = event.target.closest('[data-pc-record]');
        if (!record || record.classList.contains('pc-fe-dragging')) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const rect = record.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        // Remove previous indicators
        document.querySelectorAll('.pc-fe-drop-indicator').forEach(el => el.remove());

        const indicator = document.createElement('div');
        indicator.className = 'pc-fe-drop-indicator';

        if (event.clientY < midpoint) {
            record.before(indicator);
            indicator.dataset.position = 'before';
            indicator.dataset.targetUid = record.dataset.uid;
        } else {
            record.after(indicator);
            indicator.dataset.position = 'after';
            indicator.dataset.targetUid = record.dataset.uid;
        }
    }

    /**
     * Handle drop
     */
    async handleDrop(event) {
        if (!this.editMode) return;
        const indicator = document.querySelector('.pc-fe-drop-indicator');
        if (!indicator) return;

        event.preventDefault();
        const draggedUid = event.dataTransfer.getData('text/plain');
        const targetUid = indicator.dataset.targetUid;
        const position = indicator.dataset.position;

        if (draggedUid === targetUid) {
            this.handleDragEnd();
            return;
        }

        const draggedElement = document.querySelector(`[data-pc-record][data-uid="${draggedUid}"]`);
        const table = draggedElement ? draggedElement.dataset.table : 'tt_content';

        let finalTarget;
        if (position === 'before') {
            const targetElement = document.querySelector(`[data-pc-record][data-uid="${targetUid}"]`);
            const prev = targetElement.previousElementSibling;
            if (prev && prev.hasAttribute('data-pc-record')) {
                finalTarget = -prev.dataset.uid;
            } else {
                finalTarget = targetElement.dataset.pid || document.querySelector('[data-pid]')?.dataset.pid || 0;
            }
        } else {
            finalTarget = -targetUid;
        }

        try {
            const result = await this.sendRequest({
                action: 'move',
                table,
                uid: draggedUid,
                target: finalTarget
            });

            if (result.ok) {
                this.announceToScreenReader('Element reordered. Reloading page...');
                this.showNotification('Element reordered', 'success');
                location.reload();
            } else {
                throw new Error(result.message || 'Reorder failed');
            }
        } catch (error) {
            this.showNotification('Reorder failed: ' + error.message, 'error');
            this.handleDragEnd();
        }
    }

    /**
     * Handle drag end
     */
    handleDragEnd() {
        document.querySelectorAll('.pc-fe-dragging').forEach(el => el.classList.remove('pc-fe-dragging'));
        document.querySelectorAll('.pc-fe-drop-indicator').forEach(el => el.remove());
        document.body.classList.remove('pc-fe-is-dragging');
    }

    /**
     * Handle input events
     */
    handleInput(event) {
        const element = event.target.closest('[data-pc-field]');
        if (!element || !this.editMode) return;

        this.markAsModified(element);
        this.saveToDraft(element);
        this.updateSaveButtonState();
    }

    /**
     * Handle focus out events (auto-save)
     */
    async handleFocusOut(event) {
        const element = event.target.closest('[data-pc-field]');
        if (!element || !this.editMode) return;

        if (this.config.autoSave) {
            await this.saveElement(element);
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(event) {
        // Ctrl+S or Cmd+S to save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveAll();
            return;
        }

        // Escape to exit edit mode
        if (event.key === 'Escape' && this.editMode) {
            this.toggleEditMode();
            return;
        }
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        this.editMode = !this.editMode;
        this.setEditableState(this.editMode);

        const toggleButton = document.getElementById('pc-edit-toggle');
        if (toggleButton) {
            toggleButton.classList.toggle('active', this.editMode);
        }

        if (!this.editMode) {
            this.hideElementToolbar();
            this.activeRecord = null;
        }

        this.dispatchEvent('editModeChanged', {
            editMode: this.editMode
        });
        console.log('PixelCoda FE: Edit mode', this.editMode ? 'enabled' : 'disabled');
    }

    /**
     * Set editable state for all elements
     */
    setEditableState(editable) {
        this.editableElements.forEach(element => {
            element.contentEditable = editable ? 'true' : 'false';
            element.classList.toggle('pc-fe-editable', editable);

            if (editable) {
                element.setAttribute('title', 'Click to edit');
            } else {
                element.removeAttribute('title');
            }
        });
    }

    /**
     * Scan for editable elements
     */
    scanEditableElements() {
        this.editableElements = Array.from(document.querySelectorAll('[data-pc-field]'));
        console.log('PixelCoda FE: Found', this.editableElements.length, 'editable elements');
    }

    /**
     * Wrap records with [data-pc-record] if they don't have it
     */
    wrapRecords() {
        const fields = document.querySelectorAll('[data-pc-field]');
        fields.forEach(field => {
            let record = field.closest('[data-pc-record]');
            if (!record) {
                // Find a container that seems to represent the whole record, usually the parent of multiple fields
                // For now, let's just mark the parent if it contains the fields
                record = field.parentElement;
                record.setAttribute('data-pc-record', '');
                record.setAttribute('data-table', field.dataset.table);
                record.setAttribute('data-uid', field.dataset.uid);
            }
        });
    }

    /**
     * Initialize element toolbar
     */
    initElementToolbar() {
        this.elementToolbar = document.createElement('div');
        this.elementToolbar.id = 'pc-fe-element-toolbar';
        this.elementToolbar.className = 'pc-fe-move-controls';
        this.elementToolbar.hidden = true;
        this.elementToolbar.innerHTML = `
            <button class="pc-fe-move-button pc-fe-move-up" title="Move Up" aria-label="Move Up">↑</button>
            <button class="pc-fe-move-button pc-fe-move-down" title="Move Down" aria-label="Move Down">↓</button>
            <div class="pc-fe-drag-handle" draggable="true" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</div>
            <button class="pc-fe-move-button pc-fe-delete pc-fe-danger-action" title="Delete" aria-label="Delete">×</button>
        `;
        document.body.appendChild(this.elementToolbar);
    }

    /**
     * Show element toolbar for a record
     */
    showElementToolbar(record) {
        if (!this.elementToolbar) return;

        const rect = record.getBoundingClientRect();
        this.elementToolbar.style.top = `${rect.top + window.scrollY}px`;
        this.elementToolbar.style.left = `${rect.left + window.scrollX}px`;
        this.elementToolbar.hidden = false;

        record.classList.add('pc-fe-selected');
    }

    /**
     * Hide element toolbar
     */
    hideElementToolbar() {
        if (this.elementToolbar) {
            this.elementToolbar.hidden = true;
        }
        document.querySelectorAll('.pc-fe-selected').forEach(el => el.classList.remove('pc-fe-selected'));
    }

    /**
     * Move element up or down
     */
    async moveElement(direction) {
        if (!this.activeRecord) return;
        const { table, uid } = this.activeRecord.dataset;

        const targetElement = direction === 'up'
            ? this.activeRecord.previousElementSibling
            : this.activeRecord.nextElementSibling;

        if (!targetElement || !targetElement.hasAttribute('data-pc-record')) {
            this.showNotification(`Cannot move ${direction} further`, 'warning');
            return;
        }

        const targetUid = direction === 'up'
            ? `-${targetElement.dataset.uid}` // Move before
            : targetElement.dataset.uid; // Move after is tricky in DataHandler, usually move to -targetUid means BEFORE targetUid.
                                         // Actually DataHandler move target:
                                         // If target > 0, it's the PID (move to top of page)
                                         // If target < 0, it's the UID of record AFTER which we move (actually move after -target)

        // Correct TYPO3 DataHandler logic:
        // move [table][uid] to [target]
        // if target is > 0, move to the top of the page with that PID
        // if target is < 0, move AFTER the record with UID = abs(target)

        let finalTarget;
        if (direction === 'up') {
            const prevPrev = targetElement.previousElementSibling;
            if (prevPrev && prevPrev.hasAttribute('data-pc-record')) {
                finalTarget = -prevPrev.dataset.uid;
            } else {
                // Move to top of page (pid)
                finalTarget = targetElement.dataset.pid || document.querySelector('[data-pid]')?.dataset.pid || 0;
            }
        } else {
            finalTarget = -targetElement.dataset.uid;
        }

        try {
            const result = await this.sendRequest({
                action: 'move',
                table,
                uid,
                target: finalTarget
            });

            if (result.ok) {
                this.showNotification('Element moved', 'success');
                location.reload();
            } else {
                throw new Error(result.message || 'Move failed');
            }
        } catch (error) {
            this.showNotification('Move failed: ' + error.message, 'error');
        }
    }

    /**
     * Delete element
     */
    async deleteElement() {
        if (!this.activeRecord) return;
        if (!confirm('Are you sure you want to delete this element?')) return;

        const { table, uid } = this.activeRecord.dataset;

        try {
            const result = await this.sendRequest({
                action: 'delete',
                table,
                uid
            });

            if (result.ok) {
                this.showNotification('Element deleted', 'success');
                this.activeRecord.remove();
                this.hideElementToolbar();
            } else {
                throw new Error(result.message || 'Delete failed');
            }
        } catch (error) {
            this.showNotification('Delete failed: ' + error.message, 'error');
        }
    }

    /**
     * Save a single element
     */
    async saveElement(element) {
        const {
            table,
            uid,
            field
        } = element.dataset;
        const value = element.innerHTML;

        try {
            const result = await this.saveField({
                table,
                uid,
                field,
                value
            });

            if (result.ok) {
                this.showNotification('Saved successfully', 'success');
                this.announceToScreenReader('Changes saved successfully');
                this.dispatchEvent('elementSaved', {
                    element,
                    table,
                    uid,
                    field,
                    value
                });
            } else {
                throw new Error(result.message || 'Save failed');
            }
        } catch (error) {
            console.error('Save failed:', error);
            this.showNotification('Save failed: ' + error.message, 'error');
        }
    }

    /**
     * Save all modified elements
     */
    async saveAll() {
        const modifiedElements = this.editableElements.filter(el =>
            el.classList.contains('pc-fe-modified')
        );

        if (modifiedElements.length === 0) {
            this.showNotification('No changes to save', 'info');
            return;
        }

        this.showNotification('Saving ' + modifiedElements.length + ' elements...', 'info');

        try {
            const promises = modifiedElements.map(el => this.saveElement(el));
            await Promise.all(promises);

            modifiedElements.forEach(el => el.classList.remove('pc-fe-modified'));
            this.showNotification('All changes saved successfully', 'success');
        } catch (error) {
            console.error('Bulk save failed:', error);
            this.showNotification('Some saves failed', 'error');
        }
    }

    /**
     * Handle AI action
     */
    async handleAIAction() {
        const activeElement = document.querySelector('[data-pc-field][contenteditable="true"]:focus');
        if (!activeElement) {
            this.showNotification('Please select a text field first', 'warning');
            return;
        }

        // Placeholder for AI integration
        const currentText = activeElement.textContent || activeElement.innerText || '';
        const aiSuggestion = '[AI Suggestion] Enhanced: ' + currentText;

        activeElement.innerHTML = aiSuggestion;
        activeElement.classList.add('pc-fe-modified');

        this.dispatchEvent('aiActionPerformed', {
            element: activeElement,
            suggestion: aiSuggestion
        });
        this.showNotification('AI suggestion applied', 'success');
    }

    /**
     * Create content element
     */
    async createContentElement(pid, colPos) {
        if (!this.config.ajaxUrl || !this.config.csrfToken) {
            console.error('Missing configuration for content creation');
            return;
        }

        const newId = 'NEW' + Math.floor(Math.random() * 1e6);
        const data = {
            tt_content: {
                [newId]: {
                    pid: parseInt(pid, 10),
                    colPos: parseInt(colPos, 10),
                    CType: 'text',
                    header: 'New Element',
                    bodytext: '<p>Click to edit this content...</p>'
                }
            }
        };

        try {
            const result = await this.sendRequest({
                data: JSON.stringify(data),
                cmd: JSON.stringify({})
            });

            if (result.ok) {
                this.showNotification('New element created', 'success');
                this.dispatchEvent('elementCreated', {
                    pid,
                    colPos,
                    data
                });

                // Reload page to show new element
                setTimeout(() => location.reload(), 500);
            } else {
                throw new Error(result.message || 'Creation failed');
            }
        } catch (error) {
            console.error('Create failed:', error);
            this.showNotification('Failed to create element: ' + error.message, 'error');
        }
    }

    /**
     * Create element globally (find best position)
     */
    async createGlobalElement() {
        const firstDropzone = document.querySelector('[data-pc-dropzone]');
        if (firstDropzone) {
            await this.createContentElement(firstDropzone.dataset.targetPid, firstDropzone.dataset.colPos);
        } else {
            // Fallback: create in colPos 0 on current page
            const pidElement = document.querySelector('[data-pid]');
            const pid = pidElement ? pidElement.dataset.pid : '1';
            await this.createContentElement(pid, '0');
        }
    }

    /**
     * Save field to backend
     */
    async saveField({
        table,
        uid,
        field,
        value
    }) {
        return this.sendRequest({
            table,
            uid,
            field,
            value
        });
    }

    /**
     * Send request to backend
     */
    async sendRequest(data) {
        if (!this.config.ajaxUrl || !this.config.csrfToken) {
            throw new Error('Missing configuration');
        }

        const formData = new URLSearchParams({
            formToken: this.config.csrfToken, // SaveController expects formToken
            ...data
        });

        const response = await fetch(this.config.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create simple notification element
        const notification = document.createElement('div');
        notification.className = `pc-fe-notification pc-fe-notification--${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button type="button" onclick="this.parentElement.remove()">×</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            padding: 0.75rem 1rem;
            background: ${this.getNotificationColor(type)};
            color: white;
            border-radius: 0.5rem;
            z-index: 999998;
            font: 14px/1.2 system-ui;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Get notification color based on type
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`pixelcoda:${eventName}`, {
            detail
        });
        this.eventDispatcher.dispatchEvent(event);
        document.dispatchEvent(event);
    }

    /**
     * Add event listener
     */
    addEventListener(eventName, callback) {
        this.eventDispatcher.addEventListener(`pixelcoda:${eventName}`, callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(eventName, callback) {
        this.eventDispatcher.removeEventListener(`pixelcoda:${eventName}`, callback);
    }

    /**
     * Event handlers
     */
    onEditModeChanged(event) {
        console.log('Edit mode changed:', event.detail.editMode);
    }

    onElementSaved(event) {
        console.log('Element saved:', event.detail);
        const { table, uid, field } = event.detail;
        const draftKey = `${table}:${uid}:${field}`;

        delete this.draft[draftKey];
        this.persistDraft();

        event.detail.element.classList.remove('pc-fe-modified');
        this.updateSaveButtonState();
    }

    onElementCreated(event) {
        console.log('Element created:', event.detail);
    }

    /**
     * Mark element as modified
     */
    markAsModified(element) {
        element.classList.add('pc-fe-modified');
    }

    /**
     * Get all modified elements
     */
    getModifiedElements() {
        return this.editableElements.filter(el =>
            el.classList.contains('pc-fe-modified')
        );
    }

    /**
     * Announce message to screen reader
     */
    announceToScreenReader(message) {
        const status = document.getElementById('pc-fe-status');
        if (status) {
            status.textContent = message;
            status.setAttribute('aria-live', 'assertive');
            setTimeout(() => {
                this.updateSaveButtonState();
            }, 3000);
        }
    }

    /**
     * Reset all modifications
     */
    resetModifications() {
        this.editableElements.forEach(el => {
            el.classList.remove('pc-fe-modified');
        });
        this.clearDraft();
        this.updateSaveButtonState();
    }

    /**
     * Load draft from localStorage
     */
    loadDraft() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                this.draft = JSON.parse(stored);
                console.log('PixelCoda FE: Draft loaded', this.draft);
            } catch (e) {
                console.error('PixelCoda FE: Failed to parse draft', e);
                this.draft = {};
            }
        }
    }

    /**
     * Save element to draft
     */
    saveToDraft(element) {
        const { table, uid, field } = element.dataset;
        const value = element.innerHTML;
        const draftKey = `${table}:${uid}:${field}`;

        this.draft[draftKey] = value;
        this.persistDraft();
    }

    /**
     * Persist draft to localStorage
     */
    persistDraft() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.draft));
    }

    /**
     * Apply draft to elements
     */
    applyDraft() {
        Object.entries(this.draft).forEach(([key, value]) => {
            const [table, uid, field] = key.split(':');
            const element = document.querySelector(`[data-pc-field][data-table="${table}"][data-uid="${uid}"][data-field="${field}"]`);
            if (element) {
                // Determine if we should use textContent or innerHTML based on field type
                // In TYPO3, 'bodytext' is usually the only field allowed to have HTML
                if (field === 'bodytext') {
                    // For bodytext we allow HTML but we should ideally sanitize it
                    // Since we are in a trusted BE context, we'll keep innerHTML but mark it
                    element.innerHTML = value;
                } else {
                    element.textContent = value;
                }
                this.markAsModified(element);
            }
        });
    }

    /**
     * Clear draft
     */
    clearDraft() {
        this.draft = {};
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Update save button state
     */
    updateSaveButtonState() {
        const saveButton = document.getElementById('pc-save');
        if (!saveButton) return;

        const hasChanges = Object.keys(this.draft).length > 0 || this.getModifiedElements().length > 0;
        saveButton.disabled = !hasChanges;
        saveButton.classList.toggle('dirty', hasChanges);

        const status = document.getElementById('pc-fe-status');
        if (status) {
            const message = hasChanges ? `${Object.keys(this.draft).length} unsaved changes` : '';
            if (status.textContent !== message) {
                status.textContent = message;
                status.dataset.state = hasChanges ? 'warning' : '';
                // Trigger aria-live announcement if message changed to something non-empty
                if (message) {
                    status.setAttribute('aria-live', 'polite');
                }
            }
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PixelCodaFE = new PixelCodaFE();
    });
} else {
    window.PixelCodaFE = new PixelCodaFE();
}

// Backward compatibility with old editor.js
if (!window.init) {
    window.init = () => console.log('PixelCoda FE: Legacy init() called - using new architecture');
}