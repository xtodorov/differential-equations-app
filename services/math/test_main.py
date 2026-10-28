import pytest
from fastapi.testclient import TestClient
from main import app, expression, verify
client=TestClient(app)
@pytest.mark.parametrize('answer,expected',[
 ('6*exp(x*2)/2','3*exp(2*x)'), ('1/4+1/2','3/4'), ('x+x','2*x'),
 ('sin(x)^2+cos(x)^2','1'), ('2*exp(-x)-exp(-2*x)','2*exp(-x)-exp(-2*x)'),
 ('20+60*exp(-0.1*x)','20+60*exp(-x/10)'), ('sqrt(x^2)','abs(x)')
])
def test_equivalence(answer,expected): assert verify({'answer':answer,'expected':expected})['correct']
@pytest.mark.parametrize('answer,expected',[('exp(2*x)','3*exp(2*x)'),('sqrt(x^2)','x'),('x/x','1'),('(x^2-1)/(x-1)','x+1')])
def test_wrong_or_domain_mismatch(answer,expected): assert not verify({'answer':answer,'expected':expected})['correct']
@pytest.mark.parametrize('text',['__import__("os").system("id")','x.__class__','[1,2]','lambda:1','2**100000','1/0','x[0]','open("file")','True'])
def test_unsafe(text):
 with pytest.raises((ValueError,SyntaxError,TypeError)): expression(text)
def test_health(): assert client.get('/health').json()['engine']=='SymPy'
def test_endpoint():
 r=client.post('/verify',json={'answer':'6*exp(2*x)/2','expected':'3*exp(2*x)'})
 assert r.status_code==200 and r.json()['correct']
def test_endpoint_rejects_unsafe(): assert client.post('/verify',json={'answer':'__import__("os")','expected':'1'}).status_code==422

@pytest.mark.parametrize('solution,k,initial',[
 ('3*exp(2*x)',2,3),('2*exp(-x)',-1,2),('0',3,0),('5*exp(-2*x)',-2,5),('exp(2*x)',2,1)
])
def test_ode_solutions_satisfy_equation_and_initial_value(solution,k,initial):
 import sympy as s
 from main import x
 value=expression(solution)
 assert s.simplify(s.diff(value,x)-k*value)==0
 assert s.simplify(value.subs(x,0)-initial)==0

@pytest.mark.parametrize('solution,a,b,y0,v0',[
 ('2*exp(-x)-exp(-2*x)',3,2,1,0),('exp(x)',0,-1,1,1),
 ('cos(2*x)',0,4,1,0),('x*exp(-x)',2,1,0,1),('sin(x)',0,1,0,1)
])
def test_second_order_solutions(solution,a,b,y0,v0):
 import sympy as s
 from main import x
 value=expression(solution)
 assert s.simplify(s.diff(value,x,2)+a*s.diff(value,x)+b*value)==0
 assert value.subs(x,0)==y0
 assert s.diff(value,x).subs(x,0)==v0

def test_cooling_model():
 import sympy as s
 from main import x
 value=expression('20+60*exp(-x/10)')
 assert s.simplify(s.diff(value,x)+(value-20)/10)==0
 assert value.subs(x,0)==80
 assert s.limit(value,x,s.oo)==20
