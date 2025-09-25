<?php
declare(strict_types=1);

namespace PixelCoda\FeEditor\ViewHelpers;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use PixelCoda\FeEditor\Utility\PermissionChecker;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractTagBasedViewHelper;

/**
 * ViewHelper to create drop zones for new content elements
 *
 * Example:
 *
 * <pc:dropZone pid="{data.pid}" colPos="0">
 *     <p>Drop new content here</p>
 * </pc:dropZone>
 *
 * Output:
 * <div data-pc-dropzone data-target-pid="123" data-col-pos="0" class="pc-drop">
 *     <p>Drop new content here</p>
 *     <button type="button" class="pc-add">+ Element</button>
 * </div>
 */
class DropZoneViewHelper extends AbstractTagBasedViewHelper
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
            'pid',
            'string',
            'The page ID where new content elements should be created',
            true
        );
        $this->registerArgument(
            'colPos',
            'string',
            'The column position where new content elements should be created',
            false,
            '0'
        );
        $this->registerArgument(
            'tag',
            'string',
            'An optional tag name, e.g. "div" or "section".',
            false,
            'div'
        );
        $this->registerArgument(
            'buttonText',
            'string',
            'Text for the add button',
            false,
            '+ Element hinzufügen'
        );
    }

    /**
     * Create a drop zone for new content elements
     */
    public function render(): string
    {
        $content = $this->renderChildren();

        // Check if backend user has permissions
        $beUser = $this->getBackendUser();
        if (!$beUser || !PermissionChecker::mayEditFrontend($beUser)) {
            // Return content without drop zone functionality
            $this->tag->setTagName($this->arguments['tag']);
            $this->tag->setContent($content);
            return $this->tag->render();
        }

        // Check if user can create content elements
        if (!$beUser->check('tables_modify', 'tt_content')) {
            $this->tag->setTagName($this->arguments['tag']);
            $this->tag->setContent($content);
            return $this->tag->render();
        }

        // Add drop zone attributes
        $this->tag->setTagName($this->arguments['tag']);
        $this->tag->addAttribute('data-pc-dropzone', '');
        $this->tag->addAttribute('data-target-pid', $this->arguments['pid']);
        $this->tag->addAttribute('data-col-pos', $this->arguments['colPos']);
        $this->tag->addAttribute('class', 'pc-drop');
        
        // Add button for creating new elements
        $buttonText = htmlspecialchars($this->arguments['buttonText']);
        $button = '<button type="button" class="pc-add" style="display: inline-block; padding: 0.5rem 1rem; background: #0EA5E9; color: white; border: none; border-radius: 0.25rem; cursor: pointer; margin-top: 0.5rem;">' . $buttonText . '</button>';
        
        $this->tag->setContent($content . $button);
        return $this->tag->render();
    }

    /**
     * Get backend user
     */
    protected function getBackendUser(): ?BackendUserAuthentication
    {
        return $GLOBALS['BE_USER'] ?? null;
    }
}
