namespace DocumentStorageDecorator.Models;

/// <summary>Catalog entry. The layers are kept so the document can be read back through the same stack.</summary>
public record DocumentInfo(string Id, List<StorageLayer> Layers, int OriginalBytes, int StoredBytes, DateTime SavedAt);
