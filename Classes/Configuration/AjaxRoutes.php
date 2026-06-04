<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Configuration;

use PixelCoda\FeEditor\Controller\SaveController;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Utility\GeneralUtility;

class AjaxRoutes
{
    public static function handle(ServerRequestInterface $request): ResponseInterface
    {
        $controller = GeneralUtility::makeInstance(SaveController::class);
        return $controller->handle($request);
    }
}