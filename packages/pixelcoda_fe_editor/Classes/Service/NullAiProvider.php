<?php

namespace PixelCoda\FeEditor\Service;

class NullAiProvider implements AiProviderInterface
{
    public function generate(string $prompt, array $context = []): string
    {
        return '[AI Vorschlag] - ' . $prompt;
    }
    
    public function rewrite(string $content, string $style = 'professional'): string
    {
        return '[KI Vorschlag] - ' . $content;
    }
    
    public function translate(string $content, string $targetLanguage = 'en'): string
    {
        return '[KI Vorschlag] - ' . $content;
    }
    
    public function summarize(string $content, int $maxLength = 100): string
    {
        return '[KI Vorschlag] - ' . substr($content, 0, $maxLength) . '...';
    }
}