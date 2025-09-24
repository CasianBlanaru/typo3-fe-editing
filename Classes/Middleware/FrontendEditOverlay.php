<?php

namespace PixelCoda\FeEditor\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Http\HtmlResponse;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Frontend\Controller\TypoScriptFrontendController;

class FrontendEditOverlay implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = $handler->handle($request);
        
        // Only inject for authorized backend users
        if (!$this->isAuthorizedUser()) {
            return $response;
        }

        // Only inject for HTML responses
        if (!$this->isHtmlResponse($response)) {
            return $response;
        }

        $body = (string) $response->getBody();
        $injectedBody = $this->injectEditorAssets($body);
        
        return new HtmlResponse($injectedBody, $response->getStatusCode(), $response->getHeaders());
    }

    private function isAuthorizedUser(): bool
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        
        if (!$backendUser instanceof BackendUserAuthentication) {
            return false;
        }

        // Check if user is admin or has tables_modify permission
        return $backendUser->isAdmin() || $backendUser->check('tables_modify', 'tt_content');
    }

    private function isHtmlResponse(ResponseInterface $response): bool
    {
        $contentType = $response->getHeaderLine('Content-Type');
        return str_contains($contentType, 'text/html');
    }

    private function injectEditorAssets(string $body): string
    {
        $cssPath = 'EXT:pixelcoda_fe_editor/Resources/Public/Css/editor.css';
        $jsPath = 'EXT:pixelcoda_fe_editor/Resources/Public/JavaScript/editor.js';
        
        $cssUrl = GeneralUtility::getFileAbsFileName($cssPath);
        $jsUrl = GeneralUtility::getFileAbsFileName($jsPath);
        
        $cssTag = '<link rel="stylesheet" href="' . $cssUrl . '">';
        $jsTag = '<script src="' . $jsUrl . '"></script>';
        
        $toolbar = $this->generateToolbar();
        
        // Inject before </body>
        $body = str_replace('</body>', $cssTag . $toolbar . $jsTag . '</body>', $body);
        
        return $body;
    }

    private function generateToolbar(): string
    {
        return '
        <div id="pc-fe-editor-toolbar" style="display: none;">
            <button id="pc-edit-btn" title="Edit Content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
            </button>
            <button id="pc-ai-btn" title="AI Assistant">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </button>
            <button id="pc-add-btn" title="Add Element">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
            </button>
        </div>';
    }
}