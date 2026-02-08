"""Pytest configuration and shared fixtures."""
import sys
from pathlib import Path

# Add project root so "from src..." works
root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))
