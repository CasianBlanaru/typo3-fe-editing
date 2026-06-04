<?php

use PixelCoda\FeEditor\Middleware\FrontendEditOverlay;
use PixelCoda\FeEditor\Configuration\AjaxRoutes;
use PixelCoda\FeEditor\Configuration\Icons;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

defined('TYPO3') or die();

// Register middleware
$GLOBALS['TYPO3_CONF_VARS']['FE']['middlewares']['pixelcoda_fe_editor/overlay'] = [
    'target' => FrontendEditOverlay::class,
    'before' => [
        'typo3/cms-frontend/content-length-headers',
    ],
];

// Register AJAX routes
ExtensionManagementUtility::addAjaxRoute('fe_editor_save', AjaxRoutes::class . '::handle');

// Register icons
$iconRegistry = \TYPO3\CMS\Core\Utility\GeneralUtility::makeInstance(\TYPO3\CMS\Core\Imaging\IconRegistry::class);
\PixelCoda\FeEditor\Configuration\Icons::registerIcons($iconRegistry);

// Register PageTS
ExtensionManagementUtility::addPageTSConfig('
    @import "EXT:pixelcoda_fe_editor/Configuration/PageTS/NewContentElementWizard.typoscript"
');

// Add RTE preset
ExtensionManagementUtility::addPageTSConfig('
    @import "EXT:pixelcoda_fe_editor/Configuration/PageTS/RtePreset.typoscript"
');