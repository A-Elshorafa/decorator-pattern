using System.Security.Cryptography;
using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary>
/// <b>Concrete Decorator.</b> AES-256-GCM. Stored layout: nonce (12 bytes) + tag (16 bytes) + ciphertext.
/// GCM also authenticates, so changed bytes fail to decrypt.
/// </summary>
public class EncryptionDecorator(IDocumentStorage inner, LayerTrace trace, byte[] key) : StorageDecorator(inner, trace)
{
    private const int NonceSize = 12, TagSize = 16;

    public override StorageLayer Layer => StorageLayer.Encryption;

    protected override byte[] Encode(byte[] data)
    {
        var output = new byte[NonceSize + TagSize + data.Length];
        var nonce = output.AsSpan(0, NonceSize);
        RandomNumberGenerator.Fill(nonce);

        using var aes = new AesGcm(key, TagSize);
        aes.Encrypt(nonce, data, output.AsSpan(NonceSize + TagSize), output.AsSpan(NonceSize, TagSize));
        return output;
    }

    protected override byte[] Decode(byte[] data)
    {
        if (data.Length < NonceSize + TagSize) throw new InvalidDataException("Encrypted data is too short.");

        var plain = new byte[data.Length - NonceSize - TagSize];
        using var aes = new AesGcm(key, TagSize);
        aes.Decrypt(data.AsSpan(0, NonceSize), data.AsSpan(NonceSize + TagSize), data.AsSpan(NonceSize, TagSize), plain);
        return plain;
    }
}
