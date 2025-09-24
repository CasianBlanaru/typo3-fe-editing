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

        /** @var BackendUserAuthentication|null $be */
        $be = $GLOBALS['BE_USER'] ?? null;
        if (!$be || !PermissionChecker::mayEditFrontend($be)) {
            return $response;
        }

        $body = (string)$response->getBody();
        
        // Generate CSRF token for frontend
        $formProtection = FormProtectionFactory::get();
        $csrfToken = $formProtection->generateToken('pixelcoda-fe-editor', 'fe-editor-action');
        
        // Get proper paths for resources
        $extPath = PathUtility::getAbsoluteWebPath(
            ExtensionManagementUtility::extPath('pixelcoda_fe_editor')
        );
        $publicPath = $extPath . 'Resources/Public/';
        
        $injection = <<<HTML
<link rel="stylesheet" href="{$publicPath}editor.css">
<div id="pc-fe-toolbar-root" class="pc-fe-toolbar" hidden>
  <button id="pc-edit-toggle" class="btn" title="Bearbeiten">
    <img src="{$publicPath}Icons/edit.svg" alt="Edit"/>
  </button>
  <button id="pc-ai" class="btn" title="KI">
    <img src="{$publicPath}Icons/ai.svg" alt="AI"/>
  </button>
  <button id="pc-add-global" class="btn" title="Element hinzufügen">
    <img src="{$publicPath}Icons/add.svg" alt="Add"/>
  </button>
</div>
<script>
window.TYPO3 = window.TYPO3 || { settings: {}, security: {} };
window.TYPO3.settings.ajaxUrls = window.TYPO3.settings.ajaxUrls || {};
window.TYPO3.settings.ajaxUrls['fe_editor_save'] = '/typo3/ajax/fe-editor/save';
window.TYPO3.security.csrfToken = '{$csrfToken}';
</script>
<script src="{$publicPath}editor.js" defer></script>
HTML;
        $body = str_ireplace('</body>', $injection . '</body>', $body);
        return new HtmlResponse($body, $response->getStatusCode(), $response->getHeaders());
    }
}
