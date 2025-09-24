<?php

declare(strict_types=1);

namespace PixelCoda\FeEditor\Ai;

interface AiProviderInterface
{
    /**
     * Generate new content based on a prompt
     */
    public function generate(string $prompt, array $context = []): string;

    /**
     * Rewrite existing content
     */
    public function rewrite(string $content, string $instruction, array $context = []): string;

    /**
     * Translate content to another language
     */
    public function translate(string $content, string $targetLanguage, array $context = []): string;

    /**
     * Summarize content
     */
    public function summarize(string $content, int $maxLength = 100, array $context = []): string;

    /**
     * Check if the provider is available/configured
     */
    public function isAvailable(): bool;

    /**
     * Get provider name
     */
    public function getName(): string;
}