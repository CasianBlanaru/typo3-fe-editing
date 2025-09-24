<?php
declare(strict_types=1);

use PixelCoda\FeEditor\Api\SaveController;

return [
    'fe_editor_save' => [
        'path'   => '/fe-editor/save',
        'target' => SaveController::class . '::handle',
        'access' => 'csrfToken', // BE-Auth + CSRF
    ],
];
