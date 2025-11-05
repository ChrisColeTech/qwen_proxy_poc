## user token:
```bash
bx-umidtoken: T2gATMkyvnXwsCHMqLVhSP2NnuG9oO9Y-o5gMo-6pwOFVaOfzOms_48xjRj4jcAmfoM='
```

### get models
```bash
curl --location 'https://chat.qwen.ai/api/models' \
--header 'Cookie: acw_tc=0a03e58917614845059388224e3bb4fd72d2618d4adb57cf3d3fcb620bef75; x-ap=na-vancouver-pop'
```

### start a new chat
**must pass `bx-umidtoken`**

```bash
curl --location 'https://chat.qwen.ai/api/v2/chats/new' \
--header 'bx-umidtoken: T2gATMkyvnXwsCHMqLVhSP2NnuG9oO9Y-o5gMo-6pwOFVaOfzOms_48xjRj4jcAmfoM=' \
--header 'Content-Type: application/json' \
--header 'Cookie: acw_tc=0a03e58917614845059388224e3bb4fd72d2618d4adb57cf3d3fcb620bef75; x-ap=na-vancouver-pop' \
--data '{"title":"New Chat","models":["qwen3-max"],"chat_mode":"guest","chat_type":"t2t","timestamp":1761484022218}'
```

### completions endpoint
**must pass `chat_id`**
**must pass `bx-umidtoken`**

```bash
curl --location 'https://chat.qwen.ai/api/v2/chat/completions?chat_id=c8c98d85-9175-4495-a851-0ff5ae3a6f2a' \
--header 'bx-umidtoken: T2gATMkyvnXwsCHMqLVhSP2NnuG9oO9Y-o5gMo-6pwOFVaOfzOms_48xjRj4jcAmfoM=' \
--header 'Content-Type: application/json' \
--header 'Cookie: acw_tc=0a03e58917614845059388224e3bb4fd72d2618d4adb57cf3d3fcb620bef75; x-ap=na-vancouver-pop' \
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
            "content": "explain youtube to an alien",
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
    "timestamp": 1761484568
}'
```