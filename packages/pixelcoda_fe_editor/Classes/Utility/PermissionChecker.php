<?php
namespace PixelCoda\FeEditor\Utility;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;

final class PermissionChecker
{
    public static function mayEditFrontend(?BackendUserAuthentication $be): bool
    {
        if (!$be) return false;
        if ($be->isAdmin()) return true;
        return $be->check('tables_modify', 'tt_content');
    }
}
