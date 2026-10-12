using System.Security.Cryptography;
using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary><b>Concrete Decorator.</b> Prepends a SHA-256 hash on save and checks it on load, so corruption is caught instead of returned.</summary>
public class ChecksumDecorator(IDocumentStorage inner, LayerTrace trace) : StorageDecorator(inner, trace)
{
    private const int HashSize = SHA256.HashSizeInBytes;

    public override StorageLayer Layer => StorageLayer.Checksum;

    protected override byte[] Encode(byte[] data) => [.. SHA256.HashData(data), .. data];

    protected override byte[] Decode(byte[] data)
    {
        if (data.Length < HashSize) throw new InvalidDataException("Checksum is missing.");

        var payload = data[HashSize..];
        if (!CryptographicOperations.FixedTimeEquals(data.AsSpan(0, HashSize), SHA256.HashData(payload)))
            throw new InvalidDataException("Checksum mismatch: the stored bytes were changed.");

        return payload;
    }
}
