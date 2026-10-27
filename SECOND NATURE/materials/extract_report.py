"""Extract original data from SECOND NATURE PDF reports, using Python's stdlib.

This deliberately reads only this app's documented PDF layout, not arbitrary PDFs.
It never executes an attachment. Original UTF-8 bytes are written unchanged.
Usage: python materials/extract_report.py report.pdf --output materials/P01
"""
import argparse
import re
from pathlib import Path


def extract_report(source, output):
    data = Path(source).read_bytes()
    if not data.startswith(b'%PDF-1.7\n%SECOND-NATURE-REPORT-1\n'):
        raise ValueError('Expected an original SECOND NATURE report PDF.')
    destination = Path(output).resolve()
    # Filenames in our reports are fixed ASCII basenames, never directory paths.
    specs = re.findall(rb'/Type /Filespec /F \(([^()\\]+)\) /UF \([^()\\]+\) /EF << /F (\d+) 0 R >>', data)
    if not specs:
        raise ValueError('No original data attachments were found.')
    pending = []
    for raw_name, reference in specs:
        name = raw_name.decode('ascii')
        if not re.fullmatch(r'[A-Za-z0-9_-]+\.(json|csv|py|txt)', name):
            raise ValueError('Unsupported attachment filename.')
        target = (destination / name).resolve()
        if target.parent != destination:
            raise ValueError('Attachment is outside the requested output folder.')
        start = re.search(rb'(?:^|\n)' + reference + rb' 0 obj\n', data)
        if not start:
            raise ValueError('Missing attachment object.')
        stream = data.find(b'\nstream\n', start.end())
        header = data[start.end():stream]
        length = re.search(rb'/Length (\d+)', header)
        if stream < 0 or b'/Type /EmbeddedFile' not in header or b'/ASCIIHexDecode' not in header or not length:
            raise ValueError('Unsupported attachment encoding.')
        encoded = data[stream + 8:stream + 8 + int(length[1])]
        if not encoded.endswith(b'>'):
            raise ValueError('Truncated attachment.')
        original = bytes.fromhex(encoded[:-1].decode('ascii'))
        size = re.search(rb'/Size (\d+)', header)
        if not size or len(original) != int(size[1]):
            raise ValueError('Attachment size mismatch.')
        pending.append((target, original))
    # Validate everything and refuse to overwrite differing research records.
    for target, original in pending:
        if target.exists() and target.read_bytes() != original:
            raise FileExistsError(f'Refusing to replace existing data: {target.name}')
    destination.mkdir(parents=True, exist_ok=True)
    for target, original in pending:
        target.write_bytes(original)
    return [target for target, _ in pending]


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    for path in extract_report(args.report, args.output):
        print(path.name)
