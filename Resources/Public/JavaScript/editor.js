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
        this.bindEvents();
        this.setupAjaxUrls();
    }

    bindEvents() {
        // Edit button
        document.getElementById('pc-edit-btn')?.addEventListener('click', () => {
            this.toggleEditMode();
        });

        // AI button
        document.getElementById('pc-ai-btn')?.addEventListener('click', () => {
            this.handleAiSuggestion();
        });

        // Add button
        document.getElementById('pc-add-btn')?.addEventListener('click', () => {
            this.addNewElement();
        });

        // Handle field blur events
        document.addEventListener('blur', (e) => {
            if (e.target.hasAttribute('data-pc-field') && this.isEditing) {
                this.saveField(e.target);
            }
        }, true);
    }

    setupAjaxUrls() {
        if (typeof TYPO3 !== 'undefined' && TYPO3.settings) {
            TYPO3.settings.ajaxUrls = TYPO3.settings.ajaxUrls || {};
            TYPO3.settings.ajaxUrls['fe_editor_save'] = '/typo3/ajax/fe_editor_save';
        }
    }

    getCsrfToken() {
        // Get CSRF token from meta tag or global variable
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            return metaToken.getAttribute('content');
        }
        
        if (typeof TYPO3 !== 'undefined' && TYPO3.settings && TYPO3.settings.ajaxTokens) {
            return TYPO3.settings.ajaxTokens['fe_editor_save'];
        }
        
        return '';
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        const editBtn = document.getElementById('pc-edit-btn');
        
        if (this.isEditing) {
            editBtn.classList.add('active');
            this.enableFieldEditing();
        } else {
            editBtn.classList.remove('active');
            this.disableFieldEditing();
        }
    }

    enableFieldEditing() {
        const fields = document.querySelectorAll('[data-pc-field]');
        fields.forEach(field => {
            field.contentEditable = true;
            field.classList.add('pc-editable');
        });
    }

    disableFieldEditing() {
        const fields = document.querySelectorAll('[data-pc-field]');
        fields.forEach(field => {
            field.contentEditable = false;
            field.classList.remove('pc-editable');
        });
    }

    async saveField(field) {
        const table = field.getAttribute('data-pc-table');
        const uid = field.getAttribute('data-pc-uid');
        const fieldName = field.getAttribute('data-pc-field');
        const value = field.textContent;

        try {
            const response = await fetch('/typo3/ajax/fe_editor_save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': this.csrfToken
                },
                body: new URLSearchParams({
                    table: table,
                    uid: uid,
                    field: fieldName,
                    value: value
                })
            });

            const result = await response.json();
            if (result.ok) {
                this.showNotification('Content saved successfully', 'success');
            } else {
                this.showNotification('Error saving content: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    handleAiSuggestion() {
        const fields = document.querySelectorAll('[data-pc-field]');
        fields.forEach(field => {
            if (field.contentEditable) {
                field.textContent = '[KI Vorschlag] ' + field.textContent;
            }
        });
        this.showNotification('AI suggestion applied', 'info');
    }

    async addNewElement() {
        const newId = 'NEW' + Date.now();
        
        const datamap = {
            tt_content: {
                [newId]: {
                    pid: this.getCurrentPageId(),
                    CType: 'pc_demo',
                    header: 'New Element',
                    subheader: 'Created via frontend editor',
                    bodytext: 'This is a new content element created from the frontend.'
                }
            }
        };

        try {
            const response = await fetch('/typo3/ajax/fe_editor_save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRF-Token': this.csrfToken
                },
                body: new URLSearchParams({
                    data: JSON.stringify(datamap)
                })
            });

            const result = await response.json();
            if (result.ok) {
                this.showNotification('New element created successfully', 'success');
                // Reload page to show new element
                setTimeout(() => window.location.reload(), 1000);
            } else {
                this.showNotification('Error creating element: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    getCurrentPageId() {
        // Try to get page ID from various sources
        const body = document.body;
        const pageId = body.getAttribute('data-page-id') || 
                      body.getAttribute('data-typo3-page-id') ||
                      window.location.pathname.match(/\/page\/(\d+)/)?.[1] ||
                      '1';
        return parseInt(pageId);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `pc-notification pc-notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PixelCodaFeEditor();
});