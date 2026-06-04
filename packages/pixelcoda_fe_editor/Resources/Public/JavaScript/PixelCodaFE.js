/**
 * PixelCoda Frontend Editor - Modern JavaScript Architecture
 * Inspired by the original frontend_editing extension but simplified and modernized
 */

class PixelCodaFE {
    constructor() {
        this.editMode = false;
        this.toolbar = null;
        this.editableElements = [];
        this.eventDispatcher = new EventTarget();
        this.config = {
            ajaxUrl: null,
            csrfToken: null,
            autoSave: true,
            autoSaveDelay: 1000
        };

        this.init();
    }

    /**
     * Initialize the frontend editor
     */
    init() {
        this.loadConfig();
        this.initToolbar();
        this.bindEvents();
        this.scanEditableElements();

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
            ...data,
            token: this.config.csrfToken
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
        event.detail.element.classList.remove('pc-fe-modified');
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
     * Reset all modifications
     */
    resetModifications() {
        this.editableElements.forEach(el => {
            el.classList.remove('pc-fe-modified');
        });
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