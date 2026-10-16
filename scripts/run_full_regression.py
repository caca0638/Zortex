# -*- coding: utf-8 -*-
"""
scripts/run_full_regression.py

Executes the automated regression gate (sim_gate.py) across all 10 waves.
Zero hardcoded paths or missing dependencies.
"""

import sys
import os
import subprocess

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sim_gate_script = os.path.join(script_dir, "sim_gate.py")
    
    print(f"[*] Invoking ZORTEX regression gate: {sim_gate_script}")
    result = subprocess.run([sys.executable, sim_gate_script])
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
