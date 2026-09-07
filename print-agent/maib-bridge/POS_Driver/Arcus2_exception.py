# -*- coding: utf-8 -*-
# Created by Nicolae Gaidarji at 02.12.2021
# define Python user-defined exceptions
class Error(Exception):
    """Base class for other exceptions"""
    pass


class arcus_set_err(Error):
    def __init__(self, exc):
        raise ValueError('Error set value: ArcusSet')


class op_code_not_found(Error):
    def __init__(self, exc):
        raise ValueError('Code operation not found')

