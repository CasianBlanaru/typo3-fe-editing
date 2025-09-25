<?php
defined('TYPO3') || die();

use PixelCoda\FeEditor\Middleware\FrontendEditOverlay;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

// PSR-15 FE Middleware: injiziert Toolbar/JS nur für berechtigte BE-User
$GLOBALS['TYPO3_CONF_VARS']['FE']['middlewares']['pixelcoda/fe-editor-overlay'] = [
    'target' => FrontendEditOverlay::class,
    'after'  => [
        'typo3/cms-frontend/tsfe',
        'typo3/cms-frontend/prepare-tsfe-rendering'
    ],
    'before' => [
        'typo3/cms-frontend/output-compression'
    ]
];

// Register static TypoScript
ExtensionManagementUtility::addStaticFile(
    'pixelcoda_fe_editor',
    'Configuration/TypoScript',
    'PixelCoda FE Editor'
);

// Page TSconfig
ExtensionManagementUtility::addPageTSConfig(
    '@import "EXT:pixelcoda_fe_editor/Configuration/PageTS/Page.tsconfig"'
);
