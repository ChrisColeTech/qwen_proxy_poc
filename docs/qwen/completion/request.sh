curl --location 'https://chat.qwen.ai/api/v2/chat/completions?chat_id=c8c98d85-9175-4495-a851-0ff5ae3a6f2a' \
--header 'bx-umidtoken: T2gATMkyvnXwsCHMqLVhSP2NnuG9oO9Y-o5gMo-6pwOFVaOfzOms_48xjRj4jcAmfoM=' \
--header 'Content-Type: application/json' \
--header 'Cookie: acw_tc=0a03e58a17614897623874923e38757bf7060aadd5cd973b147899cc6cb8bc; x-ap=na-vancouver-pop' \
--data '{
    "stream": false,
    "incremental_output": true,
    "chat_id": "c8c98d85-9175-4495-a851-0ff5ae3a6f2a",
    "chat_mode": "guest",
    "model": "qwen3-max",
    "parent_id": "5594c51b-9b37-4f12-83f4-a17cb7d56ec7",
    "messages": [
        {
            "fid": "8fc623f2-b790-4a73-a310-0c02ec766eb8",
            "parentId": "5594c51b-9b37-4f12-83f4-a17cb7d56ec7",
            "childrenIds": [
                "a45abf5c-0fbd-4e18-891e-83f020da7aee"
            ],
            "role": "user",
            "content": "explain religion to an alien",
            "user_action": "chat",
            "files": [],
            "timestamp": 1761484568,
            "models": [
                "qwen3-max"
            ],
            "chat_type": "t2t",
            "feature_config": {
                "thinking_enabled": false,
                "output_schema": "phase"
            },
            "extra": {
                "meta": {
                    "subChatType": "t2t"
                }
            },
            "sub_chat_type": "t2t",
            "parent_id": "5594c51b-9b37-4f12-83f4-a17cb7d56ec7"
        }
    ],
    "timestamp": 1761489788
}'