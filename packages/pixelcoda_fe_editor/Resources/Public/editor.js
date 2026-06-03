(function() {
    function init() {
        const bar = document.getElementById('pc-fe-toolbar-root');
        if (!bar) return;
        bar.hidden = false;

        let editMode = false;
        const editToggle = document.getElementById('pc-edit-toggle');
        const saveButton = document.getElementById('pc-save');
        const addGlobal = document.getElementById('pc-add-global');
        const status = document.getElementById('pc-fe-status');
        const dirtyFields = new Map();
        let saveTimer = null;
        let activeEditable = null;
        let draggedFrame = null;

        updateToolbarState();

        function setEditable(on) {
            if (on) {
                markContentFields();
                updateToolbarState();
            }
            document.querySelectorAll('[data-pc-field]').forEach(el => {
                el.contentEditable = on ? 'true' : 'false';
                el.spellcheck = on;
                el.classList.toggle('pc-fe-editable', on);
                if (on && el.dataset.pcOriginalValue === undefined) {
                    el.dataset.pcOriginalValue = getFieldValue(el);
                }
            });
            document.querySelectorAll('.pc-fe-image-edit-button').forEach(button => {
                button.hidden = !on;
            });
            document.querySelectorAll('[data-pc-image-field]').forEach(image => {
                image.classList.toggle('pc-fe-image', on);
            });
            document.querySelectorAll('[data-pc-record-uid]').forEach(frame => {
                frame.draggable = on;
                frame.classList.toggle('pc-fe-draggable', on);
            });
            document.querySelectorAll('.pc-fe-drag-handle').forEach(handle => {
                handle.hidden = !on;
            });
        }

        function markContentFields() {
            document.querySelectorAll('[id^="c"]').forEach(frame => {
                const uid = parseInt((frame.id || '').slice(1), 10);
                if (!uid || frame.closest('.pc-fe-toolbar')) return;
                markFrame(frame, uid);

                const header = frame.querySelector(':scope h1, :scope h2, :scope h3, :scope h4, :scope h5, :scope h6');
                if (header && !header.dataset.pcField) {
                    header.dataset.pcField = '1';
                    header.dataset.table = 'tt_content';
                    header.dataset.uid = String(uid);
                    header.dataset.field = 'header';
                }

                const body = frame.querySelector(':scope .ce-bodytext, :scope p');
                if (body && !body.dataset.pcField && body !== header) {
                    body.dataset.pcField = '1';
                    body.dataset.table = 'tt_content';
                    body.dataset.uid = String(uid);
                    body.dataset.field = 'bodytext';
                }
            });

            const records = getEditableRecords();
            records.forEach(record => {
                if (!record.uid) return;

                const article = findArticleForRecord(record);
                if (!article) return;
                markFrame(article, record.uid);

                const header = article.querySelector('h1, h2, h3, h4, h5, h6');
                if (header && !header.dataset.pcField) {
                    markField(header, record.uid, 'header');
                }

                const body = article.querySelector('.ce-bodytext, p');
                if (body && !body.dataset.pcField && body !== header) {
                    markField(body, record.uid, 'bodytext');
                }

                markImages(article, record);
            });
        }

        function getEditableRecords() {
            return (TYPO3 && TYPO3.settings && Array.isArray(TYPO3.settings.feEditorRecords))
                ? TYPO3.settings.feEditorRecords
                : [];
        }

        function normalizeText(value) {
            return (value || '').replace(/\s+/g, ' ').trim();
        }

        function findArticleForRecord(record) {
            const header = normalizeText(record.header);
            const bodytext = normalizeText(record.bodytextText);
            const candidates = Array.from(document.querySelectorAll('article, section, .frame'));

            return candidates.find(candidate => {
                const candidateHeader = normalizeText(candidate.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || '');
                const candidateBody = normalizeText(candidate.querySelector('.ce-bodytext, p')?.textContent || '');

                return (header && candidateHeader === header) || (bodytext && candidateBody === bodytext);
            }) || null;
        }

        function markField(element, uid, field) {
            element.dataset.pcField = '1';
            element.dataset.table = 'tt_content';
            element.dataset.uid = String(uid);
            element.dataset.field = field;
        }

        function markFrame(frame, uid) {
            if (frame.closest('.pc-fe-toolbar')) return;
            frame.dataset.pcRecordUid = String(uid);
            frame.draggable = editMode;
            frame.classList.toggle('pc-fe-draggable', editMode);
            if (frame.querySelector(':scope > .pc-fe-drag-handle')) return;

            const handle = document.createElement('button');
            handle.type = 'button';
            handle.className = 'pc-fe-drag-handle';
            handle.title = 'Element verschieben';
            handle.hidden = !editMode;
            handle.innerHTML = '<span aria-hidden="true">::</span>';
            frame.prepend(handle);
        }

        function getIcon(name) {
            return TYPO3 && TYPO3.settings && TYPO3.settings.feEditorIcons
                ? (TYPO3.settings.feEditorIcons[name] || '')
                : '';
        }

        function createIconMarkup(name) {
            const icon = getIcon(name);
            return icon
                ? '<img class="pc-fe-icon" src="' + icon + '" alt="" onerror="this.hidden=true">'
                : '';
        }

        function markImages(container, record) {
            container.querySelectorAll('img').forEach(image => {
                if (image.closest('.pc-fe-toolbar') || image.dataset.pcImageField) return;
                image.dataset.pcImageField = '1';
                image.dataset.uid = String(record.uid);
                image.dataset.editUrl = record.editUrl || '';
                image.classList.toggle('pc-fe-image', editMode);

                const host = image.parentElement || container;
                host.classList.add('pc-fe-image-host');

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'pc-fe-image-edit-button';
                button.dataset.editUrl = record.editUrl || '';
                button.hidden = !editMode;
                button.innerHTML = createIconMarkup('edit') + 'Bild';
                host.appendChild(button);
            });
        }

        function getFieldKey(element) {
            return [element.dataset.table, element.dataset.uid, element.dataset.field].join(':');
        }

        function getFieldValue(element) {
            return element.dataset.field === 'header'
                ? normalizeText(element.textContent)
                : element.innerHTML;
        }

        function markDirty(element) {
            if (!element || !element.dataset.pcField) return;
            dirtyFields.set(getFieldKey(element), element);
            element.classList.add('pc-fe-dirty');
            updateSaveButton();
            scheduleAutosave();
        }

        function updateSaveButton() {
            if (!saveButton) return;
            const dirty = dirtyFields.size > 0;
            saveButton.disabled = !dirty;
            saveButton.classList.toggle('dirty', dirty);
            saveButton.classList.toggle('has-unsaved-changes', dirty);
            const textNode = Array.from(saveButton.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) {
                textNode.textContent = dirty ? 'Save *' : 'Save';
            } else {
                saveButton.appendChild(document.createTextNode(dirty ? 'Save *' : 'Save'));
            }
        }

        function scheduleAutosave() {
            window.clearTimeout(saveTimer);
            saveTimer = window.setTimeout(() => {
                saveDirtyFields();
            }, 1500);
        }

        function getActiveEditable() {
            if (activeEditable && activeEditable.isConnected && activeEditable.dataset.pcField) {
                return activeEditable;
            }
            return document.querySelector('[data-pc-field][contenteditable="true"]');
        }

        function applyAiPolish(element) {
            const text = normalizeText(element.innerText || element.textContent || '');
            if (!text) return false;

            if (element.dataset.field === 'header') {
                element.textContent = text
                    .replace(/\bEDIT\b/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                return true;
            }

            const improved = text
                .replace(/\s+/g, ' ')
                .replace(/\bfrontends\b/g, 'Frontend-Projekte')
                .replace(/\bconfigure\b/g, 'pflegen')
                .trim();
            element.innerHTML = '<p>' + improved + '</p>';
            return true;
        }

        function setStatus(message, type) {
            if (!status) return;
            status.textContent = message || '';
            status.dataset.state = type || '';
            if (message) {
                window.setTimeout(() => {
                    if (status.textContent === message) {
                        status.textContent = '';
                        status.dataset.state = '';
                    }
                }, 4000);
            }
        }

        function updateToolbarState() {
            const hasEditableFields = document.querySelector('[data-pc-field]') !== null;
            const hasContentFrames = document.querySelector('[id^="c"]') !== null;
            const hasEditableRecords = getEditableRecords().length > 0;
            const hasDropzones = document.querySelector('[data-pc-dropzone]') !== null;
            const pageId = TYPO3 && TYPO3.settings ? parseInt(TYPO3.settings.feEditorPageId || '0', 10) : 0;
            const canEdit = hasEditableFields || hasContentFrames || hasEditableRecords;
            const canAdd = hasDropzones || pageId > 0;

            if (editToggle) {
                editToggle.disabled = !canEdit;
                editToggle.title = canEdit
                    ? 'Frontend Editing aktivieren'
                    : 'Keine editierbaren Felder auf dieser Seite gefunden';
            }
            if (addGlobal) {
                addGlobal.disabled = !canAdd;
                addGlobal.title = canAdd
                    ? 'Neues Element hinzufuegen'
                    : 'Keine Zielseite fuer neue Elemente gefunden';
            }
            if (!canEdit && !canAdd) {
                setStatus('Keine FE-Edit Marker', 'warning');
            }
            updateSaveButton();
        }

        document.addEventListener('click', async (e) => {
            if (e.target.closest('#pc-edit-toggle')) {
                if (editToggle && editToggle.disabled) return;
                if (editMode && dirtyFields.size > 0) {
                    await saveDirtyFields();
                }
                editMode = !editMode;
                setEditable(editMode);
                e.target.closest('#pc-edit-toggle').classList.toggle('active', editMode);
                setStatus(editMode ? 'Edit an' : 'Edit aus', 'info');
            }
            if (e.target.closest('#pc-save')) {
                await saveDirtyFields();
            }
            if (e.target.closest('.pc-fe-image-edit-button')) {
                const button = e.target.closest('.pc-fe-image-edit-button');
                const editUrl = button ? button.dataset.editUrl : '';
                if (editUrl) {
                    window.open(editUrl, '_blank', 'noopener');
                    setStatus('Bild im Backend bearbeiten', 'info');
                } else {
                    setStatus('Keine Bild-URL', 'warning');
                }
            }
            if (e.target.closest('#pc-ai')) {
                if (!editMode) {
                    editMode = true;
                    setEditable(true);
                    editToggle && editToggle.classList.toggle('active', true);
                }
                const el = getActiveEditable();
                if (el && applyAiPolish(el)) {
                    markDirty(el);
                    setStatus('AI Vorschlag bereit', 'success');
                } else {
                    setStatus('Kein editierbares Feld', 'warning');
                }
            }
            if (e.target.closest('.pc-add')) {
                const z = e.target.closest('[data-pc-dropzone]');
                if (!z) return;
                if (await createContentElement(z.dataset.targetPid, z.dataset.colPos)) {
                    location.reload();
                }
            }
            if (e.target.closest('#pc-add-global')) {
                const firstDropzone = document.querySelector('[data-pc-dropzone]');
                if (firstDropzone) {
                    if (await createContentElement(firstDropzone.dataset.targetPid, firstDropzone.dataset.colPos)) {
                        setStatus('Element erstellt', 'success');
                        location.reload();
                    } else {
                        setStatus('Erstellen fehlgeschlagen', 'warning');
                    }
                    return;
                }
                const pageId = TYPO3 && TYPO3.settings ? parseInt(TYPO3.settings.feEditorPageId || '0', 10) : 0;
                if (pageId > 0 && await createContentElement(pageId, '0')) {
                    setStatus('Element erstellt', 'success');
                    location.reload();
                } else {
                    setStatus('Erstellen fehlgeschlagen', 'warning');
                }
            }
        });

        document.addEventListener('focusin', (e) => {
            const el = e.target.closest && e.target.closest('[data-pc-field]');
            if (el) {
                activeEditable = el;
            }
        });

        document.addEventListener('input', (e) => {
            const el = e.target.closest && e.target.closest('[data-pc-field]');
            if (!el || !editMode) return;
            activeEditable = el;
            markDirty(el);
            setStatus('Ungespeichert', 'info');
        });

        document.addEventListener('dragstart', (e) => {
            if (!editMode) return;
            const frame = e.target.closest && e.target.closest('[data-pc-record-uid]');
            if (!frame || e.target.closest('[data-pc-field]')) return;
            draggedFrame = frame;
            frame.classList.add('pc-fe-dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', frame.dataset.pcRecordUid);
        });

        document.addEventListener('dragover', (e) => {
            if (!editMode || !draggedFrame) return;
            const target = e.target.closest && e.target.closest('[data-pc-record-uid]');
            if (!target || target === draggedFrame || target.parentElement !== draggedFrame.parentElement) return;
            e.preventDefault();
            const rect = target.getBoundingClientRect();
            const after = e.clientY > rect.top + rect.height / 2;
            target.parentElement.insertBefore(draggedFrame, after ? target.nextSibling : target);
        });

        document.addEventListener('dragend', async () => {
            if (!draggedFrame) return;
            draggedFrame.classList.remove('pc-fe-dragging');
            draggedFrame = null;
            if (await saveCurrentOrder()) {
                setStatus('Reihenfolge gespeichert', 'success');
            } else {
                setStatus('Reihenfolge nicht gespeichert', 'warning');
            }
        });

        // Save on blur
        document.addEventListener('focusout', async (e) => {
            const el = e.target.closest && e.target.closest('[data-pc-field]');
            if (!el || !editMode) return;
            if (!dirtyFields.has(getFieldKey(el))) return;
            const {
                table,
                uid,
                field
            } = el.dataset;
            if (await saveField({
                table,
                uid,
                field,
                value: getFieldValue(el)
            })) {
                dirtyFields.delete(getFieldKey(el));
                el.classList.remove('pc-fe-dirty');
                updateSaveButton();
                setStatus('Gespeichert', 'success');
            } else {
                setStatus('Speichern fehlgeschlagen', 'warning');
            }
        });

        async function saveDirtyFields() {
            window.clearTimeout(saveTimer);
            if (dirtyFields.size === 0) {
                setStatus('Alles gespeichert', 'success');
                return true;
            }

            setStatus('Speichert...', 'info');
            let ok = true;
            for (const [key, element] of Array.from(dirtyFields.entries())) {
                const saved = await saveField({
                    table: element.dataset.table,
                    uid: element.dataset.uid,
                    field: element.dataset.field,
                    value: getFieldValue(element)
                });
                if (saved) {
                    dirtyFields.delete(key);
                    element.classList.remove('pc-fe-dirty');
                    element.dataset.pcOriginalValue = getFieldValue(element);
                } else {
                    ok = false;
                }
            }
            updateSaveButton();
            setStatus(ok ? 'Gespeichert' : 'Speichern fehlgeschlagen', ok ? 'success' : 'warning');
            return ok;
        }
    }

    async function saveField({
        table,
        uid,
        field,
        value
    }) {
        const url = TYPO3 && TYPO3.settings && TYPO3.settings.ajaxUrls ? TYPO3.settings.ajaxUrls['fe_editor_save'] : null;
        const formToken = TYPO3 && TYPO3.security ? TYPO3.security.feEditorToken : null;
        if (!url || !formToken) {
            console.error('PixelCoda FE Editor: missing ajaxUrl or formToken');
            return false;
        }
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                table,
                uid,
                field,
                value,
                formToken
            })
        });
        const json = await parseJsonResponse(res);
        if (!res.ok || !json.ok) {
            console.error('Save failed', json.error || json.errors || 'Unknown error');
            return false;
        }
        return true;
    }

    async function createContentElement(pid, colPos) {
        const url = TYPO3 && TYPO3.settings && TYPO3.settings.ajaxUrls ? TYPO3.settings.ajaxUrls['fe_editor_save'] : null;
        const formToken = TYPO3 && TYPO3.security ? TYPO3.security.feEditorToken : null;
        if (!url || !formToken) {
            console.error('PixelCoda FE Editor: missing ajaxUrl or formToken');
            return false;
        }
        const NEWID = 'NEW' + Math.floor(Math.random() * 1e6);
        const data = {
            tt_content: {
                [NEWID]: {
                    pid: parseInt(pid, 10),
                    colPos: parseInt(colPos, 10),
                    CType: 'text',
                    header: 'Neues Element',
                    bodytext: '<p>Hier können Sie Ihren Text eingeben...</p>'
                }
            }
        };
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                data: JSON.stringify(data),
                cmd: JSON.stringify({}),
                formToken
            })
        });
        const json = await parseJsonResponse(res);
        if (!res.ok || !json.ok) {
            console.error('Create failed', json.error || json.errors || 'Unknown error');
            return false;
        }
        return true;
    }

    async function saveCurrentOrder() {
        const frames = Array.from(document.querySelectorAll('[data-pc-record-uid]'))
            .filter(frame => frame.offsetParent !== null);
        if (frames.length < 2) return true;

        const data = { tt_content: {} };
        frames.forEach((frame, index) => {
            data.tt_content[frame.dataset.pcRecordUid] = {
                sorting: (index + 1) * 256
            };
        });

        return saveDataPayload(data);
    }

    async function saveDataPayload(data) {
        const url = TYPO3 && TYPO3.settings && TYPO3.settings.ajaxUrls ? TYPO3.settings.ajaxUrls['fe_editor_save'] : null;
        const formToken = TYPO3 && TYPO3.security ? TYPO3.security.feEditorToken : null;
        if (!url || !formToken) {
            console.error('PixelCoda FE Editor: missing ajaxUrl or formToken');
            return false;
        }
        const res = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                data: JSON.stringify(data),
                cmd: JSON.stringify({}),
                formToken
            })
        });
        const json = await parseJsonResponse(res);
        if (!res.ok || !json.ok) {
            console.error('Order save failed', json.error || json.errors || 'Unknown error');
            return false;
        }
        return true;
    }

    async function parseJsonResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        if (!contentType.includes('application/json')) {
            return {
                ok: false,
                error: 'non_json_response',
                message: 'Expected JSON but received ' + response.status + ' ' + contentType,
                preview: text.slice(0, 160)
            };
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            return {
                ok: false,
                error: 'invalid_json_response',
                message: 'Received invalid JSON',
                preview: text.slice(0, 160)
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
