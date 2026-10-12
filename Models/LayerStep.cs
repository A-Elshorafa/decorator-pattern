namespace DocumentStorageDecorator.Models;

/// <summary>One decorator's work on the way down (save) or up (load).</summary>
public record LayerStep(StorageLayer Layer, string Operation, int BytesIn, int BytesOut);
