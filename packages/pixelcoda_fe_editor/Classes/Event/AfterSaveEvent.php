<?php
declare(strict_types=1);

namespace PixelCoda\FeEditor\Event;

/**
 * Event dispatched after a field has been successfully saved to the database.
 * Allows for post-processing actions like cache clearing, notifications, etc.
 */
final class AfterSaveEvent
{
    private string $table;
    private string $field;
    private string $content;
    private int $uid;
    /** @var array<string, mixed> */
    private array $record;
    private bool $success;

    /** @param array<string, mixed> $record */
    public function __construct(string $table, string $field, string $content, int $uid, array $record = [], bool $success = true)
    {
        $this->table = $table;
        $this->field = $field;
        $this->content = $content;
        $this->uid = $uid;
        $this->record = $record;
        $this->success = $success;
    }

    public function getTable(): string
    {
        return $this->table;
    }

    public function getField(): string
    {
        return $this->field;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function getUid(): int
    {
        return $this->uid;
    }

    /** @return array<string, mixed> */
    public function getRecord(): array
    {
        return $this->record;
    }

    public function isSuccess(): bool
    {
        return $this->success;
    }
}
