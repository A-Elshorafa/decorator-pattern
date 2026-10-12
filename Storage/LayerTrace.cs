using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary>Collects what each decorator did during one save or load, in the order it happened.</summary>
public class LayerTrace
{
    public List<LayerStep> Steps { get; } = [];

    public void Record(StorageLayer layer, string operation, int bytesIn, int bytesOut) =>
        Steps.Add(new LayerStep(layer, operation, bytesIn, bytesOut));
}
