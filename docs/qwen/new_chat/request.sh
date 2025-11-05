curl --location 'https://chat.qwen.ai/api/v2/chats/new' \
--header 'bx-umidtoken: T2gATMkyvnXwsCHMqLVhSP2NnuG9oO9Y-o5gMo-6pwOFVaOfzOms_48xjRj4jcAmfoM=' \
--header 'Content-Type: application/json' \
--header 'Cookie: acw_tc=0a03e58917614845059388224e3bb4fd72d2618d4adb57cf3d3fcb620bef75; x-ap=na-vancouver-pop' \
--data '{"title":"New Chat","models":["qwen3-max"],"chat_mode":"guest","chat_type":"t2t","timestamp":1761484022218}'