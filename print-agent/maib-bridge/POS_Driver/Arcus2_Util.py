# -*- coding: utf-8 -*-
# Created by Nicolae Gaidarji at 02.12.2021


# Arcus2 Operation code:
PURCHASE        = 1
REFUND          = 2
CASHER_MENU     = 13
ADMIN_MENU      = 99
CLOSE_BATCH     = 7
XJURNAL         = 111
XREPORT         = 6
PRINT_CHEQ_NO   = 112
PRINT_CHEQ_LAST = 113
VERIFY_CONN     = 110
UNIVERSAL_CLOSE = 4


# Key list
AMOUNT          = b'amount'
CURRENCY        = b'currency'
RRN             = b'rrn'
SLIP            = b'slip'
TERMINAL_ID     = b'terminal_id'
RESPONSE_CODE   = b'response_code'

# DLL includes
ARCCOM = 'arccom.dll'
ITPOS  = 'itpos.dll'
