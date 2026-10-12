# Decorator Pattern – Secure Document Storage (.NET 10)

## What is the Decorator pattern?

A **Decorator** wraps an object that has the **same interface** and adds behaviour before or after passing each call on to it. Because the wrapper has the same interface as the thing it wraps, decorators can wrap other decorators. You build the features you need by **stacking** them at runtime instead of writing a subclass for every combination.

Here, documents are saved to a plain byte storage. Compression, encryption, a checksum and audit logging are each a decorator. Each request chooses which layers to use and in what order. Six subclasses like `CompressedEncryptedChecksummedStorage` would be needed to cover just a few combinations; with decorators it's four small classes.

Unlike the [Proxy](../../proxy-pattern/InventoryProxy) example, which has the same shape, a decorator's job is to **add features**, and several are meant to be stacked. A proxy **controls access** to one object (caching, permissions, lazy loading).

## Structure

```
IDocumentStorage                  ◄── Component            (Storage/IDocumentStorage.cs)
 ├── InMemoryBlobStorage          ◄── Concrete Component: only stores bytes
 └── StorageDecorator             ◄── Decorator (base): holds an inner IDocumentStorage
      ├── CompressionDecorator    ◄── GZip
      ├── EncryptionDecorator     ◄── AES-256-GCM
      ├── ChecksumDecorator       ◄── SHA-256, verified on load
      └── AuditDecorator          ◄── logs calls, doesn't change the bytes

StorageStackFactory               ◄── wraps the storage in the requested layers
DocumentService                   ◄── Client: only calls SaveAsync/LoadAsync
```

With `layers: ["Audit", "Compression", "Encryption", "Checksum"]` the stack is:

```
Audit( Compression( Encryption( Checksum( InMemoryBlobStorage ) ) ) )

save:  512 B ─Audit─► 512 ─Compression─► 87 ─Encryption─► 115 ─Checksum─► 147 B stored
load:  147 B ─Checksum─► 115 ─Encryption─► 87 ─Compression─► 512 ─Audit─► 512 B returned
```

- **Save** runs the layers in the order listed. **Load** runs them in reverse, so each layer undoes its own change.
- `StorageDecorator` does the delegation and the tracing. A concrete decorator only overrides `Encode`/`Decode`, except `AuditDecorator`, which overrides `SaveAsync`/`LoadAsync` to time the whole call underneath it.
- **Order matters.** Encrypted bytes look random and don't compress, so `Compression` must come before `Encryption`. `POST /api/documents/compare` shows the difference.
- The layers used to save a document are kept in its catalog entry, so it's read back through the same stack. This is like a `Content-Encoding` header.
- The encryption key is generated at startup. Documents are kept in memory, so they're gone on restart anyway.

## Project layout

```
DocumentStorageDecorator/
├── Program.cs                     endpoints, validation, DI
├── Storage/                       Component, Concrete Component, Decorators, factory, audit log
├── Services/DocumentService.cs    Client: save / read / raw / corrupt / compare
└── Models/                        one record/class per file
```

## Run

```bash
dotnet run
```

Swagger UI: http://localhost:8099/swagger

## Endpoints

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/layers` | The decorators you can stack |
| POST | `/api/documents` | Save through the listed layers. Returns the per-layer trace |
| GET | `/api/documents` | List documents and the stack each was saved with |
| GET | `/api/documents/{id}` | Read back through the same stack in reverse (422 if corrupted) |
| GET | `/api/documents/{id}/raw` | The bytes the underlying storage holds, with no decorators |
| POST | `/api/documents/{id}/corrupt` | Flip one stored byte |
| DELETE | `/api/documents/{id}` | Delete a document |
| POST | `/api/documents/compare` | Stored size of the same content under different stacks |
| GET | `/api/audit` | What the Audit decorator recorded, newest first |
| DELETE | `/api/audit` | Clear the audit log |

## Try it in Swagger

1. `POST /api/documents` with the default body (`contract-001`, layers `Audit → Compression → Encryption → Checksum`). The `trace` shows the size after each layer: 512 → 87 → 115 → 147 bytes.
2. `GET /api/documents/contract-001` returns the original text. The trace runs in reverse, starting at `Checksum`.
3. `GET /api/documents/contract-001/raw` shows unreadable bytes. That's all the storage ever sees.
4. `POST /api/documents/compare` with the default body. `Compression → Encryption` stores about 22% of the original size. `Encryption → Compression` stores about 110%, larger than no compression at all.
5. `POST /api/documents/contract-001/corrupt`, then `GET` it again. You get **422** "Checksum mismatch", because the outermost check on load catches it first.
6. Save `{"id": "plain", "content": "hello world", "layers": []}`, corrupt it, and read it. You get **200** with garbled text, because nothing checks the data. Add `Checksum` and it's caught.
7. `GET /api/audit` lists the save, the successful load and the failed load with its error. Move `Audit` to the end of the list and it logs the stored size instead of the original size.
