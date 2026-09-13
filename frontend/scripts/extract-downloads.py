"""Extract per-book download counts from the Project Gutenberg RDF feed.

Usage: python scripts/extract-downloads.py <rdf-files.tar.bz2> <out.json>

The feed is published at https://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2
and is the sanctioned way to read catalog metadata in bulk.
"""
import json
import re
import sys
import tarfile

DOWNLOADS = re.compile(rb"<pgterms:downloads[^>]*>(\d+)</pgterms:downloads>")
PATH_ID = re.compile(r"pg(\d+)\.rdf$")


def main(src: str, dst: str) -> None:
    counts = {}
    with tarfile.open(src, "r|bz2") as tar:
        for member in tar:
            match = PATH_ID.search(member.name)
            if not match or not member.isfile():
                continue
            handle = tar.extractfile(member)
            if handle is None:
                continue
            hit = DOWNLOADS.search(handle.read())
            if hit:
                counts[int(match.group(1))] = int(hit.group(1))

    with open(dst, "w", encoding="utf-8") as out:
        json.dump(counts, out, separators=(",", ":"))
    print(f"wrote {len(counts)} download counts to {dst}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
