<?php
namespace PixelCoda\FeEditor\Ai;

interface AiProviderInterface {
    public function generate(string $prompt, array $opts = []) : string;
    public function rewrite(string $text, array $opts = []) : string;
    public function translate(string $text, string $lang, array $opts = []) : string;
    public function summarize(string $text, array $opts = []) : string;
}
