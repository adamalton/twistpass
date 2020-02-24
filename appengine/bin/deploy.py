#!/usr/bin/env python3

import subprocess
import sys

if sys.version.startswith("2."):
    raise Exception(
        "This script is written for python 3, not python 2. "
        "It could easily be adapted (just the subprocess bit needs changing), "
        "I just haven't done it yet."
    )

NEXT_VERSION = "9"

print("Let's deploy project 'swappass-dot-com'...")
promote = input("Route traffic to this deployment? [Y/n] ")
promote = promote.lower() not in ("n", "no")
version = input("What App Engine version do you want to give this deployment? [%s]" % NEXT_VERSION)
version = version or NEXT_VERSION

command = [
    "gcloud",
    "app",
    "deploy",
    "--project",
    "swappass-dot-com",
    "--version",
    version,
    "" if promote else "--no-promote",
    "app.yaml"
]

command = [x for x in command if x]  # Remove empty value if not --no-promote

process = subprocess.run(command)
