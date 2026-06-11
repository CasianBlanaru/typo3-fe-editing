/**
 * PixelCoda Frontend Editor - Advanced JavaScript Architecture
 * Comprehensive feature set: Draft State, Optimistic UI, Drag & Drop,
 * Floating Formatting, and Content Type Picker.
 */

class PixelCodaFE {
    constructor() {
        this.editMode = false;
        this.toolbar = null;
        this.elementToolbar = null;
        this.bubbleMenu = null;
        this.activeRecord = null;
        this.editableElements = [];
        this.eventDispatcher = new EventTarget();
        this.config = {
            ajaxUrl: null,
            csrfToken: null,
            autoSave: false,
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
        this.initBubbleMenu();
        this.loadDraft();
        this.bindEvents();
        this.scanEditableElements();
        this.wrapRecords();
        this.applyDraft();
        this.updateSaveButtonState();

        this.dispatchEvent('ready');
    }

    /**
     * Load configuration from TYPO3 globals
     */
    loadConfig() {
        if (window.TYPO3?.settings?.ajaxUrls?.['fe_editor_save']) {
            this.config.ajaxUrl = window.TYPO3.settings.ajaxUrls['fe_editor_save'];
        }
        if (window.TYPO3?.security?.feEditorToken) {
            this.config.csrfToken = window.TYPO3.security.feEditorToken;
        }
    }

    /**
     * Initialize toolbars
     */
    initToolbar() {
        this.toolbar = document.getElementById('pc-fe-toolbar-root');
        if (this.toolbar) this.toolbar.hidden = false;
    }

    initElementToolbar() {
        this.elementToolbar = document.createElement('div');
        this.elementToolbar.id = 'pc-fe-element-toolbar';
        this.elementToolbar.className = 'pc-fe-move-controls';
        this.elementToolbar.hidden = true;
        this.elementToolbar.innerHTML = `
            <button class="pc-fe-move-button pc-fe-move-up" title="Move Up" aria-label="Move Up">↑</button>
            <button class="pc-fe-move-button pc-fe-move-down" title="Move Down" aria-label="Move Down">↓</button>
            <button class="pc-fe-move-button pc-fe-hide" title="Hide/Show" aria-label="Toggle Visibility">👁</button>
            <div class="pc-fe-drag-handle" draggable="true" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</div>
            <button class="pc-fe-move-button pc-fe-delete pc-fe-danger-action" title="Delete" aria-label="Delete">×</button>
        `;
        document.body.appendChild(this.elementToolbar);
    }

    initBubbleMenu() {
        this.bubbleMenu = document.createElement('div');
        this.bubbleMenu.className = 'pc-fe-bubble-menu';
        this.bubbleMenu.hidden = true;
        this.bubbleMenu.innerHTML = `
            <button type="button" data-command="bold" title="Bold"><strong>B</strong></button>
            <button type="button" data-command="italic" title="Italic"><em>I</em></button>
            <button type="button" data-command="createLink" title="Link">🔗</button>
            <button type="button" data-command="unlink" title="Unlink">unlink</button>
        `;
        document.body.appendChild(this.bubbleMenu);
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('input', this.handleInput.bind(this));
        document.addEventListener('mouseup', this.handleSelection.bind(this));
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        this.addEventListener('elementSaved', this.onElementSaved.bind(this));
    }

    /**
     * Handle click events
     */
    async handleClick(event) {
        const target = event.target;

        if (target.closest('#pc-edit-toggle')) {
            this.toggleEditMode();
            return;
        }

        if (target.closest('#pc-save')) {
            await this.saveAll();
            return;
        }

        if (target.closest('#pc-discard')) {
            if (confirm('Are you sure you want to discard all unsaved changes?')) {
                this.resetModifications();
                location.reload();
            }
            return;
        }

        if (target.closest('#pc-ai')) {
            await this.handleAIAction();
            return;
        }

        // Floating menu commands
        const bubbleBtn = target.closest('.pc-fe-bubble-menu button');
        if (bubbleBtn) {
            this.executeCommand(bubbleBtn.dataset.command);
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
        if (target.closest('.pc-fe-hide')) {
            await this.toggleVisibility();
            return;
        }
        if (target.closest('.pc-fe-delete')) {
            await this.deleteElement();
            return;
        }

        // Add buttons
        if (target.closest('.pc-add') || target.closest('.pc-add-between')) {
            const dropzone = target.closest('[data-target-pid]');
            if (dropzone) {
                await this.showContentTypePicker(dropzone.dataset.targetPid, dropzone.dataset.colPos);
            }
            return;
        }

        if (target.closest('#pc-add-global')) {
            const pid = document.querySelector('[data-pid]')?.dataset.pid || '1';
            await this.showContentTypePicker(pid, '0');
            return;
        }
    }

    /**
     * Formatting logic
     */
    handleSelection() {
        if (!this.editMode) return;
        const selection = window.getSelection();
        if (selection.isCollapsed || !selection.toString().trim()) {
            this.bubbleMenu.hidden = true;
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        this.bubbleMenu.style.top = `${rect.top + window.scrollY - 45}px`;
        this.bubbleMenu.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (this.bubbleMenu.offsetWidth / 2)}px`;
        this.bubbleMenu.hidden = false;
    }

    executeCommand(command) {
        let value = null;
        if (command === 'createLink') {
            value = prompt('Enter the URL:', 'https://');
            if (!value) return;
        }
        document.execCommand(command, false, value);

        // Mark active element as modified
        const activeField = document.activeElement.closest('[data-pc-field]');
        if (activeField) {
            this.markAsModified(activeField);
            this.saveToDraft(activeField);
            this.updateSaveButtonState();
        }
    }

    /**
     * Optimistic UI Actions
     */
    async moveElement(direction) {
        if (!this.activeRecord) return;
        const record = this.activeRecord;
        const { table, uid } = record.dataset;
        const targetElement = direction === 'up' ? record.previousElementSibling : record.nextElementSibling;

        if (!targetElement || !targetElement.hasAttribute('data-pc-record')) {
            this.showNotification(`Cannot move ${direction} further`, 'warning');
            return;
        }

        // Move DOM immediately
        if (direction === 'up') targetElement.before(record);
        else targetElement.after(record);
        this.showElementToolbar(record);

        let finalTarget;
        if (direction === 'up') {
            const prev = record.previousElementSibling;
            finalTarget = (prev && prev.hasAttribute('data-pc-record')) ? -prev.dataset.uid : (record.dataset.pid || 0);
        } else {
            finalTarget = -record.dataset.uid;
        }

        try {
            const result = await this.sendRequest({ action: 'move', table, uid, target: finalTarget });
            if (result.ok) {
                this.announceToScreenReader('Element moved successfully');
                this.showNotification('Element moved', 'success');
            }
            else throw new Error(result.message);
        } catch (error) {
            this.showNotification('Move failed: ' + error.message, 'error');
            location.reload();
        }
    }

    async deleteElement() {
        if (!this.activeRecord || !confirm('Delete this element?')) return;
        const record = this.activeRecord;
        const { table, uid } = record.dataset;

        record.style.display = 'none';
        this.hideElementToolbar();

        try {
            const result = await this.sendRequest({ action: 'delete', table, uid });
            if (result.ok) {
                this.announceToScreenReader('Element deleted successfully');
                this.showNotification('Element deleted', 'success');
                record.remove();
            } else throw new Error(result.message);
        } catch (error) {
            record.style.display = '';
            this.showNotification('Delete failed: ' + error.message, 'error');
        }
    }

    async toggleVisibility() {
        if (!this.activeRecord) return;
        const { table, uid } = this.activeRecord.dataset;

        try {
            const result = await this.sendRequest({ action: 'toggleVisibility', table, uid });
            if (result.ok) {
                this.showNotification('Visibility toggled', 'success');
                const isHidden = this.activeRecord.style.opacity === '0.5';
                this.activeRecord.style.opacity = isHidden ? '1' : '0.5';
            } else throw new Error(result.message);
        } catch (error) {
            this.showNotification('Toggle failed: ' + error.message, 'error');
        }
    }

    /**
     * Content Creation with Picker
     */
    async showContentTypePicker(pid, colPos) {
        const overlay = document.createElement('div');
        overlay.className = 'pc-fe-picker-overlay';
        overlay.innerHTML = `
            <div class="pc-fe-picker">
                <h3>New Element</h3>
                <div class="pc-fe-picker-grid">
                    <button data-type="text">Text</button>
                    <button data-type="header">Header</button>
                    <button data-type="textpic">Text & Image</button>
                    <button data-type="image">Image</button>
                    <button data-type="html">HTML</button>
                </div>
                <button class="pc-fe-picker-cancel">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);

        return new Promise((resolve) => {
            overlay.addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const type = btn.dataset.type;
                overlay.remove();
                if (type) {
                    await this.createContentElement(pid, colPos, type);
                }
                resolve();
            });
        });
    }

    async createContentElement(pid, colPos, cType = 'text') {
        const newId = 'NEW' + Math.floor(Math.random() * 1e6);
        const data = {
            tt_content: {
                [newId]: {
                    pid: parseInt(pid, 10),
                    colPos: parseInt(colPos, 10),
                    CType: cType,
                    header: 'New ' + cType,
                    bodytext: '<p>Click to edit...</p>'
                }
            }
        };

        this.showNotification('Creating element...', 'info');

        try {
            const result = await this.sendRequest({ data: JSON.stringify(data) });
            if (result.ok) {
                this.showNotification('Element created', 'success');
                location.reload();
            } else throw new Error(result.message);
        } catch (error) {
            this.showNotification('Create failed: ' + error.message, 'error');
        }
    }

    /**
     * Draft State Logic
     */
    saveToDraft(element) {
        const { table, uid, field } = element.dataset;
        const value = element.innerHTML;
        this.draft[`${table}:${uid}:${field}`] = value;
        localStorage.setItem(this.storageKey, JSON.stringify(this.draft));
    }

    loadDraft() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                this.draft = JSON.parse(stored);
            } catch (e) {
                this.draft = {};
            }
        }
    }

    applyDraft() {
        Object.entries(this.draft).forEach(([key, value]) => {
            const [table, uid, field] = key.split(':');
            const el = document.querySelector(`[data-pc-field][data-table="${table}"][data-uid="${uid}"][data-field="${field}"]`);
            if (el) {
                if (field === 'bodytext') el.innerHTML = value;
                else el.textContent = value;
                this.markAsModified(el);
            }
        });
    }

    clearDraft() {
        this.draft = {};
        localStorage.removeItem(this.storageKey);
    }

    /**
     * UI Helpers
     */
    toggleEditMode() {
        this.editMode = !this.editMode;
        this.setEditableState(this.editMode);
        document.getElementById('pc-edit-toggle')?.classList.toggle('active', this.editMode);

        if (this.editMode) this.injectAddBetweenButtons();
        else {
            this.removeAddBetweenButtons();
            this.hideElementToolbar();
            this.bubbleMenu.hidden = true;
            this.activeRecord = null;
        }

        this.dispatchEvent('editModeChanged', { editMode: this.editMode });
    }

    injectAddBetweenButtons() {
        document.querySelectorAll('[data-pc-record]').forEach((record, index) => {
            if (index === 0) this.createAddButton(record, 'before');
            this.createAddButton(record, 'after');
        });
    }

    createAddButton(reference, position) {
        const btn = document.createElement('button');
        btn.className = 'pc-add-between';
        btn.innerHTML = '+';
        btn.setAttribute('aria-label', 'Add content here');
        btn.dataset.targetPid = reference.dataset.pid || document.querySelector('[data-pid]')?.dataset.pid || 0;
        btn.dataset.colPos = reference.dataset.colPos || 0;
        if (position === 'before') reference.before(btn);
        else reference.after(btn);
    }

    removeAddBetweenButtons() {
        document.querySelectorAll('.pc-add-between').forEach(el => el.remove());
    }

    wrapRecords() {
        document.querySelectorAll('[data-pc-field]').forEach(field => {
            let record = field.closest('[data-pc-record]');
            if (!record) {
                record = field.parentElement;
                record.setAttribute('data-pc-record', '');
                record.dataset.table = field.dataset.table;
                record.dataset.uid = field.dataset.uid;
            }
        });
    }

    showElementToolbar(record) {
        if (!this.elementToolbar) return;
        const rect = record.getBoundingClientRect();
        this.elementToolbar.style.top = `${rect.top + window.scrollY}px`;
        this.elementToolbar.style.left = `${rect.left + window.scrollX}px`;
        this.elementToolbar.hidden = false;
        document.querySelectorAll('.pc-fe-selected').forEach(el => el.classList.remove('pc-fe-selected'));
        record.classList.add('pc-fe-selected');
    }

    hideElementToolbar() {
        if (this.elementToolbar) this.elementToolbar.hidden = true;
        document.querySelectorAll('.pc-fe-selected').forEach(el => el.classList.remove('pc-fe-selected'));
    }

    /**
     * Standard Event Handlers
     */
    handleMouseOver(event) {
        if (!this.editMode) return;
        const record = event.target.closest('[data-pc-record]');
        if (record && record !== this.activeRecord) {
            this.activeRecord = record;
            this.showElementToolbar(record);
        }
    }

    handleFocusIn(event) {
        if (!this.editMode) return;
        const record = event.target.closest('[data-pc-record]');
        if (record && record !== this.activeRecord) {
            this.activeRecord = record;
            this.showElementToolbar(record);
        }
    }

    handleInput(event) {
        const el = event.target.closest('[data-pc-field]');
        if (!el || !this.editMode) return;
        this.markAsModified(el);
        this.saveToDraft(el);
        this.updateSaveButtonState();
    }

    async handleFocusOut(event) {
        const el = event.target.closest('[data-pc-field]');
        if (!el || !this.editMode) return;
        if (this.config.autoSave) await this.saveElement(el);
    }

    handleKeyDown(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveAll();
        } else if (event.key === 'Escape' && this.editMode) {
            this.toggleEditMode();
        }
    }

    /**
     * Drag & Drop
     */
    handleDragStart(event) {
        if (!this.editMode) return;
        const handle = event.target.closest('.pc-fe-drag-handle');
        if (!handle) return;
        const record = handle.closest('[data-pc-record]');
        if (!record) return;
        event.dataTransfer.setData('text/plain', record.dataset.uid);
        event.dataTransfer.effectAllowed = 'move';
        record.classList.add('pc-fe-dragging');
        document.body.classList.add('pc-fe-is-dragging');
    }

    handleDragOver(event) {
        if (!this.editMode) return;
        const record = event.target.closest('[data-pc-record]');
        if (!record || record.classList.contains('pc-fe-dragging')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rect = record.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        document.querySelectorAll('.pc-fe-drop-indicator').forEach(el => el.remove());
        const indicator = document.createElement('div');
        indicator.className = 'pc-fe-drop-indicator';
        if (event.clientY < midpoint) record.before(indicator);
        else record.after(indicator);
        indicator.dataset.targetUid = record.dataset.uid;
        indicator.dataset.position = event.clientY < midpoint ? 'before' : 'after';
    }

    async handleDrop(event) {
        if (!this.editMode) return;
        const indicator = document.querySelector('.pc-fe-drop-indicator');
        if (!indicator) return;
        event.preventDefault();
        const draggedUid = event.dataTransfer.getData('text/plain');
        const { targetUid, position } = indicator.dataset;
        if (draggedUid === targetUid) { this.handleDragEnd(); return; }

        const draggedEl = document.querySelector(`[data-pc-record][data-uid="${draggedUid}"]`);
        const targetEl = document.querySelector(`[data-pc-record][data-uid="${targetUid}"]`);

        let finalTarget;
        if (position === 'before') {
            const prev = targetEl.previousElementSibling;
            finalTarget = (prev && prev.hasAttribute('data-pc-record')) ? -prev.dataset.uid : (targetEl.dataset.pid || 0);
        } else finalTarget = -targetUid;

        try {
            const result = await this.sendRequest({ action: 'move', table: draggedEl?.dataset.table || 'tt_content', uid: draggedUid, target: finalTarget });
            if (result.ok) {
                this.announceToScreenReader('Element reordered successfully');
                this.showNotification('Reordered', 'success');
                location.reload();
            } else throw new Error(result.message);
        } catch (error) {
            this.showNotification('Reorder failed: ' + error.message, 'error');
            this.handleDragEnd();
        }
    }

    handleDragEnd() {
        document.querySelectorAll('.pc-fe-dragging').forEach(el => el.classList.remove('pc-fe-dragging'));
        document.querySelectorAll('.pc-fe-drop-indicator').forEach(el => el.remove());
        document.body.classList.remove('pc-fe-is-dragging');
    }

    /**
     * Backend Communication
     */
    async saveElement(element) {
        const { table, uid, field } = element.dataset;
        try {
            const result = await this.sendRequest({ table, uid, field, value: element.innerHTML });
            if (result.ok) {
                this.announceToScreenReader('Changes saved successfully');
                this.showNotification('Saved', 'success');
                this.dispatchEvent('elementSaved', { element, table, uid, field });
            } else throw new Error(result.message);
        } catch (error) {
            this.showNotification('Save failed: ' + error.message, 'error');
        }
    }

    async saveAll() {
        const modified = this.editableElements.filter(el => el.classList.contains('pc-fe-modified'));
        if (modified.length === 0) return this.showNotification('No changes', 'info');
        this.showNotification(`Saving ${modified.length} elements...`, 'info');
        try {
            await Promise.all(modified.map(el => this.saveElement(el)));
            this.showNotification('All saved', 'success');
        } catch (error) {
            this.showNotification('Some failed', 'error');
        }
    }

    async sendRequest(data) {
        if (!this.config.ajaxUrl || !this.config.csrfToken) throw new Error('Unconfigured');
        const formData = new URLSearchParams({ formToken: this.config.csrfToken, ...data });
        const res = await fetch(this.config.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    }

    /**
     * State Management UI
     */
    updateSaveButtonState() {
        const saveBtn = document.getElementById('pc-save');
        const discardBtn = document.getElementById('pc-discard');
        const hasChanges = Object.keys(this.draft).length > 0 || this.editableElements.some(el => el.classList.contains('pc-fe-modified'));

        if (saveBtn) {
            saveBtn.disabled = !hasChanges;
            saveBtn.classList.toggle('dirty', hasChanges);
        }
        if (discardBtn) discardBtn.disabled = !hasChanges;

        const status = document.getElementById('pc-fe-status');
        if (status) {
            const message = hasChanges ? `${Object.keys(this.draft).length} unsaved changes` : '';
            if (status.textContent !== message) {
                status.textContent = message;
                status.dataset.state = hasChanges ? 'warning' : '';
                if (message) status.setAttribute('aria-live', 'polite');
            }
        }
    }

    onElementSaved(event) {
        const { table, uid, field } = event.detail;
        delete this.draft[`${table}:${uid}:${field}`];
        localStorage.setItem(this.storageKey, JSON.stringify(this.draft));
        event.detail.element.classList.remove('pc-fe-modified');
        this.updateSaveButtonState();
    }

    resetModifications() {
        this.editableElements.forEach(el => el.classList.remove('pc-fe-modified'));
        this.clearDraft();
        this.updateSaveButtonState();
    }

    markAsModified(el) { el.classList.add('pc-fe-modified'); }

    setEditableState(editable) {
        this.editableElements.forEach(el => {
            el.contentEditable = editable ? 'true' : 'false';
            el.classList.toggle('pc-fe-editable', editable);
        });
    }

    scanEditableElements() {
        this.editableElements = Array.from(document.querySelectorAll('[data-pc-field]'));
    }

    showNotification(msg, type = 'info') {
        const n = document.createElement('div');
        n.className = `pc-fe-notification pc-fe-notification--${type}`;
        n.style.cssText = `position:fixed;top:1rem;right:1rem;padding:0.75rem 1rem;background:${this.getNotificationColor(type)};color:white;border-radius:0.5rem;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }

    getNotificationColor(t) {
        return { success: '#10B981', error: '#EF4444', warning: '#F59E0B' }[t] || '#3B82F6';
    }

    announceToScreenReader(message) {
        const status = document.getElementById('pc-fe-status');
        if (status) {
            status.textContent = message;
            status.setAttribute('aria-live', 'assertive');
            setTimeout(() => this.updateSaveButtonState(), 3000);
        }
    }

    dispatchEvent(n, d = {}) { document.dispatchEvent(new CustomEvent(`pixelcoda:${n}`, { detail: d })); }
    addEventListener(n, c) { document.addEventListener(`pixelcoda:${n}`, c); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => window.PixelCodaFE = new PixelCodaFE());
else window.PixelCodaFE = new PixelCodaFE();
