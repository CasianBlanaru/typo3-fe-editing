<?php
declare(strict_types=1);

namespace PixelCoda\FeEditor\Api;

use GuzzleHttp\Exception\GuzzleException;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\FormProtection\FormProtectionFactory;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Http\RequestFactory;
use TYPO3\CMS\Core\Utility\GeneralUtility;

final class AiController
{
    private const MAX_INPUT_LENGTH = 6000;

    public function handle(ServerRequestInterface $request): JsonResponse
    {
        try {
            $beUser = $GLOBALS['BE_USER'] ?? null;
            if (!$beUser instanceof BackendUserAuthentication || empty($beUser->user)) {
                return new JsonResponse(['ok' => false, 'error' => 'auth_required'], 401);
            }
            if (!$beUser->isAdmin() && !$beUser->check('tables_modify', 'tt_content')) {
                return new JsonResponse(['ok' => false, 'error' => 'no_modify_permission'], 403);
            }

            $parsed = $request->getParsedBody() ?? [];
            $formToken = (string)($parsed['formToken'] ?? '');
            $formProtection = GeneralUtility::makeInstance(FormProtectionFactory::class)->createFromRequest($request);
            if (!$formProtection->validateToken($formToken, 'pixelcoda-fe-editor', 'fe-editor-action')) {
                return new JsonResponse(['ok' => false, 'error' => 'invalid_token'], 403);
            }

            $text = trim((string)($parsed['text'] ?? ''));
            $field = (string)($parsed['field'] ?? 'bodytext');
            $action = (string)($parsed['action'] ?? 'rewrite');
            $language = trim((string)($parsed['language'] ?? 'German'));
            if ($text === '') {
                return new JsonResponse(['ok' => false, 'error' => 'empty_text'], 400);
            }
            if (mb_strlen($text) > self::MAX_INPUT_LENGTH) {
                return new JsonResponse(['ok' => false, 'error' => 'text_too_long'], 400);
            }

            $apiKey = (string)(getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? ''));
            if ($apiKey === '') {
                return new JsonResponse([
                    'ok' => false,
                    'error' => 'openai_api_key_missing',
                    'message' => 'OPENAI_API_KEY is not configured',
                ], 503);
            }

            $model = (string)(getenv('OPENAI_MODEL') ?: ($_ENV['OPENAI_MODEL'] ?? 'gpt-4.1-mini'));
            $prompt = $this->buildPrompt($text, $field, $action, $language);
            $payload = [
                'model' => $model,
                'instructions' => 'You are an expert TYPO3 content editor. Return only the improved content, no markdown fences, no explanations.',
                'input' => $prompt,
                'max_output_tokens' => 900,
            ];

            try {
                $response = GeneralUtility::makeInstance(RequestFactory::class)->request(
                    'https://api.openai.com/v1/responses',
                    'POST',
                    [
                        'headers' => [
                            'Authorization' => 'Bearer ' . $apiKey,
                            'Content-Type' => 'application/json',
                        ],
                        'body' => json_encode($payload, JSON_THROW_ON_ERROR),
                        'timeout' => 30,
                        'connect_timeout' => 8,
                    ]
                );
            } catch (GuzzleException $e) {
                return new JsonResponse([
                    'ok' => false,
                    'error' => 'openai_request_failed',
                    'message' => $e->getMessage(),
                ], 502);
            }

            $statusCode = $response->getStatusCode();
            $rawBody = (string)$response->getBody();
            $decoded = json_decode($rawBody, true);
            if ($statusCode < 200 || $statusCode >= 300 || !is_array($decoded)) {
                return new JsonResponse([
                    'ok' => false,
                    'error' => 'openai_request_failed',
                    'status' => $statusCode,
                    'message' => is_array($decoded) ? ($decoded['error']['message'] ?? 'OpenAI request failed') : 'OpenAI request failed',
                ], 502);
            }

            $result = trim($this->extractText($decoded));
            if ($result === '') {
                return new JsonResponse(['ok' => false, 'error' => 'empty_ai_response'], 502);
            }

            return new JsonResponse([
                'ok' => true,
                'text' => $result,
                'model' => $model,
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'ok' => false,
                'error' => 'exception',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function buildPrompt(string $text, string $field, string $action, string $language): string
    {
        $formatInstruction = $field === 'bodytext'
            ? 'Keep valid lightweight HTML paragraphs if the input contains HTML. Do not add scripts, styles, classes, or external links.'
            : 'Return plain headline text only.';

        $task = match ($action) {
            'shorten' => 'Shorten the content while preserving the core message.',
            'expand' => 'Expand the content slightly with concrete, useful wording.',
            'translate' => 'Translate the content to ' . ($language !== '' ? $language : 'German') . '.',
            default => 'Improve the content for clarity, premium tone, grammar, and conversion without changing facts.',
        };

        return $task . "\n" . $formatInstruction . "\n\nContent:\n" . $text;
    }

    /**
     * @param array<string, mixed> $response
     */
    private function extractText(array $response): string
    {
        if (isset($response['output_text']) && is_string($response['output_text'])) {
            return $response['output_text'];
        }

        $chunks = [];
        foreach (($response['output'] ?? []) as $item) {
            if (!is_array($item)) {
                continue;
            }
            foreach (($item['content'] ?? []) as $content) {
                if (is_array($content) && isset($content['text']) && is_string($content['text'])) {
                    $chunks[] = $content['text'];
                }
            }
        }

        return implode("\n", $chunks);
    }
}
