<?php

namespace PixelCoda\FeEditor\Configuration;

use TYPO3\CMS\Core\Imaging\IconProvider\SvgIconProvider;
use TYPO3\CMS\Core\Imaging\IconRegistry;
use TYPO3\CMS\Core\Utility\GeneralUtility;

class Icons
{
    public static function register(): void
    {
        $iconRegistry = GeneralUtility::makeInstance(IconRegistry::class);
        
        $icons = [
            'ext-icon' => 'ext-icon.svg',
            'edit' => 'edit.svg',
            'ai' => 'ai.svg',
            'add' => 'add.svg',
            'close' => 'close.svg',
        ];

        foreach ($icons as $identifier => $file) {
            $iconRegistry->registerIcon(
                $identifier,
                SvgIconProvider::class,
                [
                    'source' => 'EXT:pixelcoda_fe_editor/Resources/Public/Icons/' . $file,
                ]
            );
        }
    }
}