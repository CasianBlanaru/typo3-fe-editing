<?php
declare(strict_types=1);

namespace PixelCoda\FeEditor\Api;

use PixelCoda\FeEditor\Event\AfterSaveEvent;
use PixelCoda\FeEditor\Event\BeforeSaveEvent;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Cache\CacheManager;
use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\CMS\Core\EventDispatcher\EventDispatcher;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\Utility\GeneralUtility;

final class SaveController
{
    public function handle(ServerRequestInterface $request): JsonResponse
    {
        try {
            $beUser = $GLOBALS['BE_USER'] ?? null;
            if (!$beUser instanceof BackendUserAuthentication || empty($beUser->user)) {
                return new JsonResponse(['error' => 'auth_required', 'message' => 'Backend user authentication required'], 401);
            }

            $parsed = $request->getParsedBody() ?? [];
            $formToken  = (string)($parsed['formToken'] ?? '');

            $fp = GeneralUtility::makeInstance(FormProtectionFactory::class)->createFromRequest($request);
            if (!$fp->validateToken($formToken, 'pixelcoda-fe-editor', 'fe-editor-action')) {
                return new JsonResponse(['error' => 'invalid_token', 'message' => 'CSRF token validation failed'], 403);
            }

            $allowedTables = [
                'tt_content' => ['header', 'bodytext', 'subheader', 'frame_class', 'CType', 'colPos', 'pid', 'sorting'],
            ];

            $table = (string)($parsed['table'] ?? '');
            $uid = (string)($parsed['uid'] ?? '');
            $field = (string)($parsed['field'] ?? '');
            $value = (string)($parsed['value'] ?? '');
            $rawData = (string)($parsed['data'] ?? '');
            $rawCmd = (string)($parsed['cmd'] ?? '');

            $data = [];
            $record = [];
            $finalValue = null;
            $affectedPageIds = [];

            if ($table !== '' && $field !== '') {
                if (!isset($allowedTables[$table]) || !in_array($field, $allowedTables[$table], true)) {
                    return new JsonResponse(['error' => 'field_not_allowed'], 400);
                }
                if (!ctype_digit($uid) || (int)$uid <= 0) {
                    return new JsonResponse(['error' => 'invalid_uid'], 400);
                }
                if (!$beUser->isAdmin() && !$beUser->check('tables_modify', $table)) {
                    return new JsonResponse(['error' => 'no_modify_permission'], 403);
                }

                $record = BackendUtility::getRecord($table, (int)$uid) ?: [];
                if ($record === []) {
                    return new JsonResponse(['error' => 'record_not_found'], 404);
                }
                if (isset($record['pid']) && (int)$record['pid'] > 0) {
                    $affectedPageIds[(int)$record['pid']] = true;
                }

                $beforeSaveEvent = new BeforeSaveEvent($table, $field, $value, (int)$uid, $record);
                GeneralUtility::makeInstance(EventDispatcher::class)->dispatch($beforeSaveEvent);

                $finalValue = $beforeSaveEvent->getContent();
                $data[$table][(int)$uid] = [$field => $finalValue];
            }

            if ($rawData !== '') {
                $decoded = json_decode($rawData, true);
                if (!is_array($decoded)) {
                    return new JsonResponse(['error' => 'invalid_data_payload'], 400);
                }
                foreach ($decoded as $t => $rows) {
                    if (!isset($allowedTables[$t]) || !is_array($rows)) {
                        return new JsonResponse(['error' => 'table_not_allowed', 'table' => $t], 400);
                    }
                    if (!$beUser->isAdmin() && !$beUser->check('tables_modify', $t)) {
                        return new JsonResponse(['error' => 'no_modify_permission', 'table' => $t], 403);
                    }
                    foreach ($rows as $id => $fields) {
                        if (!is_array($fields)) {
                            return new JsonResponse(['error' => 'invalid_fields_payload'], 400);
                        }
                        $filtered = array_intersect_key($fields, array_flip($allowedTables[$t]));
                        if ($filtered !== []) {
                            $data[$t][$id] = $filtered;
                            if (isset($filtered['pid']) && (int)$filtered['pid'] > 0) {
                                $affectedPageIds[(int)$filtered['pid']] = true;
                            }
                            if (ctype_digit((string)$id)) {
                                $payloadRecord = BackendUtility::getRecord((string)$t, (int)$id, 'pid') ?: [];
                                if (isset($payloadRecord['pid']) && (int)$payloadRecord['pid'] > 0) {
                                    $affectedPageIds[(int)$payloadRecord['pid']] = true;
                                }
                            }
                        }
                    }
                }
            }

            $cmd = [];
            if ($rawCmd !== '') {
                $decodedCmd = json_decode($rawCmd, true);
                if (!is_array($decodedCmd)) {
                    return new JsonResponse(['error' => 'invalid_cmd_payload'], 400);
                }
                foreach ($decodedCmd as $t => $rows) {
                    if (!isset($allowedTables[$t]) || !is_array($rows)) {
                        return new JsonResponse(['error' => 'cmd_table_not_allowed', 'table' => $t], 400);
                    }
                    if (!$beUser->isAdmin() && !$beUser->check('tables_modify', $t)) {
                        return new JsonResponse(['error' => 'no_modify_permission', 'table' => $t], 403);
                    }
                    foreach ($rows as $id => $ops) {
                        if (!is_array($ops)) {
                            return new JsonResponse(['error' => 'invalid_cmd_ops'], 400);
                        }
                        $allowedOps = array_intersect_key($ops, array_flip(['copy', 'move', 'delete']));
                        if ($allowedOps !== []) {
                            $cmd[$t][$id] = $allowedOps;
                        }
                    }
                }
            }

            if ($data === [] && $cmd === []) {
                return new JsonResponse(['error' => 'empty_payload'], 400);
            }

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

            if ($table !== '' && $field !== '' && $finalValue !== null) {
                $afterSaveEvent = new AfterSaveEvent($table, $field, $finalValue, (int)$uid, $record, true);
                GeneralUtility::makeInstance(EventDispatcher::class)->dispatch($afterSaveEvent);
            }

            $affectedPageIds = array_keys($affectedPageIds);
            if ($affectedPageIds !== []) {
                GeneralUtility::makeInstance(CacheManager::class)->flushCachesInGroupByTags(
                    'pages',
                    array_map(static fn(int $pageId): string => 'pageId_' . $pageId, $affectedPageIds)
                );
            }

            $result = [
                'ok' => true,
                'message' => 'Data saved successfully',
                'copymap' => property_exists($dh, 'copyMappingArray_merged') ? $dh->copyMappingArray_merged : [],
                'clearedPageIds' => $affectedPageIds,
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
