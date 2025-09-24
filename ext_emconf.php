<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'PixelCoda FE Editor',
    'description' => 'Frontend editor for TYPO3 with AI integration and modern UI',
    'category' => 'fe',
    'author' => 'PixelCoda',
    'author_email' => 'info@pixelcoda.com',
    'state' => 'stable',
    'version' => '1.0.0',
    'constraints' => [
        'depends' => [
            'typo3' => '12.0.0-14.99.99',
            'php' => '8.1.0-8.3.99',
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