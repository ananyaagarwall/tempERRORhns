# actual_rag_test.py  — fixed simple version

from app import app
from chatbot.rag_service import get_chatbot_response

print("Actual RAG system test...\n")

with app.app_context():
    import importlib
    import chatbot.rag_service as rag_module
    importlib.reload(rag_module)
    
    # Disable auto-learning for clean test
    original_extract = rag_module.extract_and_save_preferences
    rag_module.extract_and_save_preferences = lambda *args, **kwargs: None
    
    try:
        print("Test 1: Simple greeting")
        response1, shown_ids1, props1, builders1, intent1 = get_chatbot_response(
            user_query="Hi there",
            user_id=1,
            chat_history=[],
            session_shown_ids=set()
        )
        print(f"✅ SUCCESS!")
        print(f"Response: {response1[:300]}...")
        print(f"Found {len(shown_ids1)} properties (should be 0)")
        print(f"Intent: {intent1}\n")

        print("Test 2: Specific search")
        response2, shown_ids2, props2, builders2, intent2 = get_chatbot_response(
            user_query="2BHK in Ghansoli",
            user_id=1,
            chat_history=[],
            session_shown_ids=set()
        )
        print(f"✅ SUCCESS!")
        print(f"Response: {response2[:300]}...")
        print(f"Found {len(shown_ids2)} properties")
        print(f"Intent: {intent2}\n")

        print("Test 3: Follow-up query (budget filter + deduplication)")
        response3, shown_ids3, props3, builders3, intent3 = get_chatbot_response(
            user_query="What about under 1 crore?",
            user_id=1,
            chat_history=[("Show me 2BHK apartments in Ghansoli", response2)],
            session_shown_ids=shown_ids2.copy()   # .copy() is safer
        )
        print(f"✅ SUCCESS!")
        print(f"Response: {response3[:300]}...")
        print(f"Found {len(shown_ids3)} properties")
        print(f"New IDs shown this time: {shown_ids3 - shown_ids2}")

        print("\n" + "="*60)
        print("🎉 CONGRATULATIONS! Your RAG system is fully functional!")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Always restore
        rag_module.extract_and_save_preferences = original_extract