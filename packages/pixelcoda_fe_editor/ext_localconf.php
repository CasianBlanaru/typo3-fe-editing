<?php

use PixelCoda\FeEditor\Middleware\FrontendEditOverlay;
use PixelCoda\FeEditor\Configuration\AjaxRoutes;
use PixelCoda\FeEditor\Configuration\Icons;

defined('TYPO3') or die();

// Register middleware
$GLOBALS['TYPO3_CONF_VARS']['FE']['middlewares']['pixelcoda-fe-editor'] = [
    'target' => FrontendEditOverlay::class,
    'before' => [
        'typo3/cms-frontend/authentication',
    ],
    'after' => [
        'typo3/cms-frontend/content-length-headers',
    ],
];

// Register AJAX routes
AjaxRoutes::register();

// Register icons
Icons::register();

// Register default configuration
\PixelCoda\FeEditor\Configuration\DefaultConfiguration::register();