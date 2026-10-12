namespace DocumentStorageDecorator.Storage;

/// <summary>
/// <b>Component.</b> Stores and returns bytes by id. The plain storage and every decorator implement it,
/// so a decorated storage can be used wherever a plain one is expected, and decorators can wrap each other.
/// </summary>
public interface IDocumentStorage
{
    Task SaveAsync(string id, byte[] data);

    /// <summary>Throws <see cref="KeyNotFoundException"/> if nothing is stored under <paramref name="id"/>.</summary>
    Task<byte[]> LoadAsync(string id);
}
