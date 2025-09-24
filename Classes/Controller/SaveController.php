<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Controller;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use PixelCoda\FeEditor\Service\PermissionChecker;
use PixelCoda\FeEditor\Service\TokenService;

class SaveController
{
    private PermissionChecker $permissionChecker;
    private TokenService $tokenService;

    public function __construct(
        PermissionChecker $permissionChecker,
        TokenService $tokenService
    ) {
        $this->permissionChecker = $permissionChecker;
        $this->tokenService = $tokenService;
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        try {
            // Check CSRF token
            if (!$this->validateCsrfToken($request)) {
                return new JsonResponse(['ok' => false, 'error' => 'Invalid CSRF token'], 403);
            }

            // Check permissions
            if (!$this->permissionChecker->canModifyTables()) {
                return new JsonResponse(['ok' => false, 'error' => 'Insufficient permissions'], 403);
            }

            $parsedBody = $request->getParsedBody();
            
            // Handle single field update
            if (isset($parsedBody['table'], $parsedBody['uid'], $parsedBody['field'], $parsedBody['value'])) {
                return $this->handleSingleFieldUpdate($parsedBody);
            }
            
            // Handle datamap/cmdmap
            if (isset($parsedBody['data']) || isset($parsedBody['cmd'])) {
                return $this->handleDataMap($parsedBody);
            }

            return new JsonResponse(['ok' => false, 'error' => 'Invalid request format'], 400);

        } catch (\Exception $e) {
            return new JsonResponse(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function validateCsrfToken(ServerRequestInterface $request): bool
    {
        $token = $request->getHeaderLine('X-CSRF-Token');
        if (empty($token)) {
            return false;
        }

        $formProtection = FormProtectionFactory::get();
        return $formProtection->validateToken($token);
    }

    private function handleSingleFieldUpdate(array $data): ResponseInterface
    {
        $table = $data['table'];
        $uid = (int)$data['uid'];
        $field = $data['field'];
        $value = $data['value'];

        // Whitelist allowed tables and fields
        if (!$this->isAllowedTableField($table, $field)) {
            return new JsonResponse(['ok' => false, 'error' => 'Table/field not allowed'], 403);
        }

        $dataHandler = GeneralUtility::makeInstance(DataHandler::class);
        $dataHandler->start([], []);

        $datamap = [
            $table => [
                $uid => [
                    $field => $value
                ]
            ]
        ];

        $dataHandler->start($datamap, []);
        $dataHandler->process_datamap();

        if (!empty($dataHandler->errorLog)) {
            return new JsonResponse(['ok' => false, 'error' => implode(', ', $dataHandler->errorLog)], 500);
        }

        return new JsonResponse(['ok' => true]);
    }

    private function handleDataMap(array $data): ResponseInterface
    {
        $dataHandler = GeneralUtility::makeInstance(DataHandler::class);
        
        $datamap = $data['data'] ?? [];
        $cmdmap = $data['cmd'] ?? [];

        $dataHandler->start($datamap, $cmdmap);
        $dataHandler->process_datamap();
        $dataHandler->process_cmdmap();

        if (!empty($dataHandler->errorLog)) {
            return new JsonResponse(['ok' => false, 'error' => implode(', ', $dataHandler->errorLog)], 500);
        }

        $result = ['ok' => true];
        if (!empty($dataHandler->copyMappingArray_merged)) {
            $result['copyMappingArray_merged'] = $dataHandler->copyMappingArray_merged;
        }

        return new JsonResponse($result);
    }

    private function isAllowedTableField(string $table, string $field): bool
    {
        $allowedTables = ['tt_content'];
        $allowedFields = ['header', 'subheader', 'bodytext'];

        return in_array($table, $allowedTables) && in_array($field, $allowedFields);
    }
}