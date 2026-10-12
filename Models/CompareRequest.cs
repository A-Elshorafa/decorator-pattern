namespace DocumentStorageDecorator.Models;

public class CompareRequest
{
    /// <example>This agreement is made between Nile Logistics and Delta Retail. This agreement is made between Nile Logistics and Delta Retail. This agreement is made between Nile Logistics and Delta Retail. This agreement is made between Nile Logistics and Delta Retail.</example>
    public string Content { get; set; } = "";

    /// <summary>Stacks to try. Leave empty to compare the default set, including both orders of compression and encryption.</summary>
    /// <example>[]</example>
    public List<List<StorageLayer>> Stacks { get; set; } = [];
}
