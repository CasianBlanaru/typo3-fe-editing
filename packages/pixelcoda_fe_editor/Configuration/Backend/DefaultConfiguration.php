<?php

namespace PixelCoda\FeEditor\Configuration;

use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

class DefaultConfiguration
{
    public static function register(): void
    {
        // Register default TypoScript
        ExtensionManagementUtility::addTypoScript(
            'pixelcoda_fe_editor',
            'setup',
            '<INCLUDE_TYPOSCRIPT: source="FILE:EXT:pixelcoda_fe_editor/Configuration/TypoScript/setup.typoscript">'
        );
        
        // Register constants
        ExtensionManagementUtility::addTypoScript(
            'pixelcoda_fe_editor',
            'constants',
            '<INCLUDE_TYPOSCRIPT: source="FILE:EXT:pixelcoda_fe_editor/Configuration/TypoScript/constants.typoscript">'
        );
        
        // Register PageTS
        ExtensionManagementUtility::addPageTSConfig(
            '<INCLUDE_TYPOSCRIPT: source="FILE:EXT:pixelcoda_fe_editor/Configuration/PageTS/NewContentElementWizard.ts">'
        );
        
        // Register UserTS
        ExtensionManagementUtility::addUserTSConfig(
            '<INCLUDE_TYPOSCRIPT: source="FILE:EXT:pixelcoda_fe_editor/Configuration/Backend/UserTS.ts">'
        );
    }
}