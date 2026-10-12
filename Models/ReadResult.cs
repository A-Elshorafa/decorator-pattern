namespace DocumentStorageDecorator.Models;

public record ReadResult(string Id, string Content, List<StorageLayer> Layers, List<LayerStep> Trace);
