<?php
defined('TYPO3') || die();

call_user_func(function () {
    // Enable RTE with our configuration for bodytext
    $GLOBALS['TCA']['tt_content']['columns']['bodytext']['config']['enableRichtext'] = true;
    $GLOBALS['TCA']['tt_content']['columns']['bodytext']['config']['richtextConfiguration'] =
        'default:EXT:pixelcoda_fe_editor/Configuration/RTE/Editor.yaml';
});
