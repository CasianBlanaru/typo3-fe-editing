(function() {
    function init() {
        const bar = document.getElementById('pc-fe-toolbar-root');
        if (!bar) return;
        bar.hidden = false;

        let editMode = false;

        function setEditable(on) {
            document.querySelectorAll('[data-pc-field]').forEach(el => {
                el.contentEditable = on ? 'true' : 'false';
                el.classList.toggle('pc-fe-editable', on);
            });
        }

        document.addEventListener('click', async (e) => {
            if (e.target.closest('#pc-edit-toggle')) {
                editMode = !editMode;
                setEditable(editMode);
                e.target.closest('#pc-edit-toggle').classList.toggle('active', editMode);
            }
            if (e.target.closest('#pc-ai')) {
                const el = document.querySelector('[data-pc-field][contenteditable="true"]');
                if (el) el.innerHTML = '[KI Vorschlag] ' + (el.innerText || el.textContent || '');
            }
            if (e.target.closest('.pc-add')) {
                const z = e.target.closest('[data-pc-dropzone]');
                if (!z) return;
                await createContentElement(z.dataset.targetPid, z.dataset.colPos);
                location.reload();
            }
            if (e.target.closest('#pc-add-global')) {
                // Find first dropzone on page or use current page for new element
                const firstDropzone = document.querySelector('[data-pc-dropzone]');
                if (firstDropzone) {
                    await createContentElement(firstDropzone.dataset.targetPid, firstDropzone.dataset.colPos);
                } else {
                    // Fallback: create in colPos 0 on current page
                    const pid = document.querySelector('[data-pid]') ? .dataset.pid || '1';
                    await createContentElement(pid, '0');
                }
                location.reload();
            }
        });

        // Save on blur
        document.addEventListener('focusout', async (e) => {
            const el = e.target.closest && e.target.closest('[data-pc-field]');
            if (!el || !editMode) return;
            const {
                table,
                uid,
                field
            } = el.dataset;
            await saveField({
                table,
                uid,
                field,
                value: el.innerHTML
            });
        });
    }

    async function saveField({
        table,
        uid,
        field,
        value
    }) {
        const url = TYPO3 ? .settings ? .ajaxUrls ? . ['fe_editor_save'];
        const token = TYPO3 ? .security ? .csrfToken;
        if (!url || !token) {
            console.error('Missing ajaxUrl or csrfToken');
            return;
        }
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                table,
                uid,
                field,
                value,
                token
            })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
            console.error('Save failed', json.error || json.errors || 'Unknown error');
        }
    }

    async function createContentElement(pid, colPos) {
        const url = TYPO3 ? .settings ? .ajaxUrls ? . ['fe_editor_save'];
        const token = TYPO3 ? .security ? .csrfToken;
        if (!url || !token) {
            console.error('Missing ajaxUrl or csrfToken');
            return;
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
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                data: JSON.stringify(data),
                cmd: JSON.stringify({}),
                token
            })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
            console.error('Create failed', json.error || json.errors || 'Unknown error');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();