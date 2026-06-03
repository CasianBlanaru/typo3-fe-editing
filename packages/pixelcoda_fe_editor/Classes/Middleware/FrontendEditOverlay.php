<?php
namespace PixelCoda\FeEditor\Middleware;

use PixelCoda\FeEditor\Utility\PermissionChecker;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\{MiddlewareInterface, RequestHandlerInterface};
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Utility\PathUtility;
use TYPO3\CMS\Backend\Routing\UriBuilder;
use TYPO3\CMS\Frontend\Page\PageInformation;

final class FrontendEditOverlay implements MiddlewareInterface
{
    public function __construct(
        private readonly FormProtectionFactory $formProtectionFactory,
        private readonly UriBuilder $uriBuilder
    ) {}

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

        $csrfToken = $this->formProtectionFactory
            ->createForType('backend')
            ->generateToken('pixelcoda-fe-editor', 'fe-editor-action');
        $ajaxUrl = (string)$this->uriBuilder->buildUriFromRoute('ajax_fe_editor_save');
        $pageId = $this->getPageId($request);
        $records = $this->getEditableContentRecords($pageId);
        $body = str_ireplace('</body>', $this->buildInjectionCode($csrfToken, $ajaxUrl, $pageId, $records) . '</body>', $body);

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

    /**
     * @param array<int, array<string, int|string>> $records
     */
    private function buildInjectionCode(string $csrfToken, string $ajaxUrl, int $pageId, array $records): string
    {
        $cssPath = htmlspecialchars($this->getAssetWebPath('EXT:pixelcoda_fe_editor/Resources/Public/editor.css'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $scriptPath = htmlspecialchars($this->getAssetWebPath('EXT:pixelcoda_fe_editor/Resources/Public/editor.js'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $encodedToken = json_encode($csrfToken, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        $encodedAjaxUrl = json_encode($ajaxUrl, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        $encodedPageId = json_encode($pageId, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);
        $encodedRecords = json_encode($records, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT);

        return <<<HTML
<link rel="stylesheet" href="{$cssPath}">
<div id="pc-fe-toolbar-root" class="pc-fe-toolbar">
  <button id="pc-edit-toggle" class="pc-fe-button" type="button" title="Frontend Editing aktivieren">Edit</button>
  <button id="pc-save" class="pc-fe-button pc-fe-save" type="button" title="Aenderungen speichern" disabled>Save</button>
  <button id="pc-ai" class="pc-fe-button" type="button" title="KI-Assistent">AI</button>
  <button id="pc-add-global" class="pc-fe-button" type="button" title="Neues Element hinzufuegen">+</button>
  <span id="pc-fe-status" class="pc-fe-status" aria-live="polite"></span>
</div>
<script>
window.TYPO3 = window.TYPO3 || { settings: {}, security: {} };
window.TYPO3.settings.ajaxUrls = window.TYPO3.settings.ajaxUrls || {};
window.TYPO3.settings.ajaxUrls['fe_editor_save'] = {$encodedAjaxUrl};
window.TYPO3.security.feEditorToken = {$encodedToken};
window.TYPO3.settings.feEditorPageId = {$encodedPageId};
window.TYPO3.settings.feEditorRecords = {$encodedRecords};
</script>
<script src="{$scriptPath}" defer></script>
HTML;
    }

    private function getAssetWebPath(string $assetPath): string
    {
        return PathUtility::getAbsoluteWebPath(GeneralUtility::getFileAbsFileName($assetPath));
    }

    private function getPageId(ServerRequestInterface $request): int
    {
        $pageInformation = $request->getAttribute('frontend.page.information');
        if ($pageInformation instanceof PageInformation) {
            return $pageInformation->getId();
        }

        return 0;
    }

    /**
     * @return array<int, array<string, int|string>>
     */
    private function getEditableContentRecords(int $pageId): array
    {
        if ($pageId <= 0) {
            return [];
        }

        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
        $rows = $queryBuilder
            ->select('uid', 'pid', 'CType', 'header', 'bodytext', 'colPos', 'sorting')
            ->from('tt_content')
            ->where(
                $queryBuilder->expr()->eq('pid', $queryBuilder->createNamedParameter($pageId, \Doctrine\DBAL\ParameterType::INTEGER)),
                $queryBuilder->expr()->eq('colPos', $queryBuilder->createNamedParameter(0, \Doctrine\DBAL\ParameterType::INTEGER))
            )
            ->orderBy('sorting')
            ->executeQuery()
            ->fetchAllAssociative();

        return array_map(static function (array $row): array {
            return [
                'uid' => (int)$row['uid'],
                'pid' => (int)$row['pid'],
                'colPos' => (int)$row['colPos'],
                'CType' => (string)$row['CType'],
                'header' => trim((string)$row['header']),
                'bodytextText' => trim(html_entity_decode(strip_tags((string)$row['bodytext']), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')),
            ];
        }, $rows);
    }
}
