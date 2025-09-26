# Perplexity 3.0

Executable version of the LangGraph + DeepSeek experimental agent. The notebook (`server/app.ipynb`) stays under version control while the helper script (`server/code.py`) remains local-only for debugging and streaming experiments.

## Local Setup

```bash
pip install -r server/requirements.txt
```

## Running the Demo

```bash
python server/code.py
```

This reproduces the async notebook flows: a simple `ainvoke` call and a streaming `astream_events` loop with token-level updates.

## GitHub Prep

```bash
git init
echo 'server/code.py' > .gitignore
git add .gitignore server/app.ipynb README.md
git commit -m "Initial notebook"
git remote add origin git@github.com:proxi666/Perplexity-2.0.git
git push -u origin master
```

The `.gitignore` line keeps `server/code.py` out of source control.
