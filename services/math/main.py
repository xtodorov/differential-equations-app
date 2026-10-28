"""Bounded expression grammar; never eval/parse_expr untrusted student input."""
import ast
import threading
import multiprocessing
import sympy as s
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title='MathForge symbolic validator')
slots = threading.BoundedSemaphore(4)
x, y = s.symbols('x y', real=True)
FUNCTIONS = {'exp': s.exp, 'sin': s.sin, 'cos': s.cos, 'tan': s.tan, 'log': s.log, 'sqrt': s.sqrt, 'abs': s.Abs}
SYMBOLS = {'x': x, 'y': y, 'pi': s.pi, 'E': s.E}

def expression(text: str):
    if len(text) > 256:
        raise ValueError('Изразът е твърде дълъг.')
    tree = ast.parse(text.replace('^', '**'), mode='eval')
    if sum(1 for _ in ast.walk(tree)) > 80:
        raise ValueError('Изразът е твърде сложен.')
    def visit(node, depth=0):
        if depth > 16:
            raise ValueError('Твърде дълбоко влагане.')
        if isinstance(node, ast.Expression): return visit(node.body, depth+1)
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            if abs(node.value) > 1000000: raise ValueError('Твърде голямо число.')
            return s.Rational(str(node.value))
        if isinstance(node, ast.Name) and node.id in SYMBOLS: return SYMBOLS[node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            v = visit(node.operand, depth+1)
            return -v if isinstance(node.op, ast.USub) else v
        if isinstance(node, ast.BinOp):
            a, b = visit(node.left, depth+1), visit(node.right, depth+1)
            if isinstance(node.op, ast.Add): return s.Add(a,b,evaluate=False)
            if isinstance(node.op, ast.Sub): return s.Add(a,-b,evaluate=False)
            if isinstance(node.op, ast.Mult): return s.Mul(a,b,evaluate=False)
            if isinstance(node.op, ast.Div):
                if s.simplify(b) == 0: raise ValueError('Деление на нула.')
                return s.Mul(a,s.Pow(b,-1,evaluate=False),evaluate=False)
            if isinstance(node.op, ast.Pow):
                # Limit numerical exponents, including nested powers, before constructing.
                if b.is_number and (b.is_real is not True or abs(b) > 20): raise ValueError('Степента е извън учебния диапазон.')
                if not b.is_number and b.count_ops() > 8: raise ValueError('Сложен показател.')
                return s.Pow(a,b,evaluate=False)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in FUNCTIONS and len(node.args)==1 and not node.keywords:
            return FUNCTIONS[node.func.id](visit(node.args[0], depth+1), evaluate=False)
        raise ValueError('Използвай числа, x, y, +, -, *, /, ^ и поддържаните функции.')
    value = visit(tree)
    if value.has(s.zoo, s.nan, s.oo, -s.oo) or value.count_ops() > 60:
        raise ValueError('Недопустим или твърде сложен израз.')
    return value

def verify(payload):
    candidate, expected = expression(payload['answer']), expression(payload['expected'])
    # This MVP accepts only expressions with matching real domains. In particular,
    # cancellation must not turn a punctured domain into all real numbers.
    for symbol in candidate.free_symbols | expected.free_symbols:
        a = s.calculus.util.continuous_domain(candidate, symbol, s.S.Reals)
        b = s.calculus.util.continuous_domain(expected, symbol, s.S.Reals)
        if a != b:
            return {'correct': False, 'message': 'Областта на дефиниция се различава. Провери знаменателите и ограниченията.'}
    correct = s.simplify(candidate-expected) == 0
    return {'correct': bool(correct), 'message': 'Вярно! Изразите са символно еквивалентни.' if correct else 'Още не е вярно. Провери правилото и опитай отново.'}

def verify_worker(pipe, payload):
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
        resource.setrlimit(resource.RLIMIT_AS, (512*1024*1024, 512*1024*1024))
        pipe.send(('ok', verify(payload)))
    except (ValueError, SyntaxError, TypeError, NotImplementedError) as exc:
        pipe.send(('error', str(exc)))
    except Exception:
        pipe.send(('error', 'Този израз не се поддържа.'))
    finally:
        pipe.close()

class Check(BaseModel):
    answer: str = Field(min_length=1, max_length=256)
    expected: str = Field(min_length=1, max_length=256)

@app.get('/health')
def health(): return {'status':'ok', 'engine':'SymPy', 'version':s.__version__}

@app.post('/verify')
def check(body: Check):
    # One isolated process per bounded request; kill it on timeout, do not leave
    # symbolic work running in the API worker after the HTTP request ends.
    if not slots.acquire(blocking=False):
        raise HTTPException(503, 'Проверката е заета. Опитай след малко.')
    context = multiprocessing.get_context('spawn')
    parent, child = context.Pipe(duplex=False)
    process = context.Process(target=verify_worker, args=(child, body.model_dump()))
    process.start()
    child.close()
    try:
        if not parent.poll(3):
            raise HTTPException(422, 'Проверката е твърде сложна. Опрости израза.')
        try: status, result = parent.recv()
        except EOFError: raise HTTPException(422, 'Изчислителният лимит е достигнат.')
        if status == 'error': raise HTTPException(422, result)
        return result
    finally:
        if process.is_alive(): process.terminate()
        process.join(timeout=1)
        parent.close()
        slots.release()
