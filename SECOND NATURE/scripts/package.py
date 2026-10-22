"""Package this standalone project without dependency links or test records."""
import pathlib
import sys
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
output = pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else root.parent/'OneDayLessWaste.zip'
skip = {'node_modules', '.cache', '__pycache__', '.git', '.openai'}
files = [p for p in root.rglob('*') if p.is_file() and not any(part in skip for part in p.relative_to(root).parts)]
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for path in files:
        archive.write(path, pathlib.Path('OneDayLessWaste')/path.relative_to(root))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    names = set(archive.namelist())
    assert 'OneDayLessWaste/Start.cmd' in names
    assert 'OneDayLessWaste/dist/index.html' in names
    assert 'OneDayLessWaste/dist/models/hand_landmarker.task' in names
    assert 'OneDayLessWaste/dist/mediapipe/hand-tracking-worker.js' in names
    assert 'OneDayLessWaste/README.md' in names
    assert all(f'OneDayLessWaste/dist/art/S{i:02}.svg' in names for i in range(1,17))
print(str(output))
print(f'{output.stat().st_size/1024/1024:.2f} MiB; {len(files)} files; ZIP integrity checked.')
