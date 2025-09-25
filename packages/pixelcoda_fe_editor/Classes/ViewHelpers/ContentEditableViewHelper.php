<?php
declare(strict_types=1);

namespace PixelCoda\FeEditor\ViewHelpers;

use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use PixelCoda\FeEditor\Utility\PermissionChecker;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractTagBasedViewHelper;

/**
 * ViewHelper to enable frontend editing for records in fluid
 *
 * Example:
 *
 * <pc:contentEditable table="tt_content" field="bodytext" uid="{item.uid}">
 *     {item.bodytext}
 * </pc:contentEditable>
 *
 * Output:
 * <div data-pc-field data-table="tt_content" data-field="bodytext" data-uid="1" contenteditable="true">
 *     This is the content text to edit
 * </div>
 */
class ContentEditableViewHelper extends AbstractTagBasedViewHelper
{
    /**
     * Disable the escaping of children
     */
    protected $escapeChildren = false;

    /**
     * Disable that the content itself isn't escaped
     */
    protected $escapeOutput = false;

    /**
     * Initialize arguments
     */
    public function initializeArguments(): void
    {
        parent::initializeArguments();

        $this->registerUniversalTagAttributes();

        $this->registerArgument(
            'table',
            'string',
            'The database table name to be used for saving the content',
            true
        );
        $this->registerArgument(
            'field',
            'string',
            'The database table field name to be used for saving the content',
            true
        );
        $this->registerArgument(
            'uid',
            'string',
            'The database uid (identifier) to be used for the record when saving the content',
            true
        );
        $this->registerArgument(
            'tag',
            'string',
            'An optional tag name, e.g. "div" or "span".',
            false,
            'div'
        );
    }

    /**
     * Add a content-editable tag around the content.
     */
    public function render(): string
    {
        $content = $this->renderChildren();

        // Check if backend user has permissions
        $beUser = $this->getBackendUser();
        if (!$beUser || !PermissionChecker::mayEditFrontend($beUser)) {
            // Return content without editing capabilities
            $this->tag->setTagName($this->arguments['tag']);
            $this->tag->setContent($content);
            return $this->tag->render();
        }

        // Check if user can modify this table
        if (!$beUser->check('tables_modify', $this->arguments['table'])) {
            $this->tag->setTagName($this->arguments['tag']);
            $this->tag->setContent($content);
            return $this->tag->render();
        }

        // Add editing attributes
        $this->tag->setTagName($this->arguments['tag']);
        $this->tag->addAttribute('data-pc-field', '');
        $this->tag->addAttribute('data-table', $this->arguments['table']);
        $this->tag->addAttribute('data-field', $this->arguments['field']);
        $this->tag->addAttribute('data-uid', $this->arguments['uid']);
        $this->tag->addAttribute('class', 'pc-fe-editable');
        
        // Get record for placeholder text
        $record = BackendUtility::getRecord($this->arguments['table'], (int)$this->arguments['uid']);
        $placeholder = $this->getPlaceholderText($this->arguments['table'], $this->arguments['field']);
        
        if ($placeholder) {
            $this->tag->addAttribute('data-placeholder', $placeholder);
        }

        $this->tag->setContent($content);
        return $this->tag->render();
    }

    /**
     * Get placeholder text for field
     */
    protected function getPlaceholderText(string $table, string $field): string
    {
        $placeholderText = '';
        
        if (isset($GLOBALS['TCA'][$table]['columns'][$field]['label'])) {
            $placeholderText = $GLOBALS['LANG']->sL($GLOBALS['TCA'][$table]['columns'][$field]['label']);
        }
        
        if (empty($placeholderText)) {
            $placeholderText = 'Click to edit ' . $field;
        }

        return $placeholderText;
    }

    /**
     * Get backend user
     */
    protected function getBackendUser(): ?BackendUserAuthentication
    {
        return $GLOBALS['BE_USER'] ?? null;
    }
}
