.. include:: /Includes.rst.txt

====================
Pixelcoda FE Editor
====================

:Extension key:
   |extension_key|

:Package name:
   |package_name|

:Version:
   |release|

:Language:
   en

:Author:
   Casian Blanaru (Pixelcoda)

:License:
   GPL-2.0-or-later

Accessible frontend editing for TYPO3 12 LTS, TYPO3 13 LTS and TYPO3 14.
Editors can update content directly on the rendered website using inline
editing, drag-and-drop sorting, contextual record editing and optional AI.

Features
========

* Inline editing using TYPO3 DataHandler and backend permissions.
* Keyboard-accessible drag-and-drop content sorting.
* Contextual FormEngine records in an accessible side canvas.
* Existing frontend and headless marker support.
* Responsive light and dark user interface.
* Optional OpenAI, Anthropic Claude, OpenRouter and Mistral integration.

Installation
============

Install the extension through Composer:

.. code-block:: bash

   composer require pixelcoda/fe-editor
   vendor/bin/typo3 extension:setup
   vendor/bin/typo3 cache:flush

Configuration
=============

Authenticated backend users with permission to modify ``tt_content`` can use
the frontend editor. AI provider keys are configured in TYPO3 Extension
Configuration and remain server-side.

Administrators can disable frontend editing for selected users or groups:

.. code-block:: typoscript

   tx_pixelcodafeeditor.disabled = 1

Accessibility
=============

The editor provides keyboard controls, focus management, visible focus states,
live status messages, reduced-motion support and responsive light/dark modes.

Further resources
=================

* `Repository <https://github.com/CasianBlanaru/pixelcoda-typo3-fe-editing>`__
* `Issue tracker <https://github.com/CasianBlanaru/pixelcoda-typo3-fe-editing/issues>`__
* `Detailed Markdown documentation <https://github.com/CasianBlanaru/pixelcoda-typo3-fe-editing/blob/master/packages/pixelcoda_fe_editor/Documentation/Index.md>`__
