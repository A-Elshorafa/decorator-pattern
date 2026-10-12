using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary>
/// <b>Decorator (base).</b> Implements <see cref="IDocumentStorage"/> and holds another one (<c>inner</c>),
/// which can be the real storage or another decorator.
/// On save it changes the bytes with <see cref="Encode"/> and passes them in; on load it gets the bytes
/// from <c>inner</c> and undoes the change with <see cref="Decode"/>.
/// </summary>
public abstract class StorageDecorator(IDocumentStorage inner, LayerTrace trace) : IDocumentStorage
{
    public abstract StorageLayer Layer { get; }

    protected virtual byte[] Encode(byte[] data) => data;
    protected virtual byte[] Decode(byte[] data) => data;

    public virtual Task SaveAsync(string id, byte[] data)
    {
        var encoded = Encode(data);
        trace.Record(Layer, "save", data.Length, encoded.Length);
        return inner.SaveAsync(id, encoded);
    }

    public virtual async Task<byte[]> LoadAsync(string id)
    {
        var stored = await inner.LoadAsync(id);
        var decoded = Decode(stored);
        trace.Record(Layer, "load", stored.Length, decoded.Length);
        return decoded;
    }
}
