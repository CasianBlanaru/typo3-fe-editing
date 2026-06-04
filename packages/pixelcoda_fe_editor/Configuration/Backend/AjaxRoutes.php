<?php
declare(strict_types=1);

use PixelCoda\FeEditor\Api\AiController;
use PixelCoda\FeEditor\Api\SaveController;

return [
    'fe_editor_save' => [
        'path'   => '/fe-editor/save',
        'target' => SaveController::class . '::handle',
        'access' => 'user,group', // Backend user required
        'methods' => ['POST'],
    ],
    'fe_editor_ai' => [
        'path' => '/fe-editor/ai',
        'target' => AiController::class . '::handle',
        'access' => 'user,group',
        'methods' => ['POST'],
    ],
];
