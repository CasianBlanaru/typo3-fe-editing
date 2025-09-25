<?php
declare(strict_types=1);

use PixelCoda\FeEditor\Api\SaveController;

return [
    'fe_editor_save' => [
        'path'   => '/ajax/fe-editor/save',
        'target' => SaveController::class . '::handle',
        'access' => 'user,group', // Backend user required
        'methods' => ['POST'],
    ],
];
