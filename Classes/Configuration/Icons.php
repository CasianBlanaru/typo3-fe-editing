<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Configuration;

use TYPO3\CMS\Core\Imaging\IconProvider\SvgIconProvider;
use TYPO3\CMS\Core\Imaging\IconRegistry;
use TYPO3\CMS\Core\Utility\GeneralUtility;

class Icons
{
    public static function registerIcons(IconRegistry $iconRegistry): void
    {
        $icons = [
            'pixelcoda-fe-editor-ext' => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/ext-icon.svg',
            'pixelcoda-fe-editor-edit' => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/edit.svg',
            'pixelcoda-fe-editor-ai' => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/ai.svg',
            'pixelcoda-fe-editor-add' => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/add.svg',
            'pixelcoda-fe-editor-close' => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/close.svg',
            'pixelcoda-fe-editor-demo' => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/ext-icon.svg',
        ];

        foreach ($icons as $identifier => $source) {
            $iconRegistry->registerIcon(
                $identifier,
                SvgIconProvider::class,
                ['source' => $source]
            );
        }
    }
}