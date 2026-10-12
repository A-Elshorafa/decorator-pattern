# Decorator Pattern – Secure Document Storage (.NET 10 + React)

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

save:  511 B ─Audit─► 511 ─Compression─► 87 ─Encryption─► 115 ─Checksum─► 147 B stored
load:  147 B ─Checksum─► 115 ─Encryption─► 87 ─Compression─► 511 ─Audit─► 511 B returned
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
├── Models/                        one record/class per file
└── ClientApp/                     React + Tailwind tester (Vite)
    └── src/
        ├── App.jsx                page state and actions
        ├── api.js                 calls to the backend
        ├── styles.js              shared Tailwind class strings, layer colours
        └── components/            DocumentForm, ResultPanel, TraceFlow, CompareTable, DocumentList, AuditLog, LayerChip
```

## Run

Backend (terminal 1):

```bash
dotnet run
```

Swagger UI: http://localhost:8099/swagger

Client (terminal 2):

```bash
cd ClientApp && npm install && npm run dev
```

Client: http://localhost:8100

Vite forwards `/api` calls to the backend on port 8099, so no CORS setup is needed. Start the backend first.

## Client app

A one-page tester for the decorators:

- **Save a document**: id, content (with its byte size), and the **decorator stack**. Add layers, reorder them with ↑/↓, or remove them. The presets are *Recommended* (`Audit → Compression → Encryption → Checksum`), *Wrong order* (`Encryption → Compression`) and *Plain* (no layers). Below the stack, the nesting the factory builds is shown, e.g. `Audit(Compression(Encryption(Checksum(Storage))))`.
  - **Save** stores it through that stack.
  - **Compare stack sizes** runs the content through several stacks into throwaway storage.
- **Result**:
  - *Save / Read*: one bar per layer, showing the size after it and how much it changed. Save goes top to bottom and read goes bottom to top. Read also shows the text it got back.
  - *Compare*: stored size per stack, with a line at the original size. Bars past that line (red) mean the data grew.
  - *Raw / Corrupt*: the bytes the storage actually holds, as text and as Base64.
  - *Corrupted read*: which layer rejected the data, and why.
- **Documents**: every saved document with its stack and original → stored size, plus **Read**, **Raw**, **Corrupt** (flip one byte) and **Delete**.
- **Audit log**: what the Audit decorator recorded, including failed reads.

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

## Try it in the client

1. Click **Save** with the defaults. The bars show 511 B shrinking to 87 B at Compression, then growing to 115 B (nonce + tag) and 147 B (hash).
2. Click **Read it back**. The same layers run in reverse and the original text comes back.
3. Click **Raw** on `contract-001`. The bytes the storage holds are unreadable.
4. Click **Compare stack sizes**. `Encryption → Compression` is red, larger than no compression at all.
5. Click **Corrupt**, then **Read it now**. The read fails with "Checksum mismatch", and the audit log shows the failed load.
6. Pick the **Plain** preset, change the id to `plain`, save, corrupt and read. The changed text comes back with no error. Nothing was checking it.

## Try it in Swagger

1. `POST /api/documents` with the default body (`contract-001`, layers `Audit → Compression → Encryption → Checksum`). The `trace` shows the size after each layer: 511 → 87 → 115 → 147 bytes.
2. `GET /api/documents/contract-001` returns the original text. The trace runs in reverse, starting at `Checksum`.
3. `GET /api/documents/contract-001/raw` shows unreadable bytes. That's all the storage ever sees.
4. `POST /api/documents/compare` with the default body. `Compression → Encryption` stores about 22% of the original size. `Encryption → Compression` stores about 110%, larger than no compression at all.
5. `POST /api/documents/contract-001/corrupt`, then `GET` it again. You get **422** "Checksum mismatch", because the outermost check on load catches it first.
6. Save `{"id": "plain", "content": "hello world", "layers": []}`, corrupt it, and read it. You get **200** with garbled text, because nothing checks the data. Add `Checksum` and it's caught.
7. `GET /api/audit` lists the save, the successful load and the failed load with its error. Move `Audit` to the end of the list and it logs the stored size instead of the original size.
