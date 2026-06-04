<?php
declare(strict_types=1);

namespace PixelCoda\FeEditor\Ai;

interface AiProviderInterface
{
    /** @param array<string, mixed> $opts */
    public function generate(string $prompt, array $opts = []) : string;
    /** @param array<string, mixed> $opts */
    public function rewrite(string $text, array $opts = []) : string;
    /** @param array<string, mixed> $opts */
    public function translate(string $text, string $lang, array $opts = []) : string;
    /** @param array<string, mixed> $opts */
    public function summarize(string $text, array $opts = []) : string;
}
