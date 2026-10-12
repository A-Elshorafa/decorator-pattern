namespace DocumentStorageDecorator.Models;

public record CompareResult(int OriginalBytes, List<CompareRow> Rows);
