using System.Security.Cryptography;
using DocumentStorageDecorator.Models;
using DocumentStorageDecorator.Services;
using DocumentStorageDecorator.Storage;

var builder = WebApplication.CreateBuilder(args);

// A new key per run is enough for a demo: documents live in memory and are gone on restart anyway.
var encryptionKey = RandomNumberGenerator.GetBytes(32);

builder.Services.AddSingleton<AuditLog>();
builder.Services.AddSingleton<InMemoryBlobStorage>();
builder.Services.AddSingleton(sp => new StorageStackFactory(encryptionKey, sp.GetRequiredService<AuditLog>()));
builder.Services.AddSingleton<DocumentService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o => o.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "DocumentStorageDecorator.xml")));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(o => o.RoutePrefix = "swagger");
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

const int MaxContentLength = 100_000, MaxLayers = 10;

static string? ValidateLayers(List<StorageLayer> layers)
{
    if (layers.Count > MaxLayers) return $"At most {MaxLayers} layers are allowed.";
    if (layers.Any(l => !Enum.IsDefined(l))) return $"Unknown layer. Use: {string.Join(", ", Enum.GetNames<StorageLayer>())}.";
    return null;
}

static string? ValidateContent(string? content) =>
    string.IsNullOrEmpty(content) ? "Content is required."
    : content.Length > MaxContentLength ? $"Content must be at most {MaxContentLength} characters."
    : null;

// Corrupted bytes surface as one of these, depending on which layer notices first.
static bool IsCorruption(Exception ex) => ex is InvalidDataException or CryptographicException;

app.MapGet("/api/layers", () => StorageStackFactory.Available)
.WithSummary("The decorators you can stack");

app.MapPost("/api/documents", async (SaveDocumentRequest req, DocumentService svc) =>
    (ValidateContent(req.Content) ?? ValidateLayers(req.Layers)) is { } error
        ? Results.BadRequest(error)
        : Results.Ok(await svc.SaveAsync(req)))
.WithSummary("Save a document through the decorators you list, in that order. The trace shows each layer's input and output size.");

app.MapGet("/api/documents", (DocumentService svc) => svc.List())
.WithSummary("List saved documents and the stack each was saved with");

app.MapGet("/api/documents/{id}", async (string id, DocumentService svc) =>
{
    if (svc.Find(id) is not { } doc) return Results.NotFound($"Document {id} not found.");
    try { return Results.Ok(await svc.ReadAsync(doc)); }
    catch (Exception ex) when (IsCorruption(ex))
    {
        return Results.Problem(ex.Message, statusCode: StatusCodes.Status422UnprocessableEntity, title: "The stored document is corrupted.");
    }
})
.WithSummary("Read a document back through the same stack, in reverse order");

app.MapGet("/api/documents/{id}/raw", async (string id, DocumentService svc) =>
    svc.Find(id) is { } doc ? Results.Ok(await svc.ReadRawAsync(doc)) : Results.NotFound($"Document {id} not found."))
.WithSummary("The bytes the underlying storage actually holds, with no decorators");

app.MapPost("/api/documents/{id}/corrupt", async (string id, DocumentService svc) =>
{
    if (svc.Find(id) is not { } doc) return Results.NotFound($"Document {id} not found.");
    return svc.Corrupt(doc) ? Results.Ok(await svc.ReadRawAsync(doc)) : Results.Conflict("The document is empty; there is no byte to flip.");
})
.WithSummary("Flip one stored byte, then read the document to see which layer catches it");

app.MapDelete("/api/documents/{id}", (string id, DocumentService svc) =>
    svc.Delete(id) ? Results.NoContent() : Results.NotFound($"Document {id} not found."))
.WithSummary("Delete a document");

app.MapPost("/api/documents/compare", async (CompareRequest req, DocumentService svc) =>
{
    if ((ValidateContent(req.Content) ?? req.Stacks.Select(ValidateLayers).FirstOrDefault(e => e is not null)) is { } error)
        return Results.BadRequest(error);
    return Results.Ok(await svc.CompareAsync(req));
})
.WithSummary("Stored size of the same content under different stacks. Shows why Compression must come before Encryption.");

app.MapGet("/api/audit", (AuditLog log) => log.Entries)
.WithSummary("Calls recorded by the Audit decorator, newest first");

app.MapDelete("/api/audit", (AuditLog log) => { log.Clear(); return Results.NoContent(); })
.WithSummary("Clear the audit log");

app.Run();
