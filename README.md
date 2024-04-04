# Open Assistant

This project aims to provide similar functionalities to OpenAI's Assistant API for large language models (LLMs) from other vendors, such as Google and Anthropic. These functionalities include:

- Function Calling: Allows LLMs to call external functions to extend their capabilities.
- Retrieval: Allows LLMs to retrieve information from external knowledge bases, increasing their knowledge breadth and depth.
- Code Interpreter: Allows LLMs to interpret and execute code, enabling more powerful automation and control.

The goal of this project is to provide LLM developers with a unified platform to easily implement the aforementioned functionalities, thus reducing development costs and difficulties.

## Support Features

| Module     | Function            | Anthropic | Ollama | Vertex AI | OpenAI Like |
| ---------- | ------------------- | --------- | ------ | --------- | ----------- |
| Chat       | Default             | ✔        | ✘      | ✘         | ✘           |
|            | Image input         | ✔        | ✘      | ✘         | ✘           |
|            | Tool call           | ✔        | ✘      | ✘         | ✘           |
|            | Streaming           | ✔        | ✘      | ✘         | ✘           |
| Assistants | Default             | ✔        | ✘      | ✘         | ✘           |
|            | Code Interpreter    | ✘         | ✘      | ✘         | ✘           |
|            | Knowledge Retrieval | ✘         | ✘      | ✘         | ✘           |
|            | Function Calling    | ✔        | ✘      | ✘         | ✘           |
