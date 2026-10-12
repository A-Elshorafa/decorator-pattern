namespace DocumentStorageDecorator.Models;

public class SaveDocumentRequest
{
    /// <summary>Leave empty to get a generated id. An existing id is overwritten.</summary>
    /// <example>contract-001</example>
    public string? Id { get; set; }

    /// <example>This agreement is made between Nile Logistics and Delta Retail. This agreement is made between Nile Logistics and Delta Retail. This agreement is made between Nile Logistics and Delta Retail. This agreement is made between Nile Logistics and Delta Retail.</example>
    public string Content { get; set; } = "";

    /// <summary>Decorators in the order they run on save. Load runs them in reverse.</summary>
    /// <example>["Audit", "Compression", "Encryption", "Checksum"]</example>
    public List<StorageLayer> Layers { get; set; } = [];
}
