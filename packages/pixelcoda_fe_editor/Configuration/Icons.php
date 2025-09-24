<?php
declare(strict_types=1);

use TYPO3\CMS\Core\Imaging\IconProvider\SvgIconProvider;

return [
  'icons' => [
    'ext-pixelcoda-fe-editor' => [
      'provider' => SvgIconProvider::class,
      'source'   => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/ext-icon.svg',
    ],
    'pc-fe-edit' => [
      'provider' => SvgIconProvider::class,
      'source'   => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/edit.svg',
    ],
    'pc-fe-ai' => [
      'provider' => SvgIconProvider::class,
      'source'   => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/ai.svg',
    ],
    'pc-fe-add' => [
      'provider' => SvgIconProvider::class,
      'source'   => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/add.svg',
    ],
    'pc-fe-close' => [
      'provider' => SvgIconProvider::class,
      'source'   => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/close.svg',
    ],
  ],
];
