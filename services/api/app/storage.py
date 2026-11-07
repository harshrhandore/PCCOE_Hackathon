"""No privileged production state is silently kept in process memory."""
import os
from contextlib import contextmanager
import psycopg
from psycopg.rows import dict_row
from .errors import AppError

@contextmanager
def database():
    url=os.environ.get('DATABASE_URL')
    if not url:raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'database'})
    try:
        with psycopg.connect(url,connect_timeout=5,row_factory=dict_row) as connection:
            with connection.transaction():yield connection
    except psycopg.Error as exc:
        raise AppError('DEPENDENCY_UNAVAILABLE',details={'dependency':'database'}) from exc

def audit(connection,actor,event,entity_id,before,after,request_id):
    from psycopg.types.json import Jsonb
    connection.execute('insert into public.audit_log(actor_id,event,entity_type,entity_id,before_state,after_state,request_id) values(%s,%s,%s,%s,%s,%s,%s)',
      (actor,event,'alert',str(entity_id),Jsonb(before) if before else None,Jsonb(after),request_id))
