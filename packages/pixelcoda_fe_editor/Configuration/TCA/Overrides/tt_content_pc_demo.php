<?php
defined('TYPO3') || die();

call_user_func(function () {
    /** @var array{tt_content: array{types: array<string, mixed>, columns: array{CType: array{config: array{items: array<int, mixed>}}}}} $tca */
    $tca = &$GLOBALS['TCA'];
    // Register CType
    $tca['tt_content']['types']['pc_demo'] = [
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
    $tca['tt_content']['columns']['CType']['config']['items'][] = [
        'label' => 'PixelCoda Demo (editierbar)',
        'value' => 'pc_demo',
        'icon'  => 'ext-pixelcoda-fe-editor'
    ];
});
