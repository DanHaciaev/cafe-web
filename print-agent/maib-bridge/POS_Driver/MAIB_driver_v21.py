# -*- coding: utf-8 -*-
# Created by Nicolae Gaidarji at 02.12.2021
import csv
import os
import logging
import ctypes
import sys

from CONSTANT import *
from .Arcus2_Util import *
from .Arcus2_exception import *
from func_timeout import func_timeout, FunctionTimedOut


logger = logging.getLogger(__name__)


class Arcus2Lib:
    def __init__(self, p_current_path):
        logger.info('Init Arcus2 module')
        # p_current_path = r"C:\\Arcus2\\DLL\\"
        v_dll_file = f'{p_current_path}\\{ARCCOM}'
        # v_dll_file = f'\\{ARCCOM}'
        logger.info(f'DLL file: {v_dll_file}')
        self.value_time_out = 55
        try:
            ctypes.windll.kernel32.SetDllDirectoryW(None)
            # os.chdir(f'{p_current_path}\\')
            self.lib = ctypes.WinDLL(v_dll_file)
            # lib = ctypes.WinDLL('C:\\Arcus2\\DLL\\arccom.dll')
        except Exception as err_f:
            logger.error('Eroare la importarea DLL')
            logger.error(err_f)
        else:
            self.ArcusDelete = self.lib.DeleteITPos
            self.ArcusCreate = self.lib.CreateITPos
            self.ArcusSet = self.lib.ITPosSet
            self.ArcusGet = self.lib.ITPosGet
            self.ArcusRun = self.lib.ITPosRun
            self.ArcusRunCmd = self.lib.ITPosRunCmd
            self.ArcusClear = self.lib.ITPosClear

            # self.pos_obj = self.ArcusCreate()
            self.pos_obj = None
            self.create_object()
            logger.info(f'self.pos_obj {self.pos_obj}')

    def create_object(self):
        if self.pos_obj is None:
            self.pos_obj = self.ArcusCreate()

        print('='*100)
        print(self.pos_obj)

    def delete_object(self):
        logger.info('delete_object Arcus')
        self.ArcusDelete(self.pos_obj)

    def get_key_value(self, p_key):
        # self.init_obj()
        logger.info(f'Get key [{p_key}] values')
        v_size = self.ArcusGet(self.pos_obj, p_key, None, -1)
        v_size = v_size+1
        v_key = ctypes.c_buffer(v_size + 1)
        self.ArcusGet(self.pos_obj, p_key, v_key, v_size + 1)
        logger.info(f'Key value func. {v_key.value.decode()}')

        return v_key.value.decode()

    def purchase(self, p_sum, p_currency=b'498'):
        if p_currency == -1:
            p_currency = b'498'

        # v_sum = str(p_sum).encode()
        v_sum = bytes(str(p_sum), 'utf-8')
        v_currency = str(p_currency).encode()
        res_set = self.ArcusSet(self.pos_obj, AMOUNT, v_sum, -1)
        logger.info(f'Set ammount Arcus: {res_set}, suma: {v_sum} - type val sum: {type(v_sum)}, Key: {AMOUNT}')
        if res_set != 0:
            raise arcus_set_err

        res_set = self.ArcusSet(self.pos_obj, CURRENCY, v_currency, -1)
        logger.info(f'Set currency Arcus: {res_set}, currency: {v_currency}, Key: {AMOUNT}')
        if res_set != 0:
            raise arcus_set_err

        v_result_code = self.ArcusRun(self.pos_obj, PURCHASE)
        v_slip = self.get_key_value(SLIP)

        v_result = f'{v_result_code} \n {v_slip}'
        logger.info(f'result: {v_result}')
        return v_result

    def run_operation(self, p_operation):
        logger.info(f'Run oparation [{p_operation}]')
        logger.info(f'pos_obj [{self.pos_obj}]')

        try:
            v_result_code = self.ArcusRun(self.pos_obj, p_operation)
            v_slip = None
        except Exception as e:
            v_result_code = '606'
            # v_slip = e
            logger.error(f"Error running operation: {e}")

        v_slip = None
        # v_result_code = self.ArcusRun(self.pos_obj, p_operation)
        # v_slip = self.get_key_value(SLIP)

        v_result = f'{v_result_code} \n {v_slip}'
        logger.info(f'result: {v_result}')
        return v_result

    def refund(self):
        logger.info(f'run func')
        return self.run_operation(REFUND)

    def casher_menu(self):
        logger.info(f'run func')
        return self.run_operation(CASHER_MENU)

    def admin_menu(self):
        logger.info(f'run func')
        return self.run_operation(ADMIN_MENU)

    def close_batch(self):
        logger.info(f'run func')
        return self.run_operation(CLOSE_BATCH)

    def xjurnal(self):
        logger.info(f'run func')
        return self.run_operation(XJURNAL)

    def xreport(self):
        logger.info(f'run func')
        return self.run_operation(XREPORT)

    def print_cheq_no(self):
        logger.info(f'run func')
        return self.run_operation(PRINT_CHEQ_NO)

    def print_cheq_last(self):
        logger.info(f'run func')
        return self.run_operation(PRINT_CHEQ_LAST)

    def verify_conn(self):
        logger.info(f'run func')
        return self.run_operation(VERIFY_CONN)

    def universal_close(self):
        logger.info(f'run func')
        return self.run_operation(UNIVERSAL_CLOSE)

    def close_conn(self):
        logger.info(f'Clear object')
        self.ArcusClear(self.pos_obj)

    @staticmethod
    def processes_code(code):
        logger.info('[code]: ' + str(code))
        res = []
        code = code.split('\n')
        for row in code:
            row = str(row)
            item = row.find(',')
            if item == -1:
                line = {
                    'comand': row[0:],
                    'param': ''
                }
            else:
                line = {
                    'comand': row[0:item],
                    'param': row[item + 1:]
                }
            res.append(line)

        logger.info('Return: ' + str(res))
        return res

    def operation_parse(self, p_code, p_params):
        logger.info(f'param, code: [{p_code}]; params: [{p_params}]')
        if p_code == 1:
            v_amount = int(p_params[0:p_params.find(',')])  # / 100
            v_currency = p_params[p_params.find(',') + 1:]
            if v_currency == '':
                v_currency = -1
            self.purchase(v_amount, v_currency)
        elif p_code == 2:
            self.refund()
        elif p_code == 4:
            self.universal_close()
        elif p_code == 6:
            self.xreport()
        elif p_code == 7:
            self.close_batch()
        elif p_code == 13:
            self.casher_menu()
        elif p_code == 99:
            self.admin_menu()
        elif p_code == 103:
            self.print_cheq_last()
        elif p_code == 110:
            self.verify_conn()
        elif p_code == 111:
            self.xjurnal()
        elif p_code == 112:
            self.print_cheq_no()
        elif p_code == 212:
            # self.cheq_out()
            pass
        else:
            raise op_code_not_found

        transaction_id = 1 if self.get_key_value(RRN) == b'' else self.get_key_value(RRN)
        rcpt = 1 if self.get_key_value(SLIP) == b'' else self.get_key_value(SLIP)
        rcpt = '-1' if rcpt is None or rcpt == '' else rcpt

        result = 'RespCode={res3}\nTransactionID={transaction_id}\nTerminalID={terminal_id}\nRespMSG={RespMSG}\nRCPT={RCPT}' \
            .format(res3=self.get_key_value(RESPONSE_CODE), transaction_id=transaction_id
                    , terminal_id=self.get_key_value(TERMINAL_ID), RespMSG=ListERR[self.get_key_value(RESPONSE_CODE)]
                    , RCPT=rcpt) 

        logger.info(f'Return: {result}')
        # self.ArcusDelete(self.pos_obj)
        return result

    def pos_operation(self, p_code):
        logger.info(f'Param: code:[{p_code}]')
        result = ''
        p_code = self.processes_code(p_code)

        self.create_object()
        # for row in p_code:
        try:
            # result += func_timeout(self.value_time_out, self.operation_parse, args=(int(row['comand']), str(row['param']))) + '\n'
            result = func_timeout(self.value_time_out, self.operation_parse, args=(int(p_code[0]['comand']), str(p_code[0]['param']))) + '\n'
        except FunctionTimedOut as err:
            # self.delete_object()
            # self.close_conn()
            result = 'RespCode={res3}\nTransactionID={transaction_id}\nTerminalID={terminal_id}' \
                     '\nRespMSG={RespMSG}\nRCPT={RCPT}' \
                    .format(res3='603', transaction_id=-1, terminal_id=-1,
                            RespMSG=ListERR['603'], RCPT=err)
        print('-'*100)
        print(self.ArcusDelete)
        if self.ArcusDelete is not None and self.pos_obj is not None:
            self.close_conn()
            self.delete_object()
        print(self.pos_obj)
        logger.info(f'Return: {result}')
        return result

