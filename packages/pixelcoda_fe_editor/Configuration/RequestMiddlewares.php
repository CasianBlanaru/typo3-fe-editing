<?php
declare(strict_types=1);

use PixelCoda\FeEditor\Middleware\FrontendEditOverlay;

return [
    'frontend' => [
        'pixelcoda/fe-editor-overlay' => [
            'target' => FrontendEditOverlay::class,
            'after' => [
                'typo3/cms-frontend/prepare-tsfe-rendering',
            ],
            'before' => [
                'typo3/cms-frontend/content-length-headers',
            ],
        ],
    ],
];
