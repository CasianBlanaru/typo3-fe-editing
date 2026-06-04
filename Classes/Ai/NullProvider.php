<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Ai;

class NullProvider implements AiProviderInterface
{
    public function generate(string $prompt, array $context = []): string
    {
        return '[KI Vorschlag] ' . $prompt;
    }

    public function rewrite(string $content, string $instruction, array $context = []): string
    {
        return '[KI Vorschlag] ' . $content;
    }

    public function translate(string $content, string $targetLanguage, array $context = []): string
    {
        return '[KI Vorschlag] ' . $content;
    }

    public function summarize(string $content, int $maxLength = 100, array $context = []): string
    {
        $words = explode(' ', $content);
        $summary = implode(' ', array_slice($words, 0, $maxLength / 5));
        return '[KI Vorschlag] ' . $summary . '...';
    }

    public function isAvailable(): bool
    {
        return true;
    }

    public function getName(): string
    {
        return 'Null Provider (Demo)';
    }
}