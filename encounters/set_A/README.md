# Encounter Set A

A researcher-curated, text-based exploratory sequence. The order reflects the
researcher's choice; it is not randomized, counterbalanced, or justified as a
causal ordering. No order-effect conclusion follows from running this sequence alone.

## Sequence and sources

| Order | Material | Author | Distribution | Source |
| --- | --- | --- | --- | --- |
| E1 | Frankenstein | Mary Shelley | Bundled | [Project Gutenberg #84](https://www.gutenberg.org/ebooks/84) |
| E2 | An Alien Mind | Jakub Pachocki | Referenced | [OpenAI article](https://openai.com/index/an-alien-mind/) |
| E3 | Hamlet | William Shakespeare | Bundled | [Project Gutenberg #1524](https://www.gutenberg.org/ebooks/1524) |
| E4 | Depression lecture transcript | Robert Sapolsky | Referenced | [Stanford's updated lecture](https://www.youtube.com/watch?v=fzUXcBTQXKM) |
| E5 | 当陪伴不再承诺永恒：Companion AI 的记忆伦理 | Jingwen Qiu | Bundled | [Author's blog](https://glimpse-of-eurydice.github.io/2026/03/31/companion-ai-memory-ethics.html) |

[sources.yaml](sources.yaml) is both the public source inventory and the constrained
input read by the Set A v0.1 runner. It records exact local paths, source
identification, rights notes, file sizes, and SHA-256 checksums. Existing filenames
are preserved, including `Frankstein.txt`. Paths in the inventory are relative to
this directory.

## Local preparation and distribution

`Bundled/` contains materials selected for inclusion in the repository. This does
not place them under the code license: public-domain source editions, Project
Gutenberg's distribution terms, author-owned prose, and third-party quotations
must retain their respective notices and rights. This inventory grants no new
blanket license to the blog or its quoted material.

`Referenced/` holds local material excluded from Git. Obtain any permitted local
copies according to the source terms and place them at the paths in the inventory.
Only metadata is published for these sources; a source URL is not permission to
redistribute its contents. Do not commit referenced text through exported traces,
prompt dumps, reports, or copied fixtures either.

The recorded hashes identify the files currently supplied by the researcher, not
the original remote files or final model inputs. Web-page copying, caption versions,
line endings, and text cleanup can change them. The original extraction procedures
are not yet recorded, so byte-identical reconstruction from URLs alone is not
currently guaranteed. A mismatch requires review rather than silent substitution.

## Transcript identification

The local transcript introduces itself as an update to an earlier depression
lecture and contains timestamps through 2:10:49. Stanford's candidate video above
is described as a 2023 update and was published on 2024-03-13. The researcher confirmed this updated lecture on 2026-09-14; this is not a verified full-text match. The previously suggested
[older lecture](https://www.youtube.com/watch?v=NOAgplgTxfc&t=395s) is recorded in
the inventory for provenance; its 06:35 link offset is not a selected range for
this transcript. Caption origin and completeness remain to be confirmed.

## Set A v0.1 input contract

The first run froze the five-item order and used each complete UTF-8 file without
excerpting, caption cleanup, or front-matter removal. Before any model call, the
runner resolves each relative path inside this directory and verifies the recorded
checksum. Missing or changed inputs stop the run. The complete encounter prompt has
a separate run-local checksum. Supplying a complete file is not a claim that the
model attended equally to every line.

The inventory deliberately supports only the generated JSON-scalar subset used
here, rather than arbitrary YAML. A future excerpted or preprocessed condition must
receive a new protocol version, selection boundary, and checksum instead of silently
replacing these inputs.

Keep probe questions, expected answers, and scoring instructions outside the
encounter input. A future runner should validate required files and checksums
before starting, and explicitly report missing referenced material rather than
silently dropping an encounter.
