# -*- coding: utf-8 -*-
# Minimal 32-bit bridge to the vendor's own POS_Driver/MAIB_driver_v21.py
# (Arcus2Lib) — copied here verbatim, unmodified, alongside its own direct
# dependencies (CONSTANT.py, Arcus2_Util.py, Arcus2_exception.py) and the
# real arccom.dll. No new protocol logic lives here: this just wraps their
# existing pos_operation(code) call (same "opcode,params" string format
# their own Server_POSTerminal2.py already fed it, e.g. "1,100,498" for a
# purchase) in a stdin/stdout JSON-line loop.
#
# Why a separate process at all: arccom.dll is a 32-bit-only DLL (checked
# its PE header directly), but print-agent itself runs as a 64-bit Node
# process — a 64-bit process can never load a 32-bit DLL, in any language.
# This has to be a separate 32-bit process print-agent talks to; that's a
# hard Windows constraint, not a design choice.
import sys
import os
import types
import json

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# CONSTANT.py does `import wx` only for a few module-level wx.Colour(...)
# calls in an unrelated UI-color class (never touched by Arcus2Lib) — stub
# it out so this bridge doesn't need the real wxPython package installed
# for a GUI it never shows.
_fake_wx = types.ModuleType('wx')
_fake_wx.Colour = lambda *a, **k: None
sys.modules['wx'] = _fake_wx

from POS_Driver.MAIB_driver_v21 import Arcus2Lib  # noqa: E402


def main():
    sys.stdout.write(json.dumps({'ready': True}) + '\n')
    sys.stdout.flush()
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            code = req['code']  # e.g. "1,100,498" — opcode,amount,currency (same format the vendor's own orchestrator used)
            # A FRESH Arcus2Lib per request, not one shared across the whole
            # bridge process lifetime — their own pos_operation() (see
            # POS_Driver/MAIB_driver_v21.py, unmodified) calls ArcusDelete()
            # on the pos_obj handle at the end of every operation but never
            # clears self.pos_obj afterwards, so a second call on a reused
            # instance hands arccom.dll an already-freed handle straight
            # into ITPosSet/ITPosRun — confirmed on real hardware: the first
            # charge on a fresh process completes normally (a genuine
            # decline came back from the terminal), the second one crashes
            # with a native access violation. A brand new Arcus2Lib object
            # starts with pos_obj = None, so create_object() allocates a
            # real fresh handle every time — same state a first-ever call
            # already gets, just repeated per request instead of once.
            maib = Arcus2Lib(HERE)  # p_current_path — folder arccom.dll lives in, copied alongside this script
            result = maib.pos_operation(code)
            sys.stdout.write(json.dumps({'ok': True, 'result': result}) + '\n')
        except Exception as e:
            sys.stdout.write(json.dumps({'ok': False, 'error': str(e)}) + '\n')
        sys.stdout.flush()


if __name__ == '__main__':
    main()
