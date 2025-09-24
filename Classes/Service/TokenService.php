<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Service;

use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;

class TokenService
{
    public function generateToken(): string
    {
        $formProtection = FormProtectionFactory::get();
        return $formProtection->generateToken('fe_editor');
    }

    public function validateToken(string $token): bool
    {
        $formProtection = FormProtectionFactory::get();
        return $formProtection->validateToken($token);
    }
}