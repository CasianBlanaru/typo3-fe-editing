<?php

namespace PixelCoda\FeEditor\Controller;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Utility\GeneralUtility;

class SaveController
{
    private const ALLOWED_TABLES = ['tt_content'];
    private const ALLOWED_FIELDS = [
        'tt_content' => ['header', 'subheader', 'bodytext', 'CType', 'colPos', 'pid']
    ];

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        try {
            // Validate CSRF token
            $this->validateCsrfToken($request);
            
            // Validate permissions
            $this->validatePermissions();
            
            $parsedBody = $request->getParsedBody();
            
            // Handle single field update
            if (isset($parsedBody['table'], $parsedBody['uid'], $parsedBody['field'], $parsedBody['value'])) {
                return $this->handleSingleFieldUpdate($parsedBody);
            }
            
            // Handle datamap/cmdmap
            if (isset($parsedBody['data']) || isset($parsedBody['cmd'])) {
                return $this->handleDataMap($parsedBody);
            }
            
            throw new \InvalidArgumentException('Invalid request parameters');
            
        } catch (\Exception $e) {
            return new JsonResponse([
                'ok' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }

    private function validateCsrfToken(ServerRequestInterface $request): void
    {
        $token = $request->getHeaderLine('X-CSRF-Token') ?: $request->getParsedBody()['csrfToken'] ?? '';
        
        if (empty($token)) {
            throw new \InvalidArgumentException('Missing CSRF token');
        }
        
        $formProtection = FormProtectionFactory::get();
        if (!$formProtection->validateToken($token, 'fe_editor')) {
            throw new \InvalidArgumentException('Invalid CSRF token');
        }
    }

    private function validatePermissions(): void
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        
        if (!$backendUser || (!$backendUser->isAdmin() && !$backendUser->check('tables_modify', 'tt_content'))) {
            throw new \InvalidArgumentException('Insufficient permissions');
        }
    }

    private function handleSingleFieldUpdate(array $data): ResponseInterface
    {
        $table = $data['table'];
        $uid = (int) $data['uid'];
        $field = $data['field'];
        $value = $data['value'];
        
        if (!in_array($table, self::ALLOWED_TABLES)) {
            throw new \InvalidArgumentException('Table not allowed');
        }
        
        if (!in_array($field, self::ALLOWED_FIELDS[$table] ?? [])) {
            throw new \InvalidArgumentException('Field not allowed');
        }
        
        $dataMap = [
            $table => [
                $uid => [
                    $field => $value
                ]
            ]
        ];
        
        return $this->processDataHandler($dataMap, []);
    }

    private function handleDataMap(array $data): ResponseInterface
    {
        $dataMap = $data['data'] ?? [];
        $cmdMap = $data['cmd'] ?? [];
        
        // Validate tables and fields
        foreach ($dataMap as $table => $records) {
            if (!in_array($table, self::ALLOWED_TABLES)) {
                throw new \InvalidArgumentException("Table {$table} not allowed");
            }
            
            foreach ($records as $uid => $fields) {
                foreach (array_keys($fields) as $field) {
                    if (!in_array($field, self::ALLOWED_FIELDS[$table] ?? [])) {
                        throw new \InvalidArgumentException("Field {$field} not allowed in table {$table}");
                    }
                }
            }
        }
        
        return $this->processDataHandler($dataMap, $cmdMap);
    }

    private function processDataHandler(array $dataMap, array $cmdMap): ResponseInterface
    {
        /** @var DataHandler $dataHandler */
        $dataHandler = GeneralUtility::makeInstance(DataHandler::class);
        $dataHandler->start($dataMap, $cmdMap);
        $dataHandler->process_datamap();
        $dataHandler->process_cmdmap();
        
        $result = [
            'ok' => true,
            'copyMappingArray_merged' => $dataHandler->copyMappingArray_merged ?? []
        ];
        
        if (!empty($dataHandler->errorLog)) {
            $result['warnings'] = $dataHandler->errorLog;
        }
        
        return new JsonResponse($result);
    }
}