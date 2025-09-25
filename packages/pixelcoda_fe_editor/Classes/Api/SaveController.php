<?php
namespace PixelCoda\FeEditor\Api;

use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\EventDispatcher\EventDispatcher;
use TYPO3\CMS\Backend\Utility\BackendUtility;
use PixelCoda\FeEditor\Event\BeforeSaveEvent;
use PixelCoda\FeEditor\Event\AfterSaveEvent;

final class SaveController
{
    public function handle(ServerRequestInterface $request): JsonResponse
    {
        try {
            // 0) Security - Backend User Check
            $beUser = $GLOBALS['BE_USER'] ?? null;
            if (!$beUser || !$beUser->user) {
                return new JsonResponse(['error' => 'auth_required', 'message' => 'Backend user authentication required'], 401);
            }
            
            // Parse request data
            $parsed = $request->getParsedBody() ?? [];
            $token  = (string)($parsed['token'] ?? '');
            
            // CSRF Token validation
            $fp = FormProtectionFactory::get();
            if (!$fp->validateToken($token, 'pixelcoda-fe-editor', 'fe-editor-action')) {
                return new JsonResponse(['error' => 'invalid_token', 'message' => 'CSRF token validation failed'], 403);
            }

        // 1) Whitelist + Rights
        $allowedTables = [
            'tt_content' => ['header','bodytext','subheader','frame_class','CType','colPos','pid'],
        ];

        $table = (string)($parsed['table'] ?? '');
        $uid   = (string)($parsed['uid'] ?? '');
        $field = (string)($parsed['field'] ?? '');
        $value = (string)($parsed['value'] ?? '');
        $rawData = (string)($parsed['data'] ?? '');
        $rawCmd  = (string)($parsed['cmd'] ?? '');

        $data = [];
        if ($table && $field !== '') {
            if (!isset($allowedTables[$table]) || !in_array($field, $allowedTables[$table], true)) {
                return new JsonResponse(['error' => 'field_not_allowed'], 400);
            }
            if (!$beUser->isAdmin() && !$beUser->check('tables_modify', $table)) {
                return new JsonResponse(['error' => 'no_modify_permission'], 403);
            }
            
            // Get current record for event
            $record = BackendUtility::getRecord($table, (int)$uid) ?: [];
            
            // Dispatch BeforeSaveEvent to allow content modification
            $eventDispatcher = GeneralUtility::makeInstance(EventDispatcher::class);
            $beforeSaveEvent = new BeforeSaveEvent($table, $field, $value, (int)$uid, $record);
            $eventDispatcher->dispatch($beforeSaveEvent);
            
            // Use potentially modified content from event
            $finalValue = $beforeSaveEvent->getContent();
            $data[$table][$uid] = [$field => $finalValue];
        }

        if ($rawData) {
            $decoded = json_decode($rawData, true) ?: [];
            foreach ($decoded as $t => $rows) {
                if (!isset($allowedTables[$t])) {
                    return new JsonResponse(['error' => 'table_not_allowed', 'table' => $t], 400);
                }
                if (!$beUser->isAdmin() && !$beUser->check('tables_modify', $t)) {
                    return new JsonResponse(['error' => 'no_modify_permission', 'table' => $t], 403);
                }
                foreach ($rows as $id => $fields) {
                    $filtered = array_intersect_key($fields, array_flip($allowedTables[$t]));
                    $data[$t][$id] = $filtered;
                }
            }
        }

        $cmd = [];
        if ($rawCmd) {
            $decodedCmd = json_decode($rawCmd, true) ?: [];
            foreach ($decodedCmd as $t => $rows) {
                if (!isset($allowedTables[$t])) {
                    return new JsonResponse(['error' => 'cmd_table_not_allowed', 'table' => $t], 400);
                }
                if (!$beUser->isAdmin() && !$beUser->check('tables_modify', $t)) {
                    return new JsonResponse(['error' => 'no_modify_permission', 'table' => $t], 403);
                }
                foreach ($rows as $id => $ops) {
                    $allowedOps = array_intersect_key($ops, array_flip(['copy','move','delete']));
                    if (!empty($allowedOps)) {
                        $cmd[$t][$id] = $allowedOps;
                    }
                }
            }
        }

        // 2) DataHandler
        /** @var DataHandler $dh */
        $dh = GeneralUtility::makeInstance(DataHandler::class);
        $dh->start($data, $cmd);
        $dh->process_datamap();
        $dh->process_cmdmap();

            if (!empty($dh->errorLog)) {
                return new JsonResponse([
                    'ok' => false, 
                    'error' => 'datahandler_errors',
                    'errors' => $dh->errorLog,
                    'message' => 'DataHandler processing failed'
                ], 400);
            }

            // Dispatch AfterSaveEvent for post-processing
            if ($table && $field !== '') {
                $afterSaveEvent = new AfterSaveEvent($table, $field, $finalValue, (int)$uid, $record, true);
                $eventDispatcher->dispatch($afterSaveEvent);
            }

            $result = [
                'ok' => true,
                'message' => 'Data saved successfully',
                'copymap' => property_exists($dh, 'copyMappingArray_merged') ? $dh->copyMappingArray_merged : [],
            ];
            return new JsonResponse($result, 200);
            
        } catch (\Exception $e) {
            return new JsonResponse([
                'ok' => false,
                'error' => 'exception',
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }
}
