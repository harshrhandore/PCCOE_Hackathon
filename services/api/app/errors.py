class AppError(Exception):
    def __init__(self,code,status=503,message_key='state.waking',details=None,retryable=False):
        self.code=code;self.status=status;self.message_key=message_key;self.details=details or {};self.retryable=retryable
