using System.Collections.Concurrent;

namespace DocumentStorageDecorator.Storage;

/// <summary>
/// <b>Concrete Component.</b> The real storage. It only keeps bytes and knows nothing about
/// compression, encryption or checksums. Those are added around it by decorators.
/// </summary>
public class InMemoryBlobStorage : IDocumentStorage
{
    private readonly ConcurrentDictionary<string, byte[]> _blobs = new(StringComparer.OrdinalIgnoreCase);

    public Task SaveAsync(string id, byte[] data)
    {
        _blobs[id] = data.ToArray();
        return Task.CompletedTask;
    }

    public Task<byte[]> LoadAsync(string id) =>
        _blobs.TryGetValue(id, out var data)
            ? Task.FromResult(data.ToArray())
            : throw new KeyNotFoundException($"No blob stored under '{id}'.");

    public bool Remove(string id) => _blobs.TryRemove(id, out _);

    /// <summary>Flips one byte in the middle, like disk corruption or someone editing the file. Returns false if there is nothing to flip.</summary>
    public bool Corrupt(string id)
    {
        if (!_blobs.TryGetValue(id, out var data) || data.Length == 0) return false;

        var copy = data.ToArray();
        copy[copy.Length / 2] ^= 0xFF;
        _blobs[id] = copy;
        return true;
    }
}
