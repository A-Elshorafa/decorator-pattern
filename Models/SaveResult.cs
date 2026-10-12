namespace DocumentStorageDecorator.Models;

public record SaveResult(string Id, List<StorageLayer> Layers, int OriginalBytes, int StoredBytes, List<LayerStep> Trace);
