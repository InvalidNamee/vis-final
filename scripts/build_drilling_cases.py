"""Validate source plugins; create distribution ZIPs only with explicit --zip."""
import argparse
import json
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
ROOT = Path(__file__).resolve().parents[1]

def build(package_name='drilling-rop-case', *, make_zip=False):
    key = package_name.removesuffix('-case')
    packages = list((ROOT / 'plugins' / 'drilling').glob('*/' + key))
    if len(packages) != 1:
        raise ValueError('Unknown drilling package: ' + package_name)
    package = packages[0]
    manifest = json.loads((package / 'case.json').read_text(encoding='utf-8'))
    if not (package / manifest['tabs']['demo']['html']).is_file():
        raise ValueError('Missing demo HTML')
    if make_zip:
        dist = ROOT / '.dist'
        dist.mkdir(exist_ok=True)
        with ZipFile(dist / (key + '-case.zip'), 'w', ZIP_DEFLATED) as archive:
            for p in sorted(package.rglob('*')):
                if p.is_file() and p.name != '.DS_Store':
                    archive.write(p, Path(key + '-case') / p.relative_to(package))
    print('Validated ' + str(package.relative_to(ROOT)) + (' (ZIP requested)' if make_zip else ' (Vite reads source directly; no ZIP)'))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', action='store_true', help='Create ZIPs only when the user requests distribution')
    args = parser.parse_args()
    subprocess.run(['node', str(ROOT / 'scripts/check_plugins.cjs')], cwd=ROOT, check=True)
    for key in ['rop', 'warning', 'trajectory', 'failure', 'fluid']:
        build('drilling-' + key + '-case', make_zip=args.zip)
