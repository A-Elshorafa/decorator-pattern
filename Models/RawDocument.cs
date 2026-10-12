namespace DocumentStorageDecorator.Models;

/// <summary>
/// The bytes as the underlying storage holds them, with no decorator in between.
/// <see cref="Preview"/> is the first 200 bytes as text, with unprintable bytes shown as '·'. It is readable only if nothing encrypted or compressed them.
/// </summary>
public record RawDocument(string Id, int Bytes, string Preview, string Base64);
