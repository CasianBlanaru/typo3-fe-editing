<?php
namespace PixelCoda\FeEditor\Security;

use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;

final class TokenService
{
    public static function beToken(string $context): string
    {
        return FormProtectionFactory::get()->generateToken($context);
    }
}
