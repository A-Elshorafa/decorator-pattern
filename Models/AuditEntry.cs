namespace DocumentStorageDecorator.Models;

/// <summary>One call seen by the Audit decorator. <see cref="Bytes"/> is the size at the Audit layer's position in the stack.</summary>
public record AuditEntry(DateTime At, string Operation, string DocumentId, int? Bytes, double ElapsedMs, string? Error);
