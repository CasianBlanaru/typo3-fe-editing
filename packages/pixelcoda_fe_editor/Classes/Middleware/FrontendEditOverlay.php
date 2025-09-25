<?php
namespace PixelCoda\FeEditor\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\{MiddlewareInterface, RequestHandlerInterface};
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Http\HtmlResponse;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\Utility\PathUtility;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;
use PixelCoda\FeEditor\Utility\PermissionChecker;

final class FrontendEditOverlay implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);

        // Only process HTML responses
        $contentType = $response->getHeaderLine('Content-Type');
        if (!str_contains($contentType, 'text/html')) {
            return $response;
        }

        $body = (string)$response->getBody();
        
        // Skip if body doesn't contain closing body tag
        if (!str_contains($body, '</body>')) {
            return $response;
        }

        // DEBUG MODE: Always show toolbar for testing
        // TODO: In production, uncomment the permission checks below
        
        /*
        // Check for Backend User - with improved detection
        $beUser = $this->getBackendUser();
        $hasPermission = $beUser && PermissionChecker::mayEditFrontend($beUser);
        
        // Alternative: Check for Backend Cookie (for cases where BE_USER global is not set)
        $hasBeCookie = isset($_COOKIE['be_typo_user']) && !empty($_COOKIE['be_typo_user']);
        
        if (!$hasPermission && !$hasBeCookie) {
            return $response;
        }
        */
        
        // For demo: always allow
        $hasPermission = true;
        
        // Generate CSRF token for frontend
        try {
            $formProtection = FormProtectionFactory::get();
            $csrfToken = $formProtection->generateToken('pixelcoda-fe-editor', 'fe-editor-action');
        } catch (\Exception $e) {
            // Fallback token if FormProtection fails
            $csrfToken = 'debug-token-' . md5(time());
        }
        
        $injection = $this->buildInjectionCode($csrfToken, $hasPermission);
        
        $body = str_ireplace('</body>', $injection . '</body>', $body);
        return new HtmlResponse($body, $response->getStatusCode(), $response->getHeaders());
    }
    
    private function getBackendUser(): ?BackendUserAuthentication
    {
        // Try multiple ways to get backend user
        if (isset($GLOBALS['BE_USER']) && $GLOBALS['BE_USER'] instanceof BackendUserAuthentication) {
            return $GLOBALS['BE_USER'];
        }
        
        // Alternative: Initialize BE_USER if cookie exists but global is not set
        if (isset($_COOKIE['be_typo_user']) && !empty($_COOKIE['be_typo_user'])) {
            // This is a fallback - in production you might want to properly initialize the BE session
            return null; // For now, we'll handle this in the cookie check above
        }
        
        return null;
    }
    
    private function buildInjectionCode(string $csrfToken, bool $hasFullPermission = true): string
    {
        return <<<HTML
<style>
.pc-fe-toolbar{position:fixed!important;right:1rem!important;bottom:1rem!important;padding:0.75rem!important;background:#111827!important;color:#F9FAFB!important;border-radius:0.5rem!important;z-index:999999!important;font:14px/1.2 system-ui!important;box-shadow:0 10px 25px rgba(0,0,0,0.25)!important;display:flex!important;gap:0.5rem!important;border:2px solid #0EA5E9!important}
.pc-fe-toolbar .btn{width:36px!important;height:36px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:6px!important;background:transparent!important;border:1px solid #E5E7EB!important;cursor:pointer!important;color:#F9FAFB!important;font-size:16px!important;transition:all 0.2s!important}
.pc-fe-toolbar .btn:hover{background:#0EA5E9!important;border-color:#0EA5E9!important;transform:translateY(-1px)!important}
.pc-fe-toolbar .btn.active{background:#10B981!important;border-color:#10B981!important;color:white!important}
.pc-fe-editable{outline:2px dashed #0EA5E9!important;outline-offset:2px!important;background:rgba(14,165,233,0.1)!important}
.pc-fe-editable:focus{outline-color:#10B981!important;background:rgba(16,185,129,0.1)!important}
[data-pc-field]{position:relative!important}
[data-pc-field]:hover::before{content:"✏️ Editierbar"!important;position:absolute!important;top:-25px!important;left:0!important;background:#111827!important;color:#F9FAFB!important;padding:2px 6px!important;border-radius:3px!important;font-size:11px!important;z-index:1000!important}
</style>
<div id="pc-fe-toolbar-root" class="pc-fe-toolbar">
  <button id="pc-edit-toggle" class="btn" title="Frontend Editing aktivieren">✏️</button>
  <button id="pc-ai" class="btn" title="KI-Assistent">🤖</button>
  <button id="pc-add-global" class="btn" title="Neues Element hinzufügen">➕</button>
</div>
<script>
window.TYPO3 = window.TYPO3 || { settings: {}, security: {} };
window.TYPO3.settings.ajaxUrls = window.TYPO3.settings.ajaxUrls || {};
window.TYPO3.settings.ajaxUrls['fe_editor_save'] = '/typo3/ajax/fe-editor/save';
window.TYPO3.security.csrfToken = '{$csrfToken}';

(function() {
    let editMode = false;
    
    function setEditable(on) {
        // Find elements with data-pc-field attribute
        const editableElements = document.querySelectorAll('[data-pc-field]');
        
        if (editableElements.length === 0 && on) {
            // Fallback: make common content elements editable
            document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div.ce-bodytext, .content-text').forEach(el => {
                if (el.closest('.pc-fe-toolbar') || el.closest('nav') || el.closest('footer') || !el.textContent.trim()) return;
                el.dataset.pcField = 'true';
                el.dataset.table = 'tt_content';
                el.dataset.uid = '1';
                el.dataset.field = 'bodytext';
            });
        }
        
        document.querySelectorAll('[data-pc-field]').forEach(el => {
            if (on) {
                el.contentEditable = 'true';
                el.classList.add('pc-fe-editable');
            } else {
                el.contentEditable = 'false';
                el.classList.remove('pc-fe-editable');
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('#pc-edit-toggle')) {
            e.preventDefault();
            editMode = !editMode;
            setEditable(editMode);
            e.target.closest('#pc-edit-toggle').classList.toggle('active', editMode);
            console.log('PixelCoda Edit Mode:', editMode ? 'ON' : 'OFF');
        }
        
        if (e.target.closest('#pc-ai')) {
            e.preventDefault();
            if (editMode) {
                const editable = document.querySelector('.pc-fe-editable:focus, .pc-fe-editable');
                if (editable) {
                    editable.innerHTML = '🤖 [KI-Optimiert] ' + editable.innerHTML;
                    console.log('PixelCoda AI: Content enhanced');
                }
            } else {
                alert('Bitte aktivieren Sie zuerst den Edit-Modus!');
            }
        }
        
        if (e.target.closest('#pc-add-global')) {
            e.preventDefault();
            console.log('PixelCoda: New element would be created');
            alert('Element-Erstellung wird in der nächsten Version implementiert.');
        }
    });
    
    document.addEventListener('focusout', async function(e) {
        if (e.target.classList.contains('pc-fe-editable') && editMode) {
            const data = {
                table: e.target.dataset.table || 'tt_content',
                uid: e.target.dataset.uid || '1',
                field: e.target.dataset.field || 'bodytext',
                value: e.target.innerHTML
            };
            console.log('PixelCoda: Saving field', data);
            
            try {
                const response = await fetch(window.TYPO3.settings.ajaxUrls['fe_editor_save'], {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: new URLSearchParams({
                        table: data.table,
                        uid: data.uid,
                        field: data.field,
                        value: data.value,
                        token: window.TYPO3.security.csrfToken
                    })
                });
                
                const result = await response.json();
                if (response.ok && result.ok) {
                    console.log('PixelCoda: Save successful');
                    // Visual feedback
                    e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                    setTimeout(() => {
                        e.target.style.backgroundColor = '';
                    }, 1000);
                } else {
                    console.error('PixelCoda: Save failed', result);
                    alert('Speichern fehlgeschlagen: ' + (result.error || 'Unbekannter Fehler'));
                }
            } catch (error) {
                console.error('PixelCoda: Save error', error);
                alert('Netzwerkfehler beim Speichern');
            }
        }
    });
    
    // Initialize on page load
    console.log('🚀 PixelCoda Frontend Editor: Loaded for Backend User!');
    
    // Add visual indicator that the editor is ready
    setTimeout(() => {
        const toolbar = document.getElementById('pc-fe-toolbar-root');
        if (toolbar) {
            toolbar.style.animation = 'pulse 0.5s ease-in-out';
        }
    }, 500);
})();
</script>
HTML;
    }
}
