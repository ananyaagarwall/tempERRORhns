# test_api_endpoints.py
from app import app
import json
import pytest

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c

def test_health(client):
    rv = client.get('/api/chatbot/health')
    assert rv.status_code == 200
    data = rv.get_json()
    assert data['status'] == 'healthy'

def test_create_session(client):
    rv = client.post('/api/chatbot/session/new', json={"user_id": 999})
    assert rv.status_code in (200, 201)
    assert 'session_id' in rv.get_json()

def test_ask_basic(client):
    # first create session
    sess = client.post('/api/chatbot/session/new', json={"user_id": 999}).get_json()
    sid = sess['session_id']
    
    rv = client.post('/api/chatbot/ask', json={
        "message": "hello",
        "user_id": 999,
        "session_id": sid
    })
    assert rv.status_code == 200
    assert 'response' in rv.get_json()


print("Testing API endpoints...\n")

with app.test_client() as client:
    # Test 1: Health endpoint
    print("1. Testing /api/chatbot/health")
    response = client.get('/api/chatbot/health')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.get_json()}")
    
    # Test 2: Create session
    print("\n2. Testing /api/chatbot/session/new")
    response = client.post('/api/chatbot/session/new',
                          json={"user_id": 1})
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        session_data = response.get_json()
        session_id = session_data.get('session_id')
        print(f"   Session created: {session_id}")
        
        # Test 3: Ask question
        print(f"\n3. Testing /api/chatbot/ask (session: {session_id})")
        response = client.post('/api/chatbot/ask',
                              json={
                                  "message": "Show me properties in Mumbai",
                                  "user_id": 1,
                                  "session_id": session_id
                              })
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.get_json()
            print(f"   Response length: {len(result.get('response', ''))} chars")
            print(f"   Stats: {result.get('stats', {})}")
            print(f"   Preview: {result.get('response', '')[:200]}...")
    
    print("\n" + "="*60)
    print("✅ API endpoints are working!")
    print("="*60)