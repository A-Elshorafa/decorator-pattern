using System.Diagnostics;
using DocumentStorageDecorator.Models;

namespace DocumentStorageDecorator.Storage;

/// <summary>
/// <b>Concrete Decorator.</b> Leaves the bytes alone and adds behaviour around the call instead:
/// it times every save and load and writes it to the <see cref="AuditLog"/>, including failures.
/// </summary>
public class AuditDecorator(IDocumentStorage inner, LayerTrace trace, AuditLog log) : StorageDecorator(inner, trace)
{
    public override StorageLayer Layer => StorageLayer.Audit;

    public override async Task SaveAsync(string id, byte[] data)
    {
        var timer = Stopwatch.StartNew();
        try
        {
            await base.SaveAsync(id, data);
            log.Add(new AuditEntry(DateTime.UtcNow, "save", id, data.Length, timer.Elapsed.TotalMilliseconds, null));
        }
        catch (Exception ex)
        {
            log.Add(new AuditEntry(DateTime.UtcNow, "save", id, data.Length, timer.Elapsed.TotalMilliseconds, ex.Message));
            throw;
        }
    }

    public override async Task<byte[]> LoadAsync(string id)
    {
        var timer = Stopwatch.StartNew();
        try
        {
            var data = await base.LoadAsync(id);
            log.Add(new AuditEntry(DateTime.UtcNow, "load", id, data.Length, timer.Elapsed.TotalMilliseconds, null));
            return data;
        }
        catch (Exception ex)
        {
            log.Add(new AuditEntry(DateTime.UtcNow, "load", id, null, timer.Elapsed.TotalMilliseconds, ex.Message));
            throw;
        }
    }
}
