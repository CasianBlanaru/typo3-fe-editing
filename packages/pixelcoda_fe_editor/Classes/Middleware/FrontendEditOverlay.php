<?php
namespace PixelCoda\FeEditor\Middleware;

use PixelCoda\FeEditor\Utility\PermissionChecker;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\{MiddlewareInterface, RequestHandlerInterface};
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Utility\PathUtility;

final class FrontendEditOverlay implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);

        if (!$this->isEditableFrontendRequest($request)) {
            return $response;
        }

        $contentType = $response->getHeaderLine('Content-Type');
        if ($contentType !== '' && !str_contains(strtolower($contentType), 'text/html')) {
            return $response;
        }

        $body = (string)$response->getBody();
        if (!str_contains(strtolower($body), '</body>')) {
            return $response;
        }

        $csrfToken = FormProtectionFactory::get()->generateToken('pixelcoda-fe-editor', 'fe-editor-action');
        $body = str_ireplace('</body>', $this->buildInjectionCode($csrfToken) . '</body>', $body);

        $response->getBody()->rewind();
        $response->getBody()->write($body);

        return $response->withHeader('Content-Length', (string)strlen($body));
    }

    private function isEditableFrontendRequest(ServerRequestInterface $request): bool
    {
        if (strtoupper($request->getMethod()) !== 'GET') {
            return false;
        }

        return PermissionChecker::mayEditFrontend($this->getBackendUser());
    }

    private function getBackendUser(): ?BackendUserAuthentication
    {
        if (isset($GLOBALS['BE_USER']) && $GLOBALS['BE_USER'] instanceof BackendUserAuthentication) {
            return $GLOBALS['BE_USER'];
        }

        return null;
    }

    private function buildInjectionCode(string $csrfToken): string
    {
        $cssPath = htmlspecialchars($this->getAssetWebPath('EXT:pixelcoda_fe_editor/Resources/Public/editor.css'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $scriptPath = htmlspecialchars($this->getAssetWebPath('EXT:pixelcoda_fe_editor/Resources/Public/editor.js'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $encodedToken = json_encode($csrfToken, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);

        return <<<HTML
<link rel="stylesheet" href="{$cssPath}">
<div id="pc-fe-toolbar-root" class="pc-fe-toolbar">
  <button id="pc-edit-toggle" class="btn" type="button" title="Frontend Editing aktivieren">Edit</button>
  <button id="pc-ai" class="btn" type="button" title="KI-Assistent">AI</button>
  <button id="pc-add-global" class="btn" type="button" title="Neues Element hinzufuegen">+</button>
</div>
<script>
window.TYPO3 = window.TYPO3 || { settings: {}, security: {} };
window.TYPO3.settings.ajaxUrls = window.TYPO3.settings.ajaxUrls || {};
window.TYPO3.settings.ajaxUrls['fe_editor_save'] = '/typo3/ajax/fe-editor/save';
window.TYPO3.security.csrfToken = {$encodedToken};
</script>
<script src="{$scriptPath}" defer></script>
HTML;
    }

    private function getAssetWebPath(string $assetPath): string
    {
        return PathUtility::getAbsoluteWebPath(GeneralUtility::getFileAbsFileName($assetPath));
    }
}
