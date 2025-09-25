<?php
declare(strict_types=1);

namespace PixelCoda\FeEditor\Event;

/**
 * Event dispatched before a field is saved to the database.
 * Allows modification of the content before persistence.
 */
final class BeforeSaveEvent
{
    private string $table;
    private string $field;
    private string $content;
    private int $uid;
    private array $record;

    public function __construct(string $table, string $field, string $content, int $uid, array $record = [])
    {
        $this->table = $table;
        $this->field = $field;
        $this->content = $content;
        $this->uid = $uid;
        $this->record = $record;
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

    public function setContent(string $content): void
    {
        $this->content = $content;
    }

    public function getUid(): int
    {
        return $this->uid;
    }

    public function getRecord(): array
    {
        return $this->record;
    }

    public function setRecord(array $record): void
    {
        $this->record = $record;
    }
}
