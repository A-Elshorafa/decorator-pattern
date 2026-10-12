using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary>Wraps a storage in decorators at runtime, in the order the caller asks for.</summary>
public class StorageStackFactory(byte[] encryptionKey, AuditLog auditLog)
{
    public static readonly List<LayerInfo> Available =
    [
        new(StorageLayer.Compression, "GZip on save, decompress on load. Put it before Encryption: encrypted bytes look random and don't compress."),
        new(StorageLayer.Encryption, "AES-256-GCM. The stored bytes are unreadable without the key, and changed bytes fail to decrypt."),
        new(StorageLayer.Checksum, "SHA-256 hash prepended on save and verified on load. Catches corruption instead of returning bad data."),
        new(StorageLayer.Audit, "Logs every save and load with size and duration. Doesn't change the bytes. The size it logs depends on where it sits."),
    ];

    /// <summary><paramref name="layers"/> are in the order they run on save, so <c>layers[0]</c> becomes the outermost wrapper.</summary>
    public IDocumentStorage Build(IDocumentStorage storage, IReadOnlyList<StorageLayer> layers, LayerTrace trace)
    {
        // The first layer must see the data first, so wrap from the last one outwards.
        for (var i = layers.Count - 1; i >= 0; i--)
        {
            storage = layers[i] switch
            {
                StorageLayer.Compression => new CompressionDecorator(storage, trace),
                StorageLayer.Encryption => new EncryptionDecorator(storage, trace, encryptionKey),
                StorageLayer.Checksum => new ChecksumDecorator(storage, trace),
                StorageLayer.Audit => new AuditDecorator(storage, trace, auditLog),
                var unknown => throw new ArgumentOutOfRangeException(nameof(layers), unknown, "Unknown layer."),
            };
        }

        return storage;
    }
}
