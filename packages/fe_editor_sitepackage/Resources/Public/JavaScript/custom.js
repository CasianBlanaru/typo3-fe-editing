// PixelCoda Frontend Editor - Auto-inject Toolbar
(function() {
    // Add CSS
    const css = `
.pc-fe-toolbar{position:fixed;right:1rem;bottom:1rem;padding:.5rem;background:#111827;color:#F9FAFB;border-radius:.5rem;z-index:99999;font:14px/1.2 system-ui;box-shadow:0 10px 25px rgba(0,0,0,.25);display:flex;gap:.5rem}
.pc-fe-editable{outline:2px dashed rgba(14,165,233,.5);outline-offset:2px}
.pc-fe-editable:focus{outline-color:#0ea5e9}
.btn{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px;background:transparent;border:none;cursor:pointer;transition:all .2s;color:white;font-size:16px}
.btn:hover{background:rgba(255,255,255,.1)}
.btn.active{background:#0EA5E9;box-shadow:0 0 0 2px rgba(14,165,233,.3)}
`;
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    
    // Add Toolbar HTML
    const toolbar = document.createElement('div');
    toolbar.id = 'pc-fe-toolbar-root';
    toolbar.className = 'pc-fe-toolbar';
    toolbar.innerHTML = `
        <button id="pc-edit-toggle" class="btn" title="Bearbeiten">✏️</button>
        <button id="pc-ai" class="btn" title="KI">🤖</button>
        <button id="pc-add-global" class="btn" title="Element hinzufügen">➕</button>
    `;
    document.body.appendChild(toolbar);
    
    // Add functionality
    let editMode = false;
    
    function setEditable(on) {
        // Find all text elements and make them editable
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div');
        textElements.forEach(el => {
            if (el.closest('.pc-fe-toolbar')) return; // Skip toolbar
            if (el.closest('nav')) return; // Skip navigation
            if (el.closest('footer')) return; // Skip footer
            if (on) {
                el.contentEditable = 'true';
                el.classList.add('pc-fe-editable');
                el.dataset.pcField = 'true';
                el.dataset.table = 'tt_content';
                el.dataset.uid = '1';
                el.dataset.field = 'bodytext';
            } else {
                el.contentEditable = 'false';
                el.classList.remove('pc-fe-editable');
            }
        });
    }
    
    // Event listeners
    document.addEventListener('click', function(e) {
        if (e.target.closest('#pc-edit-toggle')) {
            editMode = !editMode;
            setEditable(editMode);
            e.target.closest('#pc-edit-toggle').classList.toggle('active', editMode);
            alert(editMode ? '✏️ Edit-Modus aktiviert! Klicken Sie auf Texte zum Bearbeiten.' : '✏️ Edit-Modus deaktiviert!');
        }
        if (e.target.closest('#pc-ai')) {
            if (editMode) {
                const editableElements = document.querySelectorAll('.pc-fe-editable');
                if (editableElements.length > 0) {
                    editableElements[0].innerHTML = '🤖 [KI-Vorschlag] ' + editableElements[0].innerHTML;
                    alert('🤖 KI-Vorschlag hinzugefügt!');
                } else {
                    alert('🤖 Keine editierbaren Elemente gefunden!');
                }
            } else {
                alert('🤖 Aktivieren Sie zuerst den Edit-Modus!');
            }
        }
        if (e.target.closest('#pc-add-global')) {
            alert('➕ Demo: Neues Element würde hier erstellt werden!');
        }
    });
    
    // Save on blur
    document.addEventListener('focusout', function(e) {
        if (e.target.classList.contains('pc-fe-editable') && editMode) {
            alert('💾 Demo: Änderungen an "' + e.target.tagName + '" würden gespeichert werden!');
        }
    });
    
    console.log('🚀 PixelCoda Frontend Editor loaded successfully!');
})();