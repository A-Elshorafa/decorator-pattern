using System.Text.Json.Serialization;

namespace DocumentStorageDecorator.Models;

/// <summary>A decorator that can be stacked on top of the storage.</summary>
[JsonConverter(typeof(JsonStringEnumConverter<StorageLayer>))]
public enum StorageLayer
{
    /// <summary>GZip on save, un-GZip on load.</summary>
    Compression,

    /// <summary>AES-256-GCM on save, decrypt on load.</summary>
    Encryption,

    /// <summary>Prepends a SHA-256 hash on save, verifies it on load.</summary>
    Checksum,

    /// <summary>Records every save and load with its size and duration. Does not change the bytes.</summary>
    Audit,
}
