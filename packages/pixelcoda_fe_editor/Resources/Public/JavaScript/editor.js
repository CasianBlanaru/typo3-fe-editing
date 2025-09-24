/**
 * PixelCoda FE Editor - Frontend JavaScript
 */
class PixelCodaFeEditor {
    constructor() {
        this.isEditing = false;
        this.csrfToken = this.getCsrfToken();
        this.init();
    }

    init() {
        this.setupToolbar();
        this.setupEventListeners();
        this.showToolbar();
    }

    setupToolbar() {
        const toolbar = document.getElementById('pc-fe-editor-toolbar');
        if (!toolbar) return;

        // Show toolbar
        toolbar.style.display = 'flex';
    }

    setupEventListeners() {
        // Edit button
        const editBtn = document.getElementById('pc-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // AI button
        const aiBtn = document.getElementById('pc-ai-btn');
        if (aiBtn) {
            aiBtn.addEventListener('click', () => this.handleAiAction());
        }

        // Add button
        const addBtn = document.getElementById('pc-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.handleAddElement());
        }

        // Handle blur events on editable fields
        document.addEventListener('blur', (e) => {
            if (e.target.hasAttribute('data-pc-field') && this.isEditing) {
                this.saveField(e.target);
            }
        }, true);
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        const editBtn = document.getElementById('pc-edit-btn');
        
        if (this.isEditing) {
            this.enableEditing();
            editBtn.classList.add('active');
        } else {
            this.disableEditing();
            editBtn.classList.remove('active');
        }
    }

    enableEditing() {
        const editableFields = document.querySelectorAll('[data-pc-field]');
        editableFields.forEach(field => {
            field.contentEditable = 'true';
            field.classList.add('pc-editable');
        });
    }

    disableEditing() {
        const editableFields = document.querySelectorAll('[data-pc-field]');
        editableFields.forEach(field => {
            field.contentEditable = 'false';
            field.classList.remove('pc-editable');
        });
    }

    async saveField(field) {
        const table = field.getAttribute('data-pc-table') || 'tt_content';
        const uid = field.getAttribute('data-pc-uid');
        const fieldName = field.getAttribute('data-pc-field');
        const value = field.textContent;

        if (!uid || !fieldName) {
            console.warn('Missing uid or field name for field:', field);
            return;
        }

        try {
            const response = await fetch(TYPO3.settings.ajaxUrls.fe_editor_save, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': this.csrfToken
                },
                body: new URLSearchParams({
                    table: table,
                    uid: uid,
                    field: fieldName,
                    value: value,
                    csrfToken: this.csrfToken
                })
            });

            const result = await response.json();
            if (result.ok) {
                console.log('Field saved successfully');
            } else {
                console.error('Save failed:', result.error);
                this.showError('Save failed: ' + result.error);
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showError('Save error: ' + error.message);
        }
    }

    handleAiAction() {
        const activeField = document.activeElement;
        if (activeField && activeField.hasAttribute('data-pc-field')) {
            // Demo AI functionality
            const originalText = activeField.textContent;
            activeField.textContent = '[KI Vorschlag] - ' + originalText;
            
            // Trigger save
            this.saveField(activeField);
        } else {
            this.showError('Please select a field to edit first');
        }
    }

    async handleAddElement() {
        const dropzone = document.querySelector('.pc-dropzone');
        if (!dropzone) {
            this.showError('No dropzone found');
            return;
        }

        try {
            const response = await fetch(TYPO3.settings.ajaxUrls.fe_editor_save, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': this.csrfToken
                },
                body: new URLSearchParams({
                    data: JSON.stringify({
                        tt_content: {
                            NEWID: {
                                CType: 'pc_demo',
                                header: 'New Element',
                                subheader: 'Subheader',
                                bodytext: 'This is a new content element',
                                pid: this.getCurrentPageId()
                            }
                        }
                    }),
                    csrfToken: this.csrfToken
                })
            });

            const result = await response.json();
            if (result.ok) {
                this.showSuccess('New element created successfully');
                // Reload page to show new element
                setTimeout(() => window.location.reload(), 1000);
            } else {
                console.error('Create failed:', result.error);
                this.showError('Create failed: ' + result.error);
            }
        } catch (error) {
            console.error('Create error:', error);
            this.showError('Create error: ' + error.message);
        }
    }

    getCurrentPageId() {
        // Try to get page ID from various sources
        const meta = document.querySelector('meta[name="page-id"]');
        if (meta) {
            return meta.getAttribute('content');
        }
        
        // Fallback to current URL parsing
        const path = window.location.pathname;
        const matches = path.match(/\/page\/(\d+)/);
        return matches ? matches[1] : '1';
    }

    getCsrfToken() {
        // Try to get CSRF token from meta tag
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) {
            return meta.getAttribute('content');
        }
        
        // Fallback to TYPO3 settings
        return TYPO3.settings.ajaxUrls?.csrfToken || '';
    }

    showToolbar() {
        const toolbar = document.getElementById('pc-fe-editor-toolbar');
        if (toolbar) {
            toolbar.style.display = 'flex';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pc-notification pc-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PixelCodaFeEditor();
});