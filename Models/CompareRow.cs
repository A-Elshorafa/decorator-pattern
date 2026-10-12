namespace DocumentStorageDecorator.Models;

public record CompareRow(List<StorageLayer> Layers, int StoredBytes, double PercentOfOriginal);
