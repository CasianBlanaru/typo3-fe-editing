<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Service;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;

class PermissionChecker
{
    public function canModifyTables(): bool
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        
        if (!$backendUser instanceof BackendUserAuthentication) {
            return false;
        }

        // Check if user is admin
        if ($backendUser->isAdmin()) {
            return true;
        }

        // Check specific permission
        return $backendUser->check('tables_modify', 'tt_content');
    }
}