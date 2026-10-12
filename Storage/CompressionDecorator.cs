using System.IO.Compression;
using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary><b>Concrete Decorator.</b> GZip-compresses on save and decompresses on load.</summary>
public class CompressionDecorator(IDocumentStorage inner, LayerTrace trace) : StorageDecorator(inner, trace)
{
    public override StorageLayer Layer => StorageLayer.Compression;

    protected override byte[] Encode(byte[] data)
    {
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.SmallestSize))
            gzip.Write(data);
        return output.ToArray();
    }

    protected override byte[] Decode(byte[] data)
    {
        // GZip has its own CRC, so corrupted input throws InvalidDataException here.
        using var gzip = new GZipStream(new MemoryStream(data), CompressionMode.Decompress);
        using var output = new MemoryStream();
        gzip.CopyTo(output);
        return output.ToArray();
    }
}
