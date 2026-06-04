<?php
defined('TYPO3') || die();

call_user_func(function () {
    /** @var array{tt_content: array{columns: array{bodytext: array{config: array<string, mixed>}}}} $tca */
    $tca = &$GLOBALS['TCA'];
    // Enable RTE with our configuration for bodytext
    $tca['tt_content']['columns']['bodytext']['config']['enableRichtext'] = true;
    $tca['tt_content']['columns']['bodytext']['config']['richtextConfiguration'] =
        'default:EXT:pixelcoda_fe_editor/Configuration/RTE/Editor.yaml';
});
