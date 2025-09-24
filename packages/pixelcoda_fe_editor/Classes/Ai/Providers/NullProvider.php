<?php
namespace PixelCoda\FeEditor\Ai\Providers;

use PixelCoda\FeEditor\Ai\AiProviderInterface;

final class NullProvider implements AiProviderInterface {
    public function generate(string $prompt, array $opts = []): string { return "[AI demo] " . $prompt; }
    public function rewrite(string $text, array $opts = []): string { return "[AI rewrite] " . $text; }
    public function translate(string $text, string $lang, array $opts = []): string { return "[AI " . $lang . "] " . $text; }
    public function summarize(string $text, array $opts = []): string { return "[AI summary] " . mb_substr($text, 0, 160) . "..."; }
}
