<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'PixelCoda FE Editor',
    'description' => 'Frontend editing extension for TYPO3 with AI integration and modern UI',
    'category' => 'fe',
    'author' => 'PixelCoda',
    'author_email' => 'info@pixelcoda.com',
    'state' => 'beta',
    'clearCacheOnLoad' => 1,
    'version' => '1.0.0',
    'constraints' => [
        'depends' => [
            'typo3' => '12.0.0-13.99.99',
            'php' => '8.1.0-8.4.99',
        ],
        'conflicts' => [],
        'suggests' => [],
    ],
    'autoload' => [
        'psr-4' => [
            'PixelCoda\\FeEditor\\' => 'Classes/',
        ],
    ],
];