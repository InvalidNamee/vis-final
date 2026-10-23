"""Backward-compatible ROP validation and optional distribution entry point."""
import argparse
from build_drilling_cases import build
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', action='store_true', help='Create ZIP only when the user requests distribution')
    args = parser.parse_args()
    build(make_zip=args.zip)
