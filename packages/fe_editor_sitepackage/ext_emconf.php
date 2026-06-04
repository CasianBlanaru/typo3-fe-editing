<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'FE Editor Sitepackage',
    'description' => 'Sitepackage for FE Editor Demo',
    'category' => 'templates',
    'author' => 'pixelcoda',
    'author_email' => 'info@pixelcoda.com',
    'state' => 'stable',
    'version' => '1.0.0',
    'constraints' => [
        'depends' => [
            'typo3' => '13.0.0-13.99.99',
            'bootstrap_package' => '15.0.0-15.99.99',
        ],
        'conflicts' => [],
        'suggests' => [],
    ],
];
