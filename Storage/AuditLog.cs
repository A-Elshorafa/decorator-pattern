using System.Collections.Concurrent;
using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary>The last <see cref="Capacity"/> storage calls seen by <see cref="AuditDecorator"/>, newest first.</summary>
public class AuditLog
{
    public const int Capacity = 200;
    private readonly ConcurrentQueue<AuditEntry> _entries = new();

    public List<AuditEntry> Entries => _entries.Reverse().ToList();

    public void Add(AuditEntry entry)
    {
        _entries.Enqueue(entry);
        while (_entries.Count > Capacity) _entries.TryDequeue(out _);
    }

    public void Clear() => _entries.Clear();
}
