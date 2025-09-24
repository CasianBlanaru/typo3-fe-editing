<?php
defined('TYPO3') || die();

call_user_func(function () {
    // Register CType
    $GLOBALS['TCA']['tt_content']['types']['pc_demo'] = [
        'showitem' => '
            --div--;Content,
                header, subheader,
                bodytext; Text;;;richtext:rte_transform[mode=ts_css],
            --div--;Appearance,
                frame_class, layout,
            --div--;Access,
                hidden, starttime, endtime
        '
    ];

    // Add to list of CTypes
    $GLOBALS['TCA']['tt_content']['columns']['CType']['config']['items'][] = [
        'label' => 'PixelCoda Demo (editierbar)',
        'value' => 'pc_demo',
        'icon'  => 'ext-pixelcoda-fe-editor'
    ];
});
