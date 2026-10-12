using System.Collections.Concurrent;
using System.Text;
using DocumentStorageDecorator.Models;
using DocumentStorageDecorator.Storage;

namespace DocumentStorageDecorator.Services;

/// <summary>
/// <b>Client.</b> Saves and reads documents through an <see cref="IDocumentStorage"/>. It asks the factory for
/// a stack per document and then only calls <c>SaveAsync</c>/<c>LoadAsync</c>; it never knows which decorators are inside.
/// </summary>
public class DocumentService(InMemoryBlobStorage blobs, StorageStackFactory factory)
{
    private readonly ConcurrentDictionary<string, DocumentInfo> _catalog = new(StringComparer.OrdinalIgnoreCase);

    public static readonly List<List<StorageLayer>> DefaultCompareStacks =
    [
        [],
        [StorageLayer.Compression],
        [StorageLayer.Encryption],
        [StorageLayer.Compression, StorageLayer.Encryption],
        [StorageLayer.Encryption, StorageLayer.Compression],
        [StorageLayer.Compression, StorageLayer.Encryption, StorageLayer.Checksum],
    ];

    public List<DocumentInfo> List() => _catalog.Values.OrderByDescending(d => d.SavedAt).ToList();

    public DocumentInfo? Find(string id) => _catalog.GetValueOrDefault(id);

    public async Task<SaveResult> SaveAsync(SaveDocumentRequest request)
    {
        var id = string.IsNullOrWhiteSpace(request.Id) ? $"doc-{Guid.NewGuid().ToString("N")[..8]}" : request.Id.Trim();
        var data = Encoding.UTF8.GetBytes(request.Content);
        var trace = new LayerTrace();

        await factory.Build(blobs, request.Layers, trace).SaveAsync(id, data);

        var stored = (await blobs.LoadAsync(id)).Length;
        _catalog[id] = new DocumentInfo(id, request.Layers, data.Length, stored, DateTime.UtcNow);
        return new SaveResult(id, request.Layers, data.Length, stored, trace.Steps);
    }

    /// <summary>Reads through the same stack the document was saved with. Throws if the stored bytes were corrupted.</summary>
    public async Task<ReadResult> ReadAsync(DocumentInfo doc)
    {
        var trace = new LayerTrace();
        var data = await factory.Build(blobs, doc.Layers, trace).LoadAsync(doc.Id);
        return new ReadResult(doc.Id, Encoding.UTF8.GetString(data), doc.Layers, trace.Steps);
    }

    public async Task<RawDocument> ReadRawAsync(DocumentInfo doc)
    {
        var data = await blobs.LoadAsync(doc.Id);
        var preview = new string(data.Take(200).Select(b => b is >= 0x20 and < 0x7F ? (char)b : '·').ToArray());
        return new RawDocument(doc.Id, data.Length, preview, Convert.ToBase64String(data));
    }

    public bool Corrupt(DocumentInfo doc) => blobs.Corrupt(doc.Id);

    public bool Delete(string id) => _catalog.TryRemove(id, out _) && blobs.Remove(id);

    /// <summary>Saves the content through each stack into a throwaway storage and reports the stored size.</summary>
    public async Task<CompareResult> CompareAsync(CompareRequest request)
    {
        var data = Encoding.UTF8.GetBytes(request.Content);
        var stacks = request.Stacks.Count > 0 ? request.Stacks : DefaultCompareStacks;
        var rows = new List<CompareRow>();

        foreach (var layers in stacks)
        {
            var scratch = new InMemoryBlobStorage();
            await factory.Build(scratch, layers, new LayerTrace()).SaveAsync("compare", data);

            var stored = (await scratch.LoadAsync("compare")).Length;
            rows.Add(new CompareRow(layers, stored, data.Length == 0 ? 0 : Math.Round(100.0 * stored / data.Length, 1)));
        }

        return new CompareResult(data.Length, rows);
    }
}
