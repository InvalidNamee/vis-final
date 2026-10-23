"""Build all five source folders with the original importer contract."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from build_drilling_rop import ADAPTER

ROOT = Path(__file__).resolve().parents[1]

def build(package_name='drilling-rop-case'):
    package = ROOT / package_name
    manifest = json.loads((package / 'case.json').read_text(encoding='utf-8'))
    files = [dict(name=p.relative_to(package).as_posix(), size=p.stat().st_size,
                  enc='text', data=p.read_text(encoding='utf-8'))
             for p in sorted((package / 'demo').rglob('*')) if p.is_file()]
    payload = json.dumps(dict(manifest=manifest, files=files), ensure_ascii=False, separators=(',', ':'))
    adapter = ADAPTER.replace('__PACKAGE__', package_name).replace('__PAYLOAD__', payload)
    (ROOT / 'assets/cases' / (manifest['id'] + '.case.js')).write_text(adapter, encoding='utf-8')
    dist = ROOT / '.dist'
    dist.mkdir(exist_ok=True)
    with ZipFile(dist / (package_name + '.zip'), 'w', ZIP_DEFLATED) as archive:
        for p in sorted(package.rglob('*')):
            if p.is_file() and p.name != '.DS_Store':
                archive.write(p, p.relative_to(ROOT))
    print('Built ' + package_name)

if __name__ == '__main__':
    for key in ['rop', 'warning', 'trajectory', 'failure', 'fluid']:
        build('drilling-' + key + '-case')
