<?php
defined('TYPO3') || die();

use PixelCoda\FeEditor\Middleware\FrontendEditOverlay;

// PSR-15 FE Middleware: injiziert Toolbar/JS nur für berechtigte BE-User
$GLOBALS['TYPO3_CONF_VARS']['FE']['middlewares']['pixelcoda/fe-editor-overlay'] = [
    'target' => FrontendEditOverlay::class,
    'after'  => ['typo3/cms-frontend/tsfe'],
];

// Ajax-Route wird über Configuration/Backend/AjaxRoutes.php registriert (TYPO3.settings.ajaxUrls['fe_editor_save'])
