<?php

namespace PixelCoda\FeEditor\Service;

interface AiProviderInterface
{
    public function generate(string $prompt, array $context = []): string;
    
    public function rewrite(string $content, string $style = 'professional'): string;
    
    public function translate(string $content, string $targetLanguage = 'en'): string;
    
    public function summarize(string $content, int $maxLength = 100): string;
}