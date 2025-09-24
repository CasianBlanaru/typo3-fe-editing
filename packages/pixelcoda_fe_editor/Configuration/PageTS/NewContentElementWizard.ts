mod.wizards.newContentElement.wizardItems.special {
    elements {
        pc_demo {
            iconIdentifier = ext-icon
            title = LLL:EXT:pixelcoda_fe_editor/Resources/Private/Language/locallang.xlf:content.pc_demo
            description = LLL:EXT:pixelcoda_fe_editor/Resources/Private/Language/locallang.xlf:content.pc_demo.description
            tt_content_defValues {
                CType = pc_demo
            }
        }
    }
    show := addToList(pc_demo)
}