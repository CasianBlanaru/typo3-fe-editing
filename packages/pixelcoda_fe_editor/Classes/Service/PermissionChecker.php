<?php

namespace PixelCoda\FeEditor\Service;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;

class PermissionChecker
{
    public function canEditContent(): bool
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        
        if (!$backendUser instanceof BackendUserAuthentication) {
            return false;
        }
        
        return $backendUser->isAdmin() || $backendUser->check('tables_modify', 'tt_content');
    }
    
    public function canEditTable(string $table): bool
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        
        if (!$backendUser instanceof BackendUserAuthentication) {
            return false;
        }
        
        return $backendUser->isAdmin() || $backendUser->check('tables_modify', $table);
    }
    
    public function canEditField(string $table, string $field): bool
    {
        if (!$this->canEditTable($table)) {
            return false;
        }
        
        // Additional field-level permission checks can be added here
        return true;
    }
}