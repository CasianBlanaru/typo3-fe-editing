<?php

namespace PixelCoda\FeEditor\Configuration;

use PixelCoda\FeEditor\Controller\SaveController;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

class AjaxRoutes
{
    public static function register(): void
    {
        ExtensionManagementUtility::addAjaxRoute(
            'fe_editor_save',
            SaveController::class . '::handle',
            [
                'access' => 'csrfToken',
            ]
        );
    }
}