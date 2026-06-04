<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Ai;

use TYPO3\CMS\Core\Service\AbstractService;
use TYPO3\CMS\Core\Utility\GeneralUtility;

class AiService extends AbstractService
{
    private array $providers = [];

    public function __construct()
    {
        $this->initializeProviders();
    }

    private function initializeProviders(): void
    {
        // Register available providers
        $this->providers = [
            'null' => GeneralUtility::makeInstance(NullProvider::class),
            // Future: OpenAI, local models, etc.
        ];
    }

    public function getProvider(string $identifier = 'null'): AiProviderInterface
    {
        return $this->providers[$identifier] ?? $this->providers['null'];
    }

    public function getAvailableProviders(): array
    {
        return array_filter($this->providers, function (AiProviderInterface $provider) {
            return $provider->isAvailable();
        });
    }

    public function generate(string $prompt, array $context = [], string $provider = 'null'): string
    {
        return $this->getProvider($provider)->generate($prompt, $context);
    }

    public function rewrite(string $content, string $instruction, array $context = [], string $provider = 'null'): string
    {
        return $this->getProvider($provider)->rewrite($content, $instruction, $context);
    }

    public function translate(string $content, string $targetLanguage, array $context = [], string $provider = 'null'): string
    {
        return $this->getProvider($provider)->translate($content, $targetLanguage, $context);
    }

    public function summarize(string $content, int $maxLength = 100, array $context = [], string $provider = 'null'): string
    {
        return $this->getProvider($provider)->summarize($content, $maxLength, $context);
    }
}